import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export interface AuthUser {
  id: string;
  username: string;
  phoneNumber: string;
  ownRefercode: string;
  memberStatus: string;
  referredBy?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => {
    AsyncStorage.setItem('accessToken', accessToken);
    AsyncStorage.setItem('refreshToken', refreshToken);
    AsyncStorage.setItem('authUser', JSON.stringify(user));
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  clearAuth: () => {
    AsyncStorage.removeItem('accessToken');
    AsyncStorage.removeItem('refreshToken');
    AsyncStorage.removeItem('authUser');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const userStr = await AsyncStorage.getItem('authUser');
      const user = userStr ? JSON.parse(userStr) : null;
      if (token && refreshToken) {
        set({ accessToken: token, refreshToken, user, isAuthenticated: true, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  logout: async () => {
    const { accessToken, refreshToken } = get();
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Best-effort: clear locally even if backend call fails
    }
    get().clearAuth();
  },
}));
