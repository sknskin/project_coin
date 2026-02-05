/**
 * @fileoverview 통계 컨트롤러
 * @description 방문자 추적, 실시간/히스토리컬 통계 조회 API 엔드포인트 제공
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { StatisticsService } from './statistics.service';
import { UserRole } from '@prisma/client';

/**
 * 방문자 추적 DTO
 * @description 프론트엔드에서 페이지 방문 시 전송하는 데이터
 */
class TrackVisitorDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}

/**
 * 기간별 통계 조회 DTO
 * @description 날짜 범위 및 집계 단위 지정
 */
class PeriodStatsQueryDto {
  @IsString()
  startDate: string;

  @IsString()
  endDate: string;

  @IsOptional()
  @IsString()
  period?: string;
}

/**
 * 통계 컨트롤러
 * @description 관리자 대시보드용 각종 통계 데이터 제공
 */
@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  /**
   * 방문자 추적
   * @param dto 방문자 세션 정보
   * @returns 추적 성공 여부
   * @description 프론트엔드에서 페이지 이동 시 호출하여 방문 통계를 수집합니다
   */
  @Post('track')
  @ApiOperation({
    summary: '방문자 추적',
    description: '페이지 방문을 기록합니다. 프론트엔드에서 페이지 이동 시 자동으로 호출됩니다.',
  })
  @ApiBody({ type: TrackVisitorDto })
  @ApiResponse({ status: 201, description: '방문 기록 성공' })
  trackVisitor(@Body() dto: TrackVisitorDto) {
    return this.statisticsService.trackVisitor(
      dto.sessionId,
      dto.ipAddress,
      dto.userAgent,
      dto.referrer,
    );
  }

  /**
   * 실시간 통계 조회 (관리자 전용)
   * @returns 현재 방문자 수, 오늘 통계 등
   */
  @Get('realtime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '실시간 통계',
    description: '현재 접속자 수, 오늘 방문자 수, 오늘 가입자 수 등 실시간 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '실시간 통계 반환 (현재 방문자, 오늘 페이지뷰, 오늘 가입 등)',
  })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getRealTimeStats() {
    return this.statisticsService.getRealTimeStats();
  }

  /**
   * 히스토리컬 통계 조회 (관리자 전용)
   * @param startDate 시작일
   * @param endDate 종료일
   * @returns 일별 통계 데이터
   */
  @Get('historical')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '히스토리컬 통계',
    description: '지정된 기간의 일별 통계 데이터를 조회합니다.',
  })
  @ApiQuery({ name: 'startDate', description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: '종료일 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '일별 통계 데이터 배열' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getHistoricalStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getHistoricalStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * 기간별 통계 조회 (관리자 전용)
   * @param query 날짜 범위 및 집계 단위 (daily/monthly/yearly)
   * @returns 집계된 통계 데이터
   */
  @Get('historical/period')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '기간별 통계',
    description: '일별/월별/연별 단위로 집계된 통계 데이터를 조회합니다.',
  })
  @ApiQuery({ name: 'startDate', description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: '종료일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'monthly', 'yearly'], description: '집계 단위 (기본값: daily)' })
  @ApiResponse({ status: 200, description: '기간별 집계 통계' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getHistoricalByPeriod(@Query() query: PeriodStatsQueryDto) {
    return this.statisticsService.getHistoricalByPeriod(
      new Date(query.startDate),
      new Date(query.endDate),
      (query.period as 'daily' | 'monthly' | 'yearly') || 'daily',
    );
  }

  /**
   * 로그인 통계 조회 (관리자 전용)
   * @param startDate 시작일
   * @param endDate 종료일
   * @returns 기간 내 로그인 통계
   */
  @Get('logins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '로그인 통계',
    description: '지정된 기간의 로그인 통계를 조회합니다.',
  })
  @ApiQuery({ name: 'startDate', description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: '종료일 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '로그인 통계 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getLoginStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getLoginStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * 회원가입 통계 조회 (관리자 전용)
   * @param startDate 시작일
   * @param endDate 종료일
   * @returns 기간 내 가입 통계
   */
  @Get('registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '회원가입 통계',
    description: '지정된 기간의 회원가입 통계를 조회합니다.',
  })
  @ApiQuery({ name: 'startDate', description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: '종료일 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '가입 통계 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getRegistrationStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.statisticsService.getRegistrationStats(
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * 공지사항 통계 조회 (관리자 전용)
   * @param query 날짜 범위 및 집계 단위
   * @returns 공지사항 작성/댓글/좋아요 통계
   */
  @Get('announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '공지사항 통계',
    description: '지정된 기간의 공지사항 관련 통계 (신규 작성, 댓글, 좋아요)를 조회합니다.',
  })
  @ApiQuery({ name: 'startDate', description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: '종료일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'monthly', 'yearly'], description: '집계 단위 (기본값: daily)' })
  @ApiResponse({ status: 200, description: '공지사항 통계 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getAnnouncementStats(@Query() query: PeriodStatsQueryDto) {
    return this.statisticsService.getAnnouncementStats(
      new Date(query.startDate),
      new Date(query.endDate),
      (query.period as 'daily' | 'monthly' | 'yearly') || 'daily',
    );
  }

  /**
   * 공지사항 총계 조회 (관리자 전용)
   * @returns 전체 공지/댓글/좋아요/조회수 합계
   */
  @Get('announcements/totals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '공지사항 총계',
    description: '전체 공지사항 수, 댓글 수, 좋아요 수, 조회수 합계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '공지사항 총계' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getAnnouncementTotals() {
    return this.statisticsService.getAnnouncementTotals();
  }

  /**
   * 채팅 통계 조회 (관리자 전용)
   * @param query 날짜 범위 및 집계 단위
   * @returns 메시지 수, 활성 대화방 수 통계
   */
  @Get('chat')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '채팅 통계',
    description: '지정된 기간의 채팅 통계 (메시지 수, 활성 대화방 수)를 조회합니다.',
  })
  @ApiQuery({ name: 'startDate', description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: '종료일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'monthly', 'yearly'], description: '집계 단위 (기본값: daily)' })
  @ApiResponse({ status: 200, description: '채팅 통계 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getChatStats(@Query() query: PeriodStatsQueryDto) {
    return this.statisticsService.getChatStats(
      new Date(query.startDate),
      new Date(query.endDate),
      (query.period as 'daily' | 'monthly' | 'yearly') || 'daily',
    );
  }

  /**
   * 채팅 총계 조회 (관리자 전용)
   * @returns 전체 메시지 수, 대화방 수
   */
  @Get('chat/totals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '채팅 총계',
    description: '전체 메시지 수, 대화방 수를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '채팅 총계' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getChatTotals() {
    return this.statisticsService.getChatTotals();
  }

  /**
   * 사용자 상세 통계 조회 (관리자 전용)
   * @returns 역할별 분포, 승인 현황 등
   */
  @Get('users/detail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '사용자 상세 통계',
    description: '사용자 역할별 분포, 승인 현황, 상태별 분포 등을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 상세 통계' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getUserDetailStats() {
    return this.statisticsService.getUserDetailStats();
  }

  /**
   * 알림 통계 조회 (관리자 전용)
   * @param query 날짜 범위 및 집계 단위
   * @returns 알림 발송/읽음 통계
   */
  @Get('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '알림 통계',
    description: '지정된 기간의 알림 발송 및 읽음 통계를 조회합니다.',
  })
  @ApiQuery({ name: 'startDate', description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: '종료일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'monthly', 'yearly'], description: '집계 단위 (기본값: daily)' })
  @ApiResponse({ status: 200, description: '알림 통계 데이터' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  getNotificationStats(@Query() query: PeriodStatsQueryDto) {
    return this.statisticsService.getNotificationStats(
      new Date(query.startDate),
      new Date(query.endDate),
      (query.period as 'daily' | 'monthly' | 'yearly') || 'daily',
    );
  }
}
