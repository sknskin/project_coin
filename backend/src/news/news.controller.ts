/**
 * @fileoverview 뉴스 컨트롤러
 * @description 코인 관련 뉴스 조회 및 스크래핑 API 엔드포인트 제공
 */

import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NewsService } from './news.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

/**
 * 뉴스 컨트롤러
 * @description 암호화폐 관련 뉴스 조회 기능 제공
 */
@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private newsService: NewsService) {}

  /**
   * 뉴스 목록 조회
   * @param page 페이지 번호 (기본값: 1)
   * @param limit 페이지당 항목 수 (기본값: 20)
   * @returns 페이지네이션된 뉴스 목록
   */
  @Get()
  @ApiOperation({
    summary: '뉴스 목록 조회',
    description: '암호화폐 관련 뉴스 목록을 페이지네이션하여 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값: 20)' })
  @ApiResponse({
    status: 200,
    description: '뉴스 목록 반환 (제목, 요약, 출처, 링크, 작성일 포함)',
  })
  getNews(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.newsService.getNews(parseInt(page), parseInt(limit));
  }

  /**
   * 뉴스 상세 조회
   * @param id 뉴스 ID
   * @returns 뉴스 상세 정보
   */
  @Get(':id')
  @ApiOperation({
    summary: '뉴스 상세 조회',
    description: '특정 뉴스의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'id', description: '뉴스 ID' })
  @ApiResponse({ status: 200, description: '뉴스 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '뉴스를 찾을 수 없음' })
  getNewsById(@Param('id') id: string) {
    return this.newsService.getNewsById(id);
  }

  /**
   * 수동 뉴스 스크래핑 (관리자 전용)
   * @returns 스크래핑 결과
   * @description 뉴스 소스에서 최신 뉴스를 수동으로 가져옵니다
   */
  @Post('scrape')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '뉴스 스크래핑 (관리자)',
    description: '뉴스 소스에서 최신 뉴스를 수동으로 스크래핑합니다. 관리자만 사용 가능합니다.',
  })
  @ApiResponse({ status: 200, description: '스크래핑 완료' })
  @ApiResponse({ status: 401, description: '인증되지 않음' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async manualScrape() {
    await this.newsService.scrapeNews();
    return { success: true, message: 'News scraping completed' };
  }
}
