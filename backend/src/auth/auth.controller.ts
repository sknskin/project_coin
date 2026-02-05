/**
 * @fileoverview 인증 컨트롤러
 * @description 회원가입, 로그인, 로그아웃, 토큰 갱신 등 인증 관련 API 엔드포인트 제공
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 인증 컨트롤러
 * @description JWT 기반 인증 시스템의 모든 엔드포인트를 관리
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 회원가입
   * @param dto 회원가입 정보 (이메일, 비밀번호, 이름 등)
   * @returns 생성된 사용자 정보 (승인 대기 상태)
   */
  @Post('register')
  @ApiOperation({
    summary: '회원가입',
    description: '새 사용자를 등록합니다. 관리자 승인 후 로그인이 가능합니다.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: '회원가입 성공 (승인 대기)' })
  @ApiResponse({ status: 400, description: '잘못된 요청 (유효성 검사 실패)' })
  @ApiResponse({ status: 409, description: '이메일/아이디 중복' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * 로그인
   * @param dto 로그인 정보 (이메일/아이디, 비밀번호)
   * @param req Express 요청 객체 (IP, User-Agent 추출용)
   * @param res Express 응답 객체 (쿠키 설정용)
   * @returns 사용자 정보 및 액세스 토큰
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '이메일 또는 아이디로 로그인합니다. 액세스 토큰과 리프레시 토큰(쿠키)을 발급합니다.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패 (잘못된 자격 증명)' })
  @ApiResponse({ status: 403, description: '계정 비활성화 또는 미승인' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 클라이언트 IP 주소 추출 (프록시 환경 고려)
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];

    // 로그인 처리 및 토큰 발급
    const result = await this.authService.login(dto, ipAddress, userAgent);

    // 리프레시 토큰을 HTTP-only 쿠키로 설정 (XSS 방지)
    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  /**
   * 로그아웃
   * @param user 현재 로그인한 사용자 정보
   * @param req Express 요청 객체 (리프레시 토큰 추출용)
   * @param res Express 응답 객체 (쿠키 삭제용)
   * @returns 성공 여부
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '로그아웃',
    description: '현재 세션을 종료하고 리프레시 토큰을 무효화합니다.',
  })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async logout(
    @CurrentUser() user: { id: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 쿠키에서 리프레시 토큰 추출
    const refreshToken = req.cookies?.refreshToken;

    // 리프레시 토큰이 있으면 DB에서 무효화
    if (refreshToken) {
      await this.authService.logout(user.id, refreshToken);
    }

    // 쿠키 삭제
    res.clearCookie('refreshToken');

    return { success: true };
  }

  /**
   * 토큰 갱신
   * @param req Express 요청 객체 (리프레시 토큰 추출용)
   * @returns 새로운 액세스 토큰
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '토큰 갱신',
    description: '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.',
  })
  @ApiResponse({ status: 200, description: '토큰 갱신 성공' })
  @ApiResponse({ status: 401, description: '유효하지 않은 리프레시 토큰' })
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }

    return this.authService.refreshTokens(refreshToken);
  }

  /**
   * 현재 사용자 정보 조회
   * @param user 현재 로그인한 사용자 정보
   * @returns 사용자 상세 정보
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '현재 사용자 정보',
    description: '로그인한 사용자의 상세 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '사용자 정보 반환' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.validateUser(user.id);
  }

  /**
   * 이메일 중복 확인
   * @param email 확인할 이메일 주소
   * @returns 사용 가능 여부
   */
  @Get('check/email')
  @ApiOperation({
    summary: '이메일 중복 확인',
    description: '회원가입 시 이메일 사용 가능 여부를 확인합니다.',
  })
  @ApiQuery({ name: 'email', description: '확인할 이메일 주소' })
  @ApiResponse({ status: 200, description: '{ available: boolean }' })
  async checkEmail(@Query('email') email: string) {
    const available = await this.authService.checkEmailAvailability(email);
    return { available };
  }

  /**
   * 아이디 중복 확인
   * @param username 확인할 아이디
   * @returns 사용 가능 여부
   */
  @Get('check/username')
  @ApiOperation({
    summary: '아이디 중복 확인',
    description: '회원가입 시 아이디 사용 가능 여부를 확인합니다.',
  })
  @ApiQuery({ name: 'username', description: '확인할 아이디' })
  @ApiResponse({ status: 200, description: '{ available: boolean }' })
  async checkUsername(@Query('username') username: string) {
    const available = await this.authService.checkUsernameAvailability(username);
    return { available };
  }

  /**
   * 닉네임 중복 확인
   * @param nickname 확인할 닉네임
   * @returns 사용 가능 여부
   */
  @Get('check/nickname')
  @ApiOperation({
    summary: '닉네임 중복 확인',
    description: '회원가입 시 닉네임 사용 가능 여부를 확인합니다.',
  })
  @ApiQuery({ name: 'nickname', description: '확인할 닉네임' })
  @ApiResponse({ status: 200, description: '{ available: boolean }' })
  async checkNickname(@Query('nickname') nickname: string) {
    const available = await this.authService.checkNicknameAvailability(nickname);
    return { available };
  }

  /**
   * 리프레시 토큰 쿠키 설정
   * @param res Express 응답 객체
   * @param token 리프레시 토큰
   * @description HTTP-only 쿠키로 설정하여 XSS 공격 방지
   */
  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,  // JavaScript에서 접근 불가 (XSS 방지)
      secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
      sameSite: 'lax', // CSRF 공격 방지
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });
  }
}
