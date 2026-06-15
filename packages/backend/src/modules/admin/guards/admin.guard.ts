import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../../../infrastructure/database/schema';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: { userId: string; username: string };
    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET') || 'super_secret_jwt_key',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, payload.userId),
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.memberStatus !== 'super_admin') {
      throw new ForbiddenException('Access denied. Admin privileges required.');
    }

    request.user = { userId: user.id, username: user.username, memberStatus: user.memberStatus };
    return true;
  }
}
