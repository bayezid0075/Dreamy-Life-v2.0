import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsEmail, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Unique username',
    example: 'john_doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+8801712345678',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  phoneNumber: string;

  @ApiProperty({
    description: 'Password (min 6 characters)',
    example: 'securePass123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'Referral code from an existing user (8 digits)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Referral code must be 8 digits' })
  referCode?: string;
}
