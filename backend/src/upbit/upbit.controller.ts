/**
 * @fileoverview 업비트 시세 컨트롤러
 * @description 업비트 API를 통한 코인 시세, 캔들 데이터 조회 엔드포인트 제공
 * @see https://docs.upbit.com/reference 업비트 API 문서
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UpbitService } from './upbit.service';

/**
 * 업비트 시세 컨트롤러
 * @description KRW 마켓 코인 시세 및 차트 데이터 제공
 */
@ApiTags('Upbit')
@Controller('markets')
export class UpbitController {
  constructor(private upbitService: UpbitService) {}

  /**
   * KRW 마켓 코인 목록 조회
   * @returns 원화 거래 가능한 모든 코인 목록
   */
  @Get()
  @ApiOperation({
    summary: 'KRW 마켓 코인 목록',
    description: '원화로 거래 가능한 모든 코인 목록을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '코인 목록 반환 (마켓코드, 한글명, 영문명 포함)',
  })
  async getMarkets() {
    return this.upbitService.getKrwMarkets();
  }

  /**
   * 특정 코인 현재가 조회
   * @param code 마켓 코드 (예: KRW-BTC)
   * @returns 현재가, 변동률, 거래량 등 시세 정보
   */
  @Get(':code/ticker')
  @ApiOperation({
    summary: '코인 현재가 조회',
    description: '특정 코인의 현재가 및 시세 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'code',
    description: '마켓 코드',
    example: 'KRW-BTC',
  })
  @ApiResponse({
    status: 200,
    description: '현재가, 전일대비 변동률, 거래량 등 반환',
  })
  @ApiResponse({ status: 404, description: '존재하지 않는 마켓 코드' })
  async getTicker(@Param('code') code: string) {
    const tickers = await this.upbitService.getTicker([code]);
    return tickers[0];
  }

  /**
   * 캔들(차트) 데이터 조회
   * @param code 마켓 코드
   * @param unit 분봉 단위 (1, 3, 5, 15, 30, 60, 240분)
   * @param count 조회할 캔들 개수 (기본값: 200, 최대: 200)
   * @param to 마지막 캔들 시각 (ISO 8601 형식)
   * @param type 캔들 타입 (minutes, days, weeks, months)
   * @returns 캔들 데이터 배열 (시가, 고가, 저가, 종가, 거래량)
   */
  @Get(':code/candles')
  @ApiOperation({
    summary: '캔들(차트) 데이터 조회',
    description: '분/일/주/월 단위의 캔들 차트 데이터를 조회합니다. TradingView 차트에서 사용됩니다.',
  })
  @ApiParam({
    name: 'code',
    description: '마켓 코드',
    example: 'KRW-BTC',
  })
  @ApiQuery({
    name: 'unit',
    required: false,
    description: '분봉 단위 (1, 3, 5, 15, 30, 60, 240)',
    example: '1',
  })
  @ApiQuery({
    name: 'count',
    required: false,
    description: '조회할 캔들 개수 (최대 200)',
    example: '200',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: '마지막 캔들 시각 (ISO 8601, 예: 2024-01-01T00:00:00Z)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: '캔들 타입',
    enum: ['minutes', 'days', 'weeks', 'months'],
    example: 'minutes',
  })
  @ApiResponse({
    status: 200,
    description: '캔들 데이터 배열 (시가, 고가, 저가, 종가, 거래량)',
  })
  async getCandles(
    @Param('code') code: string,
    @Query('unit') unit: string = '1',
    @Query('count') count: string = '200',
    @Query('to') to?: string,
    @Query('type') type: string = 'minutes',
  ) {
    const countNum = parseInt(count, 10);

    // 캔들 타입에 따라 적절한 API 호출
    switch (type) {
      case 'days':
        return this.upbitService.getDayCandles(code, countNum, to);
      case 'weeks':
        return this.upbitService.getWeekCandles(code, countNum, to);
      case 'months':
        return this.upbitService.getMonthCandles(code, countNum, to);
      default:
        // 분봉: 1, 3, 5, 15, 30, 60, 240분 단위 지원
        const unitNum = parseInt(unit, 10) as 1 | 3 | 5 | 15 | 30 | 60 | 240;
        return this.upbitService.getMinuteCandles(code, unitNum, countNum, to);
    }
  }
}
