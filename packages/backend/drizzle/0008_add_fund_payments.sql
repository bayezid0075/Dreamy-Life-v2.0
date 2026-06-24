CREATE TABLE IF NOT EXISTS "fund_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"invoice_id" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"fee" numeric(12, 2) DEFAULT '0.00',
	"charged_amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50),
	"sender_number" varchar(30),
	"transaction_id" varchar(255),
	"metadata" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fund_payments_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_payment_invoice_idx" ON "fund_payments" ("invoice_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fund_payment_user_id_idx" ON "fund_payments" ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fund_payments" ADD CONSTRAINT "fund_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
