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

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get('/admin/stats');
  return response.data.data;
};
