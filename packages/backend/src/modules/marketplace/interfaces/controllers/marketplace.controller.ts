import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MarketplaceService } from '../../application/services/marketplace.service';
import { UserGuard } from '../../../notifications/guards/user.guard';

@Controller()
@UseGuards(UserGuard)
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  // ─── Job Posting ───────────────────────────────────────────────────────

  @Post('marketplace/jobs')
  async createJob(
    @Body() body: { title: string; description: string; type: 'single' | 'multiple'; amount: number; unitPay: number; totalUnits?: number; mediaUrls?: string[] },
    @Req() req: any,
  ) {
    return this.marketplaceService.createJob(req.user.userId, body);
  }

  @Get('marketplace/jobs')
  async getJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.marketplaceService.getJobs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      type,
      search,
    });
  }

  @Get('marketplace/jobs/posted')
  async getPostedJobs(@Req() req: any) {
    return this.marketplaceService.getPostedJobs(req.user.userId);
  }

  @Get('marketplace/jobs/available')
  async getAvailableJobs(@Req() req: any) {
    return this.marketplaceService.getAvailableJobs(req.user.userId);
  }

  @Get('marketplace/jobs/assigned')
  async getAssignedJobs(@Req() req: any) {
    return this.marketplaceService.getAssignedJobs(req.user.userId);
  }

  @Get('marketplace/jobs/:id')
  async getJobById(@Param('id') id: string) {
    return this.marketplaceService.getJobById(id);
  }

  // ─── Bidding (Single Unit) ─────────────────────────────────────────────

  @Post('marketplace/jobs/:id/bids')
  async placeBid(
    @Param('id') jobId: string,
    @Body() body: { amount: number; message?: string },
    @Req() req: any,
  ) {
    return this.marketplaceService.placeBid(jobId, req.user.userId, body.amount, body.message);
  }

  @Delete('marketplace/bids/:bidId')
  async cancelBid(@Param('bidId') bidId: string, @Req() req: any) {
    return this.marketplaceService.cancelBid(bidId, req.user.userId);
  }

  @Post('marketplace/jobs/:jobId/bids/:bidId/accept')
  async acceptBid(
    @Param('jobId') jobId: string,
    @Param('bidId') bidId: string,
    @Req() req: any,
  ) {
    return this.marketplaceService.acceptBid(jobId, bidId, req.user.userId);
  }

  @Post('marketplace/jobs/:jobId/bids/:bidId/reject')
  async rejectBid(
    @Param('jobId') jobId: string,
    @Param('bidId') bidId: string,
    @Req() req: any,
  ) {
    return this.marketplaceService.rejectBid(jobId, bidId, req.user.userId);
  }

  // ─── Multi-Unit Assignments ────────────────────────────────────────────

  @Post('marketplace/jobs/:id/assign')
  async assignWorker(
    @Param('id') jobId: string,
    @Body() body: { workerId: string; units: number },
    @Req() req: any,
  ) {
    return this.marketplaceService.assignWorker(jobId, body.workerId, body.units, req.user.userId);
  }

  // ─── Submissions ───────────────────────────────────────────────────────

  @Post('marketplace/jobs/:id/submit')
  async submitWork(
    @Param('id') jobId: string,
    @Body() body: { proof: string; proofMediaUrls?: string[] },
    @Req() req: any,
  ) {
    return this.marketplaceService.submitWork(jobId, req.user.userId, body.proof, body.proofMediaUrls);
  }

  @Post('marketplace/jobs/:jobId/submissions/:submissionId/approve')
  async approveSubmission(
    @Param('jobId') jobId: string,
    @Param('submissionId') submissionId: string,
    @Req() req: any,
  ) {
    return this.marketplaceService.approveSubmission(jobId, submissionId, req.user.userId);
  }

  @Post('marketplace/jobs/:jobId/submissions/:submissionId/reject')
  async rejectSubmission(
    @Param('jobId') jobId: string,
    @Param('submissionId') submissionId: string,
    @Body() body: { comment?: string },
    @Req() req: any,
  ) {
    return this.marketplaceService.rejectSubmission(jobId, submissionId, req.user.userId, body.comment);
  }

  // ─── Job Cancellation ──────────────────────────────────────────────────

  @Delete('marketplace/jobs/:id')
  async cancelJob(@Param('id') jobId: string, @Req() req: any) {
    return this.marketplaceService.cancelJob(jobId, req.user.userId);
  }
}
