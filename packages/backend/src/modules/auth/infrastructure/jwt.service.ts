import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async generateAccessToken(userId: string, username: string): Promise<string> {
    return this.jwt.sign(
      { userId, username },
      {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
      },
    );
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return this.jwt.sign(
      { userId },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string; iat: number; exp: number }> {
    try {
      return this.jwt.verify(token, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
