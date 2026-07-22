import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address or phone number',
    example: 'john@example.com',
  })
  @IsString()
  @MinLength(1)
  emailOrPhone: string;

  @ApiProperty({
    description: 'Password',
    example: 'securePass123',
  })
  @IsString()
  @MinLength(1)
  password: string;
}
