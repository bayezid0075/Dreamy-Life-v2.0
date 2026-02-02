import { apiClient } from './client';
import type { Order, OrderCreatePayload } from '@/types';

export const ordersApi = {
  createOrder: async (data: OrderCreatePayload): Promise<Order> => {
    const response = await apiClient.post<Order>('/api/vendors/orders/', data);
    return response.data;
  },

  getOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<Order[]>('/api/vendors/orders/list/');
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await apiClient.get<Order>(`/api/vendors/orders/${id}/`);
    return response.data;
  },
};

export default ordersApi;
