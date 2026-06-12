-- Migration: Initial schema for auth, referral, and membership system
-- Tables: users, user_info, referrals, membership_plans, membership_purchases, commissions, sessions

-- Enable pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users Table ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  own_refercode VARCHAR(8) NOT NULL UNIQUE,
  referred_by VARCHAR(8),
  member_status VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS refercode_idx ON users (own_refercode);
CREATE UNIQUE INDEX IF NOT EXISTS username_idx ON users (username);
CREATE UNIQUE INDEX IF NOT EXISTS phone_idx ON users (phone_number);

-- ─── User Info Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  full_name VARCHAR(255),
  email VARCHAR(255),
  avatar_url TEXT,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  date_of_birth TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Referrals Table (tracks upline / downline relationships) ───────────
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referred_id UUID NOT NULL UNIQUE REFERENCES users(id),
  level INTEGER NOT NULL,
  commission_rate DECIMAL(5, 2) DEFAULT '0.00',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Membership Plans Table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(12, 2) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Membership Purchases Table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membership_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL REFERENCES membership_plans(id),
  amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Commission Distributions Table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id),
  to_user_id UUID NOT NULL REFERENCES users(id),
  purchase_id UUID NOT NULL REFERENCES membership_purchases(id),
  level INTEGER NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Sessions Table (for refresh tokens) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  refresh_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
