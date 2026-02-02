'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import { usersApi } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setIsLoading, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      const accessToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('access_token')
          : null;

      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userInfo = await usersApi.getUserInfo();
        setUser(userInfo);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [setUser, setIsLoading, logout]);

  return <>{children}</>;
}
