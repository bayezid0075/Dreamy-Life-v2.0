import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async generateAccessToken(userId: string, email: string): Promise<string> {
    return this.jwt.sign({ userId, email }, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    });
  }

  async generateRefreshToken(userId: string): Promise<string> {
    return this.jwt.sign({ userId }, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  async verifyRefreshToken(token: string): Promise<any> {
    return this.jwt.verify(token, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });
  }
}
