-- Add email column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar(255);

-- Update existing users with a default email based on their phone number
UPDATE "users" SET "email" = CONCAT("phone_number", '@placeholder.local') WHERE "email" IS NULL;

-- Make email NOT NULL after backfill
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- Add unique constraint
DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add index
CREATE UNIQUE INDEX IF NOT EXISTS "email_idx" ON "users" ("email");
