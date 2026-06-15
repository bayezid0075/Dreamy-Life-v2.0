-- Migration: Wallet system - wallets and transactions tables

-- ─── Wallets Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  wallet_balance DECIMAL(12, 2) NOT NULL DEFAULT '0.00',
  funds_balance DECIMAL(12, 2) NOT NULL DEFAULT '0.00',
  points_balance DECIMAL(12, 2) NOT NULL DEFAULT '0.00',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Transactions Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);
