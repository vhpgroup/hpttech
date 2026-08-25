import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

// Thêm group `seoContent` vào collection Categories: khối bài SEO đặt dưới grid
// sản phẩm ở landing danh mục /<slug> (mô hình samnec.com.vn/tivi).
//
// Categories KHÔNG bật versions.drafts nên không cần bảng _categories_v song song.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_enabled" boolean DEFAULT true;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_heading" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_show_toc" boolean DEFAULT true;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_toc_title" varchar DEFAULT 'Xem nhanh';
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_body" jsonb;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_seo_title" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_seo_description" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_seo_no_index" boolean DEFAULT false;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "categories_seo_content_faqs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar,
      "answer" varchar
    );
  `);

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "categories_seo_content_faqs" ADD CONSTRAINT "categories_seo_content_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "categories_seo_content_faqs_order_idx" ON "categories_seo_content_faqs" ("_order");
    CREATE INDEX IF NOT EXISTS "categories_seo_content_faqs_parent_id_idx" ON "categories_seo_content_faqs" ("_parent_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "categories_seo_content_faqs";`);

  await db.execute(sql`
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_enabled";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_heading";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_show_toc";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_toc_title";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_body";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_seo_title";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_seo_description";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_content_seo_no_index";
  `);
}
