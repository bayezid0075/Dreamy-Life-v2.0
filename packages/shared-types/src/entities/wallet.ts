export interface Wallet {
  walletBalance: number;
  fundsBalance: number;
  pointsBalance: number;
}

export type TransactionType =
  | 'wallet_credit'
  | 'wallet_debit'
  | 'fund_credit'
  | 'fund_debit'
  | 'point_earned'
  | 'point_spent';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  description: string;
  createdAt: string;
}
