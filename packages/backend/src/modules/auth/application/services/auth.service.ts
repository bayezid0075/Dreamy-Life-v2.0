import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, or, and } from 'drizzle-orm';
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
    email: string;
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

    // Check if email already exists
    const existingEmail = await this.db.query.users.findFirst({
      where: eq(schema.users.email, data.email),
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
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
        email: data.email,
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
      try {
        await this.referralService.buildReferralTree(newUser.id, referredBy);
      } catch (err) {
        console.error('Referral tree build failed (non-fatal):', err);
      }
    }

    // Generate tokens
    const accessToken = await this.tokenService.generateAccessToken(newUser.id, newUser.username);
    const refreshToken = await this.tokenService.generateRefreshToken(newUser.id);

    // Save session
    await this.db.insert(schema.sessions).values({
      userId: newUser.id,
      refreshToken,
      expiresAt: new Date('2099-12-31T23:59:59.000Z'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        ownRefercode: newUser.ownRefercode,
        memberStatus: newUser.memberStatus,
        referredBy: newUser.referredBy,
      },
    };
  }

  async login(emailOrPhone: string, password: string) {
    // Find user by email or phone number
    const user = await this.db.query.users.findFirst({
      where: or(
        eq(schema.users.email, emailOrPhone),
        eq(schema.users.phoneNumber, emailOrPhone),
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
      expiresAt: new Date('2099-12-31T23:59:59.000Z'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
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

    // Validate session exists in DB
    const session = await this.db.query.sessions.findFirst({
      where: and(
        eq(schema.sessions.userId, payload.userId),
        eq(schema.sessions.refreshToken, refreshToken),
      ),
    });
    if (!session) {
      throw new UnauthorizedException('Session expired or invalidated');
    }

    const newAccessToken = await this.tokenService.generateAccessToken(user.id, user.username);

    return { accessToken: newAccessToken };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // Delete specific session by refresh token
      await this.db
        .delete(schema.sessions)
        .where(
          and(
            eq(schema.sessions.userId, userId),
            eq(schema.sessions.refreshToken, refreshToken),
          ),
        );
    } else {
      // Delete all sessions for the user
      await this.db
        .delete(schema.sessions)
        .where(eq(schema.sessions.userId, userId));
    }
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
        email: user.email,
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
    dateOfBirth?: string;
    gender?: string;
    fatherName?: string;
    motherName?: string;
    preferredLanguage?: string;
  }) {
    const existing = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, userId),
    });

    const updateData: Record<string, any> = { ...data, updatedAt: new Date() };
    if (data.dateOfBirth) {
      updateData.dateOfBirth = new Date(data.dateOfBirth);
    }

    if (existing) {
      await this.db
        .update(schema.userInfo)
        .set(updateData)
        .where(eq(schema.userInfo.userId, userId));
    } else {
      await this.db.insert(schema.userInfo).values({
        userId,
        ...updateData,
      });
    }

    const updated = await this.db.query.userInfo.findFirst({
      where: eq(schema.userInfo.userId, userId),
    });

    return updated;
  }

  async requestForgotPasswordOtp(phoneNumber: string) {
    // Check if user exists with this phone number
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.phoneNumber, phoneNumber),
    });

    if (!user) {
      throw new ConflictException('No account found with this phone number');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any existing OTPs for this phone number and type
    await this.db
      .delete(schema.otpVerifications)
      .where(
        and(
          eq(schema.otpVerifications.phoneNumber, phoneNumber),
          eq(schema.otpVerifications.type, 'forgot_password'),
        ),
      );

    // Store OTP in database
    await this.db.insert(schema.otpVerifications).values({
      phoneNumber,
      otpCode,
      type: 'forgot_password',
      expiresAt,
    });

    // Send OTP via WhatsApp Gateway
    const whatsappGatewayUrl = process.env.WHATSAPP_GATEWAY_URL || 'http://whatsapp-gateway:5001';
    try {
      const response = await fetch(`${whatsappGatewayUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, otp: otpCode }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('WhatsApp gateway returned error:', response.status, errorData);
        throw new ConflictException(
          errorData.error || 'WhatsApp service is temporarily unavailable. Please try again later.',
        );
      }
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      console.error('Failed to connect to WhatsApp gateway:', err);
      throw new ConflictException(
        'Unable to send OTP. The messaging service is currently unavailable.',
      );
    }

    return { message: 'OTP sent to your WhatsApp', phoneNumber };
  }

  async verifyForgotPasswordOtp(phoneNumber: string, otpCode: string) {
    // Find the OTP record
    const otpRecord = await this.db.query.otpVerifications.findFirst({
      where: and(
        eq(schema.otpVerifications.phoneNumber, phoneNumber),
        eq(schema.otpVerifications.type, 'forgot_password'),
        eq(schema.otpVerifications.verified, false),
      ),
    });

    if (!otpRecord) {
      throw new ConflictException('No OTP request found. Please request a new one.');
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      throw new ConflictException('OTP has expired. Please request a new one.');
    }

    // Verify OTP
    if (otpRecord.otpCode !== otpCode) {
      throw new ConflictException('Invalid OTP code');
    }

    // Mark OTP as verified
    await this.db
      .update(schema.otpVerifications)
      .set({ verified: true })
      .where(eq(schema.otpVerifications.id, otpRecord.id));

    return { message: 'OTP verified successfully', phoneNumber, verified: true };
  }

  async resetPassword(phoneNumber: string, otpCode: string, newPassword: string) {
    // Find verified OTP record
    const otpRecord = await this.db.query.otpVerifications.findFirst({
      where: and(
        eq(schema.otpVerifications.phoneNumber, phoneNumber),
        eq(schema.otpVerifications.type, 'forgot_password'),
        eq(schema.otpVerifications.verified, true),
      ),
    });

    if (!otpRecord) {
      throw new ConflictException('OTP not verified. Please verify OTP first.');
    }

    // Check if OTP is still valid (within 10 minutes of verification)
    if (new Date() > otpRecord.expiresAt) {
      throw new ConflictException('OTP session expired. Please start over.');
    }

    // Find user
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.phoneNumber, phoneNumber),
    });

    if (!user) {
      throw new ConflictException('User not found');
    }

    // Hash new password
    const passwordHash = await this.passwordService.hash(newPassword);

    // Update password
    await this.db
      .update(schema.users)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));

    // Delete used OTP
    await this.db
      .delete(schema.otpVerifications)
      .where(eq(schema.otpVerifications.id, otpRecord.id));

    // Invalidate all sessions for this user
    await this.db
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, user.id));

    return { message: 'Password reset successfully' };
  }

  async checkWhatsAppNumber(phoneNumber: string) {
    const whatsappGatewayUrl = process.env.WHATSAPP_GATEWAY_URL || 'http://whatsapp-gateway:5001';
    try {
      const response = await fetch(`${whatsappGatewayUrl}/check-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      if (!response.ok) {
        console.error('WhatsApp gateway check-number returned:', response.status);
        throw new ConflictException('WhatsApp service is temporarily unavailable.');
      }

      const data = await response.json();
      return { exists: data.exists, phone: phoneNumber };
    } catch (err) {
      if (err instanceof ConflictException) throw err;
      console.error('Failed to connect to WhatsApp gateway:', err);
      throw new ConflictException('Unable to verify WhatsApp number. The messaging service is currently unavailable.');
    }
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
