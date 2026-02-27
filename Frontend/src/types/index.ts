// User Types
export type AccountStatus = "active" | "hold" | "ban" | "inactive";

export interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active?: boolean;
  account_status?: AccountStatus;
  referred_by?: number | null;
  referred_by_username?: string | null;
  referred_by_refercode?: string | null;
  created_at?: string;
  updated_at?: string;
  last_login?: string | null;
}

export interface AccountStatusResponse {
  account_status: AccountStatus;
  restricted_areas: string[];
  message: string | null;
  is_verified?: boolean;
  member_status?: string;
}

export const RESTRICTABLE_AREAS = [
  "wallet",
  "withdrawals",
  "shop",
  "profile_edit",
  "membership",
  "referrals",
] as const;

export type RestrictableArea = (typeof RESTRICTABLE_AREAS)[number];

export const MEMBER_STATUS_KEYS = [
  "user",
  "Basic",
  "Standard",
  "Smart",
  "VVIP",
] as const;
export type MemberStatusKey = (typeof MEMBER_STATUS_KEYS)[number];

export interface RestrictionConfigResponse {
  config: {
    hold: string[];
    ban: string[];
    inactive: string[];
    unverified_restricted_areas?: string[];
    member_status_allowed_areas?: Record<string, string[]>;
  };
  restrictable_areas: string[];
  member_status_keys?: string[];
}

export interface UserInfo {
  id: number;
  user: User;
  own_refercode: string;
  level: number;
  member_status: "user" | "Basic" | "Standard" | "Smart" | "VVIP";
  profile_picture: string | null;
  is_verified: boolean;
  address: string | null;
  nid_or_brid: string | null;
  profession: string | null;
  blood_group: string | null;
  gender: string | null;
  marital_status: string | null;
  father_name: string | null;
  mother_name: string | null;
  working_place: string | null;
  created_at: string;
  updated_at: string;
  active_membership: ActiveMembership | null;
}

export interface ActiveMembership {
  name: string;
  purchased_at: string;
  is_active: boolean;
}

export interface UserInfoUpdatePayload {
  profile_picture?: string;
  address?: string;
  nid_or_brid?: string;
  profession?: string;
  blood_group?: string;
  gender?: string;
  marital_status?: string;
  father_name?: string;
  mother_name?: string;
  working_place?: string;
}

// Auth Types
export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  phone_number: string;
  password: string;
  referred_by?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  detail: string;
  user_id: number;
  username: string;
  email: string;
  referral_code: string;
}

// Membership Types
export interface Membership {
  id: number;
  name: string;
  price: string;
  description: string;
  created_at: string;
}

export interface MembershipPurchase {
  id: number;
  user: number;
  membership: Membership;
  purchased_at: string;
  is_active: boolean;
}

export interface PaymentCreateResponse {
  payment_url: string;
  message: string;
}

export interface PaymentVerifyResponse {
  status: "success" | "pending";
  message: string;
  membership?: string;
  transaction_id?: string;
}

// Wallet Types
export interface Transaction {
  id: number;
  amount: string;
  transaction_type: "credit" | "debit";
  description: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  balance: string;
  reserved_balance?: string;
  available_balance?: string;
  transactions: Transaction[];
  income: string;
  expense: string;
}

export interface Funds {
  id: number;
  balance: string;
  transactions: Transaction[];
  income: string;
  expense: string;
}

export interface Points {
  id: number;
  balance: string;
  transactions: Transaction[];
  income: string;
  expense: string;
}

// Withdrawals
export type WithdrawalMethod = "bkash";
export type WithdrawalStatus = "pending" | "accepted" | "rejected" | "finished";

export interface WithdrawalRequest {
  id: number;
  user: number;
  user_username: string;
  user_email: string;
  amount: string;
  fee: string;
  total_debit: string;
  method: WithdrawalMethod;
  receiver_phone: string;
  status: WithdrawalStatus;
  created_at: string;
  updated_at: string;
  decided_by: number | null;
  decided_by_email: string | null;
  decided_at: string | null;
  finished_by: number | null;
  finished_by_email: string | null;
  finished_at: string | null;
  admin_note: string;
}

// Referral Types
export interface Downline {
  user_id: number;
  username: string;
  phone_number: string;
  email: string;
  level: number;
  own_refercode: string;
  is_verified: boolean;
  member_status: "user" | "Basic" | "Standard" | "Smart" | "VVIP";
  profile_picture: string | null;
  joined_at: string | null;
}

export interface DownlinesResponse {
  downlines: Downline[];
}

export interface LevelStats {
  level: number;
  count: number;
  verified: number;
  unverified: number;
}

// Vendor Types
export type VendorStatus = "active" | "hold" | "ban";

