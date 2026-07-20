import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
  RegisterResponse,
  LoginResponse,
  RefreshResponse,
  ProfileResponse,
  LogoutResponse,
} from '../../../../common/dto/api-response.dto';
import { Response, Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (with optional referral code)' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: RegisterResponse })
  @ApiResponse({ status: 409, description: 'Username already taken, phone number already registered, or invalid referral code' })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with username/phone and password' })
  @ApiResponse({ status: 200, description: 'Logged in successfully', type: LoginResponse })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.username, body.password);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token (cookie or body)' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: RefreshResponse })
  @ApiResponse({ status: 401, description: 'Refresh token missing or invalid' })
  async refresh(@Req() req: Request) {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.authService.refresh(token);
    return {
      success: true,
      data: result,
    };
  }

  @Get('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user profile with referral stats' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req: Request) {
    const userId = this.extractUserId(req);
    const result = await this.authService.getProfile(userId);
    return {
      success: true,
      data: result,
    };
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout — clears the refresh token cookie and invalidates session' })
  @ApiResponse({ status: 200, description: 'Logged out successfully', type: LogoutResponse })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token || req.body?.refreshToken;

    // Try to extract userId from access token if available
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
        });
        userId = payload.userId;
      } catch {
        // Access token may be expired — that's okay, we still clear the cookie
      }
    }

    if (userId) {
      await this.authService.logout(userId, refreshToken);
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Patch('profile')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Req() req: Request, @Body() body: Record<string, any>) {
    const userId = this.extractUserId(req);
    const allowedFields = ['fullName', 'bio', 'avatarUrl', 'coverImage', 'email', 'address', 'city', 'country', 'dateOfBirth', 'gender', 'fatherName', 'motherName', 'preferredLanguage'];
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        updateData[key] = body[key];
      }
    }
    const result = await this.authService.updateProfile(userId, updateData);
    return {
      success: true,
      data: result,
    };
  }

  private extractUserId(req: Request): string {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Authorization header missing');
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key',
      });
      return payload.userId;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
