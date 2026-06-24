import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Generic Success Response ──────────────────────────────────────────────
export class ApiSuccessResponse<TData = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: TData;

  constructor(success: boolean, data: TData) {
    this.success = success;
    this.data = data;
  }
}

// ─── Generic Error Response ────────────────────────────────────────────────
export class ApiErrorDetail {
  @ApiProperty({ example: 'BAD_REQUEST' })
  code: string;

  @ApiProperty({ example: 'Description of the error' })
  message: string;

  @ApiPropertyOptional({ example: null })
  detail?: any;
}

export class ApiErrorResponse {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty()
  error: ApiErrorDetail;
}

// ─── Health Check Response ────────────────────────────────────────────────
export class HealthCheckResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2026-06-14T12:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 'dreamy-life-backend' })
  service: string;
}

// ─── Auth Responses ────────────────────────────────────────────────────────
export class AuthUserResponse {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: '+8801712345678' })
  phoneNumber: string;

  @ApiProperty({ example: '12345678' })
  ownRefercode: string;

  @ApiProperty({ example: 'user' })
  memberStatus: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  referredBy?: string | null;
}

export class AuthDataResponse {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty()
  user: AuthUserResponse;
}

export class RegisterResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: AuthDataResponse;
}

export class LoginResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: AuthDataResponse;
}

export class RefreshDataResponse {
  @ApiProperty({ description: 'New JWT access token' })
  accessToken: string;
}

export class RefreshResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: RefreshDataResponse;
}

// ─── Profile Response ─────────────────────────────────────────────────────
class UserInfoProfile {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  fullName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  address?: string | null;

  @ApiPropertyOptional({ nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ nullable: true })
  country?: string | null;

  @ApiPropertyOptional({ nullable: true })
  dateOfBirth?: string | null;
}

class ProfileUserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  ownRefercode: string;

  @ApiProperty()
  memberStatus: string;

  @ApiProperty({ example: false })
  isVerified: boolean;

  @ApiPropertyOptional({ nullable: true })
  referredBy?: string | null;

  @ApiPropertyOptional({ type: UserInfoProfile })
  info?: UserInfoProfile;
}

class ProfileStatsResponse {
  @ApiProperty({ example: 5 })
  totalReferrals: number;

  @ApiProperty({ example: 2 })
  directReferrals: number;
}

export class ProfileDataResponse {
  @ApiProperty({ type: ProfileUserResponse })
  user: ProfileUserResponse;

  @ApiProperty({ type: ProfileStatsResponse })
  stats: ProfileStatsResponse;
}

export class ProfileResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: ProfileDataResponse })
  data: ProfileDataResponse;
}

export class LogoutResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Logged out successfully' })
  message: string;
}

// ─── Membership Responses ─────────────────────────────────────────────────
class MembershipPlanItem {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'basic' })
  name: string;

  @ApiProperty({ example: '500' })
  price: string;

  @ApiPropertyOptional({ example: 'Basic membership with starter benefits' })
  description?: string;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty({ example: [10, 5, 3, 2, 1, 0.5, 0.5, 0.5, 0.5, 0.5] })
  commissionRates: number[];

  @ApiProperty()
  createdAt: string;
}

export class PlansListResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [MembershipPlanItem] })
  data: MembershipPlanItem[];
}

class CommissionItem {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 50 })
  amount: number;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty({ example: 10 })
  percentage: number;

  @ApiProperty()
  createdAt: string;
}

class PurchaseItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  planId: string;

  @ApiProperty({ example: 500 })
  amount: number;

  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiProperty()
  createdAt: string;
}

class MyMembershipPlan {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'basic' })
  name: string;

  @ApiProperty({ example: 500 })
  price: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ example: 1 })
  level: number;
}

export class MyMembershipData {
  @ApiPropertyOptional({ type: MyMembershipPlan, nullable: true })
  currentPlan: MyMembershipPlan | null;

  @ApiProperty({ type: [MyMembershipPlan] })
  plans: MyMembershipPlan[];

  @ApiProperty({ type: [PurchaseItem] })
  purchaseHistory: any[];

  @ApiProperty({ example: 0 })
  commissionEarned: number;

