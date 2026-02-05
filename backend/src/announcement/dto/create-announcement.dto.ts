import { IsString, IsBoolean, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: '공지사항 제목',
    example: '시스템 점검 안내',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({
    description: '공지사항 내용',
    example: '2024년 1월 15일 오전 2시부터 4시까지 시스템 점검이 예정되어 있습니다.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    description: '상단 고정 여부',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPinned?: boolean;
}
