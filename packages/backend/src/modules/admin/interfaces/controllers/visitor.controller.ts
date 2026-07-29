import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VisitorService } from '../../services/visitor.service';
import { AdminGuard } from '../../guards/admin.guard';
import { Request } from 'express';

@ApiTags('Visitors')
@Controller()
export class VisitorController {
  constructor(private readonly visitorService: VisitorService) {}

  @Post('visitors/track')
  @ApiOperation({ summary: 'Track a visitor pageview' })
  @ApiResponse({ status: 201, description: 'Visitor tracked' })
  async track(@Req() req: Request, @Body() body: { userId?: string; platform: string }) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    const userAgent = req.headers['user-agent'] || '';
    return this.visitorService.trackVisitor({
      userId: body.userId,
      platform: body.platform,
      ip,
      userAgent,
    });
  }

  @Get('admin/visitors')
  @ApiBearerAuth('access-token')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get visitor statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Visitor stats retrieved' })
  async getStats() {
    const stats = await this.visitorService.getVisitorStats();
    return { success: true, data: stats };
  }
}
