import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

/**
 * Đăng ký các Product Type cho nhánh "Máy tính đồng bộ - Máy chủ" (anphatpc).
 * Idempotent: chạy lại an toàn (upsert theo code).
 *
 * CẢNH BÁO (AGENTS.md §10): script GHI dữ liệu — xác nhận DATABASE_URI trỏ đúng
 * DB local/staging trước khi chạy. Không chạy trên prod khi chưa được xác nhận.
 *
 * Cách chạy: npm run payload:add-desktop-server-types
 */
async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();

  const types = [
    {
      code: "desktop-pc",
      name: "PC đồng bộ",
      description: "Máy tính để bàn đồng bộ chính hãng HP, Dell, Lenovo, ASUS.",
    },
    {
      code: "all-in-one",
      name: "PC All-in-One",
      description: "Máy tính All-in-One tích hợp màn hình.",
    },
    {
      code: "mini-pc",
      name: "Mini PC - NUC",
      description: "Máy tính mini, ASUS NUC các thế hệ.",
    },
    {
      code: "workstation",
      name: "Máy trạm Workstation",
      description: "Máy trạm chuyên dụng cho đồ họa, kỹ thuật, AI.",
    },
    {
      code: "industrial-pc",
      name: "Máy tính công nghiệp",
      description: "Máy tính công nghiệp cho môi trường sản xuất, vận hành.",
    },
    {
      code: "server",
      name: "Máy chủ - Server",
      description: "Máy chủ nguyên chiếc Dell, HP, Lenovo/IBM.",
    },
    {
      code: "server-component",
      name: "Linh kiện máy chủ",
      description: "CPU, RAM, ổ cứng, VGA, RAID, mainboard, nguồn cho máy chủ.",
    },
  ] as const;

  try {
    const results: Array<{ code: string; id: string | number }> = [];

    for (const type of types) {
      const found = await payload.find({
        collection: "product-types",
        depth: 0,
        limit: 1,
        overrideAccess: true,
        where: { code: { equals: type.code } },
      });

      const data = {
        ...type,
        schemaVersion: 1,
        status: "active",
      } as const;

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

      results.push({ code: type.code, id: result.id });
    }

    console.log(JSON.stringify({ ok: true, productTypes: results }));
  } finally {
    await payload.destroy();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
