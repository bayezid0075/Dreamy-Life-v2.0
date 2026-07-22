import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@dreamylife.com',
  })
  @IsString()
  @MinLength(1)
  email: string;

  @ApiProperty({
    description: 'Admin access code',
    example: 'ADMIN001',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  accessCode: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'admin123',
  })
  @IsString()
  @MinLength(1)
  password: string;
}
