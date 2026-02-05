/**
 * @fileoverview 알림 컨트롤러
 * @description 사용자 알림 조회, 읽음 처리, 삭제 API 엔드포인트 제공
 */

import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';

/**
 * 인증된 요청 타입 정의
 */
interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string };
}

/**
 * 알림 컨트롤러
 * @description 사용자 알림 관리 기능 제공
 */
@ApiTags('Notification')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  /**
   * 알림 목록 조회
   * @param req 인증된 요청 객체
   * @param page 페이지 번호 (기본값: 1)
   * @param limit 페이지당 항목 수 (기본값: 20)
   * @returns 페이지네이션된 알림 목록
   */
  @Get()
  @ApiOperation({
    summary: '알림 목록 조회',
    description: '사용자의 알림 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값: 20)' })
  @ApiResponse({
    status: 200,
    description: '알림 목록 반환 (타입, 내용, 읽음 여부, 생성일 포함)',
  })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  findAll(
    @Request() req: RequestWithUser,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.notificationService.findAllForUser(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  /**
   * 읽지 않은 알림 수 조회
   * @param req 인증된 요청 객체
   * @returns 읽지 않은 알림 개수
   */
  @Get('unread-count')
  @ApiOperation({
    summary: '읽지 않은 알림 수',
    description: '읽지 않은 알림의 총 개수를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '{ count: number }' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  getUnreadCount(@Request() req: RequestWithUser) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  /**
   * 알림 읽음 처리
   * @param req 인증된 요청 객체
   * @param id 알림 ID
   * @returns 업데이트된 알림 정보
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: '알림 읽음 처리',
    description: '특정 알림을 읽음 상태로 변경합니다.',
  })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: 200, description: '읽음 처리 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '알림을 찾을 수 없음' })
  markAsRead(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationService.markAsRead(req.user.id, id);
  }

  /**
   * 모든 알림 읽음 처리
   * @param req 인증된 요청 객체
   * @returns 처리된 알림 수
   */
  @Patch('read-all')
  @ApiOperation({
    summary: '모든 알림 읽음 처리',
    description: '사용자의 모든 알림을 읽음 상태로 변경합니다.',
  })
  @ApiResponse({ status: 200, description: '모든 알림 읽음 처리 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  markAllAsRead(@Request() req: RequestWithUser) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  /**
   * 알림 삭제
   * @param req 인증된 요청 객체
   * @param id 삭제할 알림 ID
   * @returns 삭제 결과
   */
  @Delete(':id')
  @ApiOperation({
    summary: '알림 삭제',
    description: '특정 알림을 삭제합니다.',
  })
  @ApiParam({ name: 'id', description: '알림 ID' })
  @ApiResponse({ status: 200, description: '알림 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '알림을 찾을 수 없음' })
  delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationService.delete(req.user.id, id);
  }
}
