import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementCount: () => void;
  decrementCount: () => void;
  resetCount: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementCount: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  resetCount: () => set({ unreadCount: 0 }),
}));
