import { create } from 'zustand';

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
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: (token: string, user: AuthUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
    set({ accessToken: token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        set({ accessToken: token, isAuthenticated: true });
      }
    }
  },
}));
