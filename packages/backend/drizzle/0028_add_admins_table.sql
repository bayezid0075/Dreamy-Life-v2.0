-- Create admins table
CREATE TABLE IF NOT EXISTS "admins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL UNIQUE,
  "access_code" varchar(50) NOT NULL,
  "password" text NOT NULL,
  "failed_attempts" integer NOT NULL DEFAULT 0,
  "locked_until" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "admin_email_idx" ON "admins" ("email");
