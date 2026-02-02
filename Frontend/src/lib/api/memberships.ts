import { apiClient } from './client';
import type { Membership, PaymentCreateResponse, PaymentVerifyResponse } from '@/types';

export const membershipsApi = {
  getMemberships: async (): Promise<Membership[]> => {
    const response = await apiClient.get<Membership[]>('/api/memberships/');
    return response.data;
  },

  purchaseMembership: async (membership_id: number): Promise<{ message: string; membership: string }> => {
    const response = await apiClient.post('/api/memberships/purchase/', { membership_id });
    return response.data;
  },

  createPayment: async (membership_id: number): Promise<PaymentCreateResponse> => {
    const response = await apiClient.post<PaymentCreateResponse>('/api/memberships/payment/create/', {
      membership_id,
    });
    return response.data;
  },

  verifyPayment: async (transaction_id: string): Promise<PaymentVerifyResponse> => {
    const response = await apiClient.post<PaymentVerifyResponse>('/api/memberships/payment/verify/', {
      transaction_id,
    });
    return response.data;
  },
};

export default membershipsApi;
