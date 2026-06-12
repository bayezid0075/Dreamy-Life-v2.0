import api from '@dreamy-life/api-client';

export interface ReferralNode {
  userId: string;
  name: string;
  email: string;
  level: number;
  earnings: number;
  children: ReferralNode[];
}

export const getReferralTree = async (): Promise<ReferralNode[]> => {
  const response = await api.get('/admin/referrals/tree');
  return response.data;
};

export const getReferralStats = async () => {
  const response = await api.get('/admin/referrals/stats');
  return response.data;
};
