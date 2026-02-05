/**
 * @fileoverview 사용자 컨트롤러
 * @description 관심 코인(Watchlist) 관리 API 엔드포인트 제공
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * 사용자 컨트롤러
 * @description 관심 코인 목록 CRUD 기능 제공
 */
@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * 관심 코인 목록 조회
   * @param user 현재 로그인한 사용자 정보
   * @returns 관심 코인 목록 (마켓 코드 배열)
   */
  @Get('watchlist')
  @ApiOperation({
    summary: '관심 코인 목록 조회',
    description: '사용자가 등록한 관심 코인 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '관심 코인 목록 반환' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  async getWatchlist(@CurrentUser() user: { id: string }) {
    return this.usersService.getWatchlist(user.id);
  }

  /**
   * 관심 코인 추가
   * @param user 현재 로그인한 사용자 정보
   * @param marketCode 추가할 코인 마켓 코드 (예: KRW-BTC)
   * @returns 추가된 관심 코인 정보
   */
  @Post('watchlist/:marketCode')
  @ApiOperation({
    summary: '관심 코인 추가',
    description: '새로운 코인을 관심 목록에 추가합니다.',
  })
  @ApiParam({ name: 'marketCode', description: '마켓 코드 (예: KRW-BTC)', example: 'KRW-BTC' })
  @ApiResponse({ status: 201, description: '관심 코인 추가 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 409, description: '이미 등록된 코인' })
  async addToWatchlist(
    @CurrentUser() user: { id: string },
    @Param('marketCode') marketCode: string,
  ) {
    return this.usersService.addToWatchlist(user.id, marketCode);
  }

  /**
   * 관심 코인 삭제
   * @param user 현재 로그인한 사용자 정보
   * @param marketCode 삭제할 코인 마켓 코드
   * @returns 삭제 성공 여부
   */
  @Delete('watchlist/:marketCode')
  @ApiOperation({
    summary: '관심 코인 삭제',
    description: '관심 목록에서 코인을 제거합니다.',
  })
  @ApiParam({ name: 'marketCode', description: '마켓 코드 (예: KRW-BTC)', example: 'KRW-BTC' })
  @ApiResponse({ status: 200, description: '관심 코인 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 404, description: '등록되지 않은 코인' })
  async removeFromWatchlist(
    @CurrentUser() user: { id: string },
    @Param('marketCode') marketCode: string,
  ) {
    await this.usersService.removeFromWatchlist(user.id, marketCode);
    return { success: true };
  }
}
