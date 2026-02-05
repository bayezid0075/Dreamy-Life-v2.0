import { apiClient } from './client';
import type { UserInfo, UserInfoUpdatePayload, DownlinesResponse, AccountStatusResponse } from '@/types';

export const usersApi = {
  getAccountStatus: async (): Promise<AccountStatusResponse> => {
    const response = await apiClient.get<AccountStatusResponse>('/api/users/account-status/');
    return response.data;
  },

  getUserInfo: async (): Promise<UserInfo> => {
    const response = await apiClient.get<UserInfo>('/api/users/userinfo/');
    return response.data;
  },

  updateUserInfo: async (data: UserInfoUpdatePayload): Promise<UserInfo> => {
    const response = await apiClient.post<UserInfo>('/api/users/userinfo/', data);
    return response.data;
  },

  getDownlines: async (): Promise<DownlinesResponse> => {
    const response = await apiClient.get<DownlinesResponse>('/api/users/downlines/');
    return response.data;
  },
};

export default usersApi;
