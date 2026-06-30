// ---------- Entity Exports ----------
export type {
  User,
  UserInfo,
  UserProfile,
  MemberStatus,
} from './entities/user';

export type {
  Post,
  PostCreateInput,
  PostLike,
  FriendRequest,
  FriendRequestWithUser,
  Friend,
  FriendWithUser,
  FriendshipStatus,
} from './entities/post';

export type {
  Referral,
  ReferralEarning,
  ReferralNode,
  ReferralTree,
  MembershipPlan,
  MembershipPlanFeature,
  MembershipPurchase,
  CommissionDistribution,
} from './entities/referral';

// ---------- DTO Exports ----------
export type {
  RegisterInput,
  LoginInput,
  AuthResponse,
  RefreshTokenInput,
  RefreshTokenResponse,
  UserProfileResponse,
} from './dtos/auth.dto';

export type {
  MembershipPlanDto,
  MembershipPlanFeature as MembershipPlanFeatureDto,
  PurchaseMembershipInput,
  PurchaseMembershipResponse,
  CommissionHistoryDto,
  MembershipResponse,
} from './dtos/membership.dto';

export type {
  CreatePostDto,
  UpdatePostDto,
  PostResponseDto,
  PostListResponseDto,
  FriendRequestDto,
  FriendDto,
  FriendListResponse,
  FriendRequestListResponse,
  FriendshipStatusResponse,
} from './dtos/post.dto';

export type {
  ReferralStatsDto,
  ReferralLinkDto,
  ReferralEarningDto,
  DownlineMemberDto,
  DownlineResponseDto,
} from './dtos/referral.dto';

export type {
  Wallet,
  Transaction,
  TransactionType,
} from './entities/wallet';

export type {
  WalletBalanceResponse,
  TransactionListResponse,
  AddFundsInput,
  GetTransactionsQuery,
} from './dtos/wallet.dto';

export type {
  Notification,
  NotificationRecipient,
  PushToken,
  NotificationTemplate,
  UserNotification,
  NotificationListResponse,
  UserNotificationListResponse,
  NotificationStats,
  DeliveryStats,
} from './entities/notification';

// ---------- Chat Entity Exports ----------
export type {
  Conversation,
  ConversationMember,
  Message,
  MessageRead,
  ChatUser,
  ConversationWithDetails,
  MessageWithSender,
} from './entities/chat';

// ---------- Chat DTO Exports ----------
export type {
  CreateConversationDto,
  SendMessageDto,
  ConversationListResponse,
  MessageListResponse,
} from './dtos/chat.dto';

// ---------- Vendor Entity Exports ----------
export type {
  Vendor,
  Product,
  ResellerOrder,
  ResellerOrderStatus,
  PaymentMethod,
  ShipmentStatus,
  Shipment,
  VendorPayment,
  VendorWithStats,
  ProductWithVendor,
  ResellerOrderWithDetails,
} from './entities/vendor';

// ---------- Vendor DTO Exports ----------
export type {
  CreateVendorDto,
  UpdateVendorBannerDto,
  CreateProductDto,
  UpdateProductDto,
  CreateResellerOrderDto,
  UpdateOrderStatusDto,
  CreateShipmentDto,
  UpdateShipmentDto,
  VendorApplyResponse,
  ProductFeedQuery,
  ResellerOrderResponse,
  OrderTrackingResponse,
} from './dtos/vendor.dto';

// ---------- Marketplace Entity Exports ----------
export type {
  JobType,
  JobStatus,
  BidStatus,
  AssignmentStatus,
  SubmissionStatus,
  EscrowStatus,
  JobPost,
  JobPostWithPoster,
  JobBid,
  JobBidWithBidder,
  JobAssignment,
  JobAssignmentWithWorker,
  JobSubmission,
  JobSubmissionWithWorker,
  JobEscrow,
  JobDashboard,
} from './entities/marketplace';

// ---------- Marketplace DTO Exports ----------
export type {
  CreateJobDto,
  PlaceBidDto,
  SubmitWorkDto,
  JobListQuery,
  AdminUpdateUnitsDto,
  JobPostResponse,
  JobListResponse,
  BidListResponse,
  SubmissionListResponse,
} from './dtos/marketplace.dto';
