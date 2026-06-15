import api from '@dreamy-life/api-client';

export interface AdminUser {
  id: string;
  username: string;
  phoneNumber: string;
  ownRefercode: string;
  referredBy: string | null;
  memberStatus: string;
  createdAt: string;
  updatedAt: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  dateOfBirth: string | null;
  totalReferrals?: number;
  purchaseHistory?: Array<{
    id: string;
    planId: string;
    amount: string;
    status: string;
    createdAt: string;
  }>;
  commissionHistory?: Array<{
    id: string;
    fromUserId: string;
    amount: string;
    level: number;
    percentage: string;
    createdAt: string;
  }>;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getUsers = async (
  page = 1,
  limit = 20,
  search?: string,
  status?: string,
): Promise<UsersResponse> => {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const response = await api.get(`/admin/users?${params.toString()}`);
  return response.data.data;
};

export const getUser = async (id: string): Promise<AdminUser> => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data.data;
};

export const updateUserStatus = async (id: string, memberStatus: string): Promise<void> => {
  await api.patch(`/admin/users/${id}/status`, { memberStatus });
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};
