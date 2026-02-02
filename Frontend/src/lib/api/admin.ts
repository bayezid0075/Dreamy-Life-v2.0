import { apiClient } from './client';
import type {
  AdminDashboardStats,
  AdminUserListResponse,
  AdminUserFilters,
  AdminUserListItem,
} from '@/types';

export const adminApi = {
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get<AdminDashboardStats>('/api/admin/dashboard/stats/');
    return response.data;
  },

  getUsers: async (filters?: AdminUserFilters): Promise<AdminUserListResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.is_staff !== undefined) params.append('is_staff', filters.is_staff.toString());
    if (filters?.member_status) params.append('member_status', filters.member_status);
    if (filters?.ordering) params.append('ordering', filters.ordering);
    if (filters?.page) params.append('page', filters.page.toString());

    const response = await apiClient.get<AdminUserListResponse>(
      `/api/admin/users/?${params.toString()}`
    );
    return response.data;
  },

  getUser: async (id: number): Promise<AdminUserListItem> => {
    const response = await apiClient.get<AdminUserListItem>(`/api/admin/users/${id}/`);
    return response.data;
  },

  createUser: async (data: {
    username: string;
    email: string;
    phone_number: string;
    password: string;
    is_active?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    referred_by?: number;
  }): Promise<AdminUserListItem> => {
    const response = await apiClient.post<AdminUserListItem>('/api/admin/users/', data);
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
      referred_by: number;
    }>
  ): Promise<AdminUserListItem> => {
    const response = await apiClient.patch<AdminUserListItem>(`/api/admin/users/${id}/`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/admin/users/${id}/`);
  },
};

export default adminApi;
