import api from '@dreamy-life/api-client';

export interface VendorProfile {
  id: string;
  userId: string;
  shopName: string;
  address: string;
  bannerUrl?: string;
  paymentStatus: boolean;
  isActive: boolean;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  createdAt: string;
}

export interface VendorApplyResponse {
  paymentUrl?: string;
  vendor?: { id: string; shopName: string; isActive: boolean };
  message: string;
}

export const applyForVendor = async (data: { shopName: string; address: string; bannerUrl?: string }) => {
  const response = await api.post('/vendor/apply', data);
  return response.data;
};

export const verifyPayment = async (invoiceId: string) => {
  const response = await api.post('/vendor/payment-success', { invoiceId });
  return response.data;
};

export const getMyVendorProfile = async () => {
  const response = await api.get('/vendor/me');
  return response.data;
};

export const updateVendorBanner = async (bannerUrl: string) => {
  const response = await api.patch('/vendor/banner', { bannerUrl });
  return response.data;
};

export const getVendorPublicProfile = async (vendorId: string) => {
  const response = await api.get(`/vendor/${vendorId}`);
  return response.data;
};

export const getProductFeed = async (params?: { category?: string; search?: string; page?: number; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.set('category', params.category);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.page) queryParams.set('page', String(params.page));
  if (params?.limit) queryParams.set('limit', String(params.limit));
  const query = queryParams.toString();
  const response = await api.get(`/vendor/feed${query ? '?' + query : ''}`);
  return response.data;
};
