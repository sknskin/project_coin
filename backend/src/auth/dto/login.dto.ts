import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '이메일 또는 아이디',
    example: 'user@example.com',
  })
  @IsString({ message: '이메일 또는 아이디를 입력해주세요.' })
  emailOrUsername: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'Password123!',
  })
  @IsString({ message: '비밀번호를 입력해주세요.' })
  password: string;
}
