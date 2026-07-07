import { pgTable, uuid, varchar, timestamp, text, boolean, integer, decimal, uniqueIndex, index, jsonb } from 'drizzle-orm/pg-core';
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
  isVerified: boolean('is_verified').notNull().default(false), // true after first membership purchase
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
  bio: text('bio'),
  coverImage: text('cover_image'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  fatherName: varchar('father_name', { length: 255 }),
  motherName: varchar('mother_name', { length: 255 }),
  preferredLanguage: varchar('preferred_language', { length: 5 }).default('en'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Referrals Table (tracks upline / downline relationships) ───────────
export const referrals = pgTable('referrals', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  referrerId: uuid('referrer_id').references(() => users.id).notNull(),
  referredId: uuid('referred_id').references(() => users.id).notNull(),
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
  features: jsonb('features').default([]), // [{ text: string, icon: string }]
  buttonText: varchar('button_text', { length: 100 }).default('Choose Plan'),
  isPopular: boolean('is_popular').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  colorTheme: varchar('color_theme', { length: 30 }).default('primary'), // primary, tertiary, secondary
  commissionRates: jsonb('commission_rates').default([]), // [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5] - 10 levels
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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

// ─── User Wallet (earnings - commissions, app payments - WITHDRAWABLE) ────
export const userWallets = pgTable('user_wallets', {
  userId: uuid('user_id').references(() => users.id).primaryKey(),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── User Funds (deposited money for purchases, recharges, job posting) ───
export const userFunds = pgTable('user_funds', {
  userId: uuid('user_id').references(() => users.id).primaryKey(),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── User Points (rewards for app actions) ────────────────────────────────
export const userPoints = pgTable('user_points', {
  userId: uuid('user_id').references(() => users.id).primaryKey(),
  balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Wallet Transactions (earnings history) ───────────────────────────────
export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Fund Transactions (spending history) ─────────────────────────────────
export const fundTransactions = pgTable('fund_transactions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Point Transactions (rewards history) ─────────────────────────────────
export const pointTransactions = pgTable('point_transactions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
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
  imageUrl: text('image_url'),
  link: text('link'),
  type: varchar('type', { length: 20 }).notNull().default('broadcast'), // broadcast, targeted
  category: varchar('category', { length: 20 }).notNull().default('app'), // social, app
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
  parentCommentId: uuid('parent_comment_id'),
  content: text('content').notNull(),
  likesCount: integer('likes_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Comment Likes Table ────────────────────────────────────────────
export const commentLikes = pgTable('comment_likes', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  commentId: uuid('comment_id').references(() => comments.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  commentUserIdx: uniqueIndex('comment_user_idx').on(table.commentId, table.userId),
}));

// ─── Friend Requests Table ──────────────────────────────────────────
export const friendRequests = pgTable('friend_requests', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  senderReceiverIdx: uniqueIndex('sender_receiver_idx').on(table.senderId, table.receiverId),
}));

// ─── Friends Table ──────────────────────────────────────────────────
export const friends = pgTable('friends', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  friendId: uuid('friend_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userFriendIdx: uniqueIndex('user_friend_idx').on(table.userId, table.friendId),
}));

// ─── Follows Table ───────────────────────────────────────────────────
export const follows = pgTable('follows', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  followerId: uuid('follower_id').references(() => users.id).notNull(),
  followingId: uuid('following_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  followerFollowingIdx: uniqueIndex('follower_following_idx').on(table.followerId, table.followingId),
}));

// ─── Conversations Table ─────────────────────────────────────────────
export const conversations = pgTable('conversations', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  type: varchar('type', { length: 20 }).notNull().default('direct'),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Conversation Members Table ──────────────────────────────────────
export const conversationMembers = pgTable('conversation_members', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  lastReadAt: timestamp('last_read_at').defaultNow(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
}, (table) => ({
  convUserIdx: uniqueIndex('conv_user_idx').on(table.conversationId, table.userId),
}));

// ─── Messages Table ──────────────────────────────────────────────────
export const messages = pgTable('messages', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  content: text('content'),
  mediaUrl: text('media_url'),
  mediaType: varchar('media_type', { length: 50 }),
  replyTo: uuid('reply_to'),
  isEdited: boolean('is_edited').notNull().default(false),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Message Reads Table ────────────────────────────────────────────
export const messageReads = pgTable('message_reads', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  messageId: uuid('message_id').references(() => messages.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  readAt: timestamp('read_at').defaultNow().notNull(),
}, (table) => ({
  msgUserIdx: uniqueIndex('msg_user_idx').on(table.messageId, table.userId),
}));

// ─── Vendors Table ──────────────────────────────────────────────────────
export const vendors = pgTable('vendors', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  shopName: varchar('shop_name', { length: 255 }).notNull(),
  address: text('address').notNull(),
  bannerUrl: text('banner_url'),
  paymentStatus: boolean('payment_status').notNull().default(false),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  vendorUserIdIdx: uniqueIndex('vendor_user_id_idx').on(table.userId),
}));

// ─── Products Table ─────────────────────────────────────────────────────
export const products = pgTable('products', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  actualPrice: decimal('actual_price', { precision: 12, scale: 2 }).notNull(),
  discountPrice: decimal('discount_price', { precision: 12, scale: 2 }),
  deliveryArea: varchar('delivery_area', { length: 20 }).notNull().default('inside_dhaka'),
  deliveryChargeInside: decimal('delivery_charge_inside', { precision: 12, scale: 2 }).notNull().default('0'),
  deliveryChargeOutside: decimal('delivery_charge_outside', { precision: 12, scale: 2 }).notNull().default('0'),
  colors: text('colors').array().default([]),
  sizes: text('sizes').array().default([]),
  variantPrices: jsonb('variant_prices').default({}),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  stock: integer('stock').notNull().default(0),
  sku: varchar('sku', { length: 50 }).notNull().unique(),
  imageUrls: text('image_urls').array().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  productSkuIdx: uniqueIndex('product_sku_idx').on(table.sku),
}));

// ─── Reseller Orders Table ──────────────────────────────────────────────
export const resellerOrders = pgTable('reseller_orders', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  resellerId: uuid('reseller_id').references(() => users.id).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  customerAltPhone: varchar('customer_alt_phone', { length: 20 }),
  resellerPrice: decimal('reseller_price', { precision: 12, scale: 2 }).notNull(),
  vendorPrice: decimal('vendor_price', { precision: 12, scale: 2 }).notNull(),
  profit: decimal('profit', { precision: 12, scale: 2 }).notNull(),
  customerAddress: text('customer_address').notNull(),
  paymentMethod: varchar('payment_method', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Shipments Table ────────────────────────────────────────────────────
export const shipments = pgTable('shipments', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  orderId: uuid('order_id').references(() => resellerOrders.id).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  trackingNumber: varchar('tracking_number', { length: 100 }).unique(),
  carrier: varchar('carrier', { length: 50 }).notNull().default('self'),
  status: varchar('status', { length: 30 }).notNull().default('pending'),
  estimatedDelivery: timestamp('estimated_delivery'),
  deliveredAt: timestamp('delivered_at'),
  shippingAddress: text('shipping_address').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Vendor Payments Table (UddoktaPay records) ────────────────────────
export const vendorPayments = pgTable('vendor_payments', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  invoiceId: varchar('invoice_id', { length: 255 }).notNull().unique(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 12, scale: 2 }).default('0.00'),
  chargedAmount: decimal('charged_amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  senderNumber: varchar('sender_number', { length: 30 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  metadata: jsonb('metadata'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  paymentInvoiceIdx: uniqueIndex('payment_invoice_idx').on(table.invoiceId),
}));

// ─── Membership Payments Table (UddoktaPay membership purchase records) ──
export const membershipPayments = pgTable('membership_payments', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  planId: uuid('plan_id').references(() => membershipPlans.id).notNull(),
  invoiceId: varchar('invoice_id', { length: 255 }).notNull().unique(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 12, scale: 2 }).default('0.00'),
  chargedAmount: decimal('charged_amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  senderNumber: varchar('sender_number', { length: 30 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  metadata: jsonb('metadata'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  membershipPaymentInvoiceIdx: uniqueIndex('membership_payment_invoice_idx').on(table.invoiceId),
  membershipPaymentUserIdIdx: index('membership_payment_user_id_idx').on(table.userId),
}));

// ─── Fund Payments Table (UddoktaPay fund addition records) ─────────────
export const fundPayments = pgTable('fund_payments', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  invoiceId: varchar('invoice_id', { length: 255 }).notNull().unique(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  fee: decimal('fee', { precision: 12, scale: 2 }).default('0.00'),
  chargedAmount: decimal('charged_amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  senderNumber: varchar('sender_number', { length: 30 }),
  transactionId: varchar('transaction_id', { length: 255 }),
  metadata: jsonb('metadata'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  fundPaymentInvoiceIdx: uniqueIndex('fund_payment_invoice_idx').on(table.invoiceId),
  fundPaymentUserIdIdx: index('fund_payment_user_id_idx').on(table.userId),
}));

// ─── Marketplace: Job Posts Table ────────────────────────────────────────
export const jobPosts = pgTable('job_posts', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  posterId: uuid('poster_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'single' or 'multiple'
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  unitPay: decimal('unit_pay', { precision: 12, scale: 2 }).notNull(),
  totalUnits: integer('total_units').notNull().default(1),
  filledUnits: integer('filled_units').notNull().default(0),
  status: varchar('status', { length: 20 }).notNull().default('pending_approval'),
  // pending_approval, active, in_progress, completed, cancelled, rejected
  adminApproved: boolean('admin_approved').notNull().default(false),
  mediaUrls: text('media_urls').array().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  jobPosterIdx: index('job_poster_idx').on(table.posterId),
  jobStatusIdx: index('job_status_idx').on(table.status),
}));

// ─── Marketplace: Job Bids Table (single-unit jobs) ─────────────────────
export const jobBids = pgTable('job_bids', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  jobId: uuid('job_id').references(() => jobPosts.id).notNull(),
  bidderId: uuid('bidder_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // pending, accepted, rejected, cancelled
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  bidJobIdx: index('bid_job_idx').on(table.jobId),
  bidBidderIdx: index('bid_bidder_idx').on(table.bidderId),
  bidJobBidderIdx: uniqueIndex('bid_job_bidder_idx').on(table.jobId, table.bidderId),
}));

// ─── Marketplace: Job Assignments Table (multi-unit jobs) ────────────────
export const jobAssignments = pgTable('job_assignments', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  jobId: uuid('job_id').references(() => jobPosts.id).notNull(),
  workerId: uuid('worker_id').references(() => users.id).notNull(),
  units: integer('units').notNull().default(1),
  status: varchar('status', { length: 20 }).notNull().default('assigned'),
  // assigned, in_progress, submitted, approved, rejected
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  assignmentJobIdx: index('assignment_job_idx').on(table.jobId),
  assignmentWorkerIdx: index('assignment_worker_idx').on(table.workerId),
}));

// ─── Marketplace: Job Submissions Table ─────────────────────────────────
export const jobSubmissions = pgTable('job_submissions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  jobId: uuid('job_id').references(() => jobPosts.id).notNull(),
  assignmentId: uuid('assignment_id').references(() => jobAssignments.id),
  bidId: uuid('bid_id').references(() => jobBids.id),
  workerId: uuid('worker_id').references(() => users.id).notNull(),
  proof: text('proof').notNull(),
  proofMediaUrls: text('proof_media_urls').array().default([]),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // pending, approved, rejected
  posterComment: text('poster_comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  submissionJobIdx: index('submission_job_idx').on(table.jobId),
  submissionWorkerIdx: index('submission_worker_idx').on(table.workerId),
}));

