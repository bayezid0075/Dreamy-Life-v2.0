import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, desc, asc, sql } from 'drizzle-orm';
import * as schema from '../../../../infrastructure/database/schema';

@Injectable()
export class ReferralService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  /**
   * Build the referral tree when a new user registers with a referral code.
   * Traces up to 10 levels up the chain.
   */
  async buildReferralTree(newUserId: string, referCode: string): Promise<void> {
    // Find the referrer
    const directReferrer = await this.db.query.users.findFirst({
      where: eq(schema.users.ownRefercode, referCode),
    });

    if (!directReferrer) return;

    // Level 1: direct referral
    await this.db.insert(schema.referrals).values({
      referrerId: directReferrer.id,
      referredId: newUserId,
      level: 1,
      commissionRate: '0.00',
    });

    // Now trace up the chain (levels 2-10)
    let currentReferrerId = directReferrer.id;
    let currentReferrer = directReferrer;

    for (let level = 2; level <= 10; level++) {
      if (!currentReferrer.referredBy) break;

      const uplineUser = await this.db.query.users.findFirst({
        where: eq(schema.users.ownRefercode, currentReferrer.referredBy),
      });

      if (!uplineUser) break;

      // Insert referral relationship for this level
      await this.db.insert(schema.referrals).values({
        referrerId: uplineUser.id,
        referredId: newUserId,
        level,
        commissionRate: '0.00',
      });

      currentReferrer = uplineUser;
      currentReferrerId = uplineUser.id;
    }
  }

  /**
   * Get the downline tree for a user (all users they referred, up to 10 levels deep)
   */
  async getDownlineTree(userId: string) {
    // Get all referrals where this user is the referrer
    const referrals = await this.db
      .select()
      .from(schema.referrals)
      .where(eq(schema.referrals.referrerId, userId))
      .orderBy(asc(schema.referrals.level));

    // Get details for all referred users
    const referredIds = referrals.map(r => r.referredId);
    const userDetails = await Promise.all(
      referredIds.map(id =>
        this.db.query.users.findFirst({ where: eq(schema.users.id, id) }),
      ),
    );

    // Build tree structure
    const buildNode = (level: number): any[] => {
      return referrals
        .filter(r => r.level === level)
        .map(r => {
          const user = userDetails.find(u => u?.id === r.referredId);
          return user
            ? {
                userId: user.id,
                username: user.username,
                phoneNumber: user.phoneNumber,
                memberStatus: user.memberStatus,
                level,
                joinedAt: user.createdAt.toISOString(),
                children: buildNode(level + 1), // recursively get children
              }
            : null;
        })
        .filter(Boolean);
    };

    const tree = buildNode(1);

    return {
      tree,
      totalCount: referrals.length,
      levels: Math.max(...referrals.map(r => r.level), 0),
    };
  }

  /**
   * Get referral stats for a user
   */
  async getStats(userId: string) {
    const referrals = await this.db
      .select()
      .from(schema.referrals)
      .where(eq(schema.referrals.referrerId, userId));

    const levelCounts: Record<number, number> = {};
    for (const r of referrals) {
      levelCounts[r.level] = (levelCounts[r.level] || 0) + 1;
    }

    return {
      totalReferrals: referrals.length,
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

  /**
   * Get downline members as a flat list (for display in tables)
   */
  async getDownlineMembers(userId: string) {
    const referrals = await this.db
      .select()
      .from(schema.referrals)
      .where(eq(schema.referrals.referrerId, userId))
      .orderBy(asc(schema.referrals.level));

    const members = await Promise.all(
      referrals.map(async (r) => {
        const user = await this.db.query.users.findFirst({
          where: eq(schema.users.id, r.referredId),
        });
        if (!user) return null;

        // Count how many people this user has referred
        const subCount = await this.db
          .select({ count: sql`count(*)` })
          .from(schema.referrals)
          .where(eq(schema.referrals.referrerId, user.id));

        return {
          userId: user.id,
          username: user.username,
          phoneNumber: user.phoneNumber,
          memberStatus: user.memberStatus,
          level: r.level,
          joinedAt: user.createdAt.toISOString(),
          totalDownline: Number(subCount[0]?.count || 0),
        };
      }),
    );

    return members.filter(Boolean);
  }
}
