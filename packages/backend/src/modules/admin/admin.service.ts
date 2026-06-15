import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, like, or, desc, count, sum } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';

@Injectable()
export class AdminService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getDashboardStats() {
    const totalUsersResult = await this.db
      .select({ count: count() })
      .from(schema.users);

    const totalUsers = Number(totalUsersResult[0]?.count ?? 0);

    const statusCounts = await this.db
      .select({
        status: schema.users.memberStatus,
        count: count(),
      })
      .from(schema.users)
      .groupBy(schema.users.memberStatus);

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = Number(row.count);
    }

    const revenueResult = await this.db
      .select({ total: sum(schema.membershipPurchases.amount) })
      .from(schema.membershipPurchases)
      .where(eq(schema.membershipPurchases.status, 'completed'));

    const totalRevenue = Number(revenueResult[0]?.total ?? 0);

    const recentPurchases = await this.db
      .select({
        id: schema.membershipPurchases.id,
        userId: schema.membershipPurchases.userId,
        amount: schema.membershipPurchases.amount,
        status: schema.membershipPurchases.status,
        createdAt: schema.membershipPurchases.createdAt,
      })
      .from(schema.membershipPurchases)
      .orderBy(desc(schema.membershipPurchases.createdAt))
      .limit(5);

    const recentUsers = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        memberStatus: schema.users.memberStatus,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(5);

    return {
      totalUsers,
      activeUsers: statusMap['user'] ?? 0,
      proUsers: (statusMap['basic'] ?? 0) + (statusMap['standard'] ?? 0) + (statusMap['smart'] ?? 0) + (statusMap['vvip'] ?? 0),
      superAdmins: statusMap['super_admin'] ?? 0,
      totalRevenue,
      statusBreakdown: statusMap,
      recentPurchases,
      recentUsers,
    };
  }

  private buildUserSearchCondition(search?: string, status?: string) {
    if (search && status) {
      return or(
        or(
          like(schema.users.username, `%${search}%`),
          like(schema.users.phoneNumber, `%${search}%`),
        ),
        eq(schema.users.memberStatus, status),
      );
    }
    if (search) {
      return or(
        like(schema.users.username, `%${search}%`),
        like(schema.users.phoneNumber, `%${search}%`),
      );
    }
    if (status) {
      return eq(schema.users.memberStatus, status);
    }
    return undefined;
  }

  async getUsers(page = 1, limit = 20, search?: string, status?: string) {
    const offset = (page - 1) * limit;
    const whereClause = this.buildUserSearchCondition(search, status);

    const usersQuery = this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        phoneNumber: schema.users.phoneNumber,
        ownRefercode: schema.users.ownRefercode,
        referredBy: schema.users.referredBy,
        memberStatus: schema.users.memberStatus,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        fullName: schema.userInfo.fullName,
        email: schema.userInfo.email,
        avatarUrl: schema.userInfo.avatarUrl,
      })
      .from(schema.users)
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .orderBy(desc(schema.users.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      usersQuery.where(whereClause);
    }

    const users = await usersQuery;

    const totalQuery = this.db.select({ count: count() }).from(schema.users);
    if (whereClause) {
      totalQuery.where(whereClause);
    }
    const totalResult = await totalQuery;
    const total = Number(totalResult[0]?.count ?? 0);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(userId: string) {
    const user = await this.db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        phoneNumber: schema.users.phoneNumber,
        ownRefercode: schema.users.ownRefercode,
        referredBy: schema.users.referredBy,
        memberStatus: schema.users.memberStatus,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        fullName: schema.userInfo.fullName,
        email: schema.userInfo.email,
        avatarUrl: schema.userInfo.avatarUrl,
        address: schema.userInfo.address,
        city: schema.userInfo.city,
        country: schema.userInfo.country,
        dateOfBirth: schema.userInfo.dateOfBirth,
      })
      .from(schema.users)
      .leftJoin(schema.userInfo, eq(schema.users.id, schema.userInfo.userId))
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user.length) {
      throw new NotFoundException('User not found');
    }

    const referralCount = await this.db
      .select({ count: count() })
      .from(schema.referrals)
      .where(eq(schema.referrals.referrerId, userId));

    const purchaseHistory = await this.db
      .select()
      .from(schema.membershipPurchases)
      .where(eq(schema.membershipPurchases.userId, userId))
      .orderBy(desc(schema.membershipPurchases.createdAt))
      .limit(20);

    const commissionHistory = await this.db
      .select()
      .from(schema.commissions)
      .where(eq(schema.commissions.toUserId, userId))
      .orderBy(desc(schema.commissions.createdAt))
      .limit(20);

    return {
      ...user[0],
      totalReferrals: Number(referralCount[0]?.count ?? 0),
      purchaseHistory,
      commissionHistory,
    };
  }

  async updateUserStatus(userId: string, memberStatus: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.db
      .update(schema.users)
      .set({ memberStatus, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    return { message: `User status updated to ${memberStatus}` };
  }

  async deleteUser(userId: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.memberStatus === 'super_admin') {
      throw new NotFoundException('Cannot delete super admin users');
    }

    await this.db.delete(schema.commissions).where(
      or(
        eq(schema.commissions.fromUserId, userId),
        eq(schema.commissions.toUserId, userId),
      ),
    );
    await this.db.delete(schema.membershipPurchases).where(
      eq(schema.membershipPurchases.userId, userId),
    );
    await this.db.delete(schema.referrals).where(
      or(
        eq(schema.referrals.referrerId, userId),
        eq(schema.referrals.referredId, userId),
      ),
    );
    await this.db.delete(schema.userInfo).where(eq(schema.userInfo.userId, userId));
    await this.db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
    await this.db.delete(schema.users).where(eq(schema.users.id, userId));

    return { message: 'User deleted successfully' };
  }

  async getReferralStats() {
    const totalReferrals = await this.db.select({ count: count() }).from(schema.referrals);

    const levelCounts = await this.db
      .select({
        level: schema.referrals.level,
        count: count(),
      })
      .from(schema.referrals)
      .groupBy(schema.referrals.level);

    const totalCommissions = await this.db
      .select({ total: sum(schema.commissions.amount) })
      .from(schema.commissions);

    return {
      totalReferrals: Number(totalReferrals[0]?.count ?? 0),
      totalCommissions: Number(totalCommissions[0]?.total ?? 0),
      levelBreakdown: levelCounts.map((r) => ({ level: r.level, count: Number(r.count) })),
    };
  }

  async getReferralTree() {
    const referrals = await this.db
      .select({
        id: schema.referrals.id,
        referrerId: schema.referrals.referrerId,
        referredId: schema.referrals.referredId,
        level: schema.referrals.level,
        commissionRate: schema.referrals.commissionRate,
        createdAt: schema.referrals.createdAt,
        referredUsername: schema.users.username,
        referredStatus: schema.users.memberStatus,
      })
      .from(schema.referrals)
      .innerJoin(schema.users, eq(schema.referrals.referredId, schema.users.id))
      .orderBy(schema.referrals.level);

    return referrals;
  }
}
