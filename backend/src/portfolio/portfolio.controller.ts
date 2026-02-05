/**
 * @fileoverview 포트폴리오 컨트롤러
 * @description 업비트 API 연동 및 보유 자산 조회 기능 제공
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { ConnectUpbitDto } from './dto/connect-upbit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 포트폴리오 컨트롤러
 * @description 업비트 API 연동을 통한 실제 보유 자산 조회 기능
 */
@ApiTags('Portfolio')
@ApiBearerAuth('access-token')
@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  /**
   * 업비트 API 연동
   * @param user 현재 로그인한 사용자 정보
   * @param dto 업비트 API 키 정보
   * @returns 연동 성공 메시지 및 보유 자산
   * @description 사용자의 업비트 API 키를 등록하여 실제 보유 자산을 조회할 수 있도록 합니다
   */
  @Post('connect')
  @ApiOperation({
    summary: '업비트 API 연동',
    description: '업비트 API 키를 등록하여 실제 보유 자산을 조회할 수 있습니다. API 키는 암호화되어 저장됩니다.',
  })
  @ApiBody({ type: ConnectUpbitDto })
  @ApiResponse({ status: 201, description: '연동 성공' })
  @ApiResponse({ status: 400, description: '잘못된 API 키' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async connectUpbit(
    @CurrentUser() user: { id: string },
    @Body() dto: ConnectUpbitDto,
  ) {
    return this.portfolioService.connectUpbit(
      user.id,
      dto.accessKey,
      dto.secretKey,
    );
  }

  /**
   * 업비트 API 연동 해제
   * @param user 현재 로그인한 사용자 정보
   * @returns 연동 해제 성공 여부
   * @description 저장된 API 키를 삭제하고 연동을 해제합니다
   */
  @Delete('disconnect')
  @ApiOperation({
    summary: '업비트 API 연동 해제',
    description: '저장된 업비트 API 키를 삭제하고 연동을 해제합니다.',
  })
  @ApiResponse({ status: 200, description: '연동 해제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async disconnectUpbit(@CurrentUser() user: { id: string }) {
    await this.portfolioService.disconnectUpbit(user.id);
    return { success: true };
  }

  /**
   * 포트폴리오 조회
   * @param user 현재 로그인한 사용자 정보
   * @returns 보유 자산 목록 (코인별 수량, 평균 매수가, 현재가, 수익률)
   * @description 업비트 API를 통해 실제 보유 자산을 조회하고 수익률을 계산합니다
   */
  @Get()
  @ApiOperation({
    summary: '포트폴리오 조회',
    description: '연동된 업비트 계정의 보유 자산을 조회합니다. 코인별 수량, 평균 매수가, 현재가, 수익률 정보를 포함합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '보유 자산 목록 (수량, 평균단가, 현재가, 수익률 포함)',
  })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 400, description: '업비트 연동되지 않음' })
  async getPortfolio(@CurrentUser() user: { id: string }) {
    return this.portfolioService.getPortfolio(user.id);
  }

  /**
   * 업비트 연동 상태 확인
   * @param user 현재 로그인한 사용자 정보
   * @returns 연동 여부 (boolean)
   */
  @Get('status')
  @ApiOperation({
    summary: '연동 상태 확인',
    description: '업비트 API 연동 여부를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '{ isConnected: boolean }',
  })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async getConnectionStatus(@CurrentUser() user: { id: string }) {
    const isConnected = await this.portfolioService.isUpbitConnected(user.id);
    return { isConnected };
  }
}