export interface Vendor {
  id: number;
  user: number;
  user_id: number;
  user_username: string;
  user_email?: string;
  shop_name: string;
  address: string;
  banner_image: string;
  member_status: string;
  payment_status: boolean;
  vendor_status?: VendorStatus;
  created_at: string;
  products_count: number;
  orders_count?: number;
}

export interface VendorCreatePayload {
  shop_name: string;
  address: string;
  banner_image?: File;
}

// Product Types
export interface ProductImage {
  id: number;
  image: string;
}

export interface Product {
  id: number;
  vendor?: number;
  vendor_id?: number;
  vendor_name?: string;
  title: string;
  description: string;
  sku: string;
  category: number | null;
  category_name?: string;
  sub_categories: number[] | string[];
  brand: number | null;
  brand_name?: string;
  tags: string[];
  price: string;
  discount_price: string | null;
  effective_price?: string;
  discount_percentage?: string;
  reseller_mrp_price: string | null;
  delivery_charge_inside_dhaka: string | null;
  delivery_charge_outside_dhaka: string | null;
  vat: string;
  images: ProductImage[];
  created_at: string;
}

export interface ProductCreatePayload {
  title: string;
  description: string;
  sku: string;
  category: number;
  sub_categories?: number[];
  brand?: number;
  tags?: string[];
  price: string;
  discount_price?: string;
  reseller_mrp_price?: string;
  delivery_charge_inside_dhaka?: string;
  delivery_charge_outside_dhaka?: string;
  vat?: string;
  images?: File[];
}

export interface Category {
  id: number;
  name: string;
  subcategories: SubCategory[];
}

export interface SubCategory {
  id: number;
  name: string;
}

export interface Brand {
  id: number;
  name: string;
}

// Order Types
export interface OrderItem {
  id: number;
  product: number;
  product_title: string;
  product_sku: string;
  product_image: string | null;
  quantity: number;
  unit_price: string;
  reseller_unit_price: string | null;
  subtotal: string;
}

export interface Order {
  id: number;
  order_number: string;
  user: number;
  user_username: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_area: "inside_dhaka" | "outside_dhaka";
  subtotal: string;
  delivery_charge: string;
  vat_amount: string;
  total_amount: string;
  reseller_price_applied: boolean;
  reseller_price_total: string | null;
  order_status:
    | "placed"
    | "confirmed"
    | "packed"
    | "shipping"
    | "shipped"
    | "received"
    | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method?: "wallet" | "mobile_banking" | "cash_on_delivery";
  amount_paid_at_placement?: string;
  due_amount?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
  reseller_price?: string;
}

export type PaymentMethod = "wallet" | "mobile_banking" | "cash_on_delivery";

export interface OrderCreatePayload {
  items: OrderItemPayload[];
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_area: "inside_dhaka" | "outside_dhaka";
  apply_reseller_price?: boolean;
  payment_method: PaymentMethod;
  delivery_payment_method?: "wallet"; // for cash_on_delivery: pay delivery charge via wallet
}

// Shop Types
export interface ShopProductsResponse {
  results: Product[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ShopFilters {
  search?: string;
  category?: number;
  brand?: number;
  vendor?: number;
  min_price?: number;
  max_price?: number;
  sort_by?: "created_at" | "price_asc" | "price_desc" | "name";
  page?: number;
  page_size?: number;
}

// Admin Types
export interface AdminDashboardStats {
  total_users: number;
  active_users: number;
  staff_users: number;
  total_vendors: number;
  total_products: number;
  total_memberships: number;
  recent_users: {
    id: number;
    username: string;
    email: string;
    created_at: string;
  }[];
}

// Superadmin Types
export interface SuperadminAccessResponse {
  allowed: boolean;
  email: string;
  reason: string | null;
}

export interface SuperadminOverviewStats {
  total_users: number;
  active_users: number;
  staff_users: number;
  total_vendors: number;
  total_products: number;
  total_memberships: number;
  total_wallet_balance: string;
  recent_users: {
    id: number;
    username: string;
    email: string;
    created_at: string;
    is_active: boolean;
  }[];
}

export interface AdminUserListItem extends User {
  info: UserInfo;
  downlines_count: number;
  active_membership: ActiveMembership | null;
}

export interface AdminUserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUserListItem[];
}

export interface AdminUserFilters {
  search?: string;
  is_active?: boolean;
  is_staff?: boolean;
  member_status?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// Notification Types
export type NotificationSource =
  | "system"
  | "admin"
  | "order"
  | "referral"
  | "wallet"
  | "membership"
  | "transaction";

export interface Notification {
  id: number;
  user?: number;
  title: string;
  message: string;
  image: string | null;
  link: string | null;
  source: NotificationSource;
  is_read: boolean;
  created_at: string;
}

// API Response Types
export interface ApiError {
  detail?: string;
  [key: string]: string | string[] | undefined;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
