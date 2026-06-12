import { Injectable, Inject, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, asc } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

// Commission percentages per level for membership purchases
const COMMISSION_PERCENTAGES: Record<string, number[]> = {
  basic: [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5],
  standard: [12, 6, 4, 3, 2, 1, 1, 0.5, 0.5, 0.5],
  smart: [15, 8, 5, 3, 2, 1.5, 1, 0.5, 0.5, 0.5],
  vvip: [20, 10, 6, 4, 3, 2, 1.5, 1, 1, 0.5],
};

@Injectable()
export class MembershipService implements OnModuleInit {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async onModuleInit() {
    await this.seedPlans();
  }

  /**
   * Get all membership plans
   */
  async getPlans() {
    const plans = await this.db
      .select()
      .from(schema.membershipPlans)
      .orderBy(asc(schema.membershipPlans.level));
    return plans;
  }

  /**
   * Get a user's current membership info
   */
  async getUserMembership(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');

    const plans = await this.getPlans();
    const currentPlan = plans.find(p => p.name === user.memberStatus) || null;

    // Get commission history
    const commissions = await this.db
      .select()
      .from(schema.commissions)
      .where(eq(schema.commissions.toUserId, userId))
      .orderBy(desc(schema.commissions.createdAt))
      .limit(50);

    const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

    // Get purchase history
    const purchases = await this.db
      .select()
      .from(schema.membershipPurchases)
      .where(eq(schema.membershipPurchases.userId, userId))
      .orderBy(desc(schema.membershipPurchases.createdAt))
      .limit(20);

    return {
      currentPlan: currentPlan ? {
        id: currentPlan.id,
        name: currentPlan.name,
        price: Number(currentPlan.price),
        description: currentPlan.description,
        level: currentPlan.level,
      } : null,
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        description: p.description,
        level: p.level,
      })),
      purchaseHistory: purchases,
      commissionEarned: totalEarned,
      commissionHistory: commissions.slice(0, 20).map(c => ({
        id: c.id,
        amount: Number(c.amount),
        level: c.level,
        percentage: Number(c.percentage),
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Purchase a membership plan
   */
  async purchaseMembership(userId: string, planId: string) {
    const plan = await this.db.query.membershipPlans.findFirst({
      where: eq(schema.membershipPlans.id, planId),
    });
    if (!plan) throw new NotFoundException('Membership plan not found');

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) throw new NotFoundException('User not found');

    // Check if user already has this or higher membership
    const planLevel = plan.level;
    const currentLevel = this.getMemberLevel(user.memberStatus);
    if (planLevel <= currentLevel) {
      throw new ConflictException('You already have this or a higher membership');
    }

    // Create purchase record
    const [purchase] = await this.db
      .insert(schema.membershipPurchases)
      .values({
        userId,
        planId: plan.id,
        amount: plan.price,
        status: 'completed',
      })
      .returning();

    // Update user's member status
    await this.db
      .update(schema.users)
      .set({ memberStatus: plan.name as any, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    // Distribute commissions to upline (10 levels)
    const commissions = await this.distributeCommissions(userId, plan, purchase.id);

    return {
      purchase: {
        id: purchase.id,
        userId: purchase.userId,
        planId: purchase.planId,
        amount: Number(purchase.amount),
        status: purchase.status,
        createdAt: purchase.createdAt.toISOString(),
      },
      commissions,
      newStatus: plan.name,
    };
  }

  /**
   * Distribute commissions to upline users (up to 10 levels)
   */
  private async distributeCommissions(
    buyerId: string,
    plan: typeof schema.membershipPlans.$inferSelect,
    purchaseId: string,
  ) {
    const buyer = await this.db.query.users.findFirst({
      where: eq(schema.users.id, buyerId),
    });
    if (!buyer || !buyer.referredBy) return [];

    const percentages = COMMISSION_PERCENTAGES[plan.name] || [];
    const commissions: any[] = [];

    let currentReferCode: string | null = buyer.referredBy;
    let level = 1;

    while (currentReferCode && level <= 10) {
      const uplineUser = await this.db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, currentReferCode),
      });
      if (!uplineUser) break;

      const percentage = percentages[level - 1];
      if (percentage > 0) {
        const amount = (Number(plan.price) * percentage) / 100;

        const [commission] = await this.db
          .insert(schema.commissions)
          .values({
            fromUserId: buyerId,
            toUserId: uplineUser.id,
            purchaseId,
            level,
            amount: String(amount),
            percentage: String(percentage),
          })
          .returning();

        commissions.push({
          id: commission.id,
          fromUserId: buyerId,
          toUserId: uplineUser.id,
          level,
          amount: Number(commission.amount),
          percentage: Number(commission.percentage),
        });
      }

      currentReferCode = uplineUser.referredBy || null;
      level++;
    }

    return commissions;
  }

  private getMemberLevel(status: string): number {
    const levels: Record<string, number> = {
      super_admin: 5,
      vvip: 4,
      smart: 3,
      standard: 2,
      basic: 1,
      user: 0,
    };
    return levels[status] ?? 0;
  }

  /**
   * Seed default membership plans on startup
   */
  async seedPlans() {
    const existing = await this.db.select().from(schema.membershipPlans);
    if (existing.length > 0) return;

    const plans = [
      { name: 'user', price: '0', description: 'Free member', level: 0 },
      { name: 'basic', price: '500', description: 'Basic membership with starter benefits', level: 1 },
      { name: 'standard', price: '1500', description: 'Standard membership with enhanced benefits', level: 2 },
      { name: 'smart', price: '3500', description: 'Smart membership with premium benefits', level: 3 },
      { name: 'vvip', price: '10000', description: 'VVIP membership with exclusive benefits', level: 4 },
    ];

    for (const plan of plans) {
      await this.db.insert(schema.membershipPlans).values(plan);
    }
    console.log('Membership plans seeded successfully');
  }
}
