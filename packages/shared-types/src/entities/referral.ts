import type { UserProfile, MemberStatus } from './user';
export type { MemberStatus };

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  level: number;
  commissionRate: string;
  createdAt: string;
}

export interface ReferralEarning {
  id: string;
  fromUserId: string;
  toUserId: string;
  purchaseId: string;
  amount: number;
  level: number;
  percentage: number;
  createdAt: string;
}

export interface ReferralNode {
  userId: string;
  username: string;
  phoneNumber: string;
  memberStatus: MemberStatus;
  level: number;
  joinedAt: string;
  children: ReferralNode[];
}

export interface ReferralTree {
  userId: string;
  username: string;
  ownRefercode: string;
  level: number;
  children: ReferralNode[];
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  description?: string;
  level: number;
}

export interface MembershipPurchase {
  id: string;
  userId: string;
  planId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export interface CommissionDistribution {
  id: string;
  fromUserId: string;
  toUserId: string;
  purchaseId: string;
  level: number;
  amount: number;
  percentage: number;
  createdAt: string;
}
