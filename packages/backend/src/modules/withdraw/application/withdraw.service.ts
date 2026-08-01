import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, sql } from 'drizzle-orm';
import * as schema from '../../../infrastructure/database/schema';
import { WalletService } from '../../wallet/application/services/wallet.service';

@Injectable()
export class WithdrawService {
  private readonly logger = new Logger(WithdrawService.name);

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
    private readonly walletService: WalletService,
  ) {}

  async getConfig() {
    this.logger.debug('Loading withdraw config from database');
    const config = await this.db.query.withdrawConfig.findFirst();
    if (!config) {
      this.logger.log('No withdraw config found, creating default');
      const [created] = await this.db
        .insert(schema.withdrawConfig)
        .values({})
        .returning();
      return created;
    }
    return config;
  }

  async updateConfig(data: {
    minimumBalance?: string;
    chargePercent?: string;
    isActive?: boolean;
  }) {
    this.logger.log(`Updating withdraw config: keys=[${Object.keys(data).join(', ')}]`);
    const existing = await this.getConfig();
    const [updated] = await this.db
      .update(schema.withdrawConfig)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.withdrawConfig.id, existing.id))
      .returning();
    this.logger.log('Withdraw config updated successfully');
    return updated;
  }

  async createWithdraw(userId: string, data: {
    amount: number;
    method: string;
    phoneNumber: string;
  }) {
    this.logger.log(`Creating withdraw: user=${userId} amount=${data.amount} method=${data.method} phone=${data.phoneNumber}`);

    const config = await this.getConfig();
    if (!config.isActive) {
      throw new BadRequestException('Withdraw service is currently disabled');
    }

    const validMethods = ['bkash', 'nagad', 'rocket'];
    if (!validMethods.includes(data.method.toLowerCase())) {
      throw new BadRequestException(`Invalid method. Allowed: ${validMethods.join(', ')}`);
    }

    if (!data.phoneNumber || data.phoneNumber.length < 11) {
      throw new BadRequestException('Please enter a valid phone number');
    }

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Invalid amount');
    }

    const minBalance = Number(config.minimumBalance) || 100;
    if (amount < minBalance) {
      throw new BadRequestException(`Minimum withdrawal amount is ৳${minBalance}`);
    }

    const walletBalance = await this.walletService.getWalletBalance(userId);
    if (walletBalance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const chargePercent = Number(config.chargePercent) || 0;
    const chargeAmount = (amount * chargePercent) / 100;
    const totalAmount = amount + chargeAmount;

    await this.walletService.debitWallet(userId, totalAmount, `Withdrawal via ${data.method} to ${data.phoneNumber}`);

    const [withdrawal] = await this.db
      .insert(schema.withdrawals)
      .values({
        userId,
        amount: String(amount),
        chargePercent: String(chargePercent),
        chargeAmount: String(chargeAmount),
        totalAmount: String(totalAmount),
        method: data.method.toLowerCase(),
        phoneNumber: data.phoneNumber,
        status: 'pending',
      })
      .returning();

    this.logger.log(`Withdrawal created: id=${withdrawal.id} total=${totalAmount}`);
    return withdrawal;
  }

  async getUserWithdrawals(userId: string, page: number = 1, limit: number = 20) {
    this.logger.debug(`Fetching withdrawals for user=${userId} page=${page} limit=${limit}`);
    const offset = (page - 1) * limit;
    const orders = await this.db
      .select()
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.userId, userId))
      .orderBy(desc(schema.withdrawals.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      orders,
      total: orders.length,
      page,
      limit,
    };
  }

  async getAllWithdrawals(page: number = 1, limit: number = 20, status?: string) {
    this.logger.debug(`Fetching all withdrawals: page=${page} limit=${limit} status=${status || 'all'}`);
    const offset = (page - 1) * limit;
    const conditions = status && status !== 'all' ? eq(schema.withdrawals.status, status) : undefined;

    const orders = await this.db
      .select()
      .from(schema.withdrawals)
      .where(conditions)
      .orderBy(desc(schema.withdrawals.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.withdrawals)
      .where(conditions);

    return {
      orders,
      total: totalResult[0]?.count || 0,
      page,
      limit,
    };
  }

  async updateWithdrawStatus(id: string, status: string, adminNote?: string) {
    this.logger.log(`Updating withdrawal ${id} to status=${status}`);
    const validStatuses = ['pending', 'accepted', 'finished', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }

    const existing = await this.db.query.withdrawals.findFirst({
      where: eq(schema.withdrawals.id, id),
    });
    if (!existing) {
      throw new NotFoundException('Withdrawal not found');
    }

    if (status === 'rejected' && existing.status !== 'pending') {
      throw new BadRequestException('Can only reject pending withdrawals');
    }

    if (status === 'rejected') {
      await this.walletService.creditWallet(existing.userId, Number(existing.totalAmount), `Withdrawal rejected - refund for ${existing.method} to ${existing.phoneNumber}`);
    }

    const updateData: any = { status, updatedAt: new Date() };
    if (adminNote) updateData.adminNote = adminNote;
    if (status === 'accepted' || status === 'finished' || status === 'rejected') {
      updateData.processedAt = new Date();
    }

    const [updated] = await this.db
      .update(schema.withdrawals)
      .set(updateData)
      .where(eq(schema.withdrawals.id, id))
      .returning();

    this.logger.log(`Withdrawal ${id} updated to ${status}`);
    return updated;
  }

  async getWithdrawStats() {
    const pending = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.status, 'pending'));

    const accepted = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.status, 'accepted'));

    const finished = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.status, 'finished'));

    const rejected = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.withdrawals)
      .where(eq(schema.withdrawals.status, 'rejected'));

    const totalAmount = await this.db
      .select({ sum: sql<string>`coalesce(sum(${schema.withdrawals.totalAmount}), 0)::text` })
      .from(schema.withdrawals);

    return {
      pending: pending[0]?.count || 0,
      accepted: accepted[0]?.count || 0,
      finished: finished[0]?.count || 0,
      rejected: rejected[0]?.count || 0,
      totalAmount: totalAmount[0]?.sum || '0',
    };
  }
}
