-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS "otp_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone_number" varchar(20) NOT NULL,
  "otp_code" varchar(6) NOT NULL,
  "type" varchar(20) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "verified" boolean NOT NULL DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "otp_phone_idx" ON "otp_verifications" ("phone_number");
CREATE INDEX IF NOT EXISTS "otp_type_idx" ON "otp_verifications" ("type");
