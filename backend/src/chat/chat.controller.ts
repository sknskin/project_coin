import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto } from './dto/create-conversation.dto';
import { ChatGateway } from './chat.gateway';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string };
}

interface ConversationParticipant {
  userId: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  getConversations(@Request() req: RequestWithUser) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Post('conversations')
  async createConversation(
    @Request() req: RequestWithUser,
    @Body() dto: CreateConversationDto,
  ) {
    const conversation = await this.chatService.createConversation(
      req.user.id,
      dto.participantIds,
    );

    // 참여자들에게 새 대화 알림
    const participantIds = conversation.participants.map((p: ConversationParticipant) => p.userId);
    this.chatGateway.notifyNewConversation(conversation, participantIds);

    return conversation;
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Request() req: RequestWithUser,
    @Param('id') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = '50',
  ) {
    return this.chatService.getMessages(
      conversationId,
      req.user.id,
      cursor,
      parseInt(limit),
    );
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Request() req: RequestWithUser,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage(
      conversationId,
      req.user.id,
      dto.content,
    );

    // WebSocket으로 메시지 전송
    this.chatGateway.server
      .to(`conversation:${conversationId}`)
      .emit('message:new', message);

    return message;
  }

  @Get('unread-counts')
  getUnreadCounts(@Request() req: RequestWithUser) {
    return this.chatService.getUnreadCounts(req.user.id);
  }

  @Get('users')
  getAvailableUsers(@Request() req: RequestWithUser) {
    return this.chatService.getAvailableUsers(req.user.id);
  }
}