  @ApiProperty({ type: [CommissionItem] })
  commissionHistory: CommissionItem[];
}

export class MyMembershipResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: MyMembershipData })
  data: MyMembershipData;
}

class CommissionDistributionItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fromUserId: string;

  @ApiProperty()
  toUserId: string;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty({ example: 50 })
  amount: number;

  @ApiProperty({ example: 10 })
  percentage: number;
}

class PurchaseMembershipData {
  @ApiProperty({ type: PurchaseItem })
  purchase: PurchaseItem;

  @ApiProperty({ type: [CommissionDistributionItem] })
  commissions: CommissionDistributionItem[];

  @ApiProperty({ example: 'basic' })
  newStatus: string;
}

export class PurchaseMembershipResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: PurchaseMembershipData })
  data: PurchaseMembershipData;
}

// ─── Wallet Responses ─────────────────────────────────────────────────────
class WalletBalance {
  @ApiProperty({ example: 45.0 })
  walletBalance: number;

  @ApiProperty({ example: 462.5 })
  fundsBalance: number;

  @ApiProperty({ example: 600.0 })
  pointsBalance: number;
}

class WalletData {
  @ApiProperty({ type: WalletBalance })
  wallet: WalletBalance;
}

export class WalletResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: WalletData })
  data: WalletData;
}

class TransactionItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ example: 'fund_credit' })
  type: string;

  @ApiProperty({ example: 100 })
  amount: number;

  @ApiProperty({ example: 'Added via bKash' })
  description: string;

  @ApiProperty()
  createdAt: string;
}

class TransactionsData {
  @ApiProperty({ type: [TransactionItem] })
  transactions: TransactionItem[];
}

export class TransactionsResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TransactionsData })
  data: TransactionsData;
}

class AddFundsData {
  @ApiProperty({ example: 562.5 })
  fundsBalance: number;
}

export class AddFundsResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AddFundsData })
  data: AddFundsData;
}

// ─── Referral Responses ───────────────────────────────────────────────────
class ReferralStatsData {
  @ApiProperty({ example: 5 })
  totalReferrals: number;

  @ApiProperty({ example: 2 })
  level1Count: number;

  @ApiProperty({ example: 2 })
  level2Count: number;

  @ApiProperty({ example: 1 })
  level3Count: number;

  @ApiProperty({ example: 0 })
  level4Count: number;

  @ApiProperty({ example: 0 })
  level5Count: number;

  @ApiProperty({ example: 0 })
  level6To10Count: number;
}

export class ReferralStatsResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: ReferralStatsData })
  data: ReferralStatsData;
}

class DownlineMember {
  @ApiProperty()
  userId: string;

  @ApiProperty({ example: 'referee1' })
  username: string;

  @ApiProperty({ example: '+8801722222222' })
  phoneNumber: string;

  @ApiProperty({ example: 'user' })
  memberStatus: string;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty()
  joinedAt: string;

  @ApiProperty({ example: 2 })
  totalDownline: number;
}

class DownlineData {
  @ApiProperty({ type: [DownlineMember] })
  members: DownlineMember[];

  @ApiProperty({ example: 5 })
  count: number;
}

export class DownlineResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DownlineData })
  data: DownlineData;
}

class DownlineTreeNode {
  @ApiProperty()
  userId: string;

  @ApiProperty({ example: 'referee1' })
  username: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  memberStatus: string;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty()
  joinedAt: string;

  @ApiProperty({ type: () => [DownlineTreeNode] })
  children: DownlineTreeNode[];
}

class DownlineTreeData {
  @ApiProperty({ type: [DownlineTreeNode] })
  tree: DownlineTreeNode[];

  @ApiProperty({ example: 5 })
  totalCount: number;

  @ApiProperty({ example: 3 })
  levels: number;
}

export class DownlineTreeResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DownlineTreeData })
  data: DownlineTreeData;
}

class UplineMember {
  @ApiProperty()
  userId: string;

  @ApiProperty({ example: 'referrer' })
  username: string;

  @ApiProperty({ example: 1 })
  level: number;
}

class UplineData {
  @ApiProperty({ type: [UplineMember] })
  upline: UplineMember[];

  @ApiProperty({ example: 2 })
  levels: number;
}

