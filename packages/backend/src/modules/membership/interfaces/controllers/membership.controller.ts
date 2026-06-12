import { Controller, Get, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { MembershipService } from '../../application/services/membership.service';
import { PurchaseMembershipDto } from '../dto/purchase-membership.dto';

@ApiTags('Membership')
@ApiBearerAuth('access-token')
@Controller('membership')
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available membership plans' })
  @ApiResponse({ status: 200, description: 'List of membership plans' })
  async getPlans() {
    const plans = await this.membershipService.getPlans();
    return { success: true, data: plans };
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user membership info, commission history & purchases' })
  @ApiResponse({ status: 200, description: 'Membership details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyMembership(@Req() req: any) {
    const userId = this.extractUserId(req);
    const data = await this.membershipService.getUserMembership(userId);
    return { success: true, data };
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase a membership plan (distributes commissions to upline)' })
  @ApiResponse({ status: 201, description: 'Membership purchased successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'Already have this or a higher membership' })
  async purchaseMembership(
    @Req() req: any,
    @Body() body: PurchaseMembershipDto,
  ) {
    const userId = this.extractUserId(req);
    const result = await this.membershipService.purchaseMembership(userId, body.planId);
    return { success: true, data: result };
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
