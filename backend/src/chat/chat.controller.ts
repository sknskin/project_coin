/**
 * @fileoverview 채팅 컨트롤러
 * @description 실시간 채팅 관련 REST API 엔드포인트 제공
 * @note WebSocket 기반 실시간 통신은 chat.gateway.ts에서 처리
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto, AddParticipantsDto } from './dto/create-conversation.dto';
import { ChatGateway } from './chat.gateway';

/**
 * 인증된 요청 타입 정의
 */
interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string };
}

/**
 * 대화 참여자 타입 정의
 */
interface ConversationParticipant {
  userId: string;
}

/**
 * 채팅 컨트롤러
 * @description 대화방 CRUD, 메시지 전송/삭제, 참여자 관리 등 처리
 */
@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  /**
   * 사용자의 대화 목록 조회
   * @param req 인증된 요청 객체
   * @returns 대화 목록 (최근 메시지, 읽지 않은 수 포함)
   */
  @Get('conversations')
  @ApiOperation({
    summary: '대화 목록 조회',
    description: '현재 사용자가 참여 중인 모든 대화방 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '대화 목록 반환' })
  getConversations(@Request() req: RequestWithUser) {
    return this.chatService.getUserConversations(req.user.id);
  }

  /**
   * 새 대화 생성
   * @param req 인증된 요청 객체
   * @param dto 대화 생성 정보 (참여자 ID 목록, 그룹명)
   * @returns 생성된 대화 정보
   */
  @Post('conversations')
  @ApiOperation({
    summary: '새 대화 생성',
    description: '새로운 1:1 또는 그룹 대화를 생성합니다. 1:1 대화의 경우 기존 대화가 있으면 해당 대화를 반환합니다.',
  })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({ status: 201, description: '대화 생성 성공' })
  @ApiResponse({ status: 200, description: '기존 1:1 대화 반환' })
  async createConversation(
    @Request() req: RequestWithUser,
    @Body() dto: CreateConversationDto,
  ) {
    const conversation = await this.chatService.createConversation(
      req.user.id,
      dto.participantIds,
      dto.name,
    );

    // WebSocket을 통해 참여자들에게 새 대화 알림
    const participantIds = conversation.participants.map((p: ConversationParticipant) => p.userId);
    this.chatGateway.notifyNewConversation(conversation, participantIds);

    return conversation;
  }

  /**
   * 대화의 메시지 목록 조회
   * @param req 인증된 요청 객체
   * @param conversationId 대화 ID
   * @param cursor 페이지네이션 커서 (마지막 메시지 시간)
   * @param limit 조회할 메시지 수 (기본값: 50)
   * @returns 메시지 목록
   */
  @Get('conversations/:id/messages')
  @ApiOperation({
    summary: '메시지 목록 조회',
    description: '특정 대화의 메시지 목록을 조회합니다. 커서 기반 페이지네이션을 지원합니다.',
  })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiQuery({ name: 'cursor', required: false, description: '페이지네이션 커서 (ISO 날짜 문자열)' })
  @ApiQuery({ name: 'limit', required: false, description: '조회할 메시지 수 (기본값: 50)' })
  @ApiResponse({ status: 200, description: '메시지 목록 반환' })
  @ApiResponse({ status: 403, description: '대화 참여자가 아님' })
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

  /**
   * 메시지 전송 (REST API)
   * @param req 인증된 요청 객체
   * @param conversationId 대화 ID
   * @param dto 메시지 내용
   * @returns 전송된 메시지 정보
   * @note 실시간 전송은 WebSocket 사용 권장
   */
  @Post('conversations/:id/messages')
  @ApiOperation({
    summary: '메시지 전송',
    description: 'REST API를 통해 메시지를 전송합니다. 실시간 전송은 WebSocket 사용을 권장합니다.',
  })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: '메시지 전송 성공' })
  @ApiResponse({ status: 403, description: '대화 참여자가 아님' })
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

    // WebSocket을 통해 대화방 참여자들에게 메시지 브로드캐스트
    this.chatGateway.server
      .to(`conversation:${conversationId}`)
      .emit('message:new', message);

    return message;
  }

  /**
   * 읽지 않은 메시지 수 조회
   * @param req 인증된 요청 객체
   * @returns 대화별 읽지 않은 메시지 수 (Record<conversationId, count>)
   */
  @Get('unread-counts')
  @ApiOperation({
    summary: '읽지 않은 메시지 수',
    description: '사용자의 모든 대화별 읽지 않은 메시지 수를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '대화별 읽지 않은 수 반환' })
  getUnreadCounts(@Request() req: RequestWithUser) {
    return this.chatService.getUnreadCounts(req.user.id);
  }

  /**
   * 대화 가능한 사용자 목록 조회
   * @param req 인증된 요청 객체
   * @returns 승인된 사용자 목록 (본인 제외)
   */
  @Get('users')
  @ApiOperation({
    summary: '대화 가능한 사용자 목록',
    description: '새 대화를 시작할 수 있는 사용자 목록을 조회합니다. 승인된 사용자만 표시됩니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 목록 반환' })
  getAvailableUsers(@Request() req: RequestWithUser) {
    return this.chatService.getAvailableUsers(req.user.id);
  }

  /**
   * 대화에 참여자 추가
   * @param req 인증된 요청 객체
   * @param conversationId 대화 ID
   * @param dto 추가할 참여자 ID 목록
   * @returns 업데이트된 대화 정보
   */
  @Post('conversations/:id/participants')
  @ApiOperation({
    summary: '참여자 추가',
    description: '기존 대화에 새 참여자를 추가합니다. 1:1 대화에 추가하면 그룹 대화로 변환됩니다.',
  })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiBody({ type: AddParticipantsDto })
  @ApiResponse({ status: 200, description: '참여자 추가 성공' })
  @ApiResponse({ status: 403, description: '대화 참여자가 아님' })
  async addParticipants(
    @Request() req: RequestWithUser,
    @Param('id') conversationId: string,
    @Body() dto: AddParticipantsDto,
  ) {
    const result = await this.chatService.addParticipants(
      conversationId,
      req.user.id,
      dto.participantIds,
    );

    // WebSocket을 통해 참여자들에게 알림
    if (result.addedUserIds && result.addedUserIds.length > 0) {
      const allParticipantIds = result.conversation.participants.map(
        (p: ConversationParticipant) => p.userId,
      );
      this.chatGateway.notifyParticipantsAdded(
        result.conversation,
        allParticipantIds,
        result.addedUserIds,
      );
    }

    return result.conversation;
  }

  /**
   * 메시지 삭제
   * @param req 인증된 요청 객체
   * @param messageId 삭제할 메시지 ID
   * @returns 삭제된 메시지 정보
   */
  @Delete('messages/:id')
  @ApiOperation({
    summary: '메시지 삭제',
    description: '본인이 전송한 메시지를 삭제합니다. 소프트 삭제로 처리됩니다.',
  })
  @ApiParam({ name: 'id', description: '메시지 ID' })
  @ApiResponse({ status: 200, description: '메시지 삭제 성공' })
  @ApiResponse({ status: 403, description: '본인 메시지가 아님' })
  async deleteMessage(
    @Request() req: RequestWithUser,
    @Param('id') messageId: string,
  ) {
    const result = await this.chatService.deleteMessage(messageId, req.user.id);

    // WebSocket을 통해 대화 참여자들에게 삭제 알림
    this.chatGateway.server
      .to(`conversation:${result.conversationId}`)
      .emit('message:deleted', { messageId, conversationId: result.conversationId });

    return result;
  }

  /**
   * 대화방 나가기
   * @param req 인증된 요청 객체
   * @param conversationId 나갈 대화 ID
   * @returns 나간 대화 정보
   */
  @Delete('conversations/:id/leave')
  @ApiOperation({
    summary: '대화방 나가기',
    description: '대화방에서 나갑니다. 모든 참여자가 나가면 대화방이 삭제됩니다.',
  })
  @ApiParam({ name: 'id', description: '대화 ID' })
  @ApiResponse({ status: 200, description: '나가기 성공' })
  @ApiResponse({ status: 403, description: '대화 참여자가 아님' })
  async leaveConversation(
    @Request() req: RequestWithUser,
    @Param('id') conversationId: string,
  ) {
    const result = await this.chatService.leaveConversation(conversationId, req.user.id);

    // WebSocket을 통해 퇴장 알림
    this.chatGateway.notifyUserLeft(conversationId, req.user.id);

    return result;
  }
}
