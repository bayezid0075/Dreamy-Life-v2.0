import { pgTable, uuid, varchar, timestamp, text, boolean, integer, decimal, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Membership Status Enum ──────────────────────────────────────────────
export type MemberStatus = 'super_admin' | 'user' | 'basic' | 'standard' | 'smart' | 'vvip';

// ─── Users Table ─────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  phoneNumber: varchar('phone_number', { length: 20 }).notNull().unique(),
  password: text('password').notNull(),
  ownRefercode: varchar('own_refercode', { length: 8 }).notNull().unique(),
  referredBy: varchar('referred_by', { length: 8 }), // refercode of the user who referred this user
  memberStatus: varchar('member_status', { length: 20 }).notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  refercodeIdx: uniqueIndex('refercode_idx').on(table.ownRefercode),
  usernameIdx: uniqueIndex('username_idx').on(table.username),
  phoneIdx: uniqueIndex('phone_idx').on(table.phoneNumber),
}));

// ─── User Info Table ─────────────────────────────────────────────────────
export const userInfo = pgTable('user_info', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  avatarUrl: text('avatar_url'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  dateOfBirth: timestamp('date_of_birth'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Referrals Table (tracks upline / downline relationships) ───────────
export const referrals = pgTable('referrals', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  referrerId: uuid('referrer_id').references(() => users.id).notNull(),
  referredId: uuid('referred_id').references(() => users.id).notNull().unique(),
  level: integer('level').notNull(), // 1-10: direct (1) to 10 levels deep
  commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Membership Plans Table ──────────────────────────────────────────────
export const membershipPlans = pgTable('membership_plans', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // basic, standard, smart, vvip
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  level: integer('level').notNull().default(0), // 0=user, 1=basic, 2=standard, 3=smart, 4=vvip
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Membership Purchases Table ──────────────────────────────────────────
export const membershipPurchases = pgTable('membership_purchases', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  planId: uuid('plan_id').references(() => membershipPlans.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('completed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Commission Distributions Table ──────────────────────────────────────
export const commissions = pgTable('commissions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  fromUserId: uuid('from_user_id').references(() => users.id).notNull(),
  toUserId: uuid('to_user_id').references(() => users.id).notNull(),
  purchaseId: uuid('purchase_id').references(() => membershipPurchases.id).notNull(),
  level: integer('level').notNull(), // which level upline (1-10)
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Wallets Table (one per user, tracks all 3 balances) ──────────────────
export const wallets = pgTable('wallets', {
  userId: uuid('user_id').references(() => users.id).primaryKey(),
  walletBalance: decimal('wallet_balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  fundsBalance: decimal('funds_balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  pointsBalance: decimal('points_balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Transactions Table (all financial movements) ─────────────────────────
export const transactions = pgTable('transactions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // wallet_credit, wallet_debit, fund_credit, fund_debit, point_earned, point_spent
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Notifications Table ────────────────────────────────────────────────
export const notifications = pgTable('notifications', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  icon: varchar('icon', { length: 50 }),
  type: varchar('type', { length: 20 }).notNull().default('broadcast'), // broadcast, targeted
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, scheduled, sent
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  totalRecipients: integer('total_recipients').notNull().default(0),
  totalSent: integer('total_sent').notNull().default(0),
  totalRead: integer('total_read').notNull().default(0),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Notification Recipients Table ──────────────────────────────────────
export const notificationRecipients = pgTable('notification_recipients', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  notificationId: uuid('notification_id').references(() => notifications.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sent: boolean('sent').notNull().default(false),
  read: boolean('read').notNull().default(false),
  sentAt: timestamp('sent_at'),
  readAt: timestamp('read_at'),
});

// ─── Push Tokens Table ──────────────────────────────────────────────────
export const pushTokens = pgTable('push_tokens', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  platform: varchar('platform', { length: 10 }).notNull(), // web, android, ios
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Notification Templates Table ───────────────────────────────────────
export const notificationTemplates = pgTable('notification_templates', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  icon: varchar('icon', { length: 50 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Posts Table ──────────────────────────────────────────────────────
export const posts = pgTable('posts', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  mediaUrls: text('media_urls').array().default([]),
  likesCount: integer('likes_count').notNull().default(0),
  commentsCount: integer('comments_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Post Likes Table ────────────────────────────────────────────────
export const postLikes = pgTable('post_likes', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  postId: uuid('post_id').references(() => posts.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  postUserIdx: uniqueIndex('post_user_idx').on(table.postId, table.userId),
}));

// ─── Comments Table ──────────────────────────────────────────────────
export const comments = pgTable('comments', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  postId: uuid('post_id').references(() => posts.id).notNull(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Follows Table ───────────────────────────────────────────────────
export const follows = pgTable('follows', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  followerId: uuid('follower_id').references(() => users.id).notNull(),
  followingId: uuid('following_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  followerFollowingIdx: uniqueIndex('follower_following_idx').on(table.followerId, table.followingId),
}));

// ─── Old Tables (kept for reference, to be removed after migration) ──────
export const sessions = pgTable('sessions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
