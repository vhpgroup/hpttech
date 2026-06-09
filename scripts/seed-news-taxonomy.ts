import type { Where } from "payload";
import { loadEnvConfig } from "@next/env";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

loadEnvConfig(process.cwd());

type TaxonomyNode = {
  name: string;
  children?: TaxonomyNode[];
};

const newsCategories: TaxonomyNode[] = [
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

const downloadCategories = ["Driver", "User Manual", "Datasheet", "Firmware", "Catalogue"];
const postTags = ["HP", "Canon", "Brother", "Ricoh", "hướng dẫn", "khắc phục lỗi", "so sánh", "bảo trì"];

type PayloadClient = Awaited<ReturnType<typeof import("../lib/payload.ts").getPayloadClient>>;

async function findOne(payload: PayloadClient, collection: string, where: Where) {
  const result = await payload.find({
    collection: collection as never,
    depth: 0,
    limit: 1,
    where,
  });
  return result.docs[0] as { id: string | number } | undefined;
}

async function upsertPostCategory(
  payload: PayloadClient,
  node: TaxonomyNode,
  parent?: string | number,
  sortOrder = 0,
) {
  const slug = formatSlug(node.name);
  const existing = await findOne(payload, "post-categories", parent ? { and: [{ slug: { equals: slug } }, { parent: { equals: parent } }] } : { slug: { equals: slug } });
  const data = { name: node.name, slug, parent, sortOrder };
  const doc = existing
    ? await payload.update({ collection: "post-categories" as never, id: existing.id, data })
    : await payload.create({ collection: "post-categories" as never, data });

  for (const [index, child] of (node.children || []).entries()) {
    await upsertPostCategory(payload, child, doc.id, index);
  }
}

async function upsertSimpleCollection(payload: PayloadClient, collection: string, name: string, sortOrder: number) {
  const slug = formatSlug(name);
  const existing = await findOne(payload, collection, { slug: { equals: slug } });
  const data = { name, slug, sortOrder };
  if (existing) {
    await payload.update({ collection: collection as never, id: existing.id, data });
  } else {
    await payload.create({ collection: collection as never, data });
  }
}

async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();

  for (const [index, node] of newsCategories.entries()) {
    console.log(`Seeding news category: ${node.name}`);
    await upsertPostCategory(payload, node, undefined, index);
  }

  for (const [index, name] of postTags.entries()) {
    console.log(`Seeding post tag: ${name}`);
    await upsertSimpleCollection(payload, "post-tags", name, index);
  }

  for (const [index, name] of downloadCategories.entries()) {
    console.log(`Seeding download category: ${name}`);
    await upsertSimpleCollection(payload, "download-categories", name, index);
  }

  console.log("Seeded news taxonomy, post tags, and download categories.");
  await payload.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
