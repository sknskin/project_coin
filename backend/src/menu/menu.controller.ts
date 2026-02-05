/**
 * @fileoverview 메뉴 컨트롤러
 * @description 사용자 역할에 따른 동적 메뉴 목록 제공
 */

import { Controller, Get, Headers } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

/**
 * 메뉴 컨트롤러
 * @description 역할 기반 동적 네비게이션 메뉴 제공
 */
@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(
    private menuService: MenuService,
    private jwtService: JwtService,
  ) {}

  /**
   * 메뉴 목록 조회
   * @param authHeader Authorization 헤더 (선택적)
   * @returns 사용자 역할에 맞는 메뉴 목록
   * @description 인증 토큰이 있으면 역할에 따른 메뉴를, 없으면 공개 메뉴만 반환합니다
   */
  @Get()
  @ApiOperation({
    summary: '메뉴 목록 조회',
    description: '사용자 역할에 따른 네비게이션 메뉴 목록을 반환합니다. 인증되지 않은 경우 공개 메뉴만 반환됩니다.',
  })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: 'Bearer 토큰 (선택적)',
  })
  @ApiResponse({
    status: 200,
    description: '메뉴 목록 반환 (경로, 아이콘, 라벨, 서브메뉴 포함)',
  })
  async getMenus(@Headers('authorization') authHeader?: string) {
    let userRole: UserRole | undefined;

    // Bearer 토큰이 있으면 역할 추출 시도
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.jwtService.verify(token);
        userRole = decoded.role;
      } catch {
        // 유효하지 않은 토큰은 미인증 상태로 처리
      }
    }

    return this.menuService.getMenus(userRole);
  }
}
