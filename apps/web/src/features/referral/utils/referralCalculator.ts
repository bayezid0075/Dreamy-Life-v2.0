export interface ReferralReward {
  level: number;
  commissionPercent: number;
  earnings: number;
}

export const REFERRAL_LEVELS = [
  { level: 1, commissionPercent: 10 },
  { level: 2, commissionPercent: 5 },
  { level: 3, commissionPercent: 2.5 },
] as const;

export const calculateReferralEarnings = (
  totalDownlineAmount: number,
  level: number
): number => {
  const tier = REFERRAL_LEVELS.find((r) => r.level === level);
  if (!tier) return 0;
  return (totalDownlineAmount * tier.commissionPercent) / 100;
};

export const calculateTotalEarnings = (
  downlineByLevel: Record<number, number>
): ReferralReward[] => {
  return REFERRAL_LEVELS.map(({ level, commissionPercent }) => ({
    level,
    commissionPercent,
    earnings: calculateReferralEarnings(downlineByLevel[level] || 0, level),
  }));
};
