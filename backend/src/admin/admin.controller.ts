/**
 * @fileoverview 관리자 컨트롤러
 * @description 회원 관리, 승인/거절, 상태 변경 등 관리자 전용 API 엔드포인트 제공
 * @access ADMIN, SYSTEM 역할만 접근 가능
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
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
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { UserFilterDto } from './dto/user-filter.dto';
import {
  ApproveUserDto,
  RejectUserDto,
  UpdateUserStatusDto,
} from './dto/approve-user.dto';
import { UserRole } from '@prisma/client';

/**
 * 인증된 관리자 요청 타입 정의
 */
interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; role: UserRole };
}

/**
 * 관리자 컨트롤러
 * @description 회원 관리 관련 모든 관리자 기능 처리
 * @requires ADMIN 이상의 권한 필요
 */
@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  /**
   * 회원 목록 조회 (필터링/페이지네이션)
   * @param filter 필터 조건 (상태, 승인여부, 역할, 검색어 등)
   * @returns 페이지네이션된 회원 목록
   */
  @Get('users')
  @ApiOperation({
    summary: '회원 목록 조회',
    description: '모든 회원 목록을 필터링하여 조회합니다. 페이지네이션을 지원합니다.',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값: 10)' })
  @ApiQuery({ name: 'search', required: false, description: '검색어 (이메일, 아이디, 닉네임)' })
  @ApiQuery({ name: 'status', required: false, description: '상태 필터 (ACTIVE, INACTIVE)' })
  @ApiQuery({ name: 'approval', required: false, description: '승인 필터 (PENDING, APPROVED, REJECTED)' })
  @ApiQuery({ name: 'role', required: false, description: '역할 필터 (USER, ADMIN, SYSTEM)' })
  @ApiResponse({ status: 200, description: '회원 목록 반환' })
  getUsers(@Query() filter: UserFilterDto) {
    return this.adminService.getUsers(filter);
  }

  /**
   * 회원 상세 정보 조회
   * @param id 회원 ID
   * @returns 회원 상세 정보 (로그인 기록 포함)
   */
  @Get('users/:id')
  @ApiOperation({
    summary: '회원 상세 조회',
    description: '특정 회원의 상세 정보를 조회합니다. 로그인 기록도 함께 반환됩니다.',
  })
  @ApiParam({ name: 'id', description: '회원 ID (UUID)' })
  @ApiResponse({ status: 200, description: '회원 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  /**
   * 회원가입 승인
   * @param req 관리자 요청 객체
   * @param userId 승인할 회원 ID
   * @param dto 승인 정보 (부여할 역할)
   * @returns 승인된 회원 정보
   */
  @Post('users/:id/approve')
  @ApiOperation({
    summary: '회원가입 승인',
    description: '대기 중인 회원가입을 승인합니다. 역할을 지정할 수 있습니다.',
  })
  @ApiParam({ name: 'id', description: '승인할 회원 ID' })
  @ApiBody({ type: ApproveUserDto })
  @ApiResponse({ status: 200, description: '승인 성공' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  @ApiResponse({ status: 400, description: '이미 처리된 회원' })
  approveUser(
    @Request() req: RequestWithUser,
    @Param('id') userId: string,
    @Body() dto: ApproveUserDto,
  ) {
    return this.adminService.approveUser(req.user.id, userId, dto);
  }

  /**
   * 회원가입 거절
   * @param req 관리자 요청 객체
   * @param userId 거절할 회원 ID
   * @param dto 거절 정보 (거절 사유)
   * @returns 거절된 회원 정보
   */
  @Post('users/:id/reject')
  @ApiOperation({
    summary: '회원가입 거절',
    description: '대기 중인 회원가입을 거절합니다. 거절 사유를 입력할 수 있습니다.',
  })
  @ApiParam({ name: 'id', description: '거절할 회원 ID' })
  @ApiBody({ type: RejectUserDto })
  @ApiResponse({ status: 200, description: '거절 성공' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  rejectUser(
    @Request() req: RequestWithUser,
    @Param('id') userId: string,
    @Body() dto: RejectUserDto,
  ) {
    return this.adminService.rejectUser(req.user.id, userId, dto.reason);
  }

  /**
   * 회원 상태 변경 (활성화/비활성화)
   * @param req 관리자 요청 객체
   * @param userId 상태 변경할 회원 ID
   * @param dto 상태 변경 정보
   * @returns 업데이트된 회원 정보
   */
  @Patch('users/:id/status')
  @ApiOperation({
    summary: '회원 상태 변경',
    description: '회원의 활성화/비활성화 상태를 변경합니다.',
  })
  @ApiParam({ name: 'id', description: '회원 ID' })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  updateStatus(
    @Request() req: RequestWithUser,
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(req.user.id, userId, dto);
  }

  /**
   * 회원 강제 탈퇴
   * @param userId 탈퇴시킬 회원 ID
   * @returns 삭제 결과
   */
  @Delete('users/:id')
  @ApiOperation({
    summary: '회원 강제 탈퇴',
    description: '회원을 시스템에서 완전히 삭제합니다. 이 작업은 되돌릴 수 없습니다.',
  })
  @ApiParam({ name: 'id', description: '삭제할 회원 ID' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  /**
   * 관리자 대시보드 통계 요약
   * @returns 회원 통계 요약 정보
   */
  @Get('stats/summary')
  @ApiOperation({
    summary: '통계 요약',
    description: '관리자 대시보드용 통계 요약 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '통계 요약 반환' })
  getStatsSummary() {
    return this.adminService.getStatsSummary();
  }
}
