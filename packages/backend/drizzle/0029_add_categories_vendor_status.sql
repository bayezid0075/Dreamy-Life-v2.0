-- Add status column to vendors table (default 'active')
ALTER TABLE "vendors" ADD COLUMN "status" varchar(20) NOT NULL DEFAULT 'active';--> statement-breakpoint

-- Create categories table
CREATE TABLE IF NOT EXISTS "categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL UNIQUE,
  "icon" varchar(50),
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Create subcategories table
CREATE TABLE IF NOT EXISTS "subcategories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "category_id" uuid NOT NULL REFERENCES "categories"("id"),
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL UNIQUE,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Migrate existing price data into discount_price where discount_price is null
UPDATE "products" SET "discount_price" = "price" WHERE "discount_price" IS NULL AND "price" IS NOT NULL;--> statement-breakpoint

-- Drop delivery_area column from products
ALTER TABLE "products" DROP COLUMN "delivery_area";--> statement-breakpoint

-- Drop price column from products
ALTER TABLE "products" DROP COLUMN "price";
