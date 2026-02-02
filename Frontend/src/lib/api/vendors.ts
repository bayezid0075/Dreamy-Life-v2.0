import { apiClient, apiClientMultipart } from './client';
import type { Vendor, Product, ProductCreatePayload } from '@/types';

export const vendorsApi = {
  // Vendor Management
  getVendors: async (): Promise<Vendor[]> => {
    const response = await apiClient.get<Vendor[]>('/api/vendors/vendors/');
    return response.data;
  },

  getVendor: async (id: number): Promise<Vendor> => {
    const response = await apiClient.get<Vendor>(`/api/vendors/vendors/${id}/`);
    return response.data;
  },

  createVendor: async (data: FormData): Promise<Vendor> => {
    const response = await apiClientMultipart.post<Vendor>('/api/vendors/vendors/', data);
    return response.data;
  },

  updateVendor: async (id: number, data: FormData): Promise<Vendor> => {
    const response = await apiClientMultipart.patch<Vendor>(`/api/vendors/vendors/${id}/`, data);
    return response.data;
  },

  deleteVendor: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/vendors/vendors/${id}/`);
  },

  // Product Management
  getProducts: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/api/vendors/products/');
    return response.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/api/vendors/products/${id}/`);
    return response.data;
  },

  createProduct: async (data: FormData): Promise<Product> => {
    const response = await apiClientMultipart.post<Product>('/api/vendors/products/', data);
    return response.data;
  },

  updateProduct: async (id: number, data: FormData): Promise<Product> => {
    const response = await apiClientMultipart.patch<Product>(`/api/vendors/products/${id}/`, data);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/vendors/products/${id}/`);
  },
};

export default vendorsApi;
