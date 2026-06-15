import { loadEnvConfig } from "@next/env";
import pg from "pg";

loadEnvConfig(process.cwd());

async function main() {
  const databaseUri = process.env.DATABASE_URI || "";
  if (!databaseUri) throw new Error("Missing DATABASE_URI.");

  const client = new pg.Client({ connectionString: databaseUri });
  await client.connect();
  try {
    const enumResult = await client.query<{ typname: string }>(`
      select distinct t.typname
      from pg_type t
      join pg_enum e on t.oid = e.enumtypid
      where t.typname = 'enum_product_types_code'
         or t.typname like '%spec_profile%'
      order by t.typname
    `);

    for (const { typname } of enumResult.rows) {
      if (!/^[a-z0-9_]+$/.test(typname)) {
        throw new Error(`Unsafe enum name: ${typname}`);
      }
      await client.query(
        `alter type "${typname}" add value if not exists 'software'`,
      );
    }

    console.log(
      JSON.stringify({
        updatedEnums: enumResult.rows.map((row) => row.typname),
      }),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
