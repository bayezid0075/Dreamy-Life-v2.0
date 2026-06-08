import { useMutation } from '@tanstack/react-query';
import api from '@dreamy-life/api-client';
import { RegisterInput, LoginInput, AuthResponse } from '@dreamy-life/shared-types';

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await api.post('/auth/login', data);
      return response.data as AuthResponse;
    },
  });
};
