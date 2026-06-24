export type MemberStatus = 'super_admin' | 'user' | 'basic' | 'standard' | 'smart' | 'vvip';

export interface User {
  id: string;
  username: string;
  phoneNumber: string;
  ownRefercode: string;
  referredBy?: string;
  memberStatus: MemberStatus;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfo {
  id: string;
  userId: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  address?: string;
  city?: string;
  country?: string;
  dateOfBirth?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  phoneNumber: string;
  ownRefercode: string;
  memberStatus: MemberStatus;
  isVerified: boolean;
  info?: UserInfo;
  totalReferrals?: number;
  totalEarnings?: number;
}
