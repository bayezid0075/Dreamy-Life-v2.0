ALTER TABLE "reseller_orders" ADD COLUMN "delivery_method" varchar(20);--> statement-breakpoint
ALTER TABLE "reseller_orders" ADD COLUMN "delivery_charge" decimal(12, 2) NOT NULL DEFAULT '0';
