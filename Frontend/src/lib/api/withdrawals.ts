import { apiClient } from "./client";
import type {
  WithdrawalRequest,
  WithdrawalMethod,
  WithdrawalStatus,
} from "@/types";

export const withdrawalsApi = {
  createWithdrawal: async (data: {
    amount: number | string;
    method: WithdrawalMethod;
    receiver_phone: string;
  }): Promise<WithdrawalRequest> => {
    const response = await apiClient.post<WithdrawalRequest>(
      "/api/wallets/withdrawals/",
      data,
    );
    return response.data;
  },

  getMyWithdrawals: async (): Promise<WithdrawalRequest[]> => {
    const response = await apiClient.get<WithdrawalRequest[]>(
      "/api/wallets/withdrawals/history/",
    );
    return response.data;
  },
};

export const superadminWithdrawalsApi = {
  list: async (filters?: {
    status?: WithdrawalStatus;
  }): Promise<WithdrawalRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    const qs = params.toString();
    const response = await apiClient.get<WithdrawalRequest[]>(
      `/api/superadmin/withdrawals/${qs ? `?${qs}` : ""}`,
    );
    return response.data;
  },

  act: async (
    id: number,
    data: { action: "accept" | "reject" | "finish"; admin_note?: string },
  ): Promise<WithdrawalRequest> => {
    const response = await apiClient.patch<WithdrawalRequest>(
      `/api/superadmin/withdrawals/${id}/`,
      data,
    );
    return response.data;
  },
};
