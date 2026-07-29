CREATE TABLE IF NOT EXISTS "visitors" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(50),
  "platform" varchar(20) NOT NULL,
  "ip" varchar(45),
  "user_agent" varchar(500),
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "visitor_platform_idx" ON "visitors" ("platform");
CREATE INDEX IF NOT EXISTS "visitor_created_idx" ON "visitors" ("created_at");
