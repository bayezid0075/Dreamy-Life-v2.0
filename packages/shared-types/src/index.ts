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
} from './entities/post';

export type {
  Referral,
  ReferralEarning,
  ReferralNode,
  ReferralTree,
  MembershipPlan,
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
