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
  hydrated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  hydrated: false,

  setAuth: (token: string, user: AuthUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('authUser', JSON.stringify(user));
    }
    set({ accessToken: token, user, isAuthenticated: true });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
    }
    set({ accessToken: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('authUser');
      const user = userStr ? JSON.parse(userStr) : null;
      if (token) {
        set({ accessToken: token, user, isAuthenticated: true, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    }
  },
}));
