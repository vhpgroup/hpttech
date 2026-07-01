const { Client } = require("pg");

const certificationsMigrationName = "20260626_041300_add_certifications";
const productTypesMigrationName = "20260630_120000_add_networking_camera_product_types";
const quoteRequestsMigrationName = "20260630_180000_add_quote_requests";
const pseoLandingPagesMigrationName = "20260701_082156_pseo_landing_pages";
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

async function main() {
  const client = new Client({ connectionString });

  await client.connect();
  try {
    await applyCertificationsMigration(client);
    await applyNetworkingCameraProductTypes(client);
    await applyQuoteRequestsMigration(client);
    await applyPseoLandingPagesMigration(client);
  } catch (error) {
    console.error("[startup-migrations] Failed.", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
