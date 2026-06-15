import { loadEnvConfig } from "@next/env";
import fs from "fs";
import path from "path";

loadEnvConfig(process.cwd());

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "products",
    where: {
      "source.type": { equals: "scraper" }
    },
    limit: 20,
    depth: 1, 
    sort: '-createdAt'
  });

  console.log(`Kiểm tra ${result.docs.length} sản phẩm scraper gần nhất...`);
  
  for (const doc of result.docs) {
    if (doc.images && Array.isArray(doc.images) && doc.images.length > 0) {
      console.log(`\nSản phẩm: ${doc.title} [${doc.internalId || doc.id}]`);
      for (const img of doc.images) {
        if (typeof img === 'object' && img !== null) {
          console.log(`  - Media ID: ${img.id}, Filename: ${img.filename}, Size: ${img.filesize}, URL: ${img.url}`);
          if (img.filename) {
             const filePath = path.join(process.cwd(), "media", img.filename);
             if (fs.existsSync(filePath)) {
               const stat = fs.statSync(filePath);
               console.log(`    -> [Local File] Tồn tại, size: ${stat.size} bytes`);
             } else {
               console.log(`    -> [Local File] KHÔNG TỒN TẠI: ${filePath}`);
             }
          } else {
            console.log(`    -> LỖI: Không có filename`);
          }
        } else {
           console.log(`  - LỖI: ảnh chỉ có ID: ${img} (có thể media doc đã bị xóa)`);
        }
      }
    } else {
      console.log(`\nSản phẩm: ${doc.title} [${doc.internalId || doc.id}]`);
      console.log(`  -> Trạng thái: Không có ảnh trong mảng images`);
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
