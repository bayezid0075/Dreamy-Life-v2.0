import { Controller, Get, Post, Patch, Body, Param, Query, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { SocialEarningsService } from '../application/social-earnings.service';

@ApiTags('Social Earnings')
@Controller('social-earnings')
export class SocialEarningsController {
  constructor(
    private readonly socialEarningsService: SocialEarningsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get my social earnings balance' })
  async getMyEarnings(@Req() req: any) {
    const userId = this.extractUserId(req);
    const earnings = await this.socialEarningsService.getOrCreate(userId);
    return { success: true, data: earnings };
  }

  @Post('withdraw')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Request withdrawal from social earnings' })
  async createWithdrawal(@Req() req: any, @Body() body: { amount: number; method: string; phoneNumber: string }) {
    const userId = this.extractUserId(req);
    const withdrawal = await this.socialEarningsService.createWithdrawal(userId, body.amount, body.method, body.phoneNumber);
    return { success: true, data: withdrawal };
  }

  @Get('withdraw/history')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get my withdrawal history' })
  async getMyWithdrawals(@Req() req: any) {
    const userId = this.extractUserId(req);
    const withdrawals = await this.socialEarningsService.getUserWithdrawals(userId);
    return { success: true, data: withdrawals };
  }

  @Get('admin/all')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all social earnings (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllEarnings(@Query('page') page?: string, @Query('limit') limit?: string) {
    const result = await this.socialEarningsService.getAllEarnings(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    return { success: true, data: result };
  }

  @Get('admin/withdrawals')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get all withdrawal requests (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllWithdrawals(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.socialEarningsService.getAllWithdrawals(
      status,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    return { success: true, data: result };
  }

  @Get('admin/stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get withdrawal stats (admin)' })
  async getAdminStats() {
    const stats = await this.socialEarningsService.getAdminStats();
    return { success: true, data: stats };
  }

  @Patch('admin/withdrawals/:id/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update withdrawal status (admin)' })
  async updateWithdrawalStatus(
    @Param('id') id: string,
    @Body() body: { status: string; adminNote?: string },
  ) {
    const result = await this.socialEarningsService.updateWithdrawalStatus(id, body.status, body.adminNote);
    return { success: true, data: result };
  }

  @Patch('admin/earnings/:userId/toggle')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Toggle user earnings active status (admin)' })
  async toggleEarningActive(@Param('userId') userId: string) {
    const result = await this.socialEarningsService.toggleEarningActive(userId);
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
