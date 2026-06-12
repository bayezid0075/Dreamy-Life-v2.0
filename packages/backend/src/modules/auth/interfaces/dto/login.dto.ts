import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Username or phone number',
    example: 'john_doe',
  })
  @IsString()
  @MinLength(1)
  username: string;

  @ApiProperty({
    description: 'Password',
    example: 'securePass123',
  })
  @IsString()
  @MinLength(1)
  password: string;
}
