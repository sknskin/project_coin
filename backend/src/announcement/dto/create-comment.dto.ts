import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '좋은 공지사항입니다!',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    description: '부모 댓글 ID (대댓글인 경우)',
    example: 'comment-uuid',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
