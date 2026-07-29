import api from '@dreamy-life/api-client';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  superAdmins: number;
  totalRevenue: number;
  statusBreakdown: Record<string, number>;
  recentPurchases: Array<{
    id: string;
    userId: string;
    amount: string;
    status: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    username: string;
    memberStatus: string;
    createdAt: string;
  }>;
}

export interface VisitorStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byPlatform: Array<{ platform: string; count: number }>;
  daily: Array<{ date: string; count: number }>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/admin/stats');
  return response.data.data;
};

export const getVisitorStats = async (): Promise<VisitorStats> => {
  const response = await api.get('/admin/visitors');
  return response.data.data;
};
