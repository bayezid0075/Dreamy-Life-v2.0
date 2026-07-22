import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number registered with your account',
    example: '+8801712345678',
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: '6-digit OTP code sent to your WhatsApp',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  otpCode: string;
}
