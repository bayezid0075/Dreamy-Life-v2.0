import api from '@dreamy-life/api-client';

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  actualPrice: number;
  discountPrice?: number;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  colors: string[];
  sizes: string[];
  variantPrices: Record<string, { price: number }>;
  stock: number;
  sku: string;
  imageUrls: string[];
  isActive: boolean;
  shopName?: string;
  createdAt: string;
}

export interface ProductWithVendor extends Product {
  vendorUserId: string;
}

export const getMyProducts = async () => {
  const response = await api.get('/vendor/products');
  return response.data;
};

export const createProduct = async (data: {
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  actualPrice: number;
  discountPrice?: number;
  deliveryChargeInside?: number;
  deliveryChargeOutside?: number;
  colors?: string[];
  sizes?: string[];
  variantPrices?: Record<string, { price: number }>;
  stock: number;
  sku?: string;
  imageUrls?: string[];
}) => {
  const response = await api.post('/vendor/products', data);
  return response.data;
};

export const updateProduct = async (id: string, data: {
  name?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  actualPrice?: number;
  discountPrice?: number;
  deliveryChargeInside?: number;
  deliveryChargeOutside?: number;
  colors?: string[];
  sizes?: string[];
  variantPrices?: Record<string, { price: number }>;
  stock?: number;
  sku?: string;
  imageUrls?: string[];
}) => {
  const response = await api.patch(`/vendor/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await api.delete(`/vendor/products/${id}`);
  return response.data;
};

export const getProductDetail = async (id: string) => {
  const response = await api.get(`/vendor/products/detail/${id}`);
  return response.data;
};
