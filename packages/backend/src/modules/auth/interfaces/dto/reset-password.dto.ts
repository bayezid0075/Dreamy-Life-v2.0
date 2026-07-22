import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Length } from 'class-validator';

export class ResetPasswordDto {
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

  @ApiProperty({
    description: 'New password (min 6 characters)',
    example: 'newSecurePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