export class UplineResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UplineData })
  data: UplineData;
}

// ─── Admin Responses ───────────────────────────────────────────────────────
class AdminRecentUser {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: 'user' })
  memberStatus: string;

  @ApiProperty()
  createdAt: string;
}

class AdminRecentPurchase {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ example: '500' })
  amount: string;

  @ApiProperty({ example: 'completed' })
  status: string;

  @ApiProperty()
  createdAt: string;
}

class AdminDashboardData {
  @ApiProperty({ example: 100 })
  totalUsers: number;

  @ApiProperty({ example: 45 })
  activeUsers: number;

  @ApiProperty({ example: 30 })
  proUsers: number;

  @ApiProperty({ example: 2 })
  superAdmins: number;

  @ApiProperty({ example: 50000 })
  totalRevenue: number;

  @ApiProperty({ type: Object, example: { user: 45, basic: 15, standard: 10, smart: 5, vvip: 3, super_admin: 2 } })
  statusBreakdown: Record<string, number>;

  @ApiProperty({ type: [AdminRecentPurchase] })
  recentPurchases: AdminRecentPurchase[];

  @ApiProperty({ type: [AdminRecentUser] })
  recentUsers: AdminRecentUser[];
}

export class AdminDashboardResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminDashboardData })
  data: AdminDashboardData;
}

class AdminUserInfo {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'john_doe' })
  username: string;

  @ApiProperty({ example: '+8801712345678' })
  phoneNumber: string;

  @ApiProperty({ example: '12345678' })
  ownRefercode: string;

  @ApiPropertyOptional({ nullable: true })
  referredBy?: string | null;

  @ApiProperty({ example: 'user' })
  memberStatus: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional({ nullable: true })
  fullName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;
}

class AdminUsersData {
  @ApiProperty({ type: [AdminUserInfo] })
  users: AdminUserInfo[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class AdminUsersResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminUsersData })
  data: AdminUsersData;
}

class AdminUserDetailStats {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  ownRefercode: string;

  @ApiPropertyOptional({ nullable: true })
  referredBy?: string | null;

  @ApiProperty()
  memberStatus: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional({ nullable: true })
  fullName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  address?: string | null;

  @ApiPropertyOptional({ nullable: true })
  city?: string | null;

  @ApiPropertyOptional({ nullable: true })
  country?: string | null;

  @ApiPropertyOptional({ nullable: true })
  dateOfBirth?: string | null;

  @ApiProperty({ example: 5 })
  totalReferrals: number;

  @ApiProperty({ type: [Object] })
  purchaseHistory: any[];

  @ApiProperty({ type: [Object] })
  commissionHistory: any[];
}

export class AdminUserDetailResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminUserDetailStats })
  data: AdminUserDetailStats;
}

class AdminUpdateStatusData {
  @ApiProperty({ example: 'User status updated to basic' })
  message: string;
}

export class AdminUpdateStatusResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminUpdateStatusData })
  data: AdminUpdateStatusData;
}

class AdminDeleteData {
  @ApiProperty({ example: 'User deleted successfully' })
  message: string;
}

export class AdminDeleteResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminDeleteData })
  data: AdminDeleteData;
}

class AdminReferralStatLevel {
  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty({ example: 50 })
  count: number;
}

class AdminReferralStatsData {
  @ApiProperty({ example: 100 })
  totalReferrals: number;

  @ApiProperty({ example: 5000 })
  totalCommissions: number;

  @ApiProperty({ type: [AdminReferralStatLevel] })
  levelBreakdown: AdminReferralStatLevel[];
}

export class AdminReferralStatsResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: AdminReferralStatsData })
  data: AdminReferralStatsData;
}

class AdminReferralTreeItem {
  @ApiProperty()
  id: string;

  @ApiProperty()
  referrerId: string;

  @ApiProperty()
  referredId: string;

  @ApiProperty({ example: 1 })
  level: number;

  @ApiProperty({ example: '0.00' })
  commissionRate: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ example: 'referee1' })
  referredUsername: string;

  @ApiProperty({ example: 'user' })
  referredStatus: string;
}

export class AdminReferralTreeResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [AdminReferralTreeItem] })
  data: AdminReferralTreeItem[];
}