// ─── Marketplace: Job Escrow Table ──────────────────────────────────────
export const jobEscrow = pgTable('job_escrow', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  jobId: uuid('job_id').references(() => jobPosts.id).notNull().unique(),
  posterId: uuid('poster_id').references(() => users.id).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('held'),
  // held, released, refunded
  releasedTo: uuid('released_to').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  escrowJobIdx: uniqueIndex('escrow_job_idx').on(table.jobId),
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

// ─── Mobile Recharge: Orders Table ─────────────────────────────────────
export const rechargeOrders = pgTable('recharge_orders', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  phoneNumber: varchar('phone_number', { length: 15 }).notNull(),
  operator: varchar('operator', { length: 10 }).notNull(), // GP, BL, RB, AT, TT, ST
  connectionType: varchar('connection_type', { length: 10 }).notNull().default('prepaid'), // prepaid, postpaid
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, processing, success, failed
  apiTransactionId: varchar('api_transaction_id', { length: 100 }),
  apiResponse: text('api_response'),
  userCommission: decimal('user_commission', { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  rechargeUserIdx: index('recharge_user_idx').on(table.userId),
  rechargeStatusIdx: index('recharge_status_idx').on(table.status),
}));

// ─── Mobile Recharge: Commission Distribution Table ────────────────────
export const rechargeCommissions = pgTable('recharge_commissions', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  rechargeOrderId: uuid('recharge_order_id').references(() => rechargeOrders.id).notNull(),
  fromUserId: uuid('from_user_id').references(() => users.id).notNull(),
  toUserId: uuid('to_user_id').references(() => users.id).notNull(),
  level: integer('level').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Mobile Recharge: Config Table (singleton) ────────────────────────
export const rechargeConfig = pgTable('recharge_config', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  apiKey: varchar('api_key', { length: 255 }).notNull().default(''),
  apiSecret: varchar('api_secret', { length: 255 }).notNull().default(''),
  apiBaseUrl: varchar('api_base_url', { length: 255 }).notNull().default('http://118.179.129.98/myportal/api/rechargeapi'),
  userCommissionRate: decimal('user_commission_rate', { precision: 5, scale: 2 }).notNull().default('2.00'),
  commissionRates: jsonb('commission_rates').notNull().default([2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1]),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
