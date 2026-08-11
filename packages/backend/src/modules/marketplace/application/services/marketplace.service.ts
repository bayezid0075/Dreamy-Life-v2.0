import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, sql, or } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { WalletService } from '../../../wallet/application/services/wallet.service';
import { MarketplaceGateway } from './marketplace.gateway';

@Injectable()
export class MarketplaceService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<typeof schema>,
    private walletService: WalletService,
    private gateway: MarketplaceGateway,
  ) {}

  // ─── Settings ───────────────────────────────────────────────────────────

  async getSettings() {
    const [settings] = await this.db
      .select()
      .from(schema.marketplaceSettings)
      .limit(1);

    if (!settings) {
      const [created] = await this.db
        .insert(schema.marketplaceSettings)
        .values({})
        .returning();
      return created;
    }
    return settings;
  }

  async updateSettings(data: { platformFeePercent?: number; maxSubmissionsPerUser?: number; isActive?: boolean }) {
    const settings = await this.getSettings();
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.platformFeePercent !== undefined) {
      updateData.platformFeePercent = data.platformFeePercent.toFixed(2);
    }
    const [updated] = await this.db
      .update(schema.marketplaceSettings)
      .set(updateData)
      .where(eq(schema.marketplaceSettings.id, settings.id))
      .returning();
    return updated;
  }

  // ─── Job Posting ───────────────────────────────────────────────────────

  async createJob(posterId: string, data: {
    title: string;
    description: string;
    unitPay: number;
    totalUnits: number;
    mediaUrls?: string[];
    link?: string;
  }) {
    if (data.unitPay <= 0) throw new BadRequestException('Unit pay must be positive');
    if (data.totalUnits <= 0) throw new BadRequestException('Total units must be positive');

    const settings = await this.getSettings();
    const totalUnits = data.totalUnits;
    const baseAmount = data.unitPay * totalUnits;
    const feeAmount = baseAmount * (Number(settings.platformFeePercent) / 100);
    const totalCost = baseAmount + feeAmount;

    const fundsBalance = await this.walletService.getFundsBalance(posterId);
    if (fundsBalance < totalCost) {
      throw new BadRequestException(`Insufficient funds. Required: ৳${totalCost.toFixed(2)} (including ${settings.platformFeePercent}% platform fee)`);
    }

    await this.walletService.debitFunds(posterId, totalCost, `Job posted: ${data.title}`);

    const [job] = await this.db
      .insert(schema.jobPosts)
      .values({
        posterId,
        title: data.title,
        description: data.description,
        type: 'multiple',
        amount: String(totalCost),
        unitPay: String(data.unitPay),
        totalUnits,
        filledUnits: 0,
        mediaUrls: data.mediaUrls || [],
        link: data.link || null,
      })
      .returning();

    const [escrow] = await this.db
      .insert(schema.jobEscrow)
      .values({
        jobId: job.id,
        posterId,
        amount: String(baseAmount),
        status: 'held',
      })
      .returning();

    this.gateway.emitJobCreated(this.normalizeJobMediaUrls({ ...job, escrow }), posterId);

    return { job, escrow, platformFee: feeAmount, totalCost };
  }

  async getJobs(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (query.status) {
      conditions.push(eq(schema.jobPosts.status, query.status));
    } else {
      conditions.push(eq(schema.jobPosts.status, 'active'));
    }

    if (query.search) {
      conditions.push(
        sql`(${schema.jobPosts.title} ILIKE ${'%' + query.search + '%'} OR ${schema.jobPosts.description} ILIKE ${'%' + query.search + '%'})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const jobs = await this.db
      .select({
        id: schema.jobPosts.id,
        posterId: schema.jobPosts.posterId,
        title: schema.jobPosts.title,
        description: schema.jobPosts.description,
        type: schema.jobPosts.type,
        amount: schema.jobPosts.amount,
        unitPay: schema.jobPosts.unitPay,
        totalUnits: schema.jobPosts.totalUnits,
        filledUnits: schema.jobPosts.filledUnits,
        status: schema.jobPosts.status,
        adminApproved: schema.jobPosts.adminApproved,
        mediaUrls: schema.jobPosts.mediaUrls,
        link: schema.jobPosts.link,
        createdAt: schema.jobPosts.createdAt,
        updatedAt: schema.jobPosts.updatedAt,
        posterUsername: schema.users.username,
        posterFullName: schema.userInfo.fullName,
        posterAvatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.jobPosts)
      .innerJoin(schema.users, eq(schema.jobPosts.posterId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(whereClause)
      .orderBy(desc(schema.jobPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.jobPosts)
      .where(whereClause);

    return { jobs: jobs.map((j) => this.normalizeJobMediaUrls(j)), total: count, page, limit };
  }

  async getJobById(jobId: string, viewerId?: string) {
    const [job] = await this.db
      .select({
        id: schema.jobPosts.id,
        posterId: schema.jobPosts.posterId,
        title: schema.jobPosts.title,
        description: schema.jobPosts.description,
        type: schema.jobPosts.type,
        amount: schema.jobPosts.amount,
        unitPay: schema.jobPosts.unitPay,
        totalUnits: schema.jobPosts.totalUnits,
        filledUnits: schema.jobPosts.filledUnits,
        status: schema.jobPosts.status,
        adminApproved: schema.jobPosts.adminApproved,
        mediaUrls: schema.jobPosts.mediaUrls,
        link: schema.jobPosts.link,
        createdAt: schema.jobPosts.createdAt,
        updatedAt: schema.jobPosts.updatedAt,
        posterUsername: schema.users.username,
        posterFullName: schema.userInfo.fullName,
        posterAvatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.jobPosts)
      .innerJoin(schema.users, eq(schema.jobPosts.posterId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');

    const [escrow] = await this.db
      .select()
      .from(schema.jobEscrow)
      .where(eq(schema.jobEscrow.jobId, jobId));

    let submissions: any[] = [];

    if (viewerId && job.posterId === viewerId) {
      submissions = await this.db
        .select({
          id: schema.jobSubmissions.id,
          jobId: schema.jobSubmissions.jobId,
          workerId: schema.jobSubmissions.workerId,
          proof: schema.jobSubmissions.proof,
          proofMediaUrls: schema.jobSubmissions.proofMediaUrls,
          status: schema.jobSubmissions.status,
          posterComment: schema.jobSubmissions.posterComment,
          createdAt: schema.jobSubmissions.createdAt,
          updatedAt: schema.jobSubmissions.updatedAt,
          workerUsername: schema.users.username,
          workerFullName: schema.userInfo.fullName,
          workerAvatarUrl: schema.userInfo.avatarUrl,
        })
        .from(schema.jobSubmissions)
        .innerJoin(schema.users, eq(schema.jobSubmissions.workerId, schema.users.id))
        .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
        .where(eq(schema.jobSubmissions.jobId, jobId))
        .orderBy(desc(schema.jobSubmissions.createdAt));
    }

    const settings = await this.getSettings();
    let mySubmissions: any[] = [];
    let submissionCount = 0;

    if (viewerId && job.posterId !== viewerId) {
      mySubmissions = await this.db
        .select()
        .from(schema.jobSubmissions)
        .where(
          and(
            eq(schema.jobSubmissions.jobId, jobId),
            eq(schema.jobSubmissions.workerId, viewerId),
          )
        )
        .orderBy(desc(schema.jobSubmissions.createdAt));

      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.jobSubmissions)
        .where(
          and(
            eq(schema.jobSubmissions.jobId, jobId),
            eq(schema.jobSubmissions.workerId, viewerId),
          )
        );
      submissionCount = count;
    }

    return {
      ...this.normalizeJobMediaUrls(job),
      escrow,
      submissions,
      mySubmissions,
      mySubmissionCount: submissionCount,
      maxSubmissions: settings.maxSubmissionsPerUser,
      platformFeePercent: settings.platformFeePercent,
    };
  }

  async getPostedJobs(posterId: string) {
    const jobs = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.posterId, posterId))
      .orderBy(desc(schema.jobPosts.createdAt));

    const pendingSubmissions = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.jobSubmissions)
      .innerJoin(schema.jobPosts, eq(schema.jobSubmissions.jobId, schema.jobPosts.id))
      .where(
        and(
          eq(schema.jobPosts.posterId, posterId),
          eq(schema.jobSubmissions.status, 'pending'),
        )
      );

    return {
      jobs: jobs.map((j) => this.normalizeJobMediaUrls(j)),
      pendingSubmissions: pendingSubmissions[0]?.count || 0,
    };
  }

  async getMySubmissions(workerId: string) {
    const submissions = await this.db
      .select({
        id: schema.jobSubmissions.id,
        jobId: schema.jobSubmissions.jobId,
        workerId: schema.jobSubmissions.workerId,
        proof: schema.jobSubmissions.proof,
        proofMediaUrls: schema.jobSubmissions.proofMediaUrls,
        status: schema.jobSubmissions.status,
        posterComment: schema.jobSubmissions.posterComment,
        createdAt: schema.jobSubmissions.createdAt,
        updatedAt: schema.jobSubmissions.updatedAt,
        jobTitle: schema.jobPosts.title,
        jobUnitPay: schema.jobPosts.unitPay,
        posterUsername: schema.users.username,
      })
      .from(schema.jobSubmissions)
      .innerJoin(schema.jobPosts, eq(schema.jobSubmissions.jobId, schema.jobPosts.id))
      .innerJoin(schema.users, eq(schema.jobPosts.posterId, schema.users.id))
      .where(eq(schema.jobSubmissions.workerId, workerId))
      .orderBy(desc(schema.jobSubmissions.createdAt));

    return submissions;
  }

  // ─── Submissions ───────────────────────────────────────────────────────

  async submitWork(jobId: string, workerId: string, proof: string, proofMediaUrls?: string[]) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'active') throw new BadRequestException('Job is not active');
    if (job.posterId === workerId) throw new ForbiddenException('Cannot submit to your own job');

    const settings = await this.getSettings();

    const [{ count: existingSubmissions }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.jobSubmissions)
      .where(
        and(
          eq(schema.jobSubmissions.jobId, jobId),
          eq(schema.jobSubmissions.workerId, workerId),
        )
      );

    if (existingSubmissions >= settings.maxSubmissionsPerUser) {
      throw new BadRequestException(`You have reached the maximum of ${settings.maxSubmissionsPerUser} submissions for this job`);
    }

    const pendingSubmission = await this.db.query.jobSubmissions.findFirst({
      where: and(
        eq(schema.jobSubmissions.jobId, jobId),
        eq(schema.jobSubmissions.workerId, workerId),
        eq(schema.jobSubmissions.status, 'pending'),
      ),
    });

    if (pendingSubmission) {
      throw new BadRequestException('You already have a pending submission for this job');
    }

    const [submission] = await this.db
      .insert(schema.jobSubmissions)
      .values({
        jobId,
        workerId,
        proof,
        proofMediaUrls: proofMediaUrls || [],
      })
      .returning();

    await this.db
      .update(schema.jobPosts)
      .set({ filledUnits: job.filledUnits + 1, updatedAt: new Date() })
      .where(eq(schema.jobPosts.id, jobId));

    const submissionWithUser = await this.db
      .select({
        id: schema.jobSubmissions.id,
        jobId: schema.jobSubmissions.jobId,
        workerId: schema.jobSubmissions.workerId,
        proof: schema.jobSubmissions.proof,
        proofMediaUrls: schema.jobSubmissions.proofMediaUrls,
        status: schema.jobSubmissions.status,
        posterComment: schema.jobSubmissions.posterComment,
        createdAt: schema.jobSubmissions.createdAt,
        updatedAt: schema.jobSubmissions.updatedAt,
        workerUsername: schema.users.username,
        workerFullName: schema.userInfo.fullName,
        workerAvatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.jobSubmissions)
      .innerJoin(schema.users, eq(schema.jobSubmissions.workerId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.jobSubmissions.id, submission.id));

    this.gateway.emitNewSubmission(submissionWithUser[0], job.posterId);

    return submission;
  }

  async approveSubmission(jobId: string, submissionId: string, posterId: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.posterId !== posterId) throw new ForbiddenException('Not authorized');

    const [submission] = await this.db
      .select()
      .from(schema.jobSubmissions)
      .where(eq(schema.jobSubmissions.id, submissionId));

    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.jobId !== jobId) throw new BadRequestException('Submission does not belong to this job');
    if (submission.status !== 'pending') throw new BadRequestException('Submission is not pending');

    await this.db
      .update(schema.jobSubmissions)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(schema.jobSubmissions.id, submissionId));

    const payAmount = Number(job.unitPay);
    await this.walletService.creditWallet(submission.workerId, payAmount, `Payment for job: ${job.title}`);

    await this.db
      .update(schema.jobEscrow)
      .set({
        status: 'released',
        releasedTo: submission.workerId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.jobEscrow.jobId, jobId),
          eq(schema.jobEscrow.status, 'held'),
        )
      );

    this.gateway.emitSubmissionApproved({ id: submissionId, jobId }, submission.workerId, payAmount);
    this.gateway.emitPaymentReleased(jobId, submission.workerId, payAmount);

    const refreshedJob = await this.db
      .select({ filledUnits: schema.jobPosts.filledUnits, totalUnits: schema.jobPosts.totalUnits })
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId))
      .then((rows) => rows[0]);

    if (refreshedJob && refreshedJob.filledUnits >= refreshedJob.totalUnits) {
      await this.db
        .update(schema.jobPosts)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(schema.jobPosts.id, jobId));
    }

    const updatedJob = await this.getJobById(jobId, posterId);
    this.gateway.emitJobUpdated(updatedJob);

    return { success: true, payAmount };
  }

  async rejectSubmission(jobId: string, submissionId: string, posterId: string, comment?: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.posterId !== posterId) throw new ForbiddenException('Not authorized');

    const [submission] = await this.db
      .select()
      .from(schema.jobSubmissions)
      .where(eq(schema.jobSubmissions.id, submissionId));

    if (!submission) throw new NotFoundException('Submission not found');
    if (submission.status !== 'pending') throw new BadRequestException('Submission is not pending');

    await this.db
      .update(schema.jobSubmissions)
      .set({ status: 'rejected', posterComment: comment, updatedAt: new Date() })
      .where(eq(schema.jobSubmissions.id, submissionId));

    await this.db
      .update(schema.jobPosts)
      .set({ filledUnits: Math.max(0, job.filledUnits - 1), updatedAt: new Date() })
      .where(eq(schema.jobPosts.id, jobId));

    this.gateway.emitSubmissionRejected({ id: submissionId, jobId, posterComment: comment }, submission.workerId);

    const updatedJob = await this.getJobById(jobId, posterId);
    this.gateway.emitJobUpdated(updatedJob);

    return { success: true };
  }

  // ─── Job Cancellation ──────────────────────────────────────────────────

  async cancelJob(jobId: string, posterId: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.posterId !== posterId) throw new ForbiddenException('Not authorized');

    const hasApprovedSubmission = await this.db.query.jobSubmissions.findFirst({
      where: and(
        eq(schema.jobSubmissions.jobId, jobId),
        eq(schema.jobSubmissions.status, 'approved'),
      ),
    });

    if (hasApprovedSubmission) {
      throw new BadRequestException('Cannot cancel job with approved submissions');
    }

    await this.db
      .update(schema.jobPosts)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.jobPosts.id, jobId));

    const pendingSubmissions = await this.db
      .select({ workerId: schema.jobSubmissions.workerId })
      .from(schema.jobSubmissions)
      .where(
        and(
          eq(schema.jobSubmissions.jobId, jobId),
          eq(schema.jobSubmissions.status, 'pending'),
        )
      );

    for (const sub of pendingSubmissions) {
      await this.db
        .update(schema.jobSubmissions)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(
          and(
            eq(schema.jobSubmissions.jobId, jobId),
            eq(schema.jobSubmissions.workerId, sub.workerId),
            eq(schema.jobSubmissions.status, 'pending'),
          )
        );
    }

    const [escrow] = await this.db
      .select()
      .from(schema.jobEscrow)
      .where(
        and(
          eq(schema.jobEscrow.jobId, jobId),
          eq(schema.jobEscrow.status, 'held'),
        )
      );

    if (escrow) {
      const refundAmount = Number(escrow.amount);
      await this.walletService.creditFunds(posterId, refundAmount, `Refund for cancelled job: ${job.title}`);

      await this.db
        .update(schema.jobEscrow)
        .set({ status: 'refunded', updatedAt: new Date() })
        .where(eq(schema.jobEscrow.id, escrow.id));
    }

    this.gateway.emitJobCancelled({ ...job, id: jobId }, pendingSubmissions.map((s) => s.workerId));

    return { success: true };
  }

  // ─── Admin Methods ─────────────────────────────────────────────────────

  async adminApproveJob(jobId: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.adminApproved) throw new BadRequestException('Job already approved');

    await this.db
      .update(schema.jobPosts)
      .set({ adminApproved: true, status: 'active', updatedAt: new Date() })
      .where(eq(schema.jobPosts.id, jobId));

    const updatedJob = await this.getJobById(jobId);
    this.gateway.emitJobApproved(updatedJob);

    return { success: true };
  }

  async adminRejectJob(jobId: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');

    await this.db
      .update(schema.jobPosts)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(schema.jobPosts.id, jobId));

    const [escrow] = await this.db
      .select()
      .from(schema.jobEscrow)
      .where(
        and(
          eq(schema.jobEscrow.jobId, jobId),
          eq(schema.jobEscrow.status, 'held'),
        )
      );

    if (escrow) {
      await this.walletService.creditFunds(job.posterId, Number(escrow.amount), `Refund for rejected job: ${job.title}`);

      await this.db
        .update(schema.jobEscrow)
        .set({ status: 'refunded', updatedAt: new Date() })
        .where(eq(schema.jobEscrow.id, escrow.id));
    }

    const updatedJob = await this.getJobById(jobId);
    this.gateway.emitJobRejected(updatedJob);

    return { success: true };
  }

  async adminGetJobs(query: { page?: number; limit?: number; status?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];
    if (query.status) {
      conditions.push(eq(schema.jobPosts.status, query.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const jobs = await this.db
      .select({
        id: schema.jobPosts.id,
        posterId: schema.jobPosts.posterId,
        title: schema.jobPosts.title,
        description: schema.jobPosts.description,
        type: schema.jobPosts.type,
        amount: schema.jobPosts.amount,
        unitPay: schema.jobPosts.unitPay,
        totalUnits: schema.jobPosts.totalUnits,
        filledUnits: schema.jobPosts.filledUnits,
        status: schema.jobPosts.status,
        adminApproved: schema.jobPosts.adminApproved,
        createdAt: schema.jobPosts.createdAt,
        updatedAt: schema.jobPosts.updatedAt,
        posterUsername: schema.users.username,
        posterFullName: schema.userInfo.fullName,
      })
      .from(schema.jobPosts)
      .innerJoin(schema.users, eq(schema.jobPosts.posterId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(whereClause)
      .orderBy(desc(schema.jobPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.jobPosts)
      .where(whereClause);

    return { jobs, total: count, page, limit };
  }

  async adminGetStats() {
    const [totalJobs] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.jobPosts);

    const [pendingJobs] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.status, 'pending_approval'));

    const [activeJobs] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.status, 'active'));

    const [completedJobs] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.status, 'completed'));

    const [totalEscrow] = await this.db
      .select({ total: sql<string>`COALESCE(SUM(${schema.jobEscrow.amount}), 0)` })
      .from(schema.jobEscrow)
      .where(eq(schema.jobEscrow.status, 'held'));

    return {
      totalJobs: totalJobs.count,
      pendingJobs: pendingJobs.count,
      activeJobs: activeJobs.count,
      completedJobs: completedJobs.count,
      totalEscrow: Number(totalEscrow.total),
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  async getJobPosterId(jobId: string): Promise<string | null> {
    const [job] = await this.db
      .select({ posterId: schema.jobPosts.posterId })
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    return job?.posterId || null;
  }

  async getSubmissionWorkerId(submissionId: string): Promise<string | null> {
    const [submission] = await this.db
      .select({ workerId: schema.jobSubmissions.workerId })
      .from(schema.jobSubmissions)
      .where(eq(schema.jobSubmissions.id, submissionId));

    return submission?.workerId || null;
  }

  private normalizeJobMediaUrls(job: any) {
    if (job.mediaUrls && Array.isArray(job.mediaUrls)) {
      const port = process.env.PORT || '4000';
      const uploadBaseUrl = process.env.UPLOAD_BASE_URL || `http://localhost:${port}`;
      job.mediaUrls = job.mediaUrls.map((url: string) => {
        if (url && url.startsWith('http://localhost:')) {
          return url.replace(/http:\/\/localhost:\d+/, uploadBaseUrl);
        }
        return url;
      });
    }
    return job;
  }
}
