import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger, forwardRef, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ChatGateway');
  private userSockets = new Map<string, Set<string>>();
  private onlineUsers = new Set<string>();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
  ) {}

  afterInit() {
    this.logger.log('Chat WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, nickname: true },
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      client.join(`user:${user.id}`);

      const sockets = this.userSockets.get(user.id) || new Set();
      sockets.add(client.id);
      this.userSockets.set(user.id, sockets);

      const wasOffline = !this.onlineUsers.has(user.id);
      this.onlineUsers.add(user.id);

      // 사용자의 모든 대화방에 조인
      const conversations = await this.chatService.getUserConversations(
        user.id,
      );
      for (const conv of conversations) {
        client.join(`conversation:${conv.id}`);
      }

      // 온라인 상태 브로드캐스트 (처음 연결 시에만)
      if (wasOffline) {
        this.broadcastUserStatus(user.id, true);
      }

      this.logger.log(`Client connected: ${client.id} (user: ${user.email})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      const sockets = this.userSockets.get(user.id);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(user.id);
          this.onlineUsers.delete(user.id);
          this.broadcastUserStatus(user.id, false);
        }
      }
      this.logger.log(
        `Client disconnected: ${client.id} (user: ${user.email})`,
      );
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    client: Socket,
    payload: { conversationId: string; content: string },
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      const message = await this.chatService.sendMessage(
        payload.conversationId,
        user.id,
        payload.content,
      );

      // 대화방의 모든 참여자에게 메시지 전송
      this.server
        .to(`conversation:${payload.conversationId}`)
        .emit('message:new', message);

      return message;
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { error: error.message };
    }
  }

  @SubscribeMessage('message:read')
  async handleMarkAsRead(client: Socket, payload: { conversationId: string }) {
    const user = client.data.user;
    if (!user) return;

    await this.chatService.markConversationAsRead(payload.conversationId, user.id);

    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('message:read', {
        conversationId: payload.conversationId,
        userId: user.id,
        readAt: new Date(),
      });
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(client: Socket, payload: { conversationId: string }) {
    const user = client.data.user;
    if (!user) return;

    client.to(`conversation:${payload.conversationId}`).emit('typing:start', {
      conversationId: payload.conversationId,
      userId: user.id,
      nickname: user.nickname || user.email,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(client: Socket, payload: { conversationId: string }) {
    const user = client.data.user;
    if (!user) return;

    client.to(`conversation:${payload.conversationId}`).emit('typing:stop', {
      conversationId: payload.conversationId,
      userId: user.id,
    });
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    this.server.emit('user:status', { userId, isOnline });
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  async joinConversation(conversationId: string, userIds: string[]) {
    for (const userId of userIds) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        for (const socketId of sockets) {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket) {
            socket.join(`conversation:${conversationId}`);
          }
        }
      }
    }
  }

  // 새 대화가 생성되었을 때 참여자들에게 알림
  notifyNewConversation(conversation: any, participantIds: string[]) {
    for (const userId of participantIds) {
      this.server
        .to(`user:${userId}`)
        .emit('conversation:new', conversation);
    }
  }
}
