import { IsArray, IsNotEmpty, IsOptional, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    description: '대화에 참여할 사용자 ID 목록',
    example: ['user-uuid-1', 'user-uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];

  @ApiPropertyOptional({
    description: '그룹 대화방 이름 (선택)',
    example: '프로젝트 팀',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: '메시지 내용',
    example: '안녕하세요!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AddParticipantsDto {
  @ApiProperty({
    description: '추가할 사용자 ID 목록',
    example: ['user-uuid-3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];
}
