import { Client } from "pg";

const REQUIRED_TABLES = [
  "products",
  "product_types",
  "product_variants",
  "product_offers",
  "product_inventory",
  "scraper_jobs",
  "enterprise_services",
] as const;

export async function assertScraperDatabaseReady() {
  const connectionString =
    process.env.DATABASE_URI ||
    process.env.POSTGRES_URL ||
    "postgres://payload:payload@127.0.0.1:5433/hpttech_payload";
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: Number(
      process.env.SCRAPER_DB_TIMEOUT_MS || 5000,
    ),
  });

  try {
    await client.connect();
    const result = await client.query<Record<string, string | null>>(
      `select ${REQUIRED_TABLES.map(
        (table) => `to_regclass('public.${table}')::text as ${table}`,
      ).join(", ")}`,
    );
    const row = result.rows[0] || {};
    const missing = REQUIRED_TABLES.filter((table) => !row[table]);
    if (missing.length) {
      throw new Error(
        `Payload schema chua san sang. Thieu bang: ${missing.join(", ")}.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Khong the khoi tao bulk import database: ${message}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}
