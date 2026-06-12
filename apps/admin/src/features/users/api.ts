import api from '@dreamy-life/api-client';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  createdAt: string;
}

export const getUsers = async (): Promise<AdminUser[]> => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getUser = async (id: string): Promise<AdminUser> => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/admin/users/${id}`);
};
