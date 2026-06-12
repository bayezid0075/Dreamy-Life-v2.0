import api from '@dreamy-life/api-client';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  revenue: number;
  dailyActiveUsers: number;
  newUsersToday: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/admin/stats');
  return response.data;
};
