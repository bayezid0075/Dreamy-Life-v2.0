-- Add new columns to membership_plans table
ALTER TABLE "membership_plans" ADD COLUMN "features" jsonb DEFAULT '[]';
ALTER TABLE "membership_plans" ADD COLUMN "button_text" varchar(100) DEFAULT 'Choose Plan';
ALTER TABLE "membership_plans" ADD COLUMN "is_popular" boolean DEFAULT false NOT NULL;
ALTER TABLE "membership_plans" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
ALTER TABLE "membership_plans" ADD COLUMN "color_theme" varchar(30) DEFAULT 'primary';
ALTER TABLE "membership_plans" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;
ALTER TABLE "membership_plans" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
