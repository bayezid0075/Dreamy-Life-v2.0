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
import { JwtService } from '@nestjs/jwt';

@Controller('admin/marketplace')
@UseGuards(AdminGuard)
export class AdminMarketplaceController {
  constructor(
    private marketplaceService: MarketplaceService,
    private marketplaceGateway: MarketplaceGateway,
    private jwtService: JwtService,
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
    const result = await this.marketplaceService.adminApproveJob(jobId);
    const job = await this.marketplaceService.getJobById(jobId);
    this.marketplaceGateway.emitJobApproved(job);
    return result;
  }

  @Patch('jobs/:id/reject')
  async rejectJob(@Param('id') jobId: string) {
    const result = await this.marketplaceService.adminRejectJob(jobId);
    const job = await this.marketplaceService.getJobById(jobId);
    this.marketplaceGateway.emitJobRejected(job);
    return result;
  }

  @Patch('assignments/:id/units')
  async updateAssignmentUnits(
    @Param('id') assignmentId: string,
    @Body() body: { units: number },
  ) {
    return this.marketplaceService.updateAssignmentUnits(assignmentId, body.units, 'admin');
  }
}
