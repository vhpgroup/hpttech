import { loadEnvConfig } from "@next/env";
import type { Where } from "payload";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

loadEnvConfig(process.cwd());

type CategoryNode = {
  name: string;
  children?: CategoryNode[];
};

const categories: CategoryNode[] = [
  {
    name: "Tin công nghệ",
    children: [
      { name: "Xu hướng công nghệ" },
      { name: "AI & Tự động hóa" },
      { name: "Bảo mật" },
      { name: "Thị trường thiết bị" },
      { name: "Mẹo & kiến thức công nghệ" },
    ],
  },
  {
    name: "Thiết bị & Giải pháp văn phòng",
    children: [
      { name: "Máy in" },
      { name: "Máy scan" },
      { name: "Máy photocopy" },
      { name: "Máy hủy tài liệu" },
      { name: "Máy in mã vạch" },
      { name: "Máy quét mã vạch" },
      { name: "Thiết bị chấm công" },
      { name: "Kiểm soát ra vào" },
    ],
  },
  {
    name: "Hạ tầng & CNTT Doanh nghiệp",
    children: [
      { name: "Máy chủ" },
      { name: "NAS & Lưu trữ" },
      { name: "Thiết bị mạng" },
      { name: "WiFi doanh nghiệp" },
      { name: "Camera giám sát" },
      { name: "Hội nghị truyền hình" },
      { name: "Data Center" },
      { name: "Triển khai hạ tầng CNTT" },
    ],
  },
  {
    name: "Chuyển đổi số & Giải pháp",
    children: [
      { name: "Số hóa tài liệu" },
      { name: "OCR & AI" },
      { name: "Quản lý tài liệu" },
      { name: "Tự động hóa quy trình" },
      { name: "Lưu trữ dữ liệu" },
      { name: "Giáo dục số" },
    ],
  },
  {
    name: "Dự án & Case Study",
    children: [
      { name: "Khối doanh nghiệp" },
      { name: "Cơ quan nhà nước" },
      { name: "Trường học" },
      { name: "Bệnh viện" },
      { name: "Nhà máy" },
      { name: "Ngân hàng" },
    ],
  },
  {
    name: "Tin tức HPT",
    children: [
      { name: "Tin công ty" },
      { name: "Tin đối tác" },
      { name: "Tuyển dụng" },
      { name: "Sự kiện" },
      { name: "Thông báo" },
      { name: "Chứng nhận & Giải thưởng" },
    ],
  },
];

const legacyTopLevelCategories = [
  {
    fullSlug: "thiet-bi-va-giai-phap-van-phong",
    fullTitle: "Thiết bị & Giải pháp văn phòng",
    name: "Thiết bị & Giải pháp văn phòng",
    sortOrder: 1,
  },
  {
    fullSlug: "ha-tang-cntt-doanh-nghiep",
    fullTitle: "Hạ tầng & CNTT Doanh nghiệp",
    name: "Hạ tầng & CNTT Doanh nghiệp",
    sortOrder: 2,
  },
  {
    fullSlug: "chuyen-doi-so-va-giai-phap",
    fullTitle: "Chuyển đổi số & Giải pháp",
    name: "Chuyển đổi số & Giải pháp",
    sortOrder: 3,
  },
  {
    fullSlug: "du-an-va-case-study",
    fullTitle: "Dự án & Case Study",
    name: "Dự án & Case Study",
    sortOrder: 4,
  },
];

type PayloadClient = Awaited<ReturnType<typeof import("../lib/payload.ts").getPayloadClient>>;
type CategoryDoc = {
  id: string | number;
  name?: string;
  slug?: string;
  fullTitle?: string;
  fullSlug?: string;
  parent?: string | number | { id?: string | number } | null;
};

async function findBySlug(payload: PayloadClient, slug: string, parent?: string | number) {
  const where: Where = parent
    ? { and: [{ slug: { equals: slug } }, { parent: { equals: parent } }] }
    : { and: [{ slug: { equals: slug } }, { parent: { exists: false } }] };

  const result = await payload.find({
    collection: "post-categories",
    depth: 0,
    limit: 1,
    where,
  });

  if (result.docs[0]) return result.docs[0] as CategoryDoc;

  const fallback = await payload.find({
    collection: "post-categories",
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  });

  return fallback.docs[0] as CategoryDoc | undefined;
}

