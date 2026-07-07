CREATE TABLE IF NOT EXISTS "recharge_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	"operator" varchar(10) NOT NULL,
	"connection_type" varchar(10) NOT NULL DEFAULT 'prepaid',
	"amount" numeric(12, 2) NOT NULL,
	"status" varchar(20) NOT NULL DEFAULT 'pending',
	"api_transaction_id" varchar(100),
	"api_response" text,
	"user_commission" numeric(12, 2) NOT NULL DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recharge_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"recharge_order_id" uuid NOT NULL,
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recharge_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"api_key" varchar(255) NOT NULL DEFAULT '',
	"api_secret" varchar(255) NOT NULL DEFAULT '',
	"api_base_url" varchar(255) NOT NULL DEFAULT 'https://api.successtopup.com',
	"user_commission_rate" numeric(5, 2) NOT NULL DEFAULT '2.00',
	"commission_rates" jsonb NOT NULL DEFAULT '[2, 1, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1]',
	"is_active" boolean NOT NULL DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recharge_orders" ADD CONSTRAINT "recharge_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recharge_commissions" ADD CONSTRAINT "recharge_commissions_recharge_order_id_recharge_orders_id_fk" FOREIGN KEY ("recharge_order_id") REFERENCES "public"."recharge_orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recharge_commissions" ADD CONSTRAINT "recharge_commissions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recharge_commissions" ADD CONSTRAINT "recharge_commissions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recharge_user_idx" ON "recharge_orders" ("user_id");
CREATE INDEX IF NOT EXISTS "recharge_status_idx" ON "recharge_orders" ("status");
