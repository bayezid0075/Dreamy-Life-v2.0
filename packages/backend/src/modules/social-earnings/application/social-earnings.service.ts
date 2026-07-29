import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import * as schema from '../../../infrastructure/database/schema';

const REACTION_CREDIT = '0.00002';
const MINIMUM_WITHDRAW = 3.0;

@Injectable()
export class SocialEarningsService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getOrCreate(userId: string) {
    let earnings = await this.db.query.socialEarnings.findFirst({
      where: eq(schema.socialEarnings.userId, userId),
    });
    if (!earnings) {
      const [created] = await this.db.insert(schema.socialEarnings).values({ userId }).returning();
      earnings = created;
    }
    return {
      balance: Number(earnings.balance),
      totalEarned: Number(earnings.totalEarned),
      totalWithdrawn: Number(earnings.totalWithdrawn),
      reactionCount: earnings.reactionCount,
      canWithdraw: Number(earnings.balance) >= MINIMUM_WITHDRAW,
      minimumWithdraw: MINIMUM_WITHDRAW,
    };
  }

  async creditReaction(userId: string, reactorId: string) {
    if (userId === reactorId) return;

    let earnings = await this.db.query.socialEarnings.findFirst({
      where: eq(schema.socialEarnings.userId, userId),
    });
    if (!earnings) {
      const [created] = await this.db.insert(schema.socialEarnings).values({ userId }).returning();
      earnings = created;
    }

    const newBalance = Number(earnings.balance) + Number(REACTION_CREDIT);
    const newTotal = Number(earnings.totalEarned) + Number(REACTION_CREDIT);
    const newCount = earnings.reactionCount + 1;

    await this.db
      .update(schema.socialEarnings)
      .set({
        balance: String(newBalance),
        totalEarned: String(newTotal),
        reactionCount: newCount,
        updatedAt: new Date(),
      })
      .where(eq(schema.socialEarnings.userId, userId));
  }

  async debitReaction(userId: string) {
    const earnings = await this.db.query.socialEarnings.findFirst({
      where: eq(schema.socialEarnings.userId, userId),
    });
    if (!earnings) return;

    const newBalance = Math.max(0, Number(earnings.balance) - Number(REACTION_CREDIT));
    const newCount = Math.max(0, earnings.reactionCount - 1);

    await this.db
      .update(schema.socialEarnings)
      .set({
        balance: String(newBalance),
        reactionCount: newCount,
        updatedAt: new Date(),
      })
      .where(eq(schema.socialEarnings.userId, userId));
  }

  async createWithdrawal(userId: string, amount: number, method: string, phoneNumber: string) {
    if (amount < MINIMUM_WITHDRAW) {
      throw new BadRequestException(`Minimum withdrawal is $${MINIMUM_WITHDRAW}`);
    }
    if (!['bkash', 'nagad', 'rocket'].includes(method)) {
      throw new BadRequestException('Invalid payment method');
    }

    const earnings = await this.db.query.socialEarnings.findFirst({
      where: eq(schema.socialEarnings.userId, userId),
    });
    if (!earnings) throw new NotFoundException('Earnings account not found');
    if (Number(earnings.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const newBalance = Number(earnings.balance) - amount;
    await this.db
      .update(schema.socialEarnings)
      .set({
        balance: String(newBalance),
        totalWithdrawn: String(Number(earnings.totalWithdrawn) + amount),
        updatedAt: new Date(),
      })
      .where(eq(schema.socialEarnings.userId, userId));

    const [withdrawal] = await this.db.insert(schema.socialWithdrawals).values({
      userId,
      amount: String(amount),
      method,
      phoneNumber,
    }).returning();

    return withdrawal;
  }

  async getUserWithdrawals(userId: string) {
    return this.db
      .select()
      .from(schema.socialWithdrawals)
      .where(eq(schema.socialWithdrawals.userId, userId))
      .orderBy(desc(schema.socialWithdrawals.createdAt));
  }

  async getAllWithdrawals(status?: string, page = 1, limit = 20) {
    const conditions = status
      ? [eq(schema.socialWithdrawals.status, status)]
      : [];

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, total] = await Promise.all([
      this.db
        .select({
          id: schema.socialWithdrawals.id,
          userId: schema.socialWithdrawals.userId,
          amount: schema.socialWithdrawals.amount,
          method: schema.socialWithdrawals.method,
          phoneNumber: schema.socialWithdrawals.phoneNumber,
          status: schema.socialWithdrawals.status,
          adminNote: schema.socialWithdrawals.adminNote,
          processedAt: schema.socialWithdrawals.processedAt,
          createdAt: schema.socialWithdrawals.createdAt,
          username: schema.users.username,
          email: schema.users.email,
        })
        .from(schema.socialWithdrawals)
        .innerJoin(schema.users, eq(schema.socialWithdrawals.userId, schema.users.id))
        .where(whereClause)
        .orderBy(desc(schema.socialWithdrawals.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ count: count() })
        .from(schema.socialWithdrawals)
        .where(whereClause),
    ]);

    return {
      items,
      total: Number(total[0]?.count ?? 0),
      page,
      limit,
    };
  }

  async getAdminStats() {
    const [pending, accepted, finished, rejected, totalAmount] = await Promise.all([
      this.db.select({ count: count() }).from(schema.socialWithdrawals).where(eq(schema.socialWithdrawals.status, 'pending')),
      this.db.select({ count: count() }).from(schema.socialWithdrawals).where(eq(schema.socialWithdrawals.status, 'accepted')),
      this.db.select({ count: count() }).from(schema.socialWithdrawals).where(eq(schema.socialWithdrawals.status, 'finished')),
      this.db.select({ count: count() }).from(schema.socialWithdrawals).where(eq(schema.socialWithdrawals.status, 'rejected')),
      this.db.select({ total: sql<string>`coalesce(sum(${schema.socialWithdrawals.amount}), '0')` }).from(schema.socialWithdrawals).where(eq(schema.socialWithdrawals.status, 'finished')),
    ]);

    return {
      pending: Number(pending[0]?.count ?? 0),
      accepted: Number(accepted[0]?.count ?? 0),
      finished: Number(finished[0]?.count ?? 0),
      rejected: Number(rejected[0]?.count ?? 0),
      totalPaid: totalAmount[0]?.total ?? '0',
    };
  }

  async updateWithdrawalStatus(id: string, status: string, adminNote?: string) {
    const withdrawal = await this.db.query.socialWithdrawals.findFirst({
      where: eq(schema.socialWithdrawals.id, id),
    });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found');

    if (status === 'rejected' && withdrawal.status === 'pending') {
      const earnings = await this.db.query.socialEarnings.findFirst({
        where: eq(schema.socialEarnings.userId, withdrawal.userId),
      });
      if (earnings) {
        await this.db
          .update(schema.socialEarnings)
          .set({
            balance: String(Number(earnings.balance) + Number(withdrawal.amount)),
            totalWithdrawn: String(Number(earnings.totalWithdrawn) - Number(withdrawal.amount)),
            updatedAt: new Date(),
          })
          .where(eq(schema.socialEarnings.userId, withdrawal.userId));
      }
    }

    await this.db
      .update(schema.socialWithdrawals)
      .set({
        status,
        adminNote: adminNote || null,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.socialWithdrawals.id, id));

    return { message: `Withdrawal ${status}` };
  }

  async getAllEarnings(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.db
        .select({
          id: schema.socialEarnings.id,
          userId: schema.socialEarnings.userId,
          balance: schema.socialEarnings.balance,
          totalEarned: schema.socialEarnings.totalEarned,
          totalWithdrawn: schema.socialEarnings.totalWithdrawn,
          reactionCount: schema.socialEarnings.reactionCount,
          isActive: schema.socialEarnings.isActive,
          createdAt: schema.socialEarnings.createdAt,
          username: schema.users.username,
          email: schema.users.email,
        })
        .from(schema.socialEarnings)
        .innerJoin(schema.users, eq(schema.socialEarnings.userId, schema.users.id))
        .orderBy(desc(schema.socialEarnings.totalEarned))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ count: count() }).from(schema.socialEarnings),
    ]);

    return {
      items,
      total: Number(total[0]?.count ?? 0),
      page,
      limit,
    };
  }

  async toggleEarningActive(userId: string) {
    const earnings = await this.db.query.socialEarnings.findFirst({
      where: eq(schema.socialEarnings.userId, userId),
    });
    if (!earnings) throw new NotFoundException('Earnings account not found');

    await this.db
      .update(schema.socialEarnings)
      .set({ isActive: !earnings.isActive, updatedAt: new Date() })
      .where(eq(schema.socialEarnings.userId, userId));

    return { isActive: !earnings.isActive };
  }
}
