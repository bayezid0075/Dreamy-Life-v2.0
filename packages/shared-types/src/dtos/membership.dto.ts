import type { MembershipPlan, MembershipPurchase, CommissionDistribution } from '../entities/referral';

export interface MembershipPlanDto {
  id: string;
  name: string;
  price: number;
  description?: string;
  level: number;
}

export interface PurchaseMembershipInput {
  planId: string;
}

export interface PurchaseMembershipResponse {
  purchase: MembershipPurchase;
  commissions: CommissionDistribution[];
}

export interface CommissionHistoryDto {
  id: string;
  fromUser: string;
  fromUsername: string;
  toUserId: string;
  amount: number;
  level: number;
  percentage: number;
  createdAt: string;
  planName: string;
}

export interface MembershipResponse {
  currentPlan: MembershipPlanDto;
  plans: MembershipPlanDto[];
  purchaseHistory: MembershipPurchase[];
  commissionEarned: number;
  commissionHistory: CommissionHistoryDto[];
}
