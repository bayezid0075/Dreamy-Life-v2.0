import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, sql, or } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';
import { WalletService } from '../../../wallet/application/services/wallet.service';

@Injectable()
export class MarketplaceService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<typeof schema>,
    private walletService: WalletService,
  ) {}

  // ─── Job Posting ───────────────────────────────────────────────────────

  async createJob(posterId: string, data: {
    title: string;
    description: string;
    type: 'single' | 'multiple';
    amount: number;
    unitPay: number;
    totalUnits?: number;
    mediaUrls?: string[];
    link?: string;
  }) {
    if (data.amount <= 0) throw new BadRequestException('Amount must be positive');
    if (data.unitPay <= 0) throw new BadRequestException('Unit pay must be positive');
    if (data.unitPay > data.amount) throw new BadRequestException('Unit pay cannot exceed total amount');

    const totalUnits = data.type === 'single' ? 1 : (data.totalUnits || 1);
    const totalCost = data.unitPay * totalUnits;

    if (totalCost > data.amount) {
      throw new BadRequestException('Total unit cost exceeds job amount');
    }

    const fundsBalance = await this.walletService.getFundsBalance(posterId);
    if (fundsBalance < data.amount) {
      throw new BadRequestException('Insufficient funds balance');
    }

    await this.walletService.debitFunds(posterId, data.amount, `Job posted: ${data.title}`);

    const [job] = await this.db
      .insert(schema.jobPosts)
      .values({
        posterId,
        title: data.title,
        description: data.description,
        type: data.type,
        amount: String(data.amount),
        unitPay: String(data.unitPay),
        totalUnits,
        mediaUrls: data.mediaUrls || [],
        link: data.link || null,
      })
      .returning();

    const [escrow] = await this.db
      .insert(schema.jobEscrow)
      .values({
        jobId: job.id,
        posterId,
        amount: String(data.amount),
        status: 'held',
      })
      .returning();

    return { job, escrow };
  }

  async getJobs(query: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
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

    if (query.type) {
      conditions.push(eq(schema.jobPosts.type, query.type));
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

  async getJobById(jobId: string) {
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

    let bids: any[] = [];
    let assignments: any[] = [];
    let submissions: any[] = [];

    if (job.type === 'single') {
      bids = await this.db
        .select({
          id: schema.jobBids.id,
          jobId: schema.jobBids.jobId,
          bidderId: schema.jobBids.bidderId,
          amount: schema.jobBids.amount,
          status: schema.jobBids.status,
          message: schema.jobBids.message,
          createdAt: schema.jobBids.createdAt,
          updatedAt: schema.jobBids.updatedAt,
          bidderUsername: schema.users.username,
          bidderFullName: schema.userInfo.fullName,
          bidderAvatarUrl: schema.userInfo.avatarUrl,
        })
        .from(schema.jobBids)
        .innerJoin(schema.users, eq(schema.jobBids.bidderId, schema.users.id))
        .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
        .where(eq(schema.jobBids.jobId, jobId))
        .orderBy(desc(schema.jobBids.createdAt));
    } else {
      assignments = await this.db
        .select({
          id: schema.jobAssignments.id,
          jobId: schema.jobAssignments.jobId,
          workerId: schema.jobAssignments.workerId,
          units: schema.jobAssignments.units,
          status: schema.jobAssignments.status,
          createdAt: schema.jobAssignments.createdAt,
          updatedAt: schema.jobAssignments.updatedAt,
          workerUsername: schema.users.username,
          workerFullName: schema.userInfo.fullName,
          workerAvatarUrl: schema.userInfo.avatarUrl,
        })
        .from(schema.jobAssignments)
        .innerJoin(schema.users, eq(schema.jobAssignments.workerId, schema.users.id))
        .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
        .where(eq(schema.jobAssignments.jobId, jobId))
        .orderBy(desc(schema.jobAssignments.createdAt));
    }

    submissions = await this.db
      .select({
        id: schema.jobSubmissions.id,
        jobId: schema.jobSubmissions.jobId,
        assignmentId: schema.jobSubmissions.assignmentId,
        bidId: schema.jobSubmissions.bidId,
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

    return { ...this.normalizeJobMediaUrls(job), escrow, bids, assignments, submissions };
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

  async getAvailableJobs(workerId: string) {
    const assignedJobIds = await this.db
      .select({ jobId: schema.jobAssignments.jobId })
      .from(schema.jobAssignments)
      .where(eq(schema.jobAssignments.workerId, workerId));

    const bidJobIds = await this.db
      .select({ jobId: schema.jobBids.jobId })
      .from(schema.jobBids)
      .where(eq(schema.jobBids.bidderId, workerId));

    const excludeIds = [
      ...assignedJobIds.map((r) => r.jobId),
      ...bidJobIds.map((r) => r.jobId),
    ];

    const conditions = [
      eq(schema.jobPosts.status, 'active'),
      eq(schema.jobPosts.adminApproved, true),
      sql`${schema.jobPosts.posterId} != ${workerId}`,
    ];

    if (excludeIds.length > 0) {
      conditions.push(sql`${schema.jobPosts.id} NOT IN ${excludeIds}`);
    }

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
        createdAt: schema.jobPosts.createdAt,
        updatedAt: schema.jobPosts.updatedAt,
        posterUsername: schema.users.username,
        posterFullName: schema.userInfo.fullName,
        posterAvatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.jobPosts)
      .innerJoin(schema.users, eq(schema.jobPosts.posterId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(and(...conditions))
      .orderBy(desc(schema.jobPosts.createdAt));

    return jobs.map((j) => this.normalizeJobMediaUrls(j));
  }

  async getAssignedJobs(workerId: string) {
    const assignments = await this.db
      .select({
        id: schema.jobAssignments.id,
        jobId: schema.jobAssignments.jobId,
        workerId: schema.jobAssignments.workerId,
        units: schema.jobAssignments.units,
        status: schema.jobAssignments.status,
        createdAt: schema.jobAssignments.createdAt,
        updatedAt: schema.jobAssignments.updatedAt,
        jobTitle: schema.jobPosts.title,
        jobAmount: schema.jobPosts.amount,
        jobUnitPay: schema.jobPosts.unitPay,
        jobType: schema.jobPosts.type,
        jobStatus: schema.jobPosts.status,
        posterUsername: schema.users.username,
        posterFullName: schema.userInfo.fullName,
        posterAvatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.jobAssignments)
      .innerJoin(schema.jobPosts, eq(schema.jobAssignments.jobId, schema.jobPosts.id))
      .innerJoin(schema.users, eq(schema.jobPosts.posterId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.jobAssignments.workerId, workerId))
      .orderBy(desc(schema.jobAssignments.createdAt));

    const assignmentJobIds = new Set(assignments.map((a) => a.jobId));

    const acceptedBids = await this.db
      .select({
        id: schema.jobBids.id,
        jobId: schema.jobBids.jobId,
        workerId: schema.jobBids.bidderId,
        units: sql<number>`1`.as('units'),
        status: schema.jobBids.status,
        createdAt: schema.jobBids.createdAt,
        updatedAt: schema.jobBids.updatedAt,
        jobTitle: schema.jobPosts.title,
        jobAmount: schema.jobPosts.amount,
        jobUnitPay: schema.jobPosts.unitPay,
        jobType: schema.jobPosts.type,
        jobStatus: schema.jobPosts.status,
        posterUsername: schema.users.username,
        posterFullName: schema.userInfo.fullName,
        posterAvatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.jobBids)
      .innerJoin(schema.jobPosts, eq(schema.jobBids.jobId, schema.jobPosts.id))
      .innerJoin(schema.users, eq(schema.jobPosts.posterId, schema.users.id))
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(
        and(
          eq(schema.jobBids.bidderId, workerId),
          eq(schema.jobBids.status, 'accepted'),
        ),
      )
      .orderBy(desc(schema.jobBids.createdAt));

    const merged = [...assignments];
    for (const bid of acceptedBids) {
      if (!assignmentJobIds.has(bid.jobId)) {
        merged.push(bid);
      }
    }

    return merged.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // ─── Bidding (Single Unit) ─────────────────────────────────────────────

  async placeBid(jobId: string, bidderId: string, amount: number, message?: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.type !== 'single') throw new BadRequestException('Can only bid on single-unit jobs');
    if (job.status !== 'active') throw new BadRequestException('Job is not active');
    if (job.posterId === bidderId) throw new ForbiddenException('Cannot bid on your own job');
    if (amount > Number(job.amount)) throw new BadRequestException('Bid amount cannot exceed job amount');

    const existingBid = await this.db.query.jobBids.findFirst({
      where: and(
        eq(schema.jobBids.jobId, jobId),
        eq(schema.jobBids.bidderId, bidderId),
      ),
    });

    if (existingBid) {
      if (existingBid.status === 'pending') throw new BadRequestException('You already have a pending bid');
      if (existingBid.status === 'accepted') throw new BadRequestException('You are already assigned to this job');
    }

    const [bid] = await this.db
      .insert(schema.jobBids)
      .values({ jobId, bidderId, amount: String(amount), message })
      .returning();

    return bid;
  }

  async cancelBid(bidId: string, bidderId: string) {
    const [bid] = await this.db
      .select()
      .from(schema.jobBids)
      .where(eq(schema.jobBids.id, bidId));

    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.bidderId !== bidderId) throw new ForbiddenException('Not authorized');
    if (bid.status !== 'pending') throw new BadRequestException('Can only cancel pending bids');

    await this.db
      .update(schema.jobBids)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.jobBids.id, bidId));

    return { success: true };
  }

  async acceptBid(jobId: string, bidId: string, posterId: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.posterId !== posterId) throw new ForbiddenException('Not authorized');
    if (job.status !== 'active') throw new BadRequestException('Job is not active');

    const [bid] = await this.db
      .select()
      .from(schema.jobBids)
      .where(eq(schema.jobBids.id, bidId));

    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.jobId !== jobId) throw new BadRequestException('Bid does not belong to this job');
    if (bid.status !== 'pending') throw new BadRequestException('Bid is not pending');

    await this.db
      .update(schema.jobBids)
      .set({ status: 'accepted', updatedAt: new Date() })
      .where(eq(schema.jobBids.id, bidId));

    await this.db
      .update(schema.jobPosts)
      .set({ status: 'in_progress', updatedAt: new Date() })
      .where(eq(schema.jobPosts.id, jobId));

    await this.db
      .update(schema.jobBids)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(
        and(
          eq(schema.jobBids.jobId, jobId),
          sql`${schema.jobBids.id} != ${bidId}`,
          eq(schema.jobBids.status, 'pending'),
        )
      );

    const [assignment] = await this.db
      .insert(schema.jobAssignments)
      .values({
        jobId,
        workerId: bid.bidderId,
        units: 1,
        status: 'in_progress',
      })
      .returning();

    return { success: true, bid, assignment };
  }

  async rejectBid(jobId: string, bidId: string, posterId: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.posterId !== posterId) throw new ForbiddenException('Not authorized');

    const [bid] = await this.db
      .select()
      .from(schema.jobBids)
      .where(eq(schema.jobBids.id, bidId));

    if (!bid) throw new NotFoundException('Bid not found');
    if (bid.status !== 'pending') throw new BadRequestException('Bid is not pending');

    await this.db
      .update(schema.jobBids)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(schema.jobBids.id, bidId));

    return { success: true };
  }

  // ─── Multi-Unit Assignments ────────────────────────────────────────────

  async assignWorker(jobId: string, workerId: string, units: number, posterId: string) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.posterId !== posterId) throw new ForbiddenException('Not authorized');
    if (job.type !== 'multiple') throw new BadRequestException('Job is not multi-unit');
    if (job.status !== 'active') throw new BadRequestException('Job is not active');

    const remaining = job.totalUnits - job.filledUnits;
    if (units > remaining) throw new BadRequestException(`Only ${remaining} units remaining`);

    const existing = await this.db.query.jobAssignments.findFirst({
      where: and(
        eq(schema.jobAssignments.jobId, jobId),
        eq(schema.jobAssignments.workerId, workerId),
      ),
    });

    if (existing) throw new BadRequestException('Worker already assigned to this job');

    const [assignment] = await this.db
      .insert(schema.jobAssignments)
      .values({ jobId, workerId, units })
      .returning();

    await this.db
      .update(schema.jobPosts)
      .set({
        filledUnits: job.filledUnits + units,
        status: job.filledUnits + units >= job.totalUnits ? 'in_progress' : job.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.jobPosts.id, jobId));

    return assignment;
  }

  async updateAssignmentUnits(assignmentId: string, units: number, adminId: string) {
    const [assignment] = await this.db
      .select()
      .from(schema.jobAssignments)
      .where(eq(schema.jobAssignments.id, assignmentId));

    if (!assignment) throw new NotFoundException('Assignment not found');

    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, assignment.jobId));

    if (!job) throw new NotFoundException('Job not found');

    const diff = units - assignment.units;
    const newFilled = job.filledUnits + diff;

    if (newFilled > job.totalUnits) {
      throw new BadRequestException('Cannot exceed total units');
    }

    await this.db
      .update(schema.jobAssignments)
      .set({ units, updatedAt: new Date() })
      .where(eq(schema.jobAssignments.id, assignmentId));

    await this.db
      .update(schema.jobPosts)
      .set({ filledUnits: newFilled, updatedAt: new Date() })
      .where(eq(schema.jobPosts.id, job.id));

    return { success: true };
  }

  // ─── Submissions ───────────────────────────────────────────────────────

  async submitWork(jobId: string, workerId: string, proof: string, proofMediaUrls?: string[]) {
    const [job] = await this.db
      .select()
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'in_progress') throw new BadRequestException('Job is not in progress');

    if (job.type === 'single') {
      const [bid] = await this.db
        .select()
        .from(schema.jobBids)
        .where(
          and(
            eq(schema.jobBids.jobId, jobId),
            eq(schema.jobBids.bidderId, workerId),
            eq(schema.jobBids.status, 'accepted'),
          )
        );

      if (!bid) throw new ForbiddenException('You are not assigned to this job');

      const existingSubmission = await this.db.query.jobSubmissions.findFirst({
        where: and(
          eq(schema.jobSubmissions.jobId, jobId),
          eq(schema.jobSubmissions.workerId, workerId),
          eq(schema.jobSubmissions.status, 'pending'),
        ),
      });

      if (existingSubmission) throw new BadRequestException('You already have a pending submission');

      const [submission] = await this.db
        .insert(schema.jobSubmissions)
        .values({
          jobId,
          bidId: bid.id,
          workerId,
          proof,
          proofMediaUrls: proofMediaUrls || [],
        })
        .returning();

      const [singleAssignment] = await this.db
        .select()
        .from(schema.jobAssignments)
        .where(
          and(
            eq(schema.jobAssignments.jobId, jobId),
            eq(schema.jobAssignments.workerId, workerId),
          ),
        );

      if (singleAssignment) {
        await this.db
          .update(schema.jobAssignments)
          .set({ status: 'submitted', updatedAt: new Date() })
          .where(eq(schema.jobAssignments.id, singleAssignment.id));
      }

      return submission;
    } else {
      const [assignment] = await this.db
        .select()
        .from(schema.jobAssignments)
        .where(
          and(
            eq(schema.jobAssignments.jobId, jobId),
            eq(schema.jobAssignments.workerId, workerId),
          )
        );

      if (!assignment) throw new ForbiddenException('You are not assigned to this job');

      const existingSubmission = await this.db.query.jobSubmissions.findFirst({
        where: and(
          eq(schema.jobSubmissions.assignmentId, assignment.id),
          eq(schema.jobSubmissions.status, 'pending'),
        ),
      });

      if (existingSubmission) throw new BadRequestException('You already have a pending submission for this assignment');

      const [submission] = await this.db
        .insert(schema.jobSubmissions)
        .values({
          jobId,
          assignmentId: assignment.id,
          workerId,
          proof,
          proofMediaUrls: proofMediaUrls || [],
        })
        .returning();

      await this.db
        .update(schema.jobAssignments)
        .set({ status: 'submitted', updatedAt: new Date() })
        .where(eq(schema.jobAssignments.id, assignment.id));

      return submission;
    }
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

    const payAmount = Number(job.unitPay) * (submission.assignmentId ? 1 : 1);

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

    if (submission.assignmentId) {
      await this.db
        .update(schema.jobAssignments)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(schema.jobAssignments.id, submission.assignmentId));
    }

    const allSubmissions = await this.db
      .select()
      .from(schema.jobSubmissions)
      .where(eq(schema.jobSubmissions.jobId, jobId));

    const allApproved = allSubmissions.every(
      (s) => s.id === submissionId || s.status === 'approved'
    );

    if (allApproved) {
      await this.db
        .update(schema.jobPosts)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(schema.jobPosts.id, jobId));
    }

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

    if (submission.assignmentId) {
      await this.db
        .update(schema.jobAssignments)
        .set({ status: 'assigned', updatedAt: new Date() })
        .where(eq(schema.jobAssignments.id, submission.assignmentId));
    }

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

    const hasAcceptedBid = await this.db.query.jobBids.findFirst({
      where: and(
        eq(schema.jobBids.jobId, jobId),
        eq(schema.jobBids.status, 'accepted'),
      ),
    });

    if (hasAcceptedBid) {
      throw new BadRequestException('Cannot cancel job with accepted bid');
    }

    const hasSubmission = await this.db.query.jobSubmissions.findFirst({
      where: and(
        eq(schema.jobSubmissions.jobId, jobId),
        or(
          eq(schema.jobSubmissions.status, 'pending'),
          eq(schema.jobSubmissions.status, 'approved'),
        ),
      ),
    });

    if (hasSubmission) {
      throw new BadRequestException('Cannot cancel job with active submissions');
    }

    await this.db
      .update(schema.jobPosts)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.jobPosts.id, jobId));

    await this.db
      .update(schema.jobBids)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(
        and(
          eq(schema.jobBids.jobId, jobId),
          eq(schema.jobBids.status, 'pending'),
        )
      );

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
      await this.walletService.creditFunds(posterId, Number(escrow.amount), `Refund for cancelled job: ${job.title}`);

      await this.db
        .update(schema.jobEscrow)
        .set({ status: 'refunded', updatedAt: new Date() })
        .where(eq(schema.jobEscrow.id, escrow.id));
    }

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

  async getBidderId(bidId: string): Promise<string | null> {
    const [bid] = await this.db
      .select({ bidderId: schema.jobBids.bidderId })
      .from(schema.jobBids)
      .where(eq(schema.jobBids.id, bidId));

    return bid?.bidderId || null;
  }

  async getSubmissionWorkerId(submissionId: string): Promise<string | null> {
    const [submission] = await this.db
      .select({ workerId: schema.jobSubmissions.workerId })
      .from(schema.jobSubmissions)
      .where(eq(schema.jobSubmissions.id, submissionId));

    return submission?.workerId || null;
  }

  async getJobType(jobId: string): Promise<string | null> {
    const [job] = await this.db
      .select({ type: schema.jobPosts.type })
      .from(schema.jobPosts)
      .where(eq(schema.jobPosts.id, jobId));

    return job?.type || null;
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
