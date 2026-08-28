import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd());

/**
 * Seed taxonomy IoT ban đầu. Idempotent theo slug.
 *
 * CẢNH BÁO: Script GHI dữ liệu. Chỉ chạy sau khi xác nhận DATABASE_URI trỏ tới
 * DB local/staging hoặc sau khi đã được phê duyệt cho production.
 *
 * Cây giai đoạn 1:
 *   Thiết bị IoT & Công nghiệp
 *   ├─ Mô-đun IoT
 *   ├─ Thiết bị IoT
 *   └─ IoT năng lượng mặt trời
 *
 * Không tạo node sâu theo tên sản phẩm trước khi crawl/xác minh thông số.
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
    "Thiết bị IoT và công nghiệp cho kết nối, truyền dữ liệu, giám sát từ xa và các giải pháp năng lượng.",
  icon: "cpu",
  name: "Thiết bị IoT & Công nghiệp",
  slug: "thiet-bi-iot-cong-nghiep",
  sortOrder: 0,
};

const CHILD_SEEDS: CategorySeed[] = [
  {
    description: "Mô-đun kết nối và truyền thông IoT cho các dự án nhúng, tự động hóa và công nghiệp.",
    icon: "component",
    name: "Mô-đun IoT",
    slug: "mo-dun-iot",
    sortOrder: 1,
  },
  {
    description: "Gateway, bộ chuyển đổi, router công nghiệp và thiết bị truyền dữ liệu cho hệ thống IoT.",
    icon: "router",
    name: "Thiết bị IoT",
    slug: "thiet-bi-iot",
    sortOrder: 2,
  },
  {
    description: "Thiết bị kết nối, giám sát và truyền dữ liệu cho hệ thống IoT năng lượng mặt trời.",
    icon: "sun",
    name: "IoT năng lượng mặt trời",
    slug: "iot-nang-luong-mat-troi",
    sortOrder: 3,
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
    const results: Array<{ id: ID; slug: string }> = [{ id: rootID, slug: ROOT_SEED.slug }];

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
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });