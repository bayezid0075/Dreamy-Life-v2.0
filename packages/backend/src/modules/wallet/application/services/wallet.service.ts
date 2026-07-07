import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

@Injectable()
export class WalletService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ─── Get Balances ─────────────────────────────────────────────────────

  async getWallet(userId: string) {
    let wallet = await this.db.query.userWallets.findFirst({
      where: eq(schema.userWallets.userId, userId),
    });
    if (!wallet) {
      const [created] = await this.db.insert(schema.userWallets).values({ userId }).returning();
      wallet = created;
    }
    return { walletBalance: Number(wallet.balance) };
  }

  async getFunds(userId: string) {
    let funds = await this.db.query.userFunds.findFirst({
      where: eq(schema.userFunds.userId, userId),
    });
    if (!funds) {
      const [created] = await this.db.insert(schema.userFunds).values({ userId }).returning();
      funds = created;
    }
    return { fundsBalance: Number(funds.balance) };
  }

  async getPoints(userId: string) {
    let points = await this.db.query.userPoints.findFirst({
      where: eq(schema.userPoints.userId, userId),
    });
    if (!points) {
      const [created] = await this.db.insert(schema.userPoints).values({ userId }).returning();
      points = created;
    }
    return { pointsBalance: Number(points.balance) };
  }

  async getAllBalances(userId: string) {
    const [wallet, funds, points] = await Promise.all([
      this.getWallet(userId),
      this.getFunds(userId),
      this.getPoints(userId),
    ]);
    return {
      walletBalance: wallet.walletBalance,
      fundsBalance: funds.fundsBalance,
      pointsBalance: points.pointsBalance,
    };
  }

  async getFundsBalance(userId: string): Promise<number> {
    const { fundsBalance } = await this.getFunds(userId);
    return fundsBalance;
  }

  // ─── Wallet Operations (earnings - WITHDRAWABLE) ──────────────────────

  async creditWallet(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let wallet = await this.db.query.userWallets.findFirst({
      where: eq(schema.userWallets.userId, userId),
    });
    if (!wallet) {
      const [created] = await this.db.insert(schema.userWallets).values({ userId }).returning();
      wallet = created;
    }

    const newBalance = Number(wallet.balance) + amount;

    await this.db
      .update(schema.userWallets)
      .set({ balance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.userWallets.userId, userId));

    await this.db.insert(schema.walletTransactions).values({
      userId,
      amount: String(amount),
      description,
    });

    return { walletBalance: newBalance };
  }

  async debitWallet(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let wallet = await this.db.query.userWallets.findFirst({
      where: eq(schema.userWallets.userId, userId),
    });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const currentBalance = Number(wallet.balance);
    if (currentBalance < amount) {
      throw new NotFoundException('Insufficient wallet balance');
    }

    const newBalance = currentBalance - amount;

    await this.db
      .update(schema.userWallets)
      .set({ balance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.userWallets.userId, userId));

    await this.db.insert(schema.walletTransactions).values({
      userId,
      amount: String(-amount),
      description,
    });

    return { walletBalance: newBalance };
  }

  // ─── Fund Operations (deposited money for purchases) ──────────────────

  async creditFunds(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let funds = await this.db.query.userFunds.findFirst({
      where: eq(schema.userFunds.userId, userId),
    });
    if (!funds) {
      const [created] = await this.db.insert(schema.userFunds).values({ userId }).returning();
      funds = created;
    }

    const newBalance = Number(funds.balance) + amount;

    await this.db
      .update(schema.userFunds)
      .set({ balance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.userFunds.userId, userId));

    await this.db.insert(schema.fundTransactions).values({
      userId,
      amount: String(amount),
      description,
    });

    return { fundsBalance: newBalance };
  }

  async debitFunds(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let funds = await this.db.query.userFunds.findFirst({
      where: eq(schema.userFunds.userId, userId),
    });
    if (!funds) throw new NotFoundException('Funds account not found');

    const currentBalance = Number(funds.balance);
    if (currentBalance < amount) {
      throw new NotFoundException('Insufficient funds balance');
    }

    const newBalance = currentBalance - amount;

    await this.db
      .update(schema.userFunds)
      .set({ balance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.userFunds.userId, userId));

    await this.db.insert(schema.fundTransactions).values({
      userId,
      amount: String(-amount),
      description,
    });

    return { fundsBalance: newBalance };
  }

  // ─── Point Operations (rewards) ───────────────────────────────────────

  async creditPoints(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let points = await this.db.query.userPoints.findFirst({
      where: eq(schema.userPoints.userId, userId),
    });
    if (!points) {
      const [created] = await this.db.insert(schema.userPoints).values({ userId }).returning();
      points = created;
    }

    const newBalance = Number(points.balance) + amount;

    await this.db
      .update(schema.userPoints)
      .set({ balance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.userPoints.userId, userId));

    await this.db.insert(schema.pointTransactions).values({
      userId,
      amount: String(amount),
      description,
    });

    return { pointsBalance: newBalance };
  }

  async debitPoints(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let points = await this.db.query.userPoints.findFirst({
      where: eq(schema.userPoints.userId, userId),
    });
    if (!points) throw new NotFoundException('Points account not found');

    const currentBalance = Number(points.balance);
    if (currentBalance < amount) {
      throw new NotFoundException('Insufficient points balance');
    }

    const newBalance = currentBalance - amount;

    await this.db
      .update(schema.userPoints)
      .set({ balance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.userPoints.userId, userId));

    await this.db.insert(schema.pointTransactions).values({
      userId,
      amount: String(-amount),
      description,
    });

    return { pointsBalance: newBalance };
  }

  // ─── Transaction History ──────────────────────────────────────────────

  async getWalletTransactions(userId: string, filter: string = 'all') {
    const conditions = [eq(schema.walletTransactions.userId, userId)];

    if (filter !== 'all') {
      const startDate = this.getFilterDate(filter);
      if (startDate) conditions.push(gte(schema.walletTransactions.createdAt, startDate));
    }

    const txns = await this.db
      .select()
      .from(schema.walletTransactions)
      .where(and(...conditions))
      .orderBy(desc(schema.walletTransactions.createdAt))
      .limit(100);

    return txns.map(t => ({
      id: t.id,
      userId: t.userId,
      type: Number(t.amount) >= 0 ? 'wallet_credit' : 'wallet_debit',
      amount: Math.abs(Number(t.amount)),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getFundTransactions(userId: string, filter: string = 'all') {
    const conditions = [eq(schema.fundTransactions.userId, userId)];

    if (filter !== 'all') {
      const startDate = this.getFilterDate(filter);
      if (startDate) conditions.push(gte(schema.fundTransactions.createdAt, startDate));
    }

    const txns = await this.db
      .select()
      .from(schema.fundTransactions)
      .where(and(...conditions))
      .orderBy(desc(schema.fundTransactions.createdAt))
      .limit(100);

    return txns.map(t => ({
      id: t.id,
      userId: t.userId,
      type: Number(t.amount) >= 0 ? 'fund_credit' : 'fund_debit',
      amount: Math.abs(Number(t.amount)),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getPointTransactions(userId: string, filter: string = 'all') {
    const conditions = [eq(schema.pointTransactions.userId, userId)];

    if (filter !== 'all') {
      const startDate = this.getFilterDate(filter);
      if (startDate) conditions.push(gte(schema.pointTransactions.createdAt, startDate));
    }

    const txns = await this.db
      .select()
      .from(schema.pointTransactions)
      .where(and(...conditions))
      .orderBy(desc(schema.pointTransactions.createdAt))
      .limit(100);

    return txns.map(t => ({
      id: t.id,
      userId: t.userId,
      type: Number(t.amount) >= 0 ? 'point_earned' : 'point_spent',
      amount: Math.abs(Number(t.amount)),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async getAllTransactions(userId: string, type: string = 'all', filter: string = 'all') {
    if (type === 'wallet') return this.getWalletTransactions(userId, filter);
    if (type === 'funds') return this.getFundTransactions(userId, filter);
    if (type === 'points') return this.getPointTransactions(userId, filter);

    const [walletTxns, fundTxns, pointTxns] = await Promise.all([
      this.getWalletTransactions(userId, filter),
      this.getFundTransactions(userId, filter),
      this.getPointTransactions(userId, filter),
    ]);

    return [...walletTxns, ...fundTxns, ...pointTxns].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  // ─── Seed Data ────────────────────────────────────────────────────────

  async seedIfEmpty(userId: string) {
    const existing = await this.db.query.walletTransactions.findFirst({
      where: eq(schema.walletTransactions.userId, userId),
    });
    if (existing) return false;

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    await this.db.insert(schema.userWallets).values({ userId, balance: '45.00' });
    await this.db.insert(schema.userFunds).values({ userId, balance: '462.50' });
    await this.db.insert(schema.userPoints).values({ userId, balance: '600.00' });

    const seedWalletTxns = [
      { amount: '50.00', description: 'Commission earned', days: 3 },
      { amount: '-30.00', description: 'Transfer to funds', days: 3 },
      { amount: '25.00', description: 'Referral bonus', days: 4 },
    ];

    const seedFundTxns = [
      { amount: '500.00', description: 'Added via bKash', days: 2 },
      { amount: '-20.00', description: 'Mobile recharge 017...', days: 2 },
      { amount: '20.00', description: 'Refund: mobile recharge', days: 2 },
      { amount: '-20.00', description: 'Mobile recharge 017...', days: 2 },
      { amount: '12.50', description: 'Cashback reward', days: 4 },
    ];

    const seedPointTxns = [
      { amount: '50.00', description: 'Daily login reward', days: 1 },
      { amount: '500.00', description: 'Referral bonus points', days: 3 },
      { amount: '-150.00', description: 'Product purchase', days: 5 },
      { amount: '200.00', description: 'Product review reward', days: 7 },
    ];

    for (const txn of seedWalletTxns) {
      await this.db.insert(schema.walletTransactions).values({
        userId, amount: txn.amount, description: txn.description, createdAt: daysAgo(txn.days),
      });
    }
    for (const txn of seedFundTxns) {
      await this.db.insert(schema.fundTransactions).values({
        userId, amount: txn.amount, description: txn.description, createdAt: daysAgo(txn.days),
      });
    }
    for (const txn of seedPointTxns) {
      await this.db.insert(schema.pointTransactions).values({
        userId, amount: txn.amount, description: txn.description, createdAt: daysAgo(txn.days),
      });
    }

    return true;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private getFilterDate(filter: string): Date | null {
    const now = new Date();
    switch (filter) {
      case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case 'yesterday': return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '15d': return new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return null;
    }
  }
}
