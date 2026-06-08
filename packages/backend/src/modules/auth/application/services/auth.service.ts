import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../../users/application/services/users.service';
import { PasswordService } from '../../domain/services/password.service';
import { TokenService } from '../../infrastructure/jwt.service';
import { UserProps } from '../../users/domain/entities/user.entity';
import { sessions } from '../../../infrastructure/database/schema';
import { NodePGDatabase } from 'drizzle-orm/node-postgres';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    @Inject('DATABASE_CONNECTION') private readonly db: NodePGDatabase<any>
  ) {}

  async register(props: UserProps) {
    const existing = await this.usersService.findByEmail(props.email);
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await this.passwordService.hash(props.passwordHash);
    const user = await this.usersService.create({
      ...props,
      passwordHash,
    });

    return { userId: user.id, email: user.email };
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await this.passwordService.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.tokenService.generateAccessToken(user.id, user.email);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    // Save session
    await this.db.insert(sessions).values({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      const session = await this.db.query.sessions.findFirst({
        where: eq(sessions.refreshToken, refreshToken),
      });

      if (!session || session.userId !== payload.userId) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.usersService.findById(payload.userId);
      const newAccessToken = await this.tokenService.generateAccessToken(user.id, user.email);

      return { accessToken: newAccessToken };
    } catch (e) {
      throw new UnauthorizedException('Session expired');
    }
  }
}
