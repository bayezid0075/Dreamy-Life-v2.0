import type { Wallet, Transaction } from '../entities/wallet';

export interface WalletBalanceResponse {
  wallet: Wallet;
}

export interface TransactionListResponse {
  transactions: Transaction[];
}

export interface AddFundsInput {
  amount: number;
}

export interface GetTransactionsQuery {
  type?: 'all' | 'wallet' | 'funds' | 'points';
  filter?: 'today' | 'yesterday' | '7d' | '15d' | '30d' | 'all';
}
