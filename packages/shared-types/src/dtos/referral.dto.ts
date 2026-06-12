import type { ReferralNode, MemberStatus } from '../entities/referral';

export interface ReferralStatsDto {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  level4Count: number;
  level5Count: number;
  level6To10Count: number;
}

export interface ReferralLinkDto {
  code: string;
  url: string;
}

export interface ReferralEarningDto {
  id: string;
  fromUser: string;
  amount: number;
  level: number;
  createdAt: string;
}

export interface DownlineMemberDto {
  userId: string;
  username: string;
  phoneNumber: string;
  memberStatus: MemberStatus;
  level: number;
  joinedAt: string;
  totalDownline: number;
}

export interface DownlineResponseDto {
  tree: ReferralNode[];
  totalCount: number;
  levels: number;
}
