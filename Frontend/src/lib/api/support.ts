import { apiClient } from "./client";
import type { SupportConversation, SupportMessage } from "@/types";

const BASE = "/api/support";

export const supportApi = {
  listConversations: async (guestEmail?: string): Promise<SupportConversation[]> => {
    const url = guestEmail ? `${BASE}/conversations/?guest_email=${encodeURIComponent(guestEmail)}` : `${BASE}/conversations/`;
    const res = await apiClient.get<SupportConversation[]>(url);
    return res.data;
  },

  createConversation: async (payload: {
    guest_email?: string;
    guest_name?: string;
    message: string;
  }): Promise<SupportConversation> => {
    const res = await apiClient.post<SupportConversation>(`${BASE}/conversations/`, payload);
    return res.data;
  },

  getConversation: async (id: number, guestEmail?: string): Promise<SupportConversation> => {
    const url = guestEmail
      ? `${BASE}/conversations/${id}/?guest_email=${encodeURIComponent(guestEmail)}`
      : `${BASE}/conversations/${id}/`;
    const res = await apiClient.get<SupportConversation>(url);
    return res.data;
  },

  sendMessage: async (
    conversationId: number,
    payload: { message: string; guest_email?: string }
  ): Promise<SupportMessage> => {
    const res = await apiClient.post<SupportMessage>(`${BASE}/conversations/${conversationId}/`, payload);
    return res.data;
  },
};
