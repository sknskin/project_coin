/**
 * @fileoverview 마이페이지 컨트롤러
 * @description 프로필 조회/수정, 비밀번호 변경 API 엔드포인트 제공
 */

import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MyPageService } from './mypage.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';

/**
 * 인증된 요청 타입 정의
 */
interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string };
}

/**
 * 마이페이지 컨트롤러
 * @description 사용자 프로필 관리 기능 제공
 */
@ApiTags('MyPage')
@ApiBearerAuth('access-token')
@Controller('mypage')
@UseGuards(JwtAuthGuard)
export class MyPageController {
  constructor(private myPageService: MyPageService) {}

  /**
   * 프로필 조회
   * @param req 인증된 요청 객체
   * @returns 사용자 프로필 정보 (비밀번호 제외)
   */
  @Get('profile')
  @ApiOperation({
    summary: '프로필 조회',
    description: '현재 로그인한 사용자의 프로필 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 정보 반환 (이메일, 닉네임, 가입일 등)',
  })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  getProfile(@Request() req: RequestWithUser) {
    return this.myPageService.getProfile(req.user.id);
  }

  /**
   * 프로필 수정
   * @param req 인증된 요청 객체
   * @param dto 수정할 프로필 정보 (닉네임 등)
   * @returns 수정된 프로필 정보
   */
  @Patch('profile')
  @ApiOperation({
    summary: '프로필 수정',
    description: '사용자의 프로필 정보를 수정합니다. 닉네임 등을 변경할 수 있습니다.',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: '프로필 수정 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 409, description: '닉네임 중복' })
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.myPageService.updateProfile(req.user.id, dto);
  }

  /**
   * 비밀번호 변경
   * @param req 인증된 요청 객체
   * @param dto 비밀번호 변경 정보 (현재 비밀번호, 새 비밀번호)
   * @returns 변경 성공 메시지
   */
  @Post('password')
  @ApiOperation({
    summary: '비밀번호 변경',
    description: '현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: '비밀번호 변경 성공' })
  @ApiResponse({ status: 400, description: '현재 비밀번호 불일치' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  changePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.myPageService.changePassword(req.user.id, dto);
  }
}
