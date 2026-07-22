import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'Phone number registered with your account',
    example: '+8801712345678',
  })
  @IsString()
  @MinLength(10)
  phoneNumber: string;
}
