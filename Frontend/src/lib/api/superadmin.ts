import { apiClient } from "./client";
import type {
  SuperadminAccessResponse,
  SuperadminOverviewStats,
  AdminUserListResponse,
  AdminUserListItem,
  AdminUserFilters,
  RestrictionConfigResponse,
  AccountStatus,
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
};

export function getSuperadminStreamUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (!token) return "";
  return `${base}/api/superadmin/stream/?token=${encodeURIComponent(token)}`;
}
