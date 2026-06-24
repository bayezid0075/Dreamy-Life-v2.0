-- Add is_verified to users table
ALTER TABLE "users" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;

-- Add commission_rates to membership_plans table
ALTER TABLE "membership_plans" ADD COLUMN "commission_rates" jsonb DEFAULT '[]';
