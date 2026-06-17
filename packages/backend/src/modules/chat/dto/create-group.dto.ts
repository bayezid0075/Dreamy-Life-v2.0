import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  memberIds: string[];

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
