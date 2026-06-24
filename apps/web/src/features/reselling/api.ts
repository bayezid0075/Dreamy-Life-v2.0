import api from '@dreamy-life/api-client';

export interface ResellerOrder {
  id: string;
  resellerId: string;
  vendorId: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  resellerPrice: number;
  vendorPrice: number;
  profit: number;
  customerAddress: string;
  paymentMethod: string;
  status: string;
  productName?: string;
  productImage?: string[];
  shopName?: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  trackingNumber?: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  shippingAddress: string;
  notes?: string;
}

export const placeResellerOrder = async (data: {
  productId: string;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  resellerPrice: number;
  customerAddress: string;
  paymentMethod: string;
}) => {
  const response = await api.post('/reselling/order', data);
  return response.data;
};

export const getMyOrders = async () => {
  const response = await api.get('/reselling/orders');
  return response.data;
};

export const getOrderDetail = async (id: string) => {
  const response = await api.get(`/reselling/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
  const response = await api.patch(`/reselling/orders/${id}/status`, { status });
  return response.data;
};

export const createShipment = async (data: {
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  shippingAddress: string;
  estimatedDelivery?: string;
  notes?: string;
}) => {
  const response = await api.post('/vendor/shipments', data);
  return response.data;
};

export const updateShipment = async (id: string, data: { status?: string; trackingNumber?: string; carrier?: string; notes?: string }) => {
  const response = await api.patch(`/vendor/shipments/${id}`, data);
  return response.data;
};

export const getShipmentTracking = async (orderId: string) => {
  const response = await api.get(`/vendor/shipments/tracking/${orderId}`);
  return response.data;
};
