/**
 * @fileoverview 공지사항 컨트롤러
 * @description 공지사항 CRUD, 댓글, 좋아요 기능 API 엔드포인트 제공
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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserRole } from '@prisma/client';

/**
 * Multer 파일 업로드 설정
 * @description 공지사항 첨부파일 저장 설정
 */
const multerOptions = {
  storage: diskStorage({
    destination: './uploads/announcements', // 저장 경로
    filename: (_req, file, callback) => {
      // 고유한 파일명 생성 (UUID + 원본 확장자)
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 파일당 10MB 제한
};

/**
 * 공지사항 컨트롤러
 * @description 게시글 CRUD, 댓글, 좋아요 등 모든 공지사항 기능 처리
 */
@ApiTags('Announcement')
@ApiBearerAuth('access-token')
@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementController {
  constructor(private announcementService: AnnouncementService) {}

  /**
   * 공지사항 목록 조회
   * @param page 페이지 번호 (기본값: 1)
   * @param limit 페이지당 항목 수 (기본값: 10)
   * @returns 페이지네이션된 공지사항 목록
   */
  @Get()
  @ApiOperation({
    summary: '공지사항 목록 조회',
    description: '모든 공지사항 목록을 페이지네이션하여 조회합니다. 고정 공지가 먼저 표시됩니다.',
  })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수 (기본값: 10)' })
  @ApiResponse({ status: 200, description: '공지사항 목록 반환' })
  getAnnouncements(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    return this.announcementService.getAnnouncements(
      parseInt(page),
      parseInt(limit),
    );
  }

  /**
   * 공지사항 상세 조회
   * @param id 공지사항 ID
   * @param user 현재 사용자 정보
   * @returns 공지사항 상세 정보 (댓글, 좋아요 포함)
   */
  @Get(':id')
  @ApiOperation({
    summary: '공지사항 상세 조회',
    description: '특정 공지사항의 상세 정보를 조회합니다. 조회 시 조회수가 증가합니다.',
  })
  @ApiParam({ name: 'id', description: '공지사항 ID' })
  @ApiResponse({ status: 200, description: '공지사항 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  getAnnouncementById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.announcementService.getAnnouncementById(id, user.id);
  }

  /**
   * 공지사항 작성 (관리자 전용)
   * @param user 현재 사용자 정보
   * @param dto 공지사항 작성 정보
   * @param files 첨부 파일 목록 (최대 5개)
   * @returns 생성된 공지사항 정보
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  @ApiOperation({
    summary: '공지사항 작성',
    description: '새 공지사항을 작성합니다. 관리자만 작성할 수 있습니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateAnnouncementDto })
  @ApiResponse({ status: 201, description: '공지사항 생성 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  createAnnouncement(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateAnnouncementDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.announcementService.createAnnouncement(user.id, dto, files);
  }

  /**
   * 공지사항 수정 (관리자 전용)
   * @param id 수정할 공지사항 ID
   * @param user 현재 사용자 정보
   * @param dto 수정할 내용
   * @param files 새 첨부 파일 목록
   * @returns 수정된 공지사항 정보
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FilesInterceptor('files', 5, multerOptions))
  @ApiOperation({
    summary: '공지사항 수정',
    description: '공지사항을 수정합니다. 관리자만 수정할 수 있습니다.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: '공지사항 ID' })
  @ApiBody({ type: UpdateAnnouncementDto })
  @ApiResponse({ status: 200, description: '공지사항 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  updateAnnouncement(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
    @Body() dto: UpdateAnnouncementDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.announcementService.updateAnnouncement(id, user.role, dto, files);
  }

  /**
   * 공지사항 삭제 (관리자 전용)
   * @param id 삭제할 공지사항 ID
   * @param user 현재 사용자 정보
   * @returns 삭제 결과
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: '공지사항 삭제',
    description: '공지사항을 삭제합니다. 관리자만 삭제할 수 있습니다.',
  })
  @ApiParam({ name: 'id', description: '공지사항 ID' })
  @ApiResponse({ status: 200, description: '공지사항 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  deleteAnnouncement(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.announcementService.deleteAnnouncement(id, user.role);
  }

  // ==================== 댓글 API ====================

  /**
   * 댓글 작성
   * @param announcementId 공지사항 ID
   * @param user 현재 사용자 정보
   * @param dto 댓글 내용 (대댓글의 경우 parentId 포함)
   * @returns 생성된 댓글 정보
   */
  @Post(':id/comments')
  @ApiOperation({
    summary: '댓글 작성',
    description: '공지사항에 댓글을 작성합니다. parentId를 포함하면 대댓글이 됩니다.',
  })
  @ApiParam({ name: 'id', description: '공지사항 ID' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: '댓글 작성 성공' })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  createComment(
    @Param('id') announcementId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateCommentDto,
  ) {
    return this.announcementService.createComment(
      announcementId,
      user.id,
      dto,
    );
  }

  /**
   * 댓글 삭제
   * @param announcementId 공지사항 ID
   * @param commentId 삭제할 댓글 ID
   * @param user 현재 사용자 정보
   * @returns 삭제 결과
   */
  @Delete(':id/comments/:commentId')
  @ApiOperation({
    summary: '댓글 삭제',
    description: '댓글을 삭제합니다. 본인 댓글 또는 관리자만 삭제할 수 있습니다.',
  })
  @ApiParam({ name: 'id', description: '공지사항 ID' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
  deleteComment(
    @Param('id') announcementId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.announcementService.deleteComment(
      announcementId,
      commentId,
      user.id,
      user.role,
    );
  }

  // ==================== 좋아요 API ====================

  /**
   * 공지사항 좋아요 토글
   * @param announcementId 공지사항 ID
   * @param user 현재 사용자 정보
   * @returns 좋아요 상태 및 총 좋아요 수
   */
  @Post(':id/like')
  @ApiOperation({
    summary: '공지사항 좋아요',
    description: '공지사항에 좋아요를 추가하거나 취소합니다 (토글).',
  })
  @ApiParam({ name: 'id', description: '공지사항 ID' })
  @ApiResponse({ status: 200, description: '좋아요 토글 성공' })
  @ApiResponse({ status: 404, description: '공지사항을 찾을 수 없음' })
  toggleLike(
    @Param('id') announcementId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.announcementService.toggleLike(announcementId, user.id);
  }

  /**
   * 댓글 좋아요 토글
   * @param commentId 댓글 ID
   * @param user 현재 사용자 정보
   * @returns 좋아요 상태 및 총 좋아요 수
   */
  @Post(':id/comments/:commentId/like')
  @ApiOperation({
    summary: '댓글 좋아요',
    description: '댓글에 좋아요를 추가하거나 취소합니다 (토글).',
  })
  @ApiParam({ name: 'id', description: '공지사항 ID' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '좋아요 토글 성공' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
  toggleCommentLike(
    @Param('commentId') commentId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.announcementService.toggleCommentLike(commentId, user.id);
  }
}
