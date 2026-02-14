import { apiClient } from "./client";
import type { Notification } from "@/types";

const BASE = "/api/notifications";

export const notificationsApi = {
  list: async (): Promise<Notification[]> => {
    const res = await apiClient.get<Notification[]>(BASE);
    return res.data;
  },

  unreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ count: number }>(`${BASE}/unread-count/`);
    return res.data.count;
  },

  markRead: async (id: number): Promise<Notification> => {
    const res = await apiClient.post<Notification>(`${BASE}/${id}/mark-read/`);
    return res.data;
  },

  markAllRead: async (): Promise<{ marked: number }> => {
    const res = await apiClient.post<{ marked: number }>(`${BASE}/mark-all-read/`);
    return res.data;
  },
};
