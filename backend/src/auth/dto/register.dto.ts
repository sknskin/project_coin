import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @ApiProperty({
    description: '아이디 (4-30자, 영문/숫자/밑줄만 허용)',
    example: 'john_doe',
    minLength: 4,
    maxLength: 30,
  })
  @IsString()
  @MinLength(4, { message: '아이디는 4자 이상이어야 합니다.' })
  @MaxLength(30, { message: '아이디는 30자 이하이어야 합니다.' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '아이디는 영문자, 숫자, 밑줄(_)만 사용할 수 있습니다.',
  })
  username: string;

  @ApiProperty({
    description: '비밀번호 (10자 이상, 영문/숫자/특수문자 포함)',
    example: 'Password123!',
    minLength: 10,
  })
  @IsString()
  @MinLength(10, { message: '비밀번호는 10자 이상이어야 합니다.' })
  @MaxLength(100)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]+$/, {
    message: '비밀번호는 영문자, 숫자, 특수문자를 각각 1자 이상 포함해야 합니다.',
  })
  password: string;

  @ApiPropertyOptional({
    description: '닉네임 (선택)',
    example: '홍길동',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nickname?: string;

  @ApiProperty({
    description: '성명',
    example: '홍길동',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: '성명을 입력해주세요.' })
  @MinLength(2, { message: '성명은 2자 이상이어야 합니다.' })
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: '연락처 (하이픈 제외 숫자만)',
    example: '01012345678',
  })
  @IsString({ message: '연락처를 입력해주세요.' })
  @Matches(/^[0-9]+$/, { message: '연락처는 숫자만 입력 가능합니다. (하이픈 제외)' })
  phone: string;

  @ApiProperty({
    description: '주소',
    example: '서울시 강남구 테헤란로 123',
    minLength: 5,
    maxLength: 200,
  })
  @IsString({ message: '주소를 입력해주세요.' })
  @MinLength(5, { message: '주소를 정확히 입력해주세요.' })
  @MaxLength(200)
  address: string;

  @ApiProperty({
    description: '주민등록번호 (형식: 900101-1234567)',
    example: '900101-1234567',
    pattern: '^[0-9]{6}-[0-9]{7}$',
  })
  @IsString({ message: '주민등록번호를 입력해주세요.' })
  @Matches(/^[0-9]{6}-[0-9]{7}$/, { message: '주민등록번호 형식이 올바르지 않습니다. (예: 900101-1234567)' })
  ssn: string;
}
