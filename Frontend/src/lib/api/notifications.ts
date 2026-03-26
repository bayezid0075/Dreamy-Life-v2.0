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

  registerDeviceToken: async (payload: {
    token: string;
    platform?: "android" | "ios" | "web";
  }): Promise<{ detail: string; token: string; platform: string }> => {
    const res = await apiClient.post<{ detail: string; token: string; platform: string }>(
      `${BASE}/device-tokens/`,
      payload
    );
    return res.data;
  },

  unregisterDeviceToken: async (payload: { token: string; platform?: "android" | "ios" | "web" }): Promise<{ detail: string; count: number }> => {
    const res = await apiClient.delete<{ detail: string; count: number }>(`${BASE}/device-tokens/`, {
      data: payload,
    });
    return res.data;
  },
};
