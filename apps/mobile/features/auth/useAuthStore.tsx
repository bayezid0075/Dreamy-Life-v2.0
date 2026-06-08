import { create } from 'zustand';
import { AuthResponse } from '@dreamy-life/shared-types';

interface AuthState {
  user: AuthResponse['user'] | null;
  token: string | null;
  setAuth: (auth: AuthResponse) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (auth) => set({ user: auth.user, token: auth.accessToken }),
  clearAuth: () => set({ user: null, token: null }),
}));
