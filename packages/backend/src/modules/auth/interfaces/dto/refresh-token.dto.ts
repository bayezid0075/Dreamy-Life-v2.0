import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiPropertyOptional({
    description: 'Refresh token (can also be provided via httpOnly cookie)',
    example: 'eyJhbGciOiJIUzI1NiIs...',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
