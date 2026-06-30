import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

@Injectable()
export class WalletService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getWallet(userId: string) {
    let wallet = await this.db.query.wallets.findFirst({
      where: eq(schema.wallets.userId, userId),
    });

    if (!wallet) {
      const [created] = await this.db
        .insert(schema.wallets)
        .values({ userId })
        .returning();
      wallet = created;
    }

    const txns = await this.db
      .select({ type: schema.transactions.type, amount: schema.transactions.amount })
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId));

    if (txns.length > 0) {
      let computedWallet = 0;
      let computedFunds = 0;
      let computedPoints = 0;

      for (const txn of txns) {
        const amt = Number(txn.amount);
        switch (txn.type) {
          case 'wallet_credit': computedWallet += amt; break;
          case 'wallet_debit': computedWallet -= amt; break;
          case 'fund_credit': computedFunds += amt; break;
          case 'fund_debit': computedFunds -= amt; break;
          case 'point_earned': computedPoints += amt; break;
          case 'point_spent': computedPoints -= amt; break;
        }
      }

      await this.db
        .update(schema.wallets)
        .set({
          walletBalance: String(computedWallet),
          fundsBalance: String(computedFunds),
          pointsBalance: String(computedPoints),
          updatedAt: new Date(),
        })
        .where(eq(schema.wallets.userId, userId));

      return {
        walletBalance: computedWallet,
        fundsBalance: computedFunds,
        pointsBalance: computedPoints,
      };
    }

    return {
      walletBalance: Number(wallet.walletBalance),
      fundsBalance: Number(wallet.fundsBalance),
      pointsBalance: Number(wallet.pointsBalance),
    };
  }

  async getTransactions(userId: string, type: string = 'all', filter: string = 'all') {
    const conditions = [eq(schema.transactions.userId, userId)];

    if (type !== 'all') {
      const typeMap: Record<string, string[]> = {
        wallet: ['wallet_credit', 'wallet_debit'],
        funds: ['fund_credit', 'fund_debit'],
        points: ['point_earned', 'point_spent'],
      };
      const types = typeMap[type] || [type];
      if (types.length === 1) {
        conditions.push(eq(schema.transactions.type, types[0]));
      } else {
        conditions.push(sql`${schema.transactions.type} IN (${sql.join(types.map(t => sql`${t}`), sql`, `)})`);
      }
    }

    if (filter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '15d':
          startDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0);
      }
      conditions.push(gte(schema.transactions.createdAt, startDate));
    }

    const txns = await this.db
      .select()
      .from(schema.transactions)
      .where(and(...conditions))
      .orderBy(desc(schema.transactions.createdAt))
      .limit(100);

    return txns.map(t => ({
      id: t.id,
      userId: t.userId,
      type: t.type,
      amount: Number(t.amount),
      description: t.description,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  async addFunds(userId: string, amount: number) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let wallet = await this.db.query.wallets.findFirst({
      where: eq(schema.wallets.userId, userId),
    });

    if (!wallet) {
      const [created] = await this.db
        .insert(schema.wallets)
        .values({ userId })
        .returning();
      wallet = created;
    }

    const newBalance = Number(wallet.fundsBalance) + amount;

    await this.db
      .update(schema.wallets)
      .set({ fundsBalance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.wallets.userId, userId));

    await this.db.insert(schema.transactions).values({
      userId,
      type: 'fund_credit',
      amount: String(amount),
      description: `Added ৳${amount.toFixed(2)} via bKash`,
    });

    return {
      fundsBalance: newBalance,
    };
  }

  async debitFunds(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let wallet = await this.db.query.wallets.findFirst({
      where: eq(schema.wallets.userId, userId),
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const currentBalance = Number(wallet.fundsBalance);
    if (currentBalance < amount) {
      throw new NotFoundException('Insufficient funds balance');
    }

    const newBalance = currentBalance - amount;

    await this.db
      .update(schema.wallets)
      .set({ fundsBalance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.wallets.userId, userId));

    await this.db.insert(schema.transactions).values({
      userId,
      type: 'fund_debit',
      amount: String(amount),
      description,
    });

    return { fundsBalance: newBalance };
  }

  async creditWallet(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let wallet = await this.db.query.wallets.findFirst({
      where: eq(schema.wallets.userId, userId),
    });

    if (!wallet) {
      const [created] = await this.db
        .insert(schema.wallets)
        .values({ userId })
        .returning();
      wallet = created;
    }

    const newBalance = Number(wallet.walletBalance) + amount;

    await this.db
      .update(schema.wallets)
      .set({ walletBalance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.wallets.userId, userId));

    await this.db.insert(schema.transactions).values({
      userId,
      type: 'wallet_credit',
      amount: String(amount),
      description,
    });

    return { walletBalance: newBalance };
  }

  async getFundsBalance(userId: string): Promise<number> {
    let wallet = await this.db.query.wallets.findFirst({
      where: eq(schema.wallets.userId, userId),
    });

    if (!wallet) {
      const [created] = await this.db
        .insert(schema.wallets)
        .values({ userId })
        .returning();
      wallet = created;
    }

    return Number(wallet.fundsBalance);
  }

  async creditFunds(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new NotFoundException('Amount must be positive');

    let wallet = await this.db.query.wallets.findFirst({
      where: eq(schema.wallets.userId, userId),
    });

    if (!wallet) {
      const [created] = await this.db
        .insert(schema.wallets)
        .values({ userId })
        .returning();
      wallet = created;
    }

    const newBalance = Number(wallet.fundsBalance) + amount;

    await this.db
      .update(schema.wallets)
      .set({ fundsBalance: String(newBalance), updatedAt: new Date() })
      .where(eq(schema.wallets.userId, userId));

    await this.db.insert(schema.transactions).values({
      userId,
      type: 'fund_credit',
      amount: String(amount),
      description,
    });

    return { fundsBalance: newBalance };
  }

  async seedIfEmpty(userId: string) {
    const existing = await this.db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.userId, userId))
      .limit(1);

    if (existing.length > 0) return false;

    const now = new Date();
    const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

    await this.db.insert(schema.wallets).values({
      userId,
      walletBalance: '45.00',
      fundsBalance: '462.50',
      pointsBalance: '600.00',
    });

    const seedTransactions = [
      { type: 'fund_credit', amount: '500.00', description: 'Added via bKash', days: 2 },
      { type: 'fund_debit', amount: '20.00', description: 'Mobile recharge 017...', days: 2 },
      { type: 'fund_credit', amount: '20.00', description: 'Refund: mobile recharge', days: 2 },
      { type: 'fund_debit', amount: '20.00', description: 'Mobile recharge 017...', days: 2 },
      { type: 'wallet_credit', amount: '50.00', description: 'Commission earned', days: 3 },
      { type: 'wallet_debit', amount: '30.00', description: 'Transfer to funds', days: 3 },
      { type: 'wallet_credit', amount: '25.00', description: 'Referral bonus', days: 4 },
      { type: 'point_earned', amount: '50.00', description: 'Daily login reward', days: 1 },
      { type: 'point_earned', amount: '500.00', description: 'Referral bonus points', days: 3 },
      { type: 'point_spent', amount: '150.00', description: 'Product purchase', days: 5 },
      { type: 'point_earned', amount: '200.00', description: 'Product review reward', days: 7 },
      { type: 'fund_credit', amount: '12.50', description: 'Cashback reward', days: 4 },
    ];

    for (const txn of seedTransactions) {
      await this.db.insert(schema.transactions).values({
        userId,
        type: txn.type,
        amount: txn.amount,
        description: txn.description,
        createdAt: daysAgo(txn.days),
      });
    }

    return true;
  }
}
