import {
  Injectable,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { ChatGateway } from './chat.gateway';
import { NotificationType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationService))
    private notificationService: NotificationService,
    @Inject(forwardRef(() => ChatGateway))
    private chatGateway: ChatGateway,
  ) {}

  async createConversation(creatorId: string, participantIds: string[]) {
    const allParticipantIds = [
      creatorId,
      ...participantIds.filter((id) => id !== creatorId),
    ];

    // 1:1 대화의 경우 기존 대화 확인
    if (allParticipantIds.length === 2) {
      const existing = await this.findExistingConversation(allParticipantIds);
      if (existing) return existing;
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: allParticipantIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true, nickname: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, email: true, nickname: true } },
          },
        },
      },
    });

    // 참여자들을 WebSocket 방에 조인
    await this.chatGateway.joinConversation(
      conversation.id,
      allParticipantIds,
    );

    return conversation;
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    // 참여자 확인
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content },
      include: {
        sender: { select: { id: true, email: true, nickname: true } },
      },
    });

    // 대화의 updatedAt 갱신
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // 오프라인 사용자에게 알림 전송
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
    });

    for (const p of participants) {
      if (!this.chatGateway.isUserOnline(p.userId)) {
        await this.notificationService.create(p.userId, {
          type: NotificationType.CHAT,
          title: '새 메시지',
          message: `${message.sender.nickname || message.sender.email}님이 메시지를 보냈습니다.`,
          data: { conversationId, messageId: message.id },
        });
      }
    }

    return message;
  }

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 50,
  ) {
    // 참여자 확인
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        ...(cursor && { createdAt: { lt: new Date(cursor) } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { id: true, email: true, nickname: true } },
      },
    });

    return messages.reverse();
  }

  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true, nickname: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, email: true, nickname: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 각 대화의 읽지 않은 메시지 수 계산
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === userId);
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isDeleted: false,
            ...(participant?.lastReadAt && {
              createdAt: { gt: participant.lastReadAt },
            }),
          },
        });
        return { ...conv, unreadCount };
      }),
    );

    return conversationsWithUnread;
  }

  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: {
        conversationId: true,
        lastReadAt: true,
      },
    });

    const counts: Record<string, number> = {};

    for (const p of participants) {
      const count = await this.prisma.message.count({
        where: {
          conversationId: p.conversationId,
          senderId: { not: userId },
          isDeleted: false,
          ...(p.lastReadAt && { createdAt: { gt: p.lastReadAt } }),
        },
      });
      counts[p.conversationId] = count;
    }

    return counts;
  }

  async markConversationAsRead(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    });
  }

  async getAvailableUsers(currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        isApproved: true,
      },
      select: { id: true, email: true, nickname: true, role: true },
      orderBy: [
        { role: 'asc' },  // ADMIN comes before USER alphabetically
        { nickname: 'asc' },
      ],
    });

    // Ensure ADMIN users come first (since ADMIN < USER alphabetically)
    return users.sort((a, b) => {
      if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
      if (a.role !== 'ADMIN' && b.role === 'ADMIN') return 1;
      return 0;
    });
  }

  private async findExistingConversation(participantIds: string[]) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          every: { userId: { in: participantIds } },
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, email: true, nickname: true } },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, email: true, nickname: true } },
          },
        },
      },
    });

    return conversations.find(
      (c) =>
        c.participants.length === participantIds.length &&
        c.participants.every((p) => participantIds.includes(p.userId)),
    );
  }
}
