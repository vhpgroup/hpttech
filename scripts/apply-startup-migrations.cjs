const { Client } = require("pg");

const certificationsMigrationName = "20260626_041300_add_certifications";
const productTypesMigrationName = "20260630_120000_add_networking_camera_product_types";
const quoteRequestsMigrationName = "20260630_180000_add_quote_requests";
const pseoLandingPagesMigrationName = "20260701_082156_pseo_landing_pages";
const desktopServerCatalogMigrationName = "20260707_101500_add_desktop_server_catalog";
const photocopierSpecsMigrationName = "20260727_100000_normalize_photocopier_specs";
const imagingProductTypeMigrationName = "20260729_100000_add_imaging_product_type";
const usersApiKeyMigrationName = "20260813_060000_users_enable_api_key";
const warrantiesMigrationName = "20260821_080000_add_warranties";
const categorySeoContentMigrationName = "20260826_031500_add_category_seo_content";
const iotProductTypeMigrationName = "20260828_090000_add_iot_product_type";
const connectionString = process.env.DATABASE_URI || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("[startup-migrations] Missing DATABASE_URI or POSTGRES_URL.");
  process.exit(1);
}

const sql = `
DO $$ BEGIN
  CREATE TYPE "public"."enum_certifications_kind" AS ENUM('doc-quyen', 'doi-tac', 'uy-quyen');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_certifications_status" AS ENUM('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__certifications_v_version_kind" AS ENUM('doc-quyen', 'doi-tac', 'uy-quyen');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__certifications_v_version_status" AS ENUM('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "certifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "brand" varchar,
  "slug" varchar,
  "kind" "enum_certifications_kind" DEFAULT 'uy-quyen',
  "kind_label" varchar,
  "image_id" integer,
  "logo_id" integer,
  "scope" varchar,
  "territory" varchar DEFAULT 'Viet Nam',
  "valid_from" timestamp(3) with time zone,
  "valid_to" timestamp(3) with time zone,
  "issuer" varchar,
  "cert_no" varchar,
  "summary" varchar,
  "content" jsonb,
  "featured" boolean DEFAULT false,
  "sort_order" numeric DEFAULT 0,
  "seo_title" varchar,
  "seo_description" varchar,
  "seo_image_id" integer,
  "seo_canonical" varchar,
  "seo_no_index" boolean DEFAULT false,
  "status" "enum_certifications_status" DEFAULT 'draft',
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "_status" "enum_certifications_status" DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS "certifications_gallery" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "image_id" integer
);

CREATE TABLE IF NOT EXISTS "_certifications_v" (
  "id" serial PRIMARY KEY NOT NULL,
  "parent_id" integer,
  "version_brand" varchar,
  "version_slug" varchar,
  "version_kind" "enum__certifications_v_version_kind" DEFAULT 'uy-quyen',
  "version_kind_label" varchar,
  "version_image_id" integer,
  "version_logo_id" integer,
  "version_scope" varchar,
  "version_territory" varchar DEFAULT 'Viet Nam',
  "version_valid_from" timestamp(3) with time zone,
  "version_valid_to" timestamp(3) with time zone,
  "version_issuer" varchar,
  "version_cert_no" varchar,
  "version_summary" varchar,
  "version_content" jsonb,
  "version_featured" boolean DEFAULT false,
  "version_sort_order" numeric DEFAULT 0,
  "version_seo_title" varchar,
  "version_seo_description" varchar,
  "version_seo_image_id" integer,
  "version_seo_canonical" varchar,
  "version_seo_no_index" boolean DEFAULT false,
  "version_status" "enum__certifications_v_version_status" DEFAULT 'draft',
  "version_updated_at" timestamp(3) with time zone,
  "version_created_at" timestamp(3) with time zone,
  "version__status" "enum__certifications_v_version_status" DEFAULT 'draft',
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "latest" boolean
);

CREATE TABLE IF NOT EXISTS "_certifications_v_version_gallery" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" serial PRIMARY KEY NOT NULL,
  "image_id" integer,
  "_uuid" varchar
);

ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "certifications_id" integer;

DO $$ BEGIN
  ALTER TABLE "certifications_gallery" ADD CONSTRAINT "certifications_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "certifications_gallery" ADD CONSTRAINT "certifications_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."certifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "certifications" ADD CONSTRAINT "certifications_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "certifications" ADD CONSTRAINT "certifications_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "certifications" ADD CONSTRAINT "certifications_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_certifications_v_version_gallery" ADD CONSTRAINT "_certifications_v_version_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_certifications_v_version_gallery" ADD CONSTRAINT "_certifications_v_version_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_certifications_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_certifications_v" ADD CONSTRAINT "_certifications_v_parent_id_certifications_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."certifications"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_certifications_v" ADD CONSTRAINT "_certifications_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_certifications_v" ADD CONSTRAINT "_certifications_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_certifications_v" ADD CONSTRAINT "_certifications_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_certifications_fk" FOREIGN KEY ("certifications_id") REFERENCES "public"."certifications"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "certifications_gallery_order_idx" ON "certifications_gallery" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "certifications_gallery_parent_id_idx" ON "certifications_gallery" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "certifications_gallery_image_idx" ON "certifications_gallery" USING btree ("image_id");
CREATE UNIQUE INDEX IF NOT EXISTS "certifications_slug_idx" ON "certifications" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "certifications_image_idx" ON "certifications" USING btree ("image_id");
CREATE INDEX IF NOT EXISTS "certifications_logo_idx" ON "certifications" USING btree ("logo_id");
CREATE INDEX IF NOT EXISTS "certifications_seo_seo_image_idx" ON "certifications" USING btree ("seo_image_id");
CREATE INDEX IF NOT EXISTS "certifications_status_idx" ON "certifications" USING btree ("status");
CREATE INDEX IF NOT EXISTS "certifications_updated_at_idx" ON "certifications" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "certifications_created_at_idx" ON "certifications" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "certifications__status_idx" ON "certifications" USING btree ("_status");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_gallery_order_idx" ON "_certifications_v_version_gallery" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_gallery_parent_id_idx" ON "_certifications_v_version_gallery" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_gallery_image_idx" ON "_certifications_v_version_gallery" USING btree ("image_id");
CREATE INDEX IF NOT EXISTS "_certifications_v_parent_idx" ON "_certifications_v" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_version_slug_idx" ON "_certifications_v" USING btree ("version_slug");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_version_image_idx" ON "_certifications_v" USING btree ("version_image_id");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_version_logo_idx" ON "_certifications_v" USING btree ("version_logo_id");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_seo_version_seo_image_idx" ON "_certifications_v" USING btree ("version_seo_image_id");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_version_status_idx" ON "_certifications_v" USING btree ("version_status");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_version_updated_at_idx" ON "_certifications_v" USING btree ("version_updated_at");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_version_created_at_idx" ON "_certifications_v" USING btree ("version_created_at");
CREATE INDEX IF NOT EXISTS "_certifications_v_version_version__status_idx" ON "_certifications_v" USING btree ("version__status");
CREATE INDEX IF NOT EXISTS "_certifications_v_created_at_idx" ON "_certifications_v" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "_certifications_v_updated_at_idx" ON "_certifications_v" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "_certifications_v_latest_idx" ON "_certifications_v" USING btree ("latest");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_certifications_id_idx" ON "payload_locked_documents_rels" USING btree ("certifications_id");

CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "batch" numeric,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '${certificationsMigrationName}', 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" WHERE "name" = '${certificationsMigrationName}'
);
`;

