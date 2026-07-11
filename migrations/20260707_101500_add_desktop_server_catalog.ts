import { type MigrateDownArgs, type MigrateUpArgs, sql } from "@payloadcms/db-postgres";

const pcServerTypeCodes = [
  "desktop-pc",
  "all-in-one",
  "mini-pc",
  "workstation",
  "industrial-pc",
  "server",
  "server-component",
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const value of pcServerTypeCodes) {
    await db.execute(sql.raw(`ALTER TYPE "public"."enum_product_types_code" ADD VALUE IF NOT EXISTS '${value}';`));
    await db.execute(sql.raw(`ALTER TYPE "public"."enum_products_spec_profile" ADD VALUE IF NOT EXISTS '${value}';`));
    await db.execute(sql.raw(`ALTER TYPE "public"."enum__products_v_version_spec_profile" ADD VALUE IF NOT EXISTS '${value}';`));
  }

  await db.execute(sql`
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
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_ram_gb";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_weight";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_dimensions";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_management";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_network_ports";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_form_factor";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_psu";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_raid";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_drive_bays";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_storage";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_ram_max";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_ram";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_socket";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_server_specs_cpu";

    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_storage_gb";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_ram_gb";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_weight";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_dimensions";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_connectivity";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_os";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_psu";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_form_factor";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_screen_size_inch";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_screen";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_storage";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_ram";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_gpu";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_desktop_specs_cpu";

    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_ram_gb";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_weight";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_dimensions";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_management";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_network_ports";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_form_factor";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_psu";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_raid";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_drive_bays";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_storage";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_ram_max";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_ram";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_socket";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "server_specs_cpu";

    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_storage_gb";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_ram_gb";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_weight";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_dimensions";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_connectivity";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_os";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_psu";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_form_factor";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_screen_size_inch";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_screen";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_storage";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_ram";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_gpu";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "desktop_specs_cpu";
  `);
}
