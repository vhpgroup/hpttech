import { loadEnvConfig } from "@next/env";

import {
  ALL_IN_ONE_CATEGORY_NAME,
  ALL_IN_ONE_CATEGORY_SLUG,
  DESKTOP_PC_CATEGORY_NAME,
  DESKTOP_PC_CATEGORY_SLUG,
  INDUSTRIAL_PC_CATEGORY_NAME,
  INDUSTRIAL_PC_CATEGORY_SLUG,
  MINI_PC_CATEGORY_NAME,
  MINI_PC_CATEGORY_SLUG,
  PC_SERVER_ROOT_CATEGORY_NAME,
  PC_SERVER_ROOT_CATEGORY_SLUG,
  SERVER_CATEGORY_NAME,
  SERVER_CATEGORY_SLUG,
  SERVER_COMPONENT_CATEGORY_NAME,
  SERVER_COMPONENT_CATEGORY_SLUG,
  WORKSTATION_CATEGORY_NAME,
  WORKSTATION_CATEGORY_SLUG,
} from "../lib/product-category";

loadEnvConfig(process.cwd());

/**
 * Seed cây danh mục "Máy tính đồng bộ - Máy chủ" (dùng field parent của
 * collection categories). Idempotent: upsert theo slug, chạy lại an toàn.
 *
 * Cây:
 *   Máy tính đồng bộ - Máy chủ (node cha)
 *   ├─ PC đồng bộ
 *   ├─ PC All-in-One
 *   ├─ Mini PC - NUC
 *   ├─ Máy trạm Workstation
 *   ├─ Máy chủ - Server
 *   ├─ Linh kiện máy chủ
 *   └─ Máy tính công nghiệp
 *
 * Đây là các node LÁ mà scraper map sản phẩm vào (khớp
 * pcServerCategoryNameForType trong lib/scraper/pc-server-taxonomy.ts).
 * CPU/RAM/Ổ cứng/Hãng KHÔNG phải danh mục — chúng là thuộc tính/brand.
 *
 * CẢNH BÁO (AGENTS.md §10): script GHI dữ liệu — xác nhận DATABASE_URI trỏ đúng
 * DB local/staging trước khi chạy. Không chạy trên prod khi chưa được xác nhận.
 *
 * Cách chạy: npm run payload:seed-desktop-server-categories
 */

type ID = string | number;

type CategorySeed = {
  description: string;
  icon: string;
  name: string;
  slug: string;
  sortOrder: number;
};

const ROOT_SEED: CategorySeed = {
  description:
    "Máy tính đồng bộ, All-in-One, mini PC, máy trạm, máy chủ và linh kiện máy chủ chính hãng cho doanh nghiệp.",
  icon: "monitor",
  name: PC_SERVER_ROOT_CATEGORY_NAME,
  slug: PC_SERVER_ROOT_CATEGORY_SLUG,
  sortOrder: 0,
};

const CHILD_SEEDS: CategorySeed[] = [
  {
    description:
      "PC đồng bộ chính hãng HP, Dell, Lenovo, ASUS cho văn phòng và doanh nghiệp.",
    icon: "monitor",
    name: DESKTOP_PC_CATEGORY_NAME,
    slug: DESKTOP_PC_CATEGORY_SLUG,
    sortOrder: 1,
  },
  {
    description: "Máy tính All-in-One tích hợp màn hình, gọn gàng cho văn phòng.",
    icon: "monitor-dot",
    name: ALL_IN_ONE_CATEGORY_NAME,
    slug: ALL_IN_ONE_CATEGORY_SLUG,
    sortOrder: 2,
  },
  {
    description: "Máy tính mini, ASUS NUC các thế hệ 12/13/14/15.",
    icon: "box",
    name: MINI_PC_CATEGORY_NAME,
    slug: MINI_PC_CATEGORY_SLUG,
    sortOrder: 3,
  },
  {
    description: "Máy trạm workstation cho đồ họa, kỹ thuật, dựng phim và AI.",
    icon: "cpu",
    name: WORKSTATION_CATEGORY_NAME,
    slug: WORKSTATION_CATEGORY_SLUG,
    sortOrder: 4,
  },
  {
    description: "Máy chủ nguyên chiếc Dell, HP, Lenovo/IBM cho doanh nghiệp.",
    icon: "server",
    name: SERVER_CATEGORY_NAME,
    slug: SERVER_CATEGORY_SLUG,
    sortOrder: 5,
  },
  {
    description:
      "Linh kiện máy chủ: CPU, RAM, ổ cứng, VGA, RAID, mainboard, nguồn.",
    icon: "hard-drive",
    name: SERVER_COMPONENT_CATEGORY_NAME,
    slug: SERVER_COMPONENT_CATEGORY_SLUG,
    sortOrder: 6,
  },
  {
    description: "Máy tính công nghiệp bền bỉ cho môi trường sản xuất.",
    icon: "factory",
    name: INDUSTRIAL_PC_CATEGORY_NAME,
    slug: INDUSTRIAL_PC_CATEGORY_SLUG,
    sortOrder: 7,
  },
];

async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();

  async function upsertCategory(seed: CategorySeed, parent?: ID) {
    const found = await payload.find({
      collection: "categories",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { slug: { equals: seed.slug } },
    });

    const data = {
      description: seed.description,
      icon: seed.icon,
      name: seed.name,
      parent: parent ?? null,
      slug: seed.slug,
      sortOrder: seed.sortOrder,
    };

    const result = found.docs[0]
      ? await payload.update({
          collection: "categories",
          id: found.docs[0].id,
          data,
          overrideAccess: true,
        })
      : await payload.create({
          collection: "categories",
          data,
          overrideAccess: true,
        });

    return result.id as ID;
  }

  try {
    const rootID = await upsertCategory(ROOT_SEED);
    const results: Array<{ id: ID; slug: string }> = [
      { id: rootID, slug: ROOT_SEED.slug },
    ];

    for (const seed of CHILD_SEEDS) {
      const id = await upsertCategory(seed, rootID);
      results.push({ id, slug: seed.slug });
    }

    console.log(JSON.stringify({ ok: true, categories: results }, null, 2));
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
