import { apiClient } from './client';
import type {
  Product,
  ShopProductsResponse,
  ShopFilters,
  Category,
  Brand,
  Vendor,
} from '@/types';

export const shopApi = {
  getProducts: async (filters?: ShopFilters): Promise<ShopProductsResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category.toString());
    if (filters?.brand) params.append('brand', filters.brand.toString());
    if (filters?.vendor) params.append('vendor', filters.vendor.toString());
    if (filters?.min_price) params.append('min_price', filters.min_price.toString());
    if (filters?.max_price) params.append('max_price', filters.max_price.toString());
    if (filters?.sort_by) params.append('sort_by', filters.sort_by);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());

    const response = await apiClient.get<ShopProductsResponse>(
      `/api/vendors/shop/products/?${params.toString()}`
    );
    return response.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/api/vendors/shop/products/${id}/`);
    return response.data;
  },

  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get<Category[]>('/api/vendors/shop/categories/');
    return response.data;
  },

  getBrands: async (): Promise<Brand[]> => {
    const response = await apiClient.get<Brand[]>('/api/vendors/shop/brands/');
    return response.data;
  },

  getVendors: async (): Promise<Vendor[]> => {
    const response = await apiClient.get<Vendor[]>('/api/vendors/shop/vendors/');
    return response.data;
  },
};

export default shopApi;
