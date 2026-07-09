CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "amount" decimal(12,2) NOT NULL,
  "charge_percent" decimal(5,2) NOT NULL DEFAULT '0.00',
  "charge_amount" decimal(12,2) NOT NULL DEFAULT '0.00',
  "total_amount" decimal(12,2) NOT NULL,
  "method" varchar(20) NOT NULL,
  "phone_number" varchar(15) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "admin_note" text,
  "processed_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "withdraw_user_idx" ON "withdrawals" ("user_id");
CREATE INDEX IF NOT EXISTS "withdraw_status_idx" ON "withdrawals" ("status");

CREATE TABLE IF NOT EXISTS "withdraw_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "minimum_balance" decimal(12,2) NOT NULL DEFAULT '100.00',
  "charge_percent" decimal(5,2) NOT NULL DEFAULT '0.00',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

INSERT INTO "withdraw_config" ("minimum_balance", "charge_percent", "is_active") VALUES ('100.00', '2.00', true) ON CONFLICT DO NOTHING;
