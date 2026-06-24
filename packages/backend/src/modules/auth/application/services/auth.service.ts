import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, or } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { PasswordService } from '../../domain/services/password.service';
import { TokenService } from '../../infrastructure/jwt.service';
import { ReferralService } from '../../../referral/application/services/referral.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly referralService: ReferralService,
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async register(data: {
    username: string;
    phoneNumber: string;
    password: string;
    referCode?: string;
  }) {
    // Check if username already exists
    const existingUsername = await this.db.query.users.findFirst({
      where: eq(schema.users.username, data.username),
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Check if phone number already exists
    const existingPhone = await this.db.query.users.findFirst({
      where: eq(schema.users.phoneNumber, data.phoneNumber),
    });
    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Generate unique 8-digit referral code
    const ownRefercode = await this.generateUniqueReferCode();

    // Validate referCode if provided
    let referredBy: string | undefined;
    if (data.referCode) {
      const referrer = await this.db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, data.referCode),
      });
      if (!referrer) {
        throw new ConflictException('Invalid referral code');
      }
      referredBy = data.referCode;
    }

    // Hash password
    const passwordHash = await this.passwordService.hash(data.password);

    // Create user
    const [newUser] = await this.db
      .insert(schema.users)
      .values({
        username: data.username,
        phoneNumber: data.phoneNumber,
        password: passwordHash,
        ownRefercode,
        referredBy: referredBy || null,
        memberStatus: 'user',
      })
      .returning();

    // Create empty user_info record
    await this.db.insert(schema.userInfo).values({
      userId: newUser.id,
    });

    // If referred, build referral tree (up to 10 levels)
    if (referredBy) {
      await this.referralService.buildReferralTree(newUser.id, referredBy);
    }

    // Generate tokens
    const accessToken = await this.tokenService.generateAccessToken(newUser.id, newUser.username);
    const refreshToken = await this.tokenService.generateRefreshToken(newUser.id);

    // Save session
    await this.db.insert(schema.sessions).values({
      userId: newUser.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        phoneNumber: newUser.phoneNumber,
        ownRefercode: newUser.ownRefercode,
        memberStatus: newUser.memberStatus,
        referredBy: newUser.referredBy,
      },
    };
  }

  async login(username: string, password: string) {
    // Find user by username or phone number
    const user = await this.db.query.users.findFirst({
      where: or(
        eq(schema.users.username, username),
        eq(schema.users.phoneNumber, username),
      ),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await this.passwordService.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.tokenService.generateAccessToken(user.id, user.username);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    // Save session
    await this.db.insert(schema.sessions).values({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        ownRefercode: user.ownRefercode,
        memberStatus: user.memberStatus,
        referredBy: user.referredBy,
      },
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, payload.userId),
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newAccessToken = await this.tokenService.generateAccessToken(user.id, user.username);

    return { accessToken: newAccessToken };
  }

  async getProfile(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const info = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, userId),
    });

    // Get referral stats
    const referralCount = await this.db.query.referrals.findMany({
      where: eq(schema.referrals.referrerId, userId),
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        phoneNumber: user.phoneNumber,
        ownRefercode: user.ownRefercode,
        memberStatus: user.memberStatus,
        isVerified: user.isVerified,
        referredBy: user.referredBy,
        info: info || undefined,
      },
      stats: {
        totalReferrals: referralCount.length,
        directReferrals: referralCount.filter(r => r.level === 1).length,
      },
    };
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    coverImage?: string;
    email?: string;
    address?: string;
    city?: string;
    country?: string;
  }) {
    const existing = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, userId),
    });

    if (existing) {
      await this.db
        .update(schema.userInfo)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.userInfo.userId, userId));
    } else {
      await this.db.insert(schema.userInfo).values({
        userId,
        ...data,
      });
    }

    const updated = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, userId),
    });

    return updated;
  }

  private async generateUniqueReferCode(): Promise<string> {
    while (true) {
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      const existing = await this.db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, code),
      });
      if (!existing) return code;
    }
  }
}
