import { apiClient } from './client';
import type {
  AuthTokens,
  LoginCredentials,
  RegisterData,
  RegisterResponse,
} from '@/types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/api/users/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/api/users/register/', data);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ detail: string; account_exists: boolean }> => {
    const response = await apiClient.post('/api/users/password-reset/request/', { email });
    return response.data;
  },

  verifyResetToken: async (token: string): Promise<{ detail: string; valid: boolean }> => {
    const response = await apiClient.post('/api/users/password-reset/verify/', { token });
    return response.data;
  },

  resetPassword: async (
    token: string,
    new_password: string,
    confirm_password: string
  ): Promise<{ detail: string }> => {
    const response = await apiClient.post('/api/users/password-reset/reset/', {
      token,
      new_password,
      confirm_password,
    });
    return response.data;
  },

  refreshToken: async (refresh: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/api/token/refresh/', { refresh });
    return response.data;
  },
};

export default authApi;
