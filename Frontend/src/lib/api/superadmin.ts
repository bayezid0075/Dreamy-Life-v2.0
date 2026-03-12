import { apiClient } from "./client";
import type {
  SuperadminAccessResponse,
  SuperadminOverviewStats,
  AdminUserListResponse,
  AdminUserListItem,
  AdminUserFilters,
  RestrictionConfigResponse,
  AccountStatus,
  Vendor,
  Order,
  SupportConversation,
} from "@/types";

export const superadminApi = {
  checkAccess: async (): Promise<SuperadminAccessResponse> => {
    const response = await apiClient.get<SuperadminAccessResponse>(
      "/api/superadmin/access/"
    );
    return response.data;
  },

  getOverview: async (): Promise<SuperadminOverviewStats> => {
    const response = await apiClient.get<SuperadminOverviewStats>(
      "/api/superadmin/overview/"
    );
    return response.data;
  },

  getUsers: async (
    filters?: AdminUserFilters
  ): Promise<AdminUserListResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.is_active !== undefined)
      params.append("is_active", filters.is_active.toString());
    if (filters?.is_staff !== undefined)
      params.append("is_staff", filters.is_staff.toString());
    if (filters?.member_status)
      params.append("member_status", filters.member_status);
    if (filters?.ordering)
      params.append("ordering", filters.ordering ?? "-created_at");
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.page_size)
      params.append("page_size", (filters.page_size ?? 20).toString());

    const response = await apiClient.get<AdminUserListResponse>(
      `/api/superadmin/users/?${params.toString()}`
    );
    return response.data;
  },

  getUser: async (id: number): Promise<AdminUserListItem> => {
    const response = await apiClient.get<AdminUserListItem>(
      `/api/superadmin/users/${id}/`
    );
    return response.data;
  },

  updateUser: async (
    id: number,
    data: Partial<{
      username: string;
      email: string;
      phone_number: string;
      password: string;
      is_active: boolean;
      is_staff: boolean;
      is_superuser: boolean;
      account_status: AccountStatus;
      referred_by: number;
      info: Record<string, unknown>;
    }>
  ): Promise<AdminUserListItem> => {
    const response = await apiClient.patch<AdminUserListItem>(
      `/api/superadmin/users/${id}/`,
      data
    );
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/superadmin/users/${id}/`);
  },

  getRestrictionConfig: async (): Promise<RestrictionConfigResponse> => {
    const response = await apiClient.get<RestrictionConfigResponse>(
      "/api/superadmin/settings/restrictions/"
    );
    return response.data;
  },

  updateRestrictionConfig: async (
    config: RestrictionConfigResponse["config"]
  ): Promise<{ config: RestrictionConfigResponse["config"] }> => {
    const response = await apiClient.put<{ config: RestrictionConfigResponse["config"] }>(
      "/api/superadmin/settings/restrictions/",
      { config }
    );
    return response.data;
  },

  // Vendors (superadmin)
  getVendors: async (): Promise<Vendor[]> => {
    const response = await apiClient.get<Vendor[]>(
      "/api/superadmin/vendors/"
    );
    return response.data;
  },

  getVendor: async (id: number): Promise<Vendor & { orders_count?: number }> => {
    const response = await apiClient.get<Vendor & { orders_count?: number }>(
      `/api/superadmin/vendors/${id}/`
    );
    return response.data;
  },

  updateVendorStatus: async (
    id: number,
    vendor_status: "active" | "hold" | "ban"
  ): Promise<Vendor> => {
    const response = await apiClient.patch<Vendor>(
      `/api/superadmin/vendors/${id}/`,
      { vendor_status }
    );
    return response.data;
  },

  // Orders (superadmin)
  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>(
      "/api/superadmin/orders/"
    );
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(
      `/api/superadmin/orders/${id}/`
    );
    return response.data;
  },

  updateOrderStatus: async (
    id: number,
    order_status: Order["order_status"]
  ): Promise<Order> => {
    const response = await apiClient.patch<Order>(
      `/api/superadmin/orders/${id}/`,
      { order_status }
    );
    return response.data;
  },

  pushNotification: async (payload: {
    title: string;
    message: string;
    image?: string;
    link?: string;
  }): Promise<{ detail: string; count: number }> => {
    const response = await apiClient.post<{ detail: string; count: number }>(
      "/api/superadmin/push-notification/",
      payload
    );
    return response.data;
  },

  // Support (superadmin)
  getSupportConversations: async (): Promise<SupportConversation[]> => {
    const response = await apiClient.get<SupportConversation[]>("/api/superadmin/support/conversations/");
    return response.data;
  },

  getSupportConversation: async (id: number): Promise<SupportConversation> => {
    const response = await apiClient.get<SupportConversation>(`/api/superadmin/support/conversations/${id}/`);
    return response.data;
  },

  replySupportConversation: async (id: number, message: string): Promise<void> => {
    await apiClient.post(`/api/superadmin/support/conversations/${id}/`, { message });
  },
};

export function getSuperadminStreamUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8888";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) return "";
  return `${base}/api/superadmin/stream/?token=${encodeURIComponent(token)}`;
}
