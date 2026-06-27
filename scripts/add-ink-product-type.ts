import { loadEnvConfig } from "@next/env";
import pg from "pg";

loadEnvConfig(process.cwd());

async function main() {
  const databaseUri = process.env.DATABASE_URI || "";
  if (!databaseUri) throw new Error("Missing DATABASE_URI.");

  const client = new pg.Client({ connectionString: databaseUri });
  await client.connect();
  try {
    await client.query(
      `alter type "enum_product_types_code" add value if not exists 'ink'`,
    );
    console.log(JSON.stringify({ ok: true, added: "ink" }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
