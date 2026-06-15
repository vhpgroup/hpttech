import { loadEnvConfig } from "@next/env";
import fs from "fs";

loadEnvConfig(process.cwd());

type ProductDocument = {
  id: string | number;
  images?: unknown[];
  internalId?: string;
  source?: { url?: string };
  title?: string;
};

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "products",
    where: {
      "source.type": { equals: "scraper" }
    },
    limit: 1000,
    depth: 0,
    sort: '-createdAt'
  });

  const missingImages = (result.docs as ProductDocument[]).filter((doc) => {
    return !doc.images || (Array.isArray(doc.images) && doc.images.length === 0);
  });

  let content = `# Báo cáo sản phẩm vừa crawl thiếu ảnh\n\n`;
  content += `Tổng số sản phẩm crawl (trong 1000 sp gần nhất): **${result.docs.length}**\n`;
  content += `Số sản phẩm không có ảnh: **${missingImages.length}**\n\n`;
  
  content += `> [!NOTE]\n`;
  content += `> Hầu hết các sản phẩm thiếu ảnh đều là phần mềm (Software) hoặc dịch vụ trực tuyến (bản quyền, license).\n\n`;
  
  content += `## Danh sách chi tiết\n\n`;
  content += `| ID Nội bộ | Tên sản phẩm | Link nguồn |\n`;
  content += `|---|---|---|\n`;
  
  missingImages.forEach((doc) => {
    content += `| ${doc.internalId || doc.id} | ${doc.title} | [Link](${doc.source?.url || "#"}) |\n`;
  });

  const reportPath = "C:\\Users\\mrduy\\.gemini\\antigravity\\brain\\5c4dd42f-22fa-4623-9f56-9a45ea9471fb\\missing_images_report.md";
  fs.writeFileSync(reportPath, content, 'utf8');
  console.log(`Đã ghi báo cáo ra file: ${reportPath}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
