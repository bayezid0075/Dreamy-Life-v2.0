import api from '@dreamy-life/api-client';

export interface ReferralStat {
  level: number;
  count: number;
}

export interface ReferralStatsResponse {
  totalReferrals: number;
  totalCommissions: number;
  levelBreakdown: ReferralStat[];
}

export interface ReferralTreeItem {
  id: string;
  referrerId: string;
  referredId: string;
  level: number;
  commissionRate: string;
  createdAt: string;
  referredUsername: string;
  referredStatus: string;
}

export const getReferralStats = async (): Promise<ReferralStatsResponse> => {
  const response = await api.get('/admin/referrals/stats');
  return response.data.data;
};

export const getReferralTree = async (): Promise<ReferralTreeItem[]> => {
  const response = await api.get('/admin/referrals/tree');
  return response.data.data;
};
