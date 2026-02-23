import { apiClient } from "./client";

export interface MobileRecharge {
  id: number;
  operator: string;
  number_type: string;
  mobile_number: string;
  amount: string;
  refid: string;
  status: string;
  trxid: string;
  api_status: string;
  api_recharge_status: string;
  api_message: string;
  created_at: string;
}

export interface RechargeCreatePayload {
  operator: string;
  number_type: string;
  mobile_number: string;
  amount: number | string;
}

export interface RechargeCreateSuccess {
  recharge: MobileRecharge;
}

export interface RechargeCreateError {
  detail: string;
  recharge?: MobileRecharge;
}

export const rechargeApi = {
  list: async (): Promise<MobileRecharge[]> => {
    const res = await apiClient.get<MobileRecharge[]>("/api/recharge/");
    return res.data;
  },

  create: async (payload: RechargeCreatePayload): Promise<MobileRecharge> => {
    try {
      const res = await apiClient.post<MobileRecharge>("/api/recharge/create/", payload);
      return res.data;
    } catch (err: unknown) {
      const ax = err as { response?: { data?: RechargeCreateError } };
      const data = ax.response?.data;
      const msg = data?.detail ?? "Recharge failed.";
      throw Object.assign(new Error(msg), { response: ax.response, detail: msg, recharge: data?.recharge });
    }
  },

  status: async (refid: string): Promise<MobileRecharge> => {
    const res = await apiClient.get<MobileRecharge>(
      `/api/recharge/status/${encodeURIComponent(refid)}/`
    );
    return res.data;
  },
};

export default rechargeApi;
