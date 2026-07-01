import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_landing_pages_page_type" AS ENUM('product-facet', 'digitization', 'it-solution', 'segment-hub');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_landing_pages_product_group" AS ENUM('may-scan', 'may-in', 'may-photocopy');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_landing_pages_facet_type" AS ENUM('industry', 'need', 'brand');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_landing_pages_product_query_max_paper_size" AS ENUM('A4', 'A3', 'A2', 'A1', 'A0');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_landing_pages_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__landing_pages_v_version_page_type" AS ENUM('product-facet', 'digitization', 'it-solution', 'segment-hub');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__landing_pages_v_version_product_group" AS ENUM('may-scan', 'may-in', 'may-photocopy');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__landing_pages_v_version_facet_type" AS ENUM('industry', 'need', 'brand');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__landing_pages_v_version_product_query_max_paper_size" AS ENUM('A4', 'A3', 'A2', 'A1', 'A0');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__landing_pages_v_version_status" AS ENUM('draft', 'published');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "industry" varchar;
    ALTER TABLE "quote_requests" ADD COLUMN IF NOT EXISTS "landing_path" varchar;

    CREATE TABLE IF NOT EXISTS "industries" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "icon" varchar,
      "accent_key" varchar,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "scan_needs" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "icon" varchar,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "landing_pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "page_type" "enum_landing_pages_page_type" DEFAULT 'product-facet',
      "product_group" "enum_landing_pages_product_group" DEFAULT 'may-scan',
      "facet_type" "enum_landing_pages_facet_type",
      "industry_ref_id" integer,
      "need_ref_id" integer,
      "brand_ref_id" integer,
      "facet_slug" varchar,
      "title" varchar,
      "slug" varchar,
      "h1" varchar,
      "intro" jsonb,
      "product_query_needs_duplex" boolean,
      "product_query_needs_a3" boolean,
      "product_query_needs_network" boolean,
      "product_query_needs_ocr" boolean,
      "product_query_needs_card_scan" boolean,
      "product_query_needs_passport" boolean,
      "product_query_prefers_flatbed" boolean,
      "product_query_large_format" boolean,
      "product_query_wide_format" boolean,
      "product_query_book_scanner" boolean,
      "product_query_min_daily_duty" numeric,
      "product_query_min_scan_speed_ppm" numeric,
      "product_query_max_paper_size" "enum_landing_pages_product_query_max_paper_size",
      "pathname" varchar,
      "seo_title" varchar,
      "seo_description" varchar,
      "seo_image_id" integer,
      "seo_canonical" varchar,
      "seo_no_index" boolean DEFAULT false,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_landing_pages_status" DEFAULT 'draft'
    );

    CREATE TABLE IF NOT EXISTS "landing_pages_pain_points" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar
    );

    CREATE TABLE IF NOT EXISTS "landing_pages_criteria" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "need" varchar,
      "spec" varchar
    );

    CREATE TABLE IF NOT EXISTS "landing_pages_workflow" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "step" varchar,
      "detail" varchar
    );

    CREATE TABLE IF NOT EXISTS "landing_pages_faqs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar,
      "answer" varchar
    );

    CREATE TABLE IF NOT EXISTS "landing_pages_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer,
      "brands_id" integer,
      "landing_pages_id" integer
    );

    CREATE TABLE IF NOT EXISTS "_landing_pages_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_page_type" "enum__landing_pages_v_version_page_type" DEFAULT 'product-facet',
      "version_product_group" "enum__landing_pages_v_version_product_group" DEFAULT 'may-scan',
      "version_facet_type" "enum__landing_pages_v_version_facet_type",
      "version_industry_ref_id" integer,
      "version_need_ref_id" integer,
      "version_brand_ref_id" integer,
      "version_facet_slug" varchar,
      "version_title" varchar,
      "version_slug" varchar,
      "version_h1" varchar,
      "version_intro" jsonb,
      "version_product_query_needs_duplex" boolean,
      "version_product_query_needs_a3" boolean,
      "version_product_query_needs_network" boolean,
      "version_product_query_needs_ocr" boolean,
      "version_product_query_needs_card_scan" boolean,
      "version_product_query_needs_passport" boolean,
      "version_product_query_prefers_flatbed" boolean,
      "version_product_query_large_format" boolean,
      "version_product_query_wide_format" boolean,
      "version_product_query_book_scanner" boolean,
      "version_product_query_min_daily_duty" numeric,
      "version_product_query_min_scan_speed_ppm" numeric,
      "version_product_query_max_paper_size" "enum__landing_pages_v_version_product_query_max_paper_size",
      "version_pathname" varchar,
      "version_seo_title" varchar,
      "version_seo_description" varchar,
      "version_seo_image_id" integer,
      "version_seo_canonical" varchar,
      "version_seo_no_index" boolean DEFAULT false,
      "version_sort_order" numeric DEFAULT 0,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__landing_pages_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean
    );

    CREATE TABLE IF NOT EXISTS "_landing_pages_v_version_pain_points" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "text" varchar,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "_landing_pages_v_version_criteria" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "need" varchar,
      "spec" varchar,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "_landing_pages_v_version_workflow" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "step" varchar,
      "detail" varchar,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "_landing_pages_v_version_faqs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "question" varchar,
      "answer" varchar,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "_landing_pages_v_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "products_id" integer,
      "brands_id" integer,
      "landing_pages_id" integer
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "industries_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "scan_needs_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "landing_pages_id" integer;

    DO $$ BEGIN
      ALTER TABLE "landing_pages_pain_points" ADD CONSTRAINT "landing_pages_pain_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages_criteria" ADD CONSTRAINT "landing_pages_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages_workflow" ADD CONSTRAINT "landing_pages_workflow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages_faqs" ADD CONSTRAINT "landing_pages_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_industry_ref_id_industries_id_fk" FOREIGN KEY ("industry_ref_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_need_ref_id_scan_needs_id_fk" FOREIGN KEY ("need_ref_id") REFERENCES "public"."scan_needs"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_brand_ref_id_brands_id_fk" FOREIGN KEY ("brand_ref_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages_rels" ADD CONSTRAINT "landing_pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages_rels" ADD CONSTRAINT "landing_pages_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages_rels" ADD CONSTRAINT "landing_pages_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "landing_pages_rels" ADD CONSTRAINT "landing_pages_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v_version_pain_points" ADD CONSTRAINT "_landing_pages_v_version_pain_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v_version_criteria" ADD CONSTRAINT "_landing_pages_v_version_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v_version_workflow" ADD CONSTRAINT "_landing_pages_v_version_workflow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v_version_faqs" ADD CONSTRAINT "_landing_pages_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_parent_id_landing_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_version_industry_ref_id_industries_id_fk" FOREIGN KEY ("version_industry_ref_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_version_need_ref_id_scan_needs_id_fk" FOREIGN KEY ("version_need_ref_id") REFERENCES "public"."scan_needs"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_version_brand_ref_id_brands_id_fk" FOREIGN KEY ("version_brand_ref_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v_rels" ADD CONSTRAINT "_landing_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v_rels" ADD CONSTRAINT "_landing_pages_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v_rels" ADD CONSTRAINT "_landing_pages_v_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "_landing_pages_v_rels" ADD CONSTRAINT "_landing_pages_v_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_scan_needs_fk" FOREIGN KEY ("scan_needs_id") REFERENCES "public"."scan_needs"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE UNIQUE INDEX IF NOT EXISTS "industries_slug_idx" ON "industries" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "industries_updated_at_idx" ON "industries" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "industries_created_at_idx" ON "industries" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "scan_needs_slug_idx" ON "scan_needs" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "scan_needs_updated_at_idx" ON "scan_needs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "scan_needs_created_at_idx" ON "scan_needs" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "landing_pages_pain_points_order_idx" ON "landing_pages_pain_points" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "landing_pages_pain_points_parent_id_idx" ON "landing_pages_pain_points" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_criteria_order_idx" ON "landing_pages_criteria" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "landing_pages_criteria_parent_id_idx" ON "landing_pages_criteria" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_workflow_order_idx" ON "landing_pages_workflow" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "landing_pages_workflow_parent_id_idx" ON "landing_pages_workflow" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_faqs_order_idx" ON "landing_pages_faqs" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "landing_pages_faqs_parent_id_idx" ON "landing_pages_faqs" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_industry_ref_idx" ON "landing_pages" USING btree ("industry_ref_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_need_ref_idx" ON "landing_pages" USING btree ("need_ref_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_brand_ref_idx" ON "landing_pages" USING btree ("brand_ref_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "landing_pages_pathname_idx" ON "landing_pages" USING btree ("pathname");
    CREATE INDEX IF NOT EXISTS "landing_pages_seo_seo_image_idx" ON "landing_pages" USING btree ("seo_image_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_updated_at_idx" ON "landing_pages" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "landing_pages_created_at_idx" ON "landing_pages" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "landing_pages__status_idx" ON "landing_pages" USING btree ("_status");
    CREATE INDEX IF NOT EXISTS "landing_pages_rels_order_idx" ON "landing_pages_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "landing_pages_rels_parent_idx" ON "landing_pages_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_rels_path_idx" ON "landing_pages_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "landing_pages_rels_products_id_idx" ON "landing_pages_rels" USING btree ("products_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_rels_brands_id_idx" ON "landing_pages_rels" USING btree ("brands_id");
    CREATE INDEX IF NOT EXISTS "landing_pages_rels_landing_pages_id_idx" ON "landing_pages_rels" USING btree ("landing_pages_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_pain_points_order_idx" ON "_landing_pages_v_version_pain_points" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_pain_points_parent_id_idx" ON "_landing_pages_v_version_pain_points" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_criteria_order_idx" ON "_landing_pages_v_version_criteria" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_criteria_parent_id_idx" ON "_landing_pages_v_version_criteria" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_workflow_order_idx" ON "_landing_pages_v_version_workflow" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_workflow_parent_id_idx" ON "_landing_pages_v_version_workflow" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_faqs_order_idx" ON "_landing_pages_v_version_faqs" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_faqs_parent_id_idx" ON "_landing_pages_v_version_faqs" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_parent_idx" ON "_landing_pages_v" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_version_industry_ref_idx" ON "_landing_pages_v" USING btree ("version_industry_ref_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_version_need_ref_idx" ON "_landing_pages_v" USING btree ("version_need_ref_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_version_brand_ref_idx" ON "_landing_pages_v" USING btree ("version_brand_ref_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_version_pathname_idx" ON "_landing_pages_v" USING btree ("version_pathname");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_seo_version_seo_image_idx" ON "_landing_pages_v" USING btree ("version_seo_image_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_version_updated_at_idx" ON "_landing_pages_v" USING btree ("version_updated_at");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_version_created_at_idx" ON "_landing_pages_v" USING btree ("version_created_at");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_version_version__status_idx" ON "_landing_pages_v" USING btree ("version__status");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_created_at_idx" ON "_landing_pages_v" USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_updated_at_idx" ON "_landing_pages_v" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_latest_idx" ON "_landing_pages_v" USING btree ("latest");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_rels_order_idx" ON "_landing_pages_v_rels" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_rels_parent_idx" ON "_landing_pages_v_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_rels_path_idx" ON "_landing_pages_v_rels" USING btree ("path");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_rels_products_id_idx" ON "_landing_pages_v_rels" USING btree ("products_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_rels_brands_id_idx" ON "_landing_pages_v_rels" USING btree ("brands_id");
    CREATE INDEX IF NOT EXISTS "_landing_pages_v_rels_landing_pages_id_idx" ON "_landing_pages_v_rels" USING btree ("landing_pages_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_industries_id_idx" ON "payload_locked_documents_rels" USING btree ("industries_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_scan_needs_id_idx" ON "payload_locked_documents_rels" USING btree ("scan_needs_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_landing_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("landing_pages_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_landing_pages_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_scan_needs_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_industries_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_landing_pages_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_scan_needs_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_industries_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "landing_pages_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "scan_needs_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "industries_id";

    ALTER TABLE "quote_requests" DROP COLUMN IF EXISTS "landing_path";
    ALTER TABLE "quote_requests" DROP COLUMN IF EXISTS "industry";

    DROP TABLE IF EXISTS "_landing_pages_v_rels" CASCADE;
    DROP TABLE IF EXISTS "_landing_pages_v_version_faqs" CASCADE;
    DROP TABLE IF EXISTS "_landing_pages_v_version_workflow" CASCADE;
    DROP TABLE IF EXISTS "_landing_pages_v_version_criteria" CASCADE;
    DROP TABLE IF EXISTS "_landing_pages_v_version_pain_points" CASCADE;
    DROP TABLE IF EXISTS "_landing_pages_v" CASCADE;
    DROP TABLE IF EXISTS "landing_pages_rels" CASCADE;
    DROP TABLE IF EXISTS "landing_pages_faqs" CASCADE;
    DROP TABLE IF EXISTS "landing_pages_workflow" CASCADE;
    DROP TABLE IF EXISTS "landing_pages_criteria" CASCADE;
    DROP TABLE IF EXISTS "landing_pages_pain_points" CASCADE;
    DROP TABLE IF EXISTS "landing_pages" CASCADE;
    DROP TABLE IF EXISTS "scan_needs" CASCADE;
    DROP TABLE IF EXISTS "industries" CASCADE;

    DROP TYPE IF EXISTS "public"."enum__landing_pages_v_version_status";
    DROP TYPE IF EXISTS "public"."enum__landing_pages_v_version_product_query_max_paper_size";
    DROP TYPE IF EXISTS "public"."enum__landing_pages_v_version_facet_type";
    DROP TYPE IF EXISTS "public"."enum__landing_pages_v_version_product_group";
    DROP TYPE IF EXISTS "public"."enum__landing_pages_v_version_page_type";
    DROP TYPE IF EXISTS "public"."enum_landing_pages_status";
    DROP TYPE IF EXISTS "public"."enum_landing_pages_product_query_max_paper_size";
    DROP TYPE IF EXISTS "public"."enum_landing_pages_facet_type";
    DROP TYPE IF EXISTS "public"."enum_landing_pages_product_group";
    DROP TYPE IF EXISTS "public"."enum_landing_pages_page_type";
  `);
}
