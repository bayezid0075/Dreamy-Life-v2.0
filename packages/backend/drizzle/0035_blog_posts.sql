CREATE TABLE "blog_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "excerpt" text,
  "body" text NOT NULL,
  "cover_image_url" text,
  "author_id" uuid NOT NULL REFERENCES "admins"("id"),
  "author_name" varchar(100) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "tags" text[] DEFAULT '{}',
  "meta_title" varchar(255),
  "meta_description" text,
  "views_count" integer NOT NULL DEFAULT 0,
  "published_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "blog_slug_idx" ON "blog_posts" ("slug");
CREATE INDEX "blog_status_idx" ON "blog_posts" ("status");
