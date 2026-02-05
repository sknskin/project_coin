import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus, ApprovalStatus } from '@prisma/client';

export class UserFilterDto {
  @ApiPropertyOptional({
    description: '회원 상태 필터',
    enum: UserStatus,
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: '승인 상태 필터',
    enum: ApprovalStatus,
    example: 'PENDING',
  })
  @IsOptional()
  @IsEnum(ApprovalStatus)
  approvalStatus?: ApprovalStatus;

  @ApiPropertyOptional({
    description: '역할 필터',
    enum: UserRole,
    example: 'USER',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: '검색어 (이메일, 아이디, 닉네임)',
    example: 'hong',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
