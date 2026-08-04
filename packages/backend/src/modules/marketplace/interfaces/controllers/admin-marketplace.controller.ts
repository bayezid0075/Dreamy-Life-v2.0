import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MarketplaceService } from '../../application/services/marketplace.service';
import { MarketplaceGateway } from '../../application/services/marketplace.gateway';
import { AdminGuard } from '../../../admin/guards/admin.guard';

@Controller('admin/marketplace')
@UseGuards(AdminGuard)
export class AdminMarketplaceController {
  constructor(
    private marketplaceService: MarketplaceService,
    private marketplaceGateway: MarketplaceGateway,
  ) {}

  @Get('jobs')
  async getJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.marketplaceService.adminGetJobs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
    });
  }

  @Get('stats')
  async getStats() {
    return this.marketplaceService.adminGetStats();
  }

  @Patch('jobs/:id/approve')
  async approveJob(@Param('id') jobId: string) {
    return this.marketplaceService.adminApproveJob(jobId);
  }

  @Patch('jobs/:id/reject')
  async rejectJob(@Param('id') jobId: string) {
    return this.marketplaceService.adminRejectJob(jobId);
  }

  // ─── Settings ──────────────────────────────────────────────────────────

  @Get('settings')
  async getSettings() {
    return this.marketplaceService.getSettings();
  }

  @Patch('settings')
  async updateSettings(
    @Body() body: { platformFeePercent?: number; maxSubmissionsPerUser?: number; isActive?: boolean },
  ) {
    return this.marketplaceService.updateSettings(body);
  }
}
