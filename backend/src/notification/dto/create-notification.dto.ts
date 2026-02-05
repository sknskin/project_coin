import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: '알림 타입',
    enum: NotificationType,
    example: 'SYSTEM',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: '알림 제목',
    example: '새로운 공지사항',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '알림 메시지',
    example: '새로운 공지사항이 등록되었습니다.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: '추가 데이터 (JSON)',
    example: { announcementId: 'uuid' },
  })
  @IsOptional()
  data?: Record<string, any>;
}

export class CreateSystemNotificationDto extends CreateNotificationDto {
  @ApiProperty({
    description: '알림을 받을 사용자 ID',
    example: 'user-uuid',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
