import { IsString, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: '닉네임',
    example: '코인왕',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({
    description: '성명',
    example: '홍길동',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: '연락처',
    example: '01012345678',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: '주소',
    example: '서울시 강남구 테헤란로 123',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: '현재 비밀번호',
    example: 'OldPassword123!',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: '새 비밀번호 (10자 이상, 영문/숫자/특수문자 포함)',
    example: 'NewPassword456!',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: '비밀번호는 10자 이상이어야 합니다.' })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/, {
    message: '비밀번호는 영문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.',
  })
  newPassword: string;
}
