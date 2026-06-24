import api from '@dreamy-life/api-client';

export interface FundPayment {
  id: string;
  userId: string;
  username: string;
  invoiceId: string;
  amount: number;
  fee: number;
  chargedAmount: number;
  paymentMethod: string | null;
  senderNumber: string | null;
  transactionId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FundPaymentsResponse {
  payments: FundPayment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FundStats {
  totalCollected: number;
  todayCollected: number;
  uniquePayers: number;
  recentPayments: Array<{
    id: string;
    userId: string;
    username: string;
    amount: number;
    status: string;
    paymentMethod: string | null;
    createdAt: string;
  }>;
}

export const getFundPayments = async (
  page = 1,
  limit = 20,
  filter?: string,
  search?: string,
): Promise<FundPaymentsResponse> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filter) params.set('filter', filter);
  if (search) params.set('search', search);

  const response = await api.get(`/admin/fund-payments?${params.toString()}`);
  return response.data.data;
};

export const getFundStats = async (): Promise<FundStats> => {
  const response = await api.get('/admin/fund-stats');
  return response.data.data;
};
