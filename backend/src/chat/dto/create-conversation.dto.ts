import { IsArray, IsNotEmpty, IsString, ArrayMinSize } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[];
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
