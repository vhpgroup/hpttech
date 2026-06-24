const { Client } = require("pg");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const connectionString =
  process.env.DATABASE_URI ||
  process.env.POSTGRES_URL ||
  "postgres://payload:payload@127.0.0.1:5433/hpttech_payload";

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalize(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function isRetailerServiceSpec(spec) {
  const label = normalize(spec && spec.label);
  const value = normalize(spec && spec.value);
  if (!label && !value) return false;

  return (
    (/^(bao hanh|warranty)$/.test(label) && /\b(vietbis|03 thang|3 thang|tai vietbis)\b/.test(value)) ||
    /^(giao hang|van chuyen|shipping|delivery)$/.test(label) ||
    /^(hotline|doi tra|ho tro|dich vu ho tro)$/.test(label) ||
    /\b(vietbis|mien phi ha noi|hotline|doi tra|nguyen dai|nguyen kien|ho tro 24\/?7|giao hang toan quoc)\b/.test(value)
  );
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query(
      `
        select
          ps.id,
          ps._parent_id as "productId",
          ps.label,
          ps.value,
          p.title
        from products_specs ps
        join products p on p.id = ps._parent_id
        order by ps._parent_id, ps._order
      `,
    );
    let scanned = 0;
    const removable = [];
    const samples = [];

    for (const row of result.rows) {
      scanned += 1;
      if (!isRetailerServiceSpec(row)) continue;
      removable.push(row);
      samples.push({
        label: row.label,
        productId: row.productId,
        title: row.title,
        value: row.value,
      });
    }

    if (!dryRun && removable.length) {
      const ids = removable.map((row) => row.id);
      const productIds = [...new Set(removable.map((row) => row.productId))];
      await client.query("delete from products_specs where id = any($1::text[])", [ids]);
      await client.query(
        "update products set updated_at = now() where id = any($1::int[])",
        [productIds],
      );
    }

    console.log(JSON.stringify({
      dryRun,
      productsChanged: new Set(removable.map((row) => row.productId)).size,
      removedSpecs: removable.length,
      samples: samples.slice(0, 20),
      scanned,
    }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
