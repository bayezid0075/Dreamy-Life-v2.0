import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';

export class CreateConversationDto {
  @IsEnum(['direct', 'group'])
  type: 'direct' | 'group';

  @IsArray()
  @IsString({ each: true })
  memberIds: string[];

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
