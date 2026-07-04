import { Injectable, Inject, Logger } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, asc, sql } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Build the referral tree when a new user registers with a referral code.
   * Traces up to 10 levels up the chain.
   */
  async buildReferralTree(newUserId: string, referCode: string): Promise<void> {
    const directReferrer = await this.db.query.users.findFirst({
      where: eq(schema.users.ownRefercode, referCode),
    });

    if (!directReferrer) return;

    // Check if this user was already referred (idempotency)
    const existing = await this.db.query.referrals.findFirst({
      where: eq(schema.referrals.referredId, newUserId),
    });
    if (existing) {
      this.logger.warn(`Referral tree already exists for user ${newUserId}, skipping`);
      return;
    }

    // Level 1: direct referral
    await this.db.insert(schema.referrals).values({
      referrerId: directReferrer.id,
      referredId: newUserId,
      level: 1,
      commissionRate: '0.00',
    });

    // Trace up the chain (levels 2-10)
    let currentReferrer = directReferrer;

    for (let level = 2; level <= 10; level++) {
      if (!currentReferrer.referredBy) break;

      const uplineUser = await this.db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, currentReferrer.referredBy),
      });

      if (!uplineUser) break;

      await this.db.insert(schema.referrals).values({
        referrerId: uplineUser.id,
        referredId: newUserId,
        level,
        commissionRate: '0.00',
      });

      currentReferrer = uplineUser;
    }
  }

  /**
   * Rebuild all referral trees from the users.referredBy chain.
   * Call this once to fix incomplete data.
   */
  async rebuildAllReferralTrees(): Promise<{ rebuilt: number }> {
    // Clear all existing referrals
    await this.db.delete(schema.referrals);

    // Get all users who were referred (have a referredBy code)
    const referredUsers = await this.db
      .select({
        id: schema.users.id,
        referredBy: schema.users.referredBy,
      })
      .from(schema.users)
      .where(sql`${schema.users.referredBy} IS NOT NULL`);

    let rebuilt = 0;

    for (const user of referredUsers) {
      if (!user.referredBy) continue;

      // Trace up the chain and insert referral entries
      let currentReferCode: string | null = user.referredBy;
      let level = 1;

      while (currentReferCode && level <= 10) {
        const referrer = await this.db.query.users.findFirst({
          where: eq(schema.users.ownRefercode, currentReferCode),
        });
        if (!referrer) break;

        await this.db.insert(schema.referrals).values({
          referrerId: referrer.id,
          referredId: user.id,
          level,
          commissionRate: '0.00',
        });

        currentReferCode = referrer.referredBy || null;
        level++;
      }

      rebuilt++;
    }

    this.logger.log(`Rebuilt referral trees for ${rebuilt} users`);
    return { rebuilt };
  }

  /**
   * Get the downline tree for a user using recursive users.referredBy traversal.
   * This builds correct parent-child nesting up to 10 levels deep.
   */
  async getDownlineTree(userId: string) {
    // Get the current user's referral code
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) return { tree: [], totalCount: 0, levels: 0 };

    const buildChildren = async (parentReferCode: string, currentLevel: number): Promise<any[]> => {
      if (currentLevel > 10) return [];

      // Find all users who were referred by this parent
      const children = await this.db
        .select({
          id: schema.users.id,
          username: schema.users.username,
          phoneNumber: schema.users.phoneNumber,
          memberStatus: schema.users.memberStatus,
          ownRefercode: schema.users.ownRefercode,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .where(eq(schema.users.referredBy, parentReferCode));

      const nodes: any[] = [];
      for (const child of children) {
        const grandchildren = await buildChildren(child.ownRefercode, currentLevel + 1);
        nodes.push({
          userId: child.id,
          username: child.username,
          phoneNumber: child.phoneNumber,
          memberStatus: child.memberStatus,
          level: currentLevel,
          joinedAt: child.createdAt.toISOString(),
          children: grandchildren,
        });
      }
      return nodes;
    };

    const tree = await buildChildren(user.ownRefercode, 1);
    const totalCount = await this.countDownline(userId);

    return {
      tree,
      totalCount,
      levels: this.getMaxLevel(tree),
    };
  }

  /**
   * Get downline members as a flat list (for display in tables)
   */
  async getDownlineMembers(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) return [];

    const members: any[] = [];

    const collectMembers = async (parentReferCode: string, currentLevel: number) => {
      if (currentLevel > 10) return;

      const children = await this.db
        .select({
          id: schema.users.id,
          username: schema.users.username,
          phoneNumber: schema.users.phoneNumber,
          memberStatus: schema.users.memberStatus,
          ownRefercode: schema.users.ownRefercode,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .where(eq(schema.users.referredBy, parentReferCode));

      for (const child of children) {
        const subCount = await this.db
          .select({ count: sql`count(*)` })
          .from(schema.referrals)
          .where(eq(schema.referrals.referrerId, child.id));

        members.push({
          userId: child.id,
          username: child.username,
          phoneNumber: child.phoneNumber,
          memberStatus: child.memberStatus,
          level: currentLevel,
          joinedAt: child.createdAt.toISOString(),
          totalDownline: Number(subCount[0]?.count || 0),
        });

        await collectMembers(child.ownRefercode, currentLevel + 1);
      }
    };

    await collectMembers(user.ownRefercode, 1);
    return members;
  }

  /**
   * Get referral stats for a user
   */
  async getStats(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) {
      return {
        totalReferrals: 0,
        level1Count: 0, level2Count: 0, level3Count: 0,
        level4Count: 0, level5Count: 0, level6To10Count: 0,
      };
    }

    const levelCounts: Record<number, number> = {};

    const countAtLevel = async (parentReferCode: string, level: number) => {
      if (level > 10) return;

      const children = await this.db
        .select({ ownRefercode: schema.users.ownRefercode })
        .from(schema.users)
        .where(eq(schema.users.referredBy, parentReferCode));

      levelCounts[level] = (levelCounts[level] || 0) + children.length;

      for (const child of children) {
        await countAtLevel(child.ownRefercode, level + 1);
      }
    };

    await countAtLevel(user.ownRefercode, 1);

    return {
      totalReferrals: Object.values(levelCounts).reduce((sum, c) => sum + c, 0),
      level1Count: levelCounts[1] || 0,
      level2Count: levelCounts[2] || 0,
      level3Count: levelCounts[3] || 0,
      level4Count: levelCounts[4] || 0,
      level5Count: levelCounts[5] || 0,
      level6To10Count: Object.entries(levelCounts)
        .filter(([k]) => parseInt(k) >= 6 && parseInt(k) <= 10)
        .reduce((sum, [, count]) => sum + count, 0),
    };
  }

  /**
   * Get the upline for a user (who referred them, and the chain up)
   */
  async getUpline(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user || !user.referredBy) return { upline: [], levels: 0 };

    const upline: { userId: string; username: string; level: number }[] = [];
    let currentReferCode: string | null = user.referredBy;
    let level = 1;

    while (currentReferCode && level <= 10) {
      const referrer = await this.db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, currentReferCode),
      });
      if (!referrer) break;

      upline.push({
        userId: referrer.id,
        username: referrer.username,
        level,
      });

      currentReferCode = referrer.referredBy || null;
      level++;
    }

    return { upline, levels: upline.length };
  }

  private async countDownline(userId: string): Promise<number> {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });
    if (!user) return 0;

    let count = 0;
    const countChildren = async (parentReferCode: string) => {
      const children = await this.db
        .select({ ownRefercode: schema.users.ownRefercode })
        .from(schema.users)
        .where(eq(schema.users.referredBy, parentReferCode));

      count += children.length;
      for (const child of children) {
        await countChildren(child.ownRefercode);
      }
    };

    await countChildren(user.ownRefercode);
    return count;
  }

  private getMaxLevel(tree: any[]): number {
    if (tree.length === 0) return 0;
    let max = 0;
    for (const node of tree) {
      if (node.level > max) max = node.level;
      if (node.children?.length > 0) {
        const childMax = this.getMaxLevel(node.children);
        if (childMax > max) max = childMax;
      }
    }
    return max;
  }
}
