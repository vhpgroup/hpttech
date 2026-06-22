const { Client } = require("pg");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const connectionString =
  process.env.DATABASE_URI ||
  process.env.POSTGRES_URL ||
  "postgres://payload:payload@127.0.0.1:5433/hpttech_payload";

const statements = [
  "create extension if not exists pg_trgm",
  `
    create index concurrently if not exists products_published_category_updated_idx
    on products (status, _status, category_id, updated_at desc)
  `,
  `
    create index concurrently if not exists products_published_brand_updated_idx
    on products (status, _status, brand_id, updated_at desc)
  `,
  `
    create index concurrently if not exists product_variants_product_primary_status_idx
    on product_variants (product_id, is_primary, status)
  `,
  `
    create index concurrently if not exists product_offers_variant_sale_updated_idx
    on product_offers (variant_id, sale_status, updated_at desc)
  `,
  `
    create index concurrently if not exists products_search_name_sku_model_trgm_idx
    on products using gin (
      lower(
        coalesce(name, '') || ' ' ||
        coalesce(sku, '') || ' ' ||
        coalesce(model, '')
      ) gin_trgm_ops
    )
  `,
];

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const statement of statements) {
      const normalized = statement.replace(/\s+/g, " ").trim();
      process.stdout.write(`Ensuring index: ${normalized.slice(0, 96)}...\n`);
      await client.query(statement);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