const productTypesSeedSQL = `
INSERT INTO "product_types" ("code", "name", "description", "schema_version", "status", "updated_at", "created_at")
VALUES
  ('networking', 'Thiết bị mạng', 'Router, switch, card mạng, access point và phụ kiện mạng.', 1, 'active', now(), now()),
  ('camera', 'Camera & Giám sát', 'Camera quan sát, đầu ghi, ổ cứng và phụ kiện camera.', 1, 'active', now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "name" = excluded."name",
  "description" = excluded."description",
  "schema_version" = excluded."schema_version",
  "status" = excluded."status",
  "updated_at" = now();

INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '${productTypesMigrationName}', 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" WHERE "name" = '${productTypesMigrationName}'
);
`;

const quoteRequestsSQL = `
DO $$ BEGIN
  CREATE TYPE "public"."enum_quote_requests_status" AS ENUM('new', 'consulting', 'quoted', 'shipping', 'success', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "quote_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "quote_id" varchar NOT NULL,
  "status" "enum_quote_requests_status" DEFAULT 'new',
  "company" varchar,
  "tax_code" varchar,
  "contact" varchar,
  "phone" varchar NOT NULL,
  "email" varchar,
  "source" varchar,
  "address" varchar,
  "note" varchar,
  "subtotal" numeric,
  "vat" numeric,
  "total_label" varchar,
  "internal_note" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "quote_requests_items" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "title" varchar NOT NULL,
  "sku" varchar,
  "quantity" numeric NOT NULL,
  "price_label" varchar
);

ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "quote_requests_id" integer;

DO $$ BEGIN
  ALTER TABLE "quote_requests_items" ADD CONSTRAINT "quote_requests_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quote_requests_fk" FOREIGN KEY ("quote_requests_id") REFERENCES "public"."quote_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "quote_requests_items_order_idx" ON "quote_requests_items" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "quote_requests_items_parent_id_idx" ON "quote_requests_items" USING btree ("_parent_id");
CREATE INDEX IF NOT EXISTS "quote_requests_quote_id_idx" ON "quote_requests" USING btree ("quote_id");
CREATE INDEX IF NOT EXISTS "quote_requests_updated_at_idx" ON "quote_requests" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "quote_requests_created_at_idx" ON "quote_requests" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_quote_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("quote_requests_id");

CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "batch" numeric,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '${quoteRequestsMigrationName}', 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" WHERE "name" = '${quoteRequestsMigrationName}'
);
`;

