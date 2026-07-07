-- Migration: Separate wallet, funds, points into independent tables
-- This migration splits the single `wallets` table into 3 balance tables
-- and the single `transactions` table into 3 transaction tables.

-- Step 1: Create new balance tables
CREATE TABLE IF NOT EXISTS user_wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance DECIMAL(12, 2) NOT NULL DEFAULT '0.00',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_funds (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance DECIMAL(12, 2) NOT NULL DEFAULT '0.00',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance DECIMAL(12, 2) NOT NULL DEFAULT '0.00',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 2: Create new transaction tables
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions (created_at);

-- Step 4: Migrate data from old wallets table to new balance tables
INSERT INTO user_wallets (user_id, balance, created_at, updated_at)
SELECT user_id, wallet_balance, created_at, updated_at FROM wallets
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_funds (user_id, balance, created_at, updated_at)
SELECT user_id, funds_balance, created_at, updated_at FROM wallets
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_points (user_id, balance, created_at, updated_at)
SELECT user_id, points_balance, created_at, updated_at FROM wallets
ON CONFLICT (user_id) DO NOTHING;

-- Step 5: Migrate transactions from old table to new tables by type prefix
-- Wallet transactions (wallet_credit, wallet_debit)
INSERT INTO wallet_transactions (id, user_id, amount, description, created_at)
SELECT id, user_id, amount, description, created_at FROM transactions
WHERE type IN ('wallet_credit', 'wallet_debit')
ON CONFLICT DO NOTHING;

-- Fund transactions (fund_credit, fund_debit)
INSERT INTO fund_transactions (id, user_id, amount, description, created_at)
SELECT id, user_id, amount, description, created_at FROM transactions
WHERE type IN ('fund_credit', 'fund_debit')
ON CONFLICT DO NOTHING;

-- Point transactions (point_earned, point_spent)
INSERT INTO point_transactions (id, user_id, amount, description, created_at)
SELECT id, user_id, amount, description, created_at FROM transactions
WHERE type IN ('point_earned', 'point_spent')
ON CONFLICT DO NOTHING;

-- Step 6: Drop old tables (uncomment after verifying migration)
-- DROP TABLE IF EXISTS transactions;
-- DROP TABLE IF EXISTS wallets;
