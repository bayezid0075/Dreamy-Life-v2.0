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
    @Body() body: { title: string; description: string; unitPay: number; totalUnits: number; mediaUrls?: string[]; link?: string },
    @Req() req: any,
  ) {
    return this.marketplaceService.createJob(req.user.userId, body);
  }

  @Get('marketplace/jobs')
  async getJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.marketplaceService.getJobs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      search,
    });
  }

  @Get('marketplace/jobs/posted')
  async getPostedJobs(@Req() req: any) {
    return this.marketplaceService.getPostedJobs(req.user.userId);
  }

  @Get('marketplace/jobs/my-submissions')
  async getMySubmissions(@Req() req: any) {
    return this.marketplaceService.getMySubmissions(req.user.userId);
  }

  @Get('marketplace/jobs/:id')
  async getJobById(@Param('id') id: string, @Req() req: any) {
    return this.marketplaceService.getJobById(id, req.user.userId);
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

  // ─── Settings ──────────────────────────────────────────────────────────

  @Get('marketplace/settings')
  async getSettings() {
    return this.marketplaceService.getSettings();
  }
}