async function upsertCategory(
  payload: PayloadClient,
  node: CategoryNode,
  sortOrder: number,
  parent?: CategoryDoc,
) {
  const slug = formatSlug(node.name);
  const parentID = parent?.id;
  const fullTitle = [parent?.fullTitle || parent?.name, node.name].filter(Boolean).join(" > ");
  const fullSlug = [parent?.fullSlug || parent?.slug, slug].filter(Boolean).join("/");
  const existing = await findBySlug(payload, slug, parentID);
  const data = {
    name: node.name,
    slug,
    parent: parentID || null,
    fullTitle,
    fullSlug,
    sortOrder,
  };
  const doc = existing
    ? ((await payload.update({ collection: "post-categories", id: existing.id, data })) as CategoryDoc)
    : ((await payload.create({ collection: "post-categories", data })) as CategoryDoc);

  console.log(`${existing ? "Updated" : "Created"} ${fullTitle} -> ${fullSlug}`);

  for (const [index, child] of (node.children || []).entries()) {
    await upsertCategory(payload, child, index, doc);
  }
}

async function removeLegacyDriverCategory(payload: PayloadClient) {
  const legacy = await findBySlug(payload, "driver-va-tai-lieu");
  if (!legacy) return;

  const posts = await payload.find({
    collection: "posts",
    depth: 0,
    limit: 1,
    where: { category: { equals: legacy.id } },
  });

  if (posts.totalDocs > 0) {
    console.log("Kept legacy Driver & Tài liệu category because posts reference it.");
    return;
  }

  await payload.delete({ collection: "post-categories", id: legacy.id });
  console.log("Deleted legacy Driver & Tài liệu category from news taxonomy.");
}

async function repairLegacyTopLevelCategories(payload: PayloadClient) {
  for (const category of legacyTopLevelCategories) {
    const result = await payload.find({
      collection: "post-categories",
      depth: 0,
      limit: 1,
      where: {
        slug: {
          equals: category.fullSlug,
        },
      },
    });
    const doc = result.docs[0] as CategoryDoc | undefined;
    if (!doc) continue;

    await payload.update({
      collection: "post-categories",
      id: doc.id,
      data: {
        name: category.name,
        fullTitle: category.fullTitle,
        fullSlug: category.fullSlug,
        sortOrder: category.sortOrder,
      },
    });
    console.log(`Repaired legacy category ${category.fullTitle} -> ${category.fullSlug}`);
  }
}

function titleFromSlug(slug?: string) {
  if (!slug) return "Danh mục chưa đặt tên";
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function repairAnyMissingTitles(payload: PayloadClient) {
  const missing = await payload.find({
    collection: "post-categories",
    depth: 0,
    limit: 100,
    where: {
      or: [{ fullTitle: { exists: false } }, { fullTitle: { equals: "" } }],
    },
  });

  for (const doc of missing.docs as CategoryDoc[]) {
    const fallbackTitle = doc.name || titleFromSlug(doc.slug);
    const fallbackSlug = doc.fullSlug || doc.slug || formatSlug(fallbackTitle);
    await payload.update({
      collection: "post-categories",
      id: doc.id,
      data: {
        name: fallbackTitle,
        fullTitle: fallbackTitle,
        fullSlug: fallbackSlug,
      },
    });
    console.log(`Fallback repaired missing category title ${doc.id} -> ${fallbackTitle}`);
  }
}

async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();

  for (const [index, category] of categories.entries()) {
    await upsertCategory(payload, category, index);
  }

  await repairLegacyTopLevelCategories(payload);
  await removeLegacyDriverCategory(payload);
  await repairAnyMissingTitles(payload);

  const missing = await payload.find({
    collection: "post-categories",
    depth: 0,
    limit: 100,
    where: {
      or: [{ fullTitle: { exists: false } }, { fullTitle: { equals: "" } }],
    },
  });
  console.log(`Categories still missing fullTitle: ${missing.totalDocs}`);

  await payload.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
