import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd());

/**
 * Upsert product type IoT sau khi migration enum đã được áp dụng.
 *
 * CẢNH BÁO: Script GHI dữ liệu. Chỉ chạy sau khi xác nhận DATABASE_URI trỏ tới
 * DB local/staging hoặc sau khi đã được phê duyệt cho production.
 */
async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();

  const data = {
    code: "iot" as const,
    description:
      "Mô-đun IoT, gateway, thiết bị truyền dữ liệu và giải pháp IoT năng lượng mặt trời cho doanh nghiệp.",
    name: "Thiết bị IoT & Công nghiệp",
    schemaVersion: 1,
    status: "active" as const,
  };

  try {
    const found = await payload.find({
      collection: "product-types",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { code: { equals: data.code } },
    });

    const result = found.docs[0]
      ? await payload.update({
          collection: "product-types",
          id: found.docs[0].id,
          data,
          overrideAccess: true,
        })
      : await payload.create({
          collection: "product-types",
          data,
          overrideAccess: true,
        });

    console.log(JSON.stringify({ id: result.id, ok: true, productType: data.code }, null, 2));
  } finally {
    await payload.destroy();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });