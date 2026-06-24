CREATE TABLE "membership_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
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
	CONSTRAINT "membership_payments_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE no action ON DELETE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_plan_id_membership_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."membership_plans"("id") ON UPDATE no action ON DELETE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_payment_invoice_idx" ON "membership_payments" ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_payment_user_id_idx" ON "membership_payments" ("user_id");