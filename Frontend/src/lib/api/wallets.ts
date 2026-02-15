import { apiClient } from './client';
import type { Wallet, Funds, Points } from '@/types';

export interface AddFundsCreateResponse {
  payment_url: string;
  message?: string;
}

export interface AddFundsVerifyResponse {
  status: 'success' | 'failed';
  message?: string;
  amount?: string;
}

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

  createAddFundsPayment: async (amount: number): Promise<AddFundsCreateResponse> => {
    const response = await apiClient.post<AddFundsCreateResponse>(
      '/api/wallets/funds/add/payment/create/',
      { amount }
    );
    return response.data;
  },

  verifyAddFundsPayment: async (invoice_id: string): Promise<AddFundsVerifyResponse> => {
    const response = await apiClient.post<AddFundsVerifyResponse>(
      '/api/wallets/funds/add/payment/verify/',
      { invoice_id }
    );
    return response.data;
  },
};

export default walletsApi;
