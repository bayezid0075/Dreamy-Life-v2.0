CREATE TABLE IF NOT EXISTS "marketplace_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform_fee_percent" numeric(5,2) NOT NULL DEFAULT 5.00,
  "max_submissions_per_user" integer NOT NULL DEFAULT 3,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

INSERT INTO "marketplace_settings" ("platform_fee_percent", "max_submissions_per_user", "is_active")
VALUES (5.00, 3, true)
ON CONFLICT DO NOTHING;
