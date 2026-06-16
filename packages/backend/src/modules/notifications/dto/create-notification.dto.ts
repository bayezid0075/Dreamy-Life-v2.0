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
  @IsIn(['broadcast', 'targeted'])
  type?: string = 'broadcast';

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
