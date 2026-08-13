import { Injectable, NotFoundException, Inject, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, like, or, desc, count, sum, asc, and, inArray } from 'drizzle-orm';
import * as schema from '../../infrastructure/database/schema';
import { PasswordService } from '../auth/domain/services/password.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminGateway } from './gateway/admin.gateway';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

@Injectable()
export class AdminService {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: NodePgDatabase<typeof schema>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly adminGateway: AdminGateway,
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
          like(schema.users.email, `%${search}%`),
          like(schema.users.phoneNumber, `%${search}%`),
        ),
        eq(schema.users.memberStatus, status),
      );
    }
    if (search) {
      return or(
        like(schema.users.username, `%${search}%`),
        like(schema.users.email, `%${search}%`),
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
        email: schema.users.email,
        phoneNumber: schema.users.phoneNumber,
        ownRefercode: schema.users.ownRefercode,
        referredBy: schema.users.referredBy,
        memberStatus: schema.users.memberStatus,
        isVerified: schema.users.isVerified,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        fullName: schema.userInfo.fullName,
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
        email: schema.users.email,
        phoneNumber: schema.users.phoneNumber,
        ownRefercode: schema.users.ownRefercode,
        referredBy: schema.users.referredBy,
        memberStatus: schema.users.memberStatus,
        isVerified: schema.users.isVerified,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
        fullName: schema.userInfo.fullName,
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

    this.adminGateway.emitUserUpdate({
      type: 'status_change',
      userId,
      username: user.username,
      newStatus: memberStatus,
      timestamp: new Date().toISOString(),
    });

    return { message: `User status updated to ${memberStatus}` };
  }

  async updateUserRefercode(userId: string, newRefercode: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new code is already taken by another user
    const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.ownRefercode, newRefercode),
    });

    if (existing && existing.id !== userId) {
      throw new ConflictException('Referral code already in use');
    }

    const oldRefercode = user.ownRefercode;

    // If the code hasn't changed, skip
    if (oldRefercode === newRefercode) {
      return { message: 'Referral code unchanged', downlineUpdated: 0 };
    }

    // Update the user's own_refercode
    await this.db
      .update(schema.users)
      .set({ ownRefercode: newRefercode, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    // Update all direct referrals: set referred_by = newRefercode where referred_by = oldRefercode
    const downlineResult = await this.db
      .update(schema.users)
      .set({ referredBy: newRefercode, updatedAt: new Date() })
      .where(eq(schema.users.referredBy, oldRefercode));

    const downlineUpdated = (downlineResult as any).rowCount || 0;

    this.adminGateway.emitUserUpdate({
      type: 'refercode_change',
      userId,
      username: user.username,
      oldRefercode,
      newRefercode,
      downlineUpdated,
      timestamp: new Date().toISOString(),
    });

    return {
      message: `Referral code updated to ${newRefercode}`,
      oldRefercode,
      newRefercode,
      downlineUpdated,
    };
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

    // Everything runs in one transaction: if any FK cleanup fails, the whole
    // deletion rolls back instead of leaving the DB half-deleted.
    await this.db.transaction(async (tx) => {
      // IDs of rows owned by this user. Other users' rows reference these
      // (likes/comments on the user's posts, bids on the user's jobs, products
      // in the user's shops, ...), so they must be removed first.
      const [
        ownedPostRows,
        ownedCommentRows,
        ownedConversationRows,
        ownedMessageRows,
        ownedNotificationRows,
        ownedJobPostRows,
        ownedVendorRows,
      ] = await Promise.all([
        tx.select({ id: schema.posts.id }).from(schema.posts).where(eq(schema.posts.authorId, userId)),
        tx.select({ id: schema.comments.id }).from(schema.comments).where(eq(schema.comments.authorId, userId)),
        tx.select({ id: schema.conversations.id }).from(schema.conversations).where(eq(schema.conversations.createdBy, userId)),
        tx.select({ id: schema.messages.id }).from(schema.messages).where(eq(schema.messages.senderId, userId)),
        tx.select({ id: schema.notifications.id }).from(schema.notifications).where(eq(schema.notifications.createdBy, userId)),
        tx.select({ id: schema.jobPosts.id }).from(schema.jobPosts).where(eq(schema.jobPosts.posterId, userId)),
        tx.select({ id: schema.vendors.id }).from(schema.vendors).where(eq(schema.vendors.userId, userId)),
      ]);

      const postIds = ownedPostRows.map((r) => r.id);
      const commentIds = ownedCommentRows.map((r) => r.id);
      const conversationIds = ownedConversationRows.map((r) => r.id);
      const messageIds = ownedMessageRows.map((r) => r.id);
      const notificationIds = ownedNotificationRows.map((r) => r.id);
      const jobPostIds = ownedJobPostRows.map((r) => r.id);
      const vendorIds = ownedVendorRows.map((r) => r.id);

      // ── Social: comment_likes → comments, post_likes → posts ──────────
      if (commentIds.length) {
        await tx.delete(schema.commentLikes).where(inArray(schema.commentLikes.commentId, commentIds));
      }
      if (postIds.length) {
        // Comments by OTHER users on the user's posts may themselves be liked
        const commentsOnPostRows = await tx
          .select({ id: schema.comments.id })
          .from(schema.comments)
          .where(inArray(schema.comments.postId, postIds));
        const commentsOnPostIds = commentsOnPostRows.map((r) => r.id);
        if (commentsOnPostIds.length) {
          await tx.delete(schema.commentLikes).where(inArray(schema.commentLikes.commentId, commentsOnPostIds));
        }
      }
      await tx.delete(schema.commentLikes).where(eq(schema.commentLikes.userId, userId));
      if (postIds.length) {
        await tx.delete(schema.postLikes).where(inArray(schema.postLikes.postId, postIds));
        await tx.delete(schema.comments).where(inArray(schema.comments.postId, postIds));
      }
      await tx.delete(schema.postLikes).where(eq(schema.postLikes.userId, userId));
      await tx.delete(schema.comments).where(eq(schema.comments.authorId, userId));
      await tx.delete(schema.posts).where(eq(schema.posts.authorId, userId));

      // ── Chat: message_reads → messages → conversation_members → conversations ──
      if (messageIds.length) {
        await tx.delete(schema.messageReads).where(inArray(schema.messageReads.messageId, messageIds));
      }
      if (conversationIds.length) {
        // Read receipts for ALL messages in the user's conversations (including
        // messages sent by other users) must go before those messages do.
        const messagesInConversationRows = await tx
          .select({ id: schema.messages.id })
          .from(schema.messages)
          .where(inArray(schema.messages.conversationId, conversationIds));
        const messagesInConversationIds = messagesInConversationRows.map((r) => r.id);
        if (messagesInConversationIds.length) {
          await tx.delete(schema.messageReads).where(inArray(schema.messageReads.messageId, messagesInConversationIds));
        }
      }
      await tx.delete(schema.messageReads).where(eq(schema.messageReads.userId, userId));
      if (conversationIds.length) {
        await tx.delete(schema.messages).where(inArray(schema.messages.conversationId, conversationIds));
        await tx.delete(schema.conversationMembers).where(inArray(schema.conversationMembers.conversationId, conversationIds));
      }
      await tx.delete(schema.messages).where(eq(schema.messages.senderId, userId));
      await tx.delete(schema.conversationMembers).where(eq(schema.conversationMembers.userId, userId));
      await tx.delete(schema.conversations).where(eq(schema.conversations.createdBy, userId));

      // ── Notifications: recipients → notifications, then templates / push tokens ──
      if (notificationIds.length) {
        await tx.delete(schema.notificationRecipients).where(inArray(schema.notificationRecipients.notificationId, notificationIds));
      }
      await tx.delete(schema.notificationRecipients).where(eq(schema.notificationRecipients.userId, userId));
      await tx.delete(schema.notifications).where(eq(schema.notifications.createdBy, userId));
      await tx.delete(schema.notificationTemplates).where(eq(schema.notificationTemplates.createdBy, userId));
      await tx.delete(schema.pushTokens).where(eq(schema.pushTokens.userId, userId));

      // ── Friends / follows ──
      await tx.delete(schema.friendRequests).where(
        or(eq(schema.friendRequests.senderId, userId), eq(schema.friendRequests.receiverId, userId)),
      );
      await tx.delete(schema.friends).where(
        or(eq(schema.friends.userId, userId), eq(schema.friends.friendId, userId)),
      );
      await tx.delete(schema.follows).where(
        or(eq(schema.follows.followerId, userId), eq(schema.follows.followingId, userId)),
      );

      // ── Marketplace: submissions/assignments/bids → escrow → job posts ──
      if (jobPostIds.length) {
        await tx.delete(schema.jobSubmissions).where(inArray(schema.jobSubmissions.jobId, jobPostIds));
        await tx.delete(schema.jobAssignments).where(inArray(schema.jobAssignments.jobId, jobPostIds));
        await tx.delete(schema.jobBids).where(inArray(schema.jobBids.jobId, jobPostIds));
        await tx.delete(schema.jobEscrow).where(inArray(schema.jobEscrow.jobId, jobPostIds));
      }
      await tx.delete(schema.jobSubmissions).where(eq(schema.jobSubmissions.workerId, userId));
      await tx.delete(schema.jobAssignments).where(eq(schema.jobAssignments.workerId, userId));
      await tx.delete(schema.jobBids).where(eq(schema.jobBids.bidderId, userId));
      await tx.delete(schema.jobEscrow).where(
        or(eq(schema.jobEscrow.posterId, userId), eq(schema.jobEscrow.releasedTo, userId)),
      );
      await tx.delete(schema.jobPosts).where(eq(schema.jobPosts.posterId, userId));

      // ── Referrals / commissions / memberships ──
      await tx.delete(schema.commissions).where(
        or(eq(schema.commissions.fromUserId, userId), eq(schema.commissions.toUserId, userId)),
      );
      await tx.delete(schema.membershipPurchases).where(eq(schema.membershipPurchases.userId, userId));
      await tx.delete(schema.membershipPayments).where(eq(schema.membershipPayments.userId, userId));
      await tx.delete(schema.referrals).where(
        or(eq(schema.referrals.referrerId, userId), eq(schema.referrals.referredId, userId)),
      );

      // ── Reseller: shipments → orders → products → vendors ──
      if (vendorIds.length) {
        await tx.delete(schema.shipments).where(inArray(schema.shipments.vendorId, vendorIds));
        await tx.delete(schema.resellerOrders).where(inArray(schema.resellerOrders.vendorId, vendorIds));
        await tx.delete(schema.products).where(inArray(schema.products.vendorId, vendorIds));
      }
      // This user's own reseller orders on other vendors' shops (with their shipments)
      const resellerOrderRows = await tx
        .select({ id: schema.resellerOrders.id })
        .from(schema.resellerOrders)
        .where(eq(schema.resellerOrders.resellerId, userId));
      const resellerOrderIds = resellerOrderRows.map((r) => r.id);
      if (resellerOrderIds.length) {
        await tx.delete(schema.shipments).where(inArray(schema.shipments.orderId, resellerOrderIds));
        await tx.delete(schema.resellerOrders).where(inArray(schema.resellerOrders.id, resellerOrderIds));
      }
      await tx.delete(schema.vendors).where(eq(schema.vendors.userId, userId));
      await tx.delete(schema.vendorPayments).where(eq(schema.vendorPayments.userId, userId));

      // ── Recharge ──
      await tx.delete(schema.rechargeCommissions).where(
        or(eq(schema.rechargeCommissions.fromUserId, userId), eq(schema.rechargeCommissions.toUserId, userId)),
      );
      await tx.delete(schema.rechargeOrders).where(eq(schema.rechargeOrders.userId, userId));

      // ── Wallets / funds / points / withdrawals ──
      await tx.delete(schema.walletTransactions).where(eq(schema.walletTransactions.userId, userId));
      await tx.delete(schema.fundTransactions).where(eq(schema.fundTransactions.userId, userId));
      await tx.delete(schema.pointTransactions).where(eq(schema.pointTransactions.userId, userId));
      await tx.delete(schema.fundPayments).where(eq(schema.fundPayments.userId, userId));
      await tx.delete(schema.withdrawals).where(eq(schema.withdrawals.userId, userId));
      await tx.delete(schema.userWallets).where(eq(schema.userWallets.userId, userId));
      await tx.delete(schema.userFunds).where(eq(schema.userFunds.userId, userId));
      await tx.delete(schema.userPoints).where(eq(schema.userPoints.userId, userId));

      // ── Profile / sessions / social earnings & withdrawals ──
      await tx.delete(schema.userInfo).where(eq(schema.userInfo.userId, userId));
      await tx.delete(schema.socialEarnings).where(eq(schema.socialEarnings.userId, userId));
      await tx.delete(schema.socialWithdrawals).where(eq(schema.socialWithdrawals.userId, userId));
      await tx.delete(schema.sessions).where(eq(schema.sessions.userId, userId));

      // ── Finally the user row itself ──
      await tx.delete(schema.users).where(eq(schema.users.id, userId));
    });

    this.adminGateway.emitUserUpdate({
      type: 'user_deleted',
      userId,
      username: user.username,
      timestamp: new Date().toISOString(),
    });

    return { message: 'User deleted successfully' };
  }

  async resetUserPassword(userId: string, newPassword: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await this.passwordService.hash(newPassword);

    await this.db
      .update(schema.users)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, userId));

    this.adminGateway.emitUserUpdate({
      type: 'password_reset',
      userId,
      username: user.username,
      timestamp: new Date().toISOString(),
    });

    return { message: `Password reset for ${user.username}` };
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

  // ─── Membership Plan Management ────────────────────────────────────────

  async getMembershipPlans() {
    const plans = await this.db
      .select()
      .from(schema.membershipPlans)
      .orderBy(asc(schema.membershipPlans.sortOrder));
    return plans;
  }

  async getMembershipPlanById(planId: string) {
    const plan = await this.db.query.membershipPlans.findFirst({
      where: eq(schema.membershipPlans.id, planId),
    });
    if (!plan) throw new NotFoundException('Membership plan not found');
    return plan;
  }

  async createMembershipPlan(data: {
    name: string;
    price: string;
    description?: string;
    level: number;
    features?: { text: string; icon: string }[];
    buttonText?: string;
    isPopular?: boolean;
    sortOrder?: number;
    colorTheme?: string;
    commissionRates?: number[];
    isActive?: boolean;
  }) {
    // Check for duplicate name
    const existing = await this.db.query.membershipPlans.findFirst({
      where: eq(schema.membershipPlans.name, data.name),
    });
    if (existing) throw new ConflictException(`Plan with name "${data.name}" already exists`);

    // Check for duplicate level
    const levelExists = await this.db.query.membershipPlans.findFirst({
      where: eq(schema.membershipPlans.level, data.level),
    });
    if (levelExists) throw new ConflictException(`Plan with level ${data.level} already exists`);

    const [plan] = await this.db
      .insert(schema.membershipPlans)
      .values({
        name: data.name,
        price: data.price,
        description: data.description,
        level: data.level,
        features: data.features || [],
        buttonText: data.buttonText || 'Choose Plan',
        isPopular: data.isPopular || false,
        sortOrder: data.sortOrder || 0,
        colorTheme: data.colorTheme || 'primary',
        commissionRates: data.commissionRates || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
      })
      .returning();

    return plan;
  }

  async updateMembershipPlan(planId: string, data: {
    name?: string;
    price?: string;
    description?: string;
    level?: number;
    features?: { text: string; icon: string }[];
    buttonText?: string;
    isPopular?: boolean;
    sortOrder?: number;
    colorTheme?: string;
    commissionRates?: number[];
    isActive?: boolean;
  }) {
    const plan = await this.db.query.membershipPlans.findFirst({
      where: eq(schema.membershipPlans.id, planId),
    });
    if (!plan) throw new NotFoundException('Membership plan not found');

    // Check duplicate name if name is being changed
    if (data.name && data.name !== plan.name) {
      const existing = await this.db.query.membershipPlans.findFirst({
        where: eq(schema.membershipPlans.name, data.name),
      });
      if (existing) throw new ConflictException(`Plan with name "${data.name}" already exists`);
    }

    // Check duplicate level if level is being changed
    if (data.level !== undefined && data.level !== plan.level) {
      const levelExists = await this.db.query.membershipPlans.findFirst({
        where: eq(schema.membershipPlans.level, data.level),
      });
      if (levelExists) throw new ConflictException(`Plan with level ${data.level} already exists`);
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.buttonText !== undefined) updateData.buttonText = data.buttonText;
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.colorTheme !== undefined) updateData.colorTheme = data.colorTheme;
    if (data.commissionRates !== undefined) updateData.commissionRates = data.commissionRates;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await this.db
      .update(schema.membershipPlans)
      .set(updateData)
      .where(eq(schema.membershipPlans.id, planId))
      .returning();

    return updated;
  }

  async deleteMembershipPlan(planId: string) {
    const plan = await this.db.query.membershipPlans.findFirst({
      where: eq(schema.membershipPlans.id, planId),
    });
    if (!plan) throw new NotFoundException('Membership plan not found');

    // Check if users are on this plan
    const usersOnPlan = await this.db
      .select({ count: count() })
      .from(schema.users)
      .where(eq(schema.users.memberStatus, plan.name));

    if (Number(usersOnPlan[0]?.count ?? 0) > 0) {
      throw new ConflictException(`Cannot delete plan: ${usersOnPlan[0].count} users are currently on this plan`);
    }

    await this.db.delete(schema.membershipPlans).where(eq(schema.membershipPlans.id, planId));
    return { message: 'Plan deleted successfully' };
  }

  async getMembershipStats() {
    const totalPurchases = await this.db
      .select({ count: count() })
      .from(schema.membershipPurchases)
      .where(eq(schema.membershipPurchases.status, 'completed'));

    const totalRevenue = await this.db
      .select({ total: sum(schema.membershipPurchases.amount) })
      .from(schema.membershipPurchases)
      .where(eq(schema.membershipPurchases.status, 'completed'));

    const planBreakdown = await this.db
      .select({
        planName: schema.membershipPlans.name,
        planId: schema.membershipPlans.id,
        price: schema.membershipPlans.price,
        purchaseCount: count(schema.membershipPurchases.id),
      })
      .from(schema.membershipPlans)
      .leftJoin(
        schema.membershipPurchases,
        eq(schema.membershipPlans.id, schema.membershipPurchases.planId),
      )
      .groupBy(schema.membershipPlans.id, schema.membershipPlans.name, schema.membershipPlans.price)
      .orderBy(asc(schema.membershipPlans.level));

    const totalCommissions = await this.db
      .select({ total: sum(schema.commissions.amount) })
      .from(schema.commissions);

    const usersByStatus = await this.db
      .select({
        status: schema.users.memberStatus,
        count: count(),
      })
      .from(schema.users)
      .groupBy(schema.users.memberStatus);

    return {
      totalPurchases: Number(totalPurchases[0]?.count ?? 0),
      totalRevenue: Number(totalRevenue[0]?.total ?? 0),
      totalCommissions: Number(totalCommissions[0]?.total ?? 0),
      planBreakdown: planBreakdown.map(p => ({
        planId: p.planId,
        planName: p.planName,
        price: Number(p.price),
        purchaseCount: Number(p.purchaseCount),
        revenue: Number(p.price) * Number(p.purchaseCount),
      })),
      usersByStatus: usersByStatus.map(u => ({
        status: u.status,
        count: Number(u.count),
      })),
    };
  }

  // ─── Vendor Management ──────────────────────────────────────────────────

  async getVendors(page = 1, limit = 20, search?: string, status?: string) {
    const offset = (page - 1) * limit;
    const conditions: any[] = [];

    if (search) {
      conditions.push(or(
        like(schema.vendors.shopName, `%${search}%`),
        like(schema.vendors.address, `%${search}%`),
      ));
    }

    if (status) {
      conditions.push(eq(schema.vendors.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let vendorsQuery = this.db
      .select({
        id: schema.vendors.id,
        userId: schema.vendors.userId,
        shopName: schema.vendors.shopName,
        address: schema.vendors.address,
        bannerUrl: schema.vendors.bannerUrl,
        paymentStatus: schema.vendors.paymentStatus,
        isActive: schema.vendors.isActive,
        status: schema.vendors.status,
        createdAt: schema.vendors.createdAt,
        updatedAt: schema.vendors.updatedAt,
        username: schema.users.username,
        phoneNumber: schema.users.phoneNumber,
      })
      .from(schema.vendors)
      .innerJoin(schema.users, eq(schema.vendors.userId, schema.users.id))
      .orderBy(desc(schema.vendors.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      vendorsQuery = vendorsQuery.where(whereClause) as any;
    }

    const vendors = await vendorsQuery;

    let totalQuery = this.db.select({ count: count() }).from(schema.vendors);
    if (whereClause) {
      totalQuery = totalQuery.where(whereClause) as any;
    }
    const totalResult = await totalQuery;
    const total = Number(totalResult[0]?.count ?? 0);

    return {
      vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getVendorById(vendorId: string) {
    const vendor = await this.db
      .select({
        id: schema.vendors.id,
        userId: schema.vendors.userId,
        shopName: schema.vendors.shopName,
        address: schema.vendors.address,
        bannerUrl: schema.vendors.bannerUrl,
        paymentStatus: schema.vendors.paymentStatus,
        isActive: schema.vendors.isActive,
        status: schema.vendors.status,
        createdAt: schema.vendors.createdAt,
        updatedAt: schema.vendors.updatedAt,
        username: schema.users.username,
        phoneNumber: schema.users.phoneNumber,
      })
      .from(schema.vendors)
      .innerJoin(schema.users, eq(schema.vendors.userId, schema.users.id))
      .where(eq(schema.vendors.id, vendorId))
      .limit(1);

    if (!vendor.length) {
      throw new NotFoundException('Vendor not found');
    }

    const productCount = await this.db
      .select({ value: count() })
      .from(schema.products)
      .where(eq(schema.products.vendorId, vendorId));

    const orderCount = await this.db
      .select({ value: count() })
      .from(schema.resellerOrders)
      .where(eq(schema.resellerOrders.vendorId, vendorId));

    return {
      ...vendor[0],
      totalProducts: Number(productCount[0]?.value) || 0,
      totalOrders: Number(orderCount[0]?.value) || 0,
    };
  }

  async updateVendorStatus(vendorId: string, status: 'active' | 'banned') {
    const vendor = await this.db.query.vendors.findFirst({
      where: eq(schema.vendors.id, vendorId),
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    await this.db
      .update(schema.vendors)
      .set({ status, isActive: status === 'active', updatedAt: new Date() })
      .where(eq(schema.vendors.id, vendorId));

    return { message: `Vendor status updated to ${status}` };
  }

  // ─── Product Management ─────────────────────────────────────────────────

  async getProducts(page = 1, limit = 20, search?: string, category?: string) {
    const offset = (page - 1) * limit;
    const conditions: any[] = [eq(schema.products.isActive, true)];

    if (search) {
      conditions.push(like(schema.products.name, `%${search}%`));
    }

    if (category) {
      conditions.push(eq(schema.products.category, category));
    }

    const whereClause = and(...conditions);

    const products = await this.db
      .select({
        id: schema.products.id,
        vendorId: schema.products.vendorId,
        name: schema.products.name,
        description: schema.products.description,
        category: schema.products.category,
        subcategory: schema.products.subcategory,
        actualPrice: schema.products.actualPrice,
        discountPrice: schema.products.discountPrice,
        stock: schema.products.stock,
        sku: schema.products.sku,
        imageUrls: schema.products.imageUrls,
        isActive: schema.products.isActive,
        createdAt: schema.products.createdAt,
        updatedAt: schema.products.updatedAt,
        shopName: schema.vendors.shopName,
        vendorUserId: schema.vendors.userId,
      })
      .from(schema.products)
      .innerJoin(schema.vendors, eq(schema.products.vendorId, schema.vendors.id))
      .where(whereClause)
      .orderBy(desc(schema.products.createdAt))
      .limit(limit)
      .offset(offset);

    let totalQuery = this.db.select({ count: count() }).from(schema.products);
    if (whereClause) {
      totalQuery = totalQuery.where(whereClause) as any;
    }
    const totalResult = await totalQuery;
    const total = Number(totalResult[0]?.count ?? 0);

    return {
      products: products.map(p => ({
        ...p,
        actualPrice: Number(p.actualPrice),
        discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(productId: string) {
    const product = await this.db
      .select({
        id: schema.products.id,
        vendorId: schema.products.vendorId,
        name: schema.products.name,
        description: schema.products.description,
        category: schema.products.category,
        subcategory: schema.products.subcategory,
        actualPrice: schema.products.actualPrice,
        discountPrice: schema.products.discountPrice,
        deliveryChargeInside: schema.products.deliveryChargeInside,
        deliveryChargeOutside: schema.products.deliveryChargeOutside,
        colors: schema.products.colors,
        sizes: schema.products.sizes,
        variantPrices: schema.products.variantPrices,
        stock: schema.products.stock,
        sku: schema.products.sku,
        imageUrls: schema.products.imageUrls,
        isActive: schema.products.isActive,
        createdAt: schema.products.createdAt,
        updatedAt: schema.products.updatedAt,
        shopName: schema.vendors.shopName,
      })
      .from(schema.products)
      .innerJoin(schema.vendors, eq(schema.products.vendorId, schema.vendors.id))
      .where(eq(schema.products.id, productId))
      .limit(1);

    if (!product.length) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...product[0],
      actualPrice: Number(product[0].actualPrice),
      discountPrice: product[0].discountPrice ? Number(product[0].discountPrice) : null,
      deliveryChargeInside: Number(product[0].deliveryChargeInside),
      deliveryChargeOutside: Number(product[0].deliveryChargeOutside),
    };
  }

  async deleteProduct(productId: string) {
    const product = await this.db.query.products.findFirst({
      where: eq(schema.products.id, productId),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.db
      .update(schema.products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.products.id, productId));

    return { message: 'Product deleted successfully' };
  }

  // ─── Admin Login ───────────────────────────────────────────────────────

  async adminLogin(email: string, accessCode: string, password: string) {
    const admin = await this.db.query.admins.findFirst({
      where: eq(schema.admins.email, email),
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check lockout
    if (admin.lockedUntil && new Date() < admin.lockedUntil) {
      const remainingMs = admin.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      throw new UnauthorizedException(
        `Account locked. Try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}.`,
      );
    }

    // Verify access code
    if (admin.accessCode !== accessCode) {
      await this.handleFailedLogin(admin.id, admin.failedAttempts);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isMatch = await this.passwordService.compare(password, admin.password);
    if (!isMatch) {
      await this.handleFailedLogin(admin.id, admin.failedAttempts);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Success — reset failed attempts
    await this.db
      .update(schema.admins)
      .set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(schema.admins.id, admin.id));

    // Generate tokens
    const accessToken = this.jwtService.sign(
      { adminId: admin.id, email: admin.email },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN') || '100y',
      },
    );

    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        accessCode: admin.accessCode,
      },
    };
  }

  private async handleFailedLogin(adminId: string, currentAttempts: number) {
    const newAttempts = currentAttempts + 1;
    const updateData: Record<string, any> = {
      failedAttempts: newAttempts,
      updatedAt: new Date(),
    };

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }

    await this.db
      .update(schema.admins)
      .set(updateData)
      .where(eq(schema.admins.id, adminId));
  }
}