const pseoLandingPagesSQL = `
DO $$ BEGIN
  CREATE TYPE "public"."enum_landing_pages_page_type" AS ENUM('product-facet', 'digitization', 'it-solution', 'segment-hub');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_landing_pages_product_group" AS ENUM('may-scan', 'may-in', 'may-photocopy');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_landing_pages_facet_type" AS ENUM('industry', 'need', 'brand');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_landing_pages_product_query_max_paper_size" AS ENUM('A4', 'A3', 'A2', 'A1', 'A0');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_landing_pages_status" AS ENUM('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__landing_pages_v_version_page_type" AS ENUM('product-facet', 'digitization', 'it-solution', 'segment-hub');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__landing_pages_v_version_product_group" AS ENUM('may-scan', 'may-in', 'may-photocopy');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__landing_pages_v_version_facet_type" AS ENUM('industry', 'need', 'brand');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__landing_pages_v_version_product_query_max_paper_size" AS ENUM('A4', 'A3', 'A2', 'A1', 'A0');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum__landing_pages_v_version_status" AS ENUM('draft', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages_criteria" ADD CONSTRAINT "landing_pages_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages_workflow" ADD CONSTRAINT "landing_pages_workflow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages_faqs" ADD CONSTRAINT "landing_pages_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_industry_ref_id_industries_id_fk" FOREIGN KEY ("industry_ref_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_need_ref_id_scan_needs_id_fk" FOREIGN KEY ("need_ref_id") REFERENCES "public"."scan_needs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_brand_ref_id_brands_id_fk" FOREIGN KEY ("brand_ref_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_seo_image_id_media_id_fk" FOREIGN KEY ("seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages_rels" ADD CONSTRAINT "landing_pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages_rels" ADD CONSTRAINT "landing_pages_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages_rels" ADD CONSTRAINT "landing_pages_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "landing_pages_rels" ADD CONSTRAINT "landing_pages_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v_version_pain_points" ADD CONSTRAINT "_landing_pages_v_version_pain_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v_version_criteria" ADD CONSTRAINT "_landing_pages_v_version_criteria_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v_version_workflow" ADD CONSTRAINT "_landing_pages_v_version_workflow_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v_version_faqs" ADD CONSTRAINT "_landing_pages_v_version_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_parent_id_landing_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_version_industry_ref_id_industries_id_fk" FOREIGN KEY ("version_industry_ref_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_version_need_ref_id_scan_needs_id_fk" FOREIGN KEY ("version_need_ref_id") REFERENCES "public"."scan_needs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_version_brand_ref_id_brands_id_fk" FOREIGN KEY ("version_brand_ref_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v" ADD CONSTRAINT "_landing_pages_v_version_seo_image_id_media_id_fk" FOREIGN KEY ("version_seo_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v_rels" ADD CONSTRAINT "_landing_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_landing_pages_v"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v_rels" ADD CONSTRAINT "_landing_pages_v_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v_rels" ADD CONSTRAINT "_landing_pages_v_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "_landing_pages_v_rels" ADD CONSTRAINT "_landing_pages_v_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_scan_needs_fk" FOREIGN KEY ("scan_needs_id") REFERENCES "public"."scan_needs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
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

CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "batch" numeric,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '${pseoLandingPagesMigrationName}', 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" WHERE "name" = '${pseoLandingPagesMigrationName}'
);
`;

