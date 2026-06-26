const { Client } = require("pg");

const migrationName = "20260626_041300_add_certifications";
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
SELECT '${migrationName}', 0, now(), now()
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_migrations" WHERE "name" = '${migrationName}'
);
`;

async function main() {
  const client = new Client({ connectionString });

  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log(`[startup-migrations] Applied ${migrationName}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("[startup-migrations] Failed.", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
