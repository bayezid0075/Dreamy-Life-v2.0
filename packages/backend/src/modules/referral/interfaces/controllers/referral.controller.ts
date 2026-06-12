import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ReferralService } from '../../application/services/referral.service';

@ApiTags('Referral')
@ApiBearerAuth('access-token')
@Controller('referral')
export class ReferralController {
  constructor(
    private readonly referralService: ReferralService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get referral statistics (counts per level)' })
  @ApiResponse({ status: 200, description: 'Referral stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(@Req() req: any) {
    const userId = this.extractUserId(req);
    const stats = await this.referralService.getStats(userId);
    return { success: true, data: stats };
  }

  @Get('downline')
  @ApiOperation({ summary: 'Get flat list of downline members' })
  @ApiResponse({ status: 200, description: 'Downline members list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDownline(@Req() req: any) {
    const userId = this.extractUserId(req);
    const members = await this.referralService.getDownlineMembers(userId);
    return { success: true, data: { members, count: members.length } };
  }

  @Get('downline/tree')
  @ApiOperation({ summary: 'Get full downline tree (nested structure up to 10 levels)' })
  @ApiResponse({ status: 200, description: 'Downline tree' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDownlineTree(@Req() req: any) {
    const userId = this.extractUserId(req);
    const tree = await this.referralService.getDownlineTree(userId);
    return { success: true, data: tree };
  }

  @Get('upline')
  @ApiOperation({ summary: 'Get upline chain (who referred you, up to 10 levels)' })
  @ApiResponse({ status: 200, description: 'Upline chain' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUpline(@Req() req: any) {
    const userId = this.extractUserId(req);
    const upline = await this.referralService.getUpline(userId);
    return { success: true, data: upline };
  }

  private extractUserId(req: any): string {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Authorization required');
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
