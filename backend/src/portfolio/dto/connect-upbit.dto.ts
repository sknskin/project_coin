import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectUpbitDto {
  @ApiProperty({
    description: '업비트 API Access Key',
    example: 'your-access-key-here',
  })
  @IsString()
  @MinLength(1)
  accessKey: string;

  @ApiProperty({
    description: '업비트 API Secret Key',
    example: 'your-secret-key-here',
  })
  @IsString()
  @MinLength(1)
  secretKey: string;
}