async function applyCertificationsMigration(client) {
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${certificationsMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

const desktopServerCatalogSQL = `
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_cpu" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_gpu" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_ram" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_storage" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_screen" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_screen_size_inch" numeric;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_form_factor" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_psu" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_os" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_connectivity" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_dimensions" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_weight" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_ram_gb" numeric;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "desktop_specs_storage_gb" numeric;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_cpu" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_socket" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_ram" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_ram_max" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_storage" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_drive_bays" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_raid" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_psu" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_form_factor" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_network_ports" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_management" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_dimensions" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_weight" varchar;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "server_specs_ram_gb" numeric;

ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_cpu" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_gpu" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_ram" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_storage" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_screen" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_screen_size_inch" numeric;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_form_factor" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_psu" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_os" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_connectivity" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_dimensions" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_weight" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_ram_gb" numeric;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_desktop_specs_storage_gb" numeric;

ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_cpu" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_socket" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_ram" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_ram_max" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_storage" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_drive_bays" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_raid" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_psu" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_form_factor" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_network_ports" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_management" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_dimensions" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_weight" varchar;
ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_server_specs_ram_gb" numeric;

INSERT INTO "product_types" ("code", "name", "description", "schema_version", "status", "updated_at", "created_at")
VALUES
  ('desktop-pc', 'PC đồng bộ', 'Máy tính để bàn đồng bộ chính hãng HP, Dell, Lenovo, ASUS.', 1, 'active', now(), now()),
  ('all-in-one', 'PC All-in-One', 'Máy tính All-in-One tích hợp màn hình.', 1, 'active', now(), now()),
  ('mini-pc', 'Mini PC - NUC', 'Máy tính mini, ASUS NUC các thế hệ.', 1, 'active', now(), now()),
  ('workstation', 'Máy trạm Workstation', 'Máy trạm chuyên dụng cho đồ họa, kỹ thuật, AI.', 1, 'active', now(), now()),
  ('industrial-pc', 'Máy tính công nghiệp', 'Máy tính công nghiệp cho môi trường sản xuất, vận hành.', 1, 'active', now(), now()),
  ('server', 'Máy chủ - Server', 'Máy chủ nguyên chiếc Dell, HP, Lenovo/IBM.', 1, 'active', now(), now()),
  ('server-component', 'Linh kiện máy chủ', 'CPU, RAM, ổ cứng, VGA, RAID, mainboard, nguồn cho máy chủ.', 1, 'active', now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "name" = excluded."name",
  "description" = excluded."description",
  "schema_version" = excluded."schema_version",
  "status" = excluded."status",
  "updated_at" = now();

CREATE TABLE IF NOT EXISTS "payload_migrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar,
  "batch" numeric,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '${desktopServerCatalogMigrationName}', 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" WHERE "name" = '${desktopServerCatalogMigrationName}'
);
`;

async function applyNetworkingCameraProductTypes(client) {
  await client.query(`alter type "enum_product_types_code" add value if not exists 'networking'`);
  await client.query(`alter type "enum_product_types_code" add value if not exists 'camera'`);

  await client.query("BEGIN");
  try {
    await client.query(productTypesSeedSQL);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${productTypesMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function applyQuoteRequestsMigration(client) {
  await client.query("BEGIN");
  try {
    await client.query(quoteRequestsSQL);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${quoteRequestsMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function applyPseoLandingPagesMigration(client) {
  await client.query("BEGIN");
  try {
    await client.query(pseoLandingPagesSQL);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${pseoLandingPagesMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function applyDesktopServerCatalogMigration(client) {
  // ALTER TYPE ... ADD VALUE phải chạy ngoài transaction (giống block
  // networking/camera). IF NOT EXISTS -> idempotent, chạy lại an toàn.
  const pcServerTypeCodes = [
    "desktop-pc",
    "all-in-one",
    "mini-pc",
    "workstation",
    "industrial-pc",
    "server",
    "server-component",
  ];
  for (const value of pcServerTypeCodes) {
    await client.query(`alter type "enum_product_types_code" add value if not exists '${value}'`);
    await client.query(`alter type "enum_products_spec_profile" add value if not exists '${value}'`);
    await client.query(`alter type "enum__products_v_version_spec_profile" add value if not exists '${value}'`);
  }

  await client.query("BEGIN");
  try {
    await client.query(desktopServerCatalogSQL);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${desktopServerCatalogMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 20260727 — Chuẩn hóa dữ liệu MÁY PHOTOCOPY để phục vụ trục lọc mega-menu.
// Idempotent + bảo thủ: chỉ sửa giá trị NULL / rác / mâu thuẫn rõ ràng với text;
// chạy lại nhiều lần vô hại (lần sau 0 rows). Áp cho cả bảng products lẫn bảng
// version (_products_v) để admin mở bản nháp lưu lại không ghi đè ngược dữ liệu cũ.
// Quy tắc:
// - copy_speed_cpm: xóa giá trị ngoài 8..150 (rác parse như 1, 2625, 6855),
//   backfill từ text "25 trang/phút" / "26/31/35 bản/phút" (lấy số đầu 2-3 chữ số).
// - color_print: tên có "màu/color" (và không có "đen trắng") -> true;
//   tên "đen trắng" mà đang true và text không xác nhận "Có" -> false.
// - auto_duplex_print: text bắt đầu "Không" -> false; text/chức năng có
//   duplex / tự động / tích hợp / có sẵn -> true.
// - has_adf: text ADF bắt đầu "Không" -> false; text có ADF/DADF/RADF/số tờ -> true.
function photocopierNormalizeStatements(prefix, table) {
  const c = (name) => `"${table}"."${prefix}photocopier_specs_${name}"`;
  const set = (name) => `"${prefix}photocopier_specs_${name}"`;
  const nameCol = `"${table}"."${prefix}name"`;
  const scope = `(
    "${table}"."${prefix}category_id" IN (SELECT "id" FROM "categories" WHERE "slug" = 'may-photocopy')
    OR "${table}"."${prefix}spec_profile" = 'photocopier'
  )`;

  return [
    // 1) copy_speed_cpm: dọn giá trị rác ngoài khoảng hợp lý
    `UPDATE "${table}" SET ${set("copy_speed_cpm")} = NULL
     WHERE ${scope} AND ${c("copy_speed_cpm")} IS NOT NULL
       AND (${c("copy_speed_cpm")} < 8 OR ${c("copy_speed_cpm")} > 150);`,

    // 2) copy_speed_cpm: backfill từ text tốc độ copy (fallback tốc độ in)
    `UPDATE "${table}" SET ${set("copy_speed_cpm")} = sub.v
     FROM (
       SELECT "id", (regexp_match(
         coalesce(${c("copy_speed")}, ${c("print_speed")}), '(\\d{2,3})'
       ))[1]::numeric AS v
       FROM "${table}"
       WHERE ${scope}
     ) sub
     WHERE "${table}"."id" = sub."id"
       AND ${c("copy_speed_cpm")} IS NULL
       AND sub.v BETWEEN 8 AND 150;`,

    // 3) color_print: tên nói "màu" (không kèm "đen trắng") -> true
    `UPDATE "${table}" SET ${set("color_print")} = true
     WHERE ${scope} AND ${c("color_print")} IS NOT TRUE
       AND ${nameCol} ~* '(màu|colou?r)'
       AND ${nameCol} !~* '(đen trắng|trắng đen)';`,

    // 4) color_print: tên nói "đen trắng" mà flag true và text không xác nhận -> false
    `UPDATE "${table}" SET ${set("color_print")} = false
     WHERE ${scope} AND ${c("color_print")} IS TRUE
       AND ${nameCol} ~* '(đen trắng|trắng đen)'
       AND coalesce(${c("color_print_text")}, '') !~* '^\\s*có';`,

    // 5) auto_duplex_print: text phủ định rõ -> false
    `UPDATE "${table}" SET ${set("auto_duplex_print")} = false
     WHERE ${scope}
       AND coalesce(${c("auto_duplex_print_text")}, '') ~* '^\\s*không';`,

    // 6) auto_duplex_print: tín hiệu khẳng định trong text/chức năng -> true
    `UPDATE "${table}" SET ${set("auto_duplex_print")} = true
     WHERE ${scope} AND ${c("auto_duplex_print")} IS NOT TRUE
       AND (
         coalesce(${c("auto_duplex_print_text")}, '') ~* '(duplex|tự động|tích hợp|có sẵn|^\\s*có)'
         OR coalesce(${c("functions")}, '') ~* 'duplex'
       );`,

    // 7) has_adf: text phủ định rõ -> false
    `UPDATE "${table}" SET ${set("has_adf")} = false
     WHERE ${scope}
       AND coalesce(${c("adf_text")}, '') ~* '^\\s*không';`,

    // 8) has_adf: tín hiệu khẳng định -> true
    `UPDATE "${table}" SET ${set("has_adf")} = true
     WHERE ${scope} AND ${c("has_adf")} IS NOT TRUE
       AND (
         (
           coalesce(${c("adf_text")}, '') <> ''
           AND ${c("adf_text")} !~* '^\\s*không'
           AND ${c("adf_text")} ~* '(adf|dadf|radf|tờ|sheets|sẵn|tự động|^\\s*có)'
         )
         OR coalesce(${c("functions")}, '') ~* '(dadf|radf)'
       );`,
  ];
}

async function applyPhotocopierSpecsNormalization(client) {
  const statements = [
    ...photocopierNormalizeStatements("", "products"),
    ...photocopierNormalizeStatements("version_", "_products_v"),
  ];

  await client.query("BEGIN");
  try {
    for (const sql of statements) {
      await client.query(sql);
    }
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${photocopierSpecsMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 20260729 — Thêm mã loại sản phẩm "imaging" (Thiết bị hình ảnh).
// PHẠM VI CỐ Ý HẸP:
//  - CHỈ mở rộng enum "enum_product_types_code" để API tạo được bản ghi
//    product-type mới với code = 'imaging'. Không mở rộng enum specProfile
//    ("enum_products_spec_profile" / "enum__products_v_version_spec_profile"):
//    sản phẩm imaging dùng specProfile "other" đã có sẵn.
//  - KHÔNG seed row product_types ở đây — bản ghi
//    { code: imaging, name: Thiết bị hình ảnh, status: active, schemaVersion: 1 }
//    do phía nội dung tự tạo qua REST API sau khi deploy.
// ALTER TYPE ... ADD VALUE phải chạy NGOÀI transaction (giống block
// networking/camera). IF NOT EXISTS -> idempotent, chạy lại an toàn.
async function applyImagingProductType(client) {
  await client.query(`alter type "enum_product_types_code" add value if not exists 'imaging'`);

  await client.query("BEGIN");
  try {
    await client.query(`
      INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
      SELECT '${imagingProductTypeMigrationName}', 0, now(), now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload_migrations" WHERE "name" = '${imagingProductTypeMigrationName}'
      );
    `);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${imagingProductTypeMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 20260813 — Bật API Key cho collection `users` (auth.useAPIKey = true).
// Payload sinh 3 cột từ base field của apiKey. Tên cột do `to-snake-case`
// (dep của @payloadcms/db-postgres) quyết định, KHÔNG phải snake_case thường:
//   enableAPIKey -> enable_a_p_i_key   (mỗi chữ HOA liên tiếp thành 1 đoạn)
//   apiKey       -> api_key
//   apiKeyIndex  -> api_key_index
// Đã đối chiếu bằng chính thư viện đó; các cột auth sẵn có khớp quy tắc này
// (loginAttempts -> login_attempts, lockUntil -> lock_until).
// ADD COLUMN IF NOT EXISTS -> idempotent, chạy lại an toàn. Không đụng dữ liệu
// user hiện có: cột mới để NULL, không tài khoản nào bị bật key tự động.
async function applyUsersApiKey(client) {
  await client.query("BEGIN");
  try {
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enable_a_p_i_key" boolean;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key" varchar;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key_index" varchar;`);
    await client.query(`
      INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
      SELECT '${usersApiKeyMigrationName}', 0, now(), now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload_migrations" WHERE "name" = '${usersApiKeyMigrationName}'
      );
    `);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${usersApiKeyMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 20260821 — Collection `warranties` (Phiếu bảo hành) cho trang /tra-cuu-bao-hanh.
// Collection KHÔNG bật versions/drafts nên chỉ có 1 bảng chính. Cấu trúc SQL
// bám sát mẫu Payload sinh cho quote_requests (xem quoteRequestsSQL phía trên):
// bảng + cột warranties_id trong payload_locked_documents_rels (khóa document
// khi mở trong Admin) + index cho 3 trường tra cứu. Tên cột theo to-snake-case:
//   serialNumber -> serial_number, ehsmtCode -> ehsmt_code, ... (không có
//   chuỗi chữ HOA liên tiếp nên snake_case thường). Idempotent, chạy lại an toàn.
const warrantiesSQL = `
CREATE TABLE IF NOT EXISTS "warranties" (
  "id" serial PRIMARY KEY NOT NULL,
  "serial_number" varchar NOT NULL,
  "customer_name" varchar NOT NULL,
  "customer_phone" varchar,
  "ehsmt_code" varchar,
  "sku" varchar,
  "product_name" varchar NOT NULL,
  "start_date" timestamp(3) with time zone NOT NULL,
  "warranty_months" numeric NOT NULL,
  "end_date" timestamp(3) with time zone,
  "voided" boolean DEFAULT false,
  "note" varchar,
  "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "warranties_id" integer;

DO $$ BEGIN
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_warranties_fk" FOREIGN KEY ("warranties_id") REFERENCES "public"."warranties"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "warranties_serial_number_idx" ON "warranties" USING btree ("serial_number");
CREATE INDEX IF NOT EXISTS "warranties_customer_name_idx" ON "warranties" USING btree ("customer_name");
CREATE INDEX IF NOT EXISTS "warranties_ehsmt_code_idx" ON "warranties" USING btree ("ehsmt_code");
CREATE INDEX IF NOT EXISTS "warranties_updated_at_idx" ON "warranties" USING btree ("updated_at");
CREATE INDEX IF NOT EXISTS "warranties_created_at_idx" ON "warranties" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_warranties_id_idx" ON "payload_locked_documents_rels" USING btree ("warranties_id");

INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '${warrantiesMigrationName}', 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" WHERE "name" = '${warrantiesMigrationName}'
);
`;

// Group `seoContent` trên collection Categories (khối bài SEO ở landing /<slug>).
// Categories KHÔNG bật versions.drafts nên không cần bảng _categories_v song song.
const categorySeoContentSQL = `
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_enabled" boolean DEFAULT true;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_heading" varchar;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_show_toc" boolean DEFAULT true;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_toc_title" varchar DEFAULT 'Xem nhanh';
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_body" jsonb;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_seo_title" varchar;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_seo_description" varchar;
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "seo_content_seo_no_index" boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS "categories_seo_content_faqs" (
  "_order" integer NOT NULL,
  "_parent_id" integer NOT NULL,
  "id" varchar PRIMARY KEY NOT NULL,
  "question" varchar,
  "answer" varchar
);

DO $$ BEGIN
  ALTER TABLE "categories_seo_content_faqs" ADD CONSTRAINT "categories_seo_content_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "categories_seo_content_faqs_order_idx" ON "categories_seo_content_faqs" USING btree ("_order");
CREATE INDEX IF NOT EXISTS "categories_seo_content_faqs_parent_id_idx" ON "categories_seo_content_faqs" USING btree ("_parent_id");

INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '${categorySeoContentMigrationName}', 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" WHERE "name" = '${categorySeoContentMigrationName}'
);
`;

async function applyCategorySeoContent(client) {
  await client.query("BEGIN");
  try {
    await client.query(categorySeoContentSQL);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${categorySeoContentMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 20260828 — Thêm loại sản phẩm IoT độc lập với "networking".
// Dùng profile `iot` với mảng `specs[]` linh hoạt ở giai đoạn catalog đầu; chưa
// tạo các cột thông số cố định khi dữ liệu hãng chưa được crawl/chuẩn hóa đầy đủ.
// ALTER TYPE phải chạy ngoài transaction; các câu còn lại được bọc transaction.
async function applyIotProductType(client) {
  await client.query(`alter type "enum_product_types_code" add value if not exists 'iot'`);
  await client.query(`alter type "enum_products_spec_profile" add value if not exists 'iot'`);
  await client.query(
    `alter type "enum__products_v_version_spec_profile" add value if not exists 'iot'`,
  );

  await client.query("BEGIN");
  try {
    await client.query(`
      INSERT INTO "product_types" ("code", "name", "description", "schema_version", "status", "updated_at", "created_at")
      VALUES (
        'iot',
        'Thiết bị IoT & Công nghiệp',
        'Mô-đun IoT, gateway, thiết bị truyền dữ liệu và giải pháp IoT năng lượng mặt trời cho doanh nghiệp.',
        1,
        'active',
        now(),
        now()
      )
      ON CONFLICT ("code") DO UPDATE SET
        "name" = excluded."name",
        "description" = excluded."description",
        "schema_version" = excluded."schema_version",
        "status" = excluded."status",
        "updated_at" = now();

      INSERT INTO "payload_migrations" ("name", "batch", "updated_at", "created_at")
      SELECT '${iotProductTypeMigrationName}', 0, now(), now()
      WHERE NOT EXISTS (
        SELECT 1 FROM "payload_migrations" WHERE "name" = '${iotProductTypeMigrationName}'
      );
    `);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${iotProductTypeMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function applyWarrantiesMigration(client) {
  await client.query("BEGIN");
  try {
    await client.query(warrantiesSQL);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${warrantiesMigrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  }
}

async function main() {
  const client = new Client({ connectionString });

  await client.connect();
  try {
    await applyCertificationsMigration(client);
    await applyNetworkingCameraProductTypes(client);
    await applyQuoteRequestsMigration(client);
    await applyPseoLandingPagesMigration(client);
    await applyDesktopServerCatalogMigration(client);
    await applyPhotocopierSpecsNormalization(client);
    await applyImagingProductType(client);
    await applyUsersApiKey(client);
    await applyWarrantiesMigration(client);
    await applyCategorySeoContent(client);
    await applyIotProductType(client);
  } catch (error) {
    console.error("[startup-migrations] Failed.", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
