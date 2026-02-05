import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class ApproveUserDto {
  @ApiPropertyOptional({
    description: '부여할 역할',
    enum: UserRole,
    example: 'USER',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class RejectUserDto {
  @ApiPropertyOptional({
    description: '거절 사유',
    example: '서류 미비',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserStatusDto {
  @ApiProperty({
    description: '변경할 상태',
    enum: UserStatus,
    example: 'ACTIVE',
  })
  @IsEnum(UserStatus)
  status: UserStatus;
}
