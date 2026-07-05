import { IsString, IsOptional, IsIn, IsDateString, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsIn(['broadcast', 'targeted'])
  type?: string = 'broadcast';

  @IsOptional()
  @IsIn(['social', 'app', 'marketing', 'system'])
  category?: string = 'app';

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class RegisterPushTokenDto {
  @IsString()
  token: string;

  @IsIn(['web', 'android', 'ios'])
  platform: string;
}
