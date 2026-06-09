const { Client } = require("pg");

const databaseURL =
  process.env.DATABASE_URI ||
  process.env.POSTGRES_URL ||
  (!process.env.VERCEL ? "postgres://payload:payload@127.0.0.1:5432/hpttech_payload" : undefined);

const columns = [
  ["products", "summary"],
  ["products", "description"],
  ["products", "usage_guide"],
  ["_products_v", "version_summary"],
  ["_products_v", "version_description"],
  ["_products_v", "version_usage_guide"],
];

function quoteIdent(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function getColumnType(client, tableName, columnName) {
  const result = await client.query(
    `
      select data_type
      from information_schema.columns
      where table_schema = current_schema()
        and table_name = $1
        and column_name = $2
      limit 1
    `,
    [tableName, columnName],
  );

  return result.rows[0]?.data_type;
}

async function migrateColumn(client, tableName, columnName) {
  const dataType = await getColumnType(client, tableName, columnName);

  if (!dataType) {
    console.log(`Skipping missing column ${tableName}.${columnName}`);
    return;
  }

  if (dataType === "jsonb") {
    console.log(`Skipping migrated column ${tableName}.${columnName}`);
    return;
  }

  const table = quoteIdent(tableName);
  const column = quoteIdent(columnName);

  await client.query(`
    alter table ${table}
      alter column ${column} type jsonb
      using case
        when ${column} is null or btrim(${column}::text) = '' then null
        else jsonb_build_object(
          'root',
          jsonb_build_object(
            'type', 'root',
            'format', '',
            'indent', 0,
            'version', 1,
            'children',
            jsonb_build_array(
              jsonb_build_object(
                'type', 'paragraph',
                'format', '',
                'indent', 0,
                'version', 1,
                'children',
                jsonb_build_array(
                  jsonb_build_object(
                    'type', 'text',
                    'text', ${column}::text,
                    'version', 1
                  )
                )
              )
            )
          )
        )
      end;
  `);

  console.log(`Migrated ${tableName}.${columnName} to jsonb`);
}

async function main() {
  if (!databaseURL) {
    throw new Error("Missing DATABASE_URI or POSTGRES_URL for product richText migration.");
  }

  const client = new Client({ connectionString: databaseURL });
  await client.connect();

  try {
    for (const [tableName, columnName] of columns) {
      await migrateColumn(client, tableName, columnName);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
