import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({
    description: '공지사항 제목',
    example: '시스템 점검 안내 (수정)',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional({
    description: '공지사항 내용',
    example: '점검 시간이 변경되었습니다.',
    minLength: 1,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({
    description: '상단 고정 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPinned?: boolean;
}
