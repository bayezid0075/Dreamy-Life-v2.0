import type { UserProfile, MemberStatus } from '../entities/user';

export interface RegisterInput {
  username: string;
  phoneNumber: string;
  password: string;
  referCode?: string; // optional referral code from another user
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    phoneNumber: string;
    ownRefercode: string;
    memberStatus: MemberStatus;
    referredBy?: string;
  };
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface UserProfileResponse {
  user: UserProfile;
  stats: {
    totalReferrals: number;
    totalEarnings: number;
    directReferrals: number;
  };
}
