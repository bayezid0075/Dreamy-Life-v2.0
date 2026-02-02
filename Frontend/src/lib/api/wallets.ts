import { apiClient } from './client';
import type { Wallet, Funds, Points } from '@/types';

export const walletsApi = {
  getWallet: async (): Promise<Wallet> => {
    const response = await apiClient.get<Wallet>('/api/wallets/');
    return response.data;
  },

  getFunds: async (): Promise<Funds> => {
    const response = await apiClient.get<Funds>('/api/wallets/funds/');
    return response.data;
  },

  getPoints: async (): Promise<Points> => {
    const response = await apiClient.get<Points>('/api/wallets/points/');
    return response.data;
  },
};

export default walletsApi;
