ALTER TABLE "products" ADD COLUMN "subcategory" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "actual_price" numeric(12, 2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "discount_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "delivery_area" varchar(20) NOT NULL DEFAULT 'inside_dhaka';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "delivery_charge_inside" numeric(12, 2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "delivery_charge_outside" numeric(12, 2) NOT NULL DEFAULT '0';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "colors" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sizes" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variant_prices" jsonb DEFAULT '{}';