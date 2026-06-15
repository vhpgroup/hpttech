import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const LOGOS = {
  Microsoft: "https://placehold.co/600x400/png?text=Microsoft+Software",
  Windows: "https://placehold.co/600x400/png?text=Microsoft+Software",
  Office: "https://placehold.co/600x400/png?text=Microsoft+Software",
  Kaspersky: "https://placehold.co/600x400/png?text=Kaspersky+Software",
  Canva: "https://placehold.co/600x400/png?text=Canva+Pro",
};

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();

  const products = await payload.find({
    collection: "products",
    where: {
      or: [
        { images: { equals: null } },
        { images: { exists: false } }
      ]
    },
    limit: 1000,
  });

  console.log(`Tìm thấy ${products.totalDocs} sản phẩm không có ảnh.`);

  // Cache uploaded media by brand to avoid duplicate uploads
  const uploadedMedia: Record<string, string> = {};

  let count = 0;

  for (const product of products.docs) {
    let brandName = "";
    if (product.name.includes("Microsoft") || product.name.includes("Windows") || product.name.includes("Office") || product.name.includes("SQL")) {
      brandName = "Microsoft";
    } else if (product.name.includes("Kaspersky") || product.name.includes("virut")) {
      brandName = "Kaspersky";
    } else if (product.name.includes("Canva")) {
      brandName = "Canva";
    }

    if (brandName && LOGOS[brandName as keyof typeof LOGOS]) {
      try {
        let mediaId = uploadedMedia[brandName];

        if (!mediaId) {
          console.log(`Đang tải logo ${brandName}...`);
          const url = LOGOS[brandName as keyof typeof LOGOS];
          const response = await fetch(url);
          const buffer = await response.arrayBuffer();

          const media = await payload.create({
            collection: "media",
            data: { alt: `Logo ${brandName}` },
            file: {
              data: Buffer.from(buffer),
              mimetype: "image/png",
              name: `${brandName.toLowerCase()}-logo.png`,
              size: buffer.byteLength,
            },
          });
          
          // Workaround: payload.create might not insert generated URL correctly in scripts without explicit update depending on hooks
          // Actually, our R2 generation URL hook was added in s3Storage, it should work for newly created items.
          
          mediaId = media.id as string;
          uploadedMedia[brandName] = mediaId;
        }

        await payload.update({
          collection: "products",
          id: product.id,
          data: {
            images: [mediaId],
          },
        });
        
        console.log(`Đã cập nhật ảnh cho sản phẩm: ${product.name}`);
        count++;
      } catch (err) {
        console.error(`Lỗi cập nhật sản phẩm ${product.name}:`, err);
      }
    } else {
      console.log(`Bỏ qua sản phẩm không rõ brand: ${product.name}`);
    }
  }

  console.log(`Đã cập nhật ảnh thành công cho ${count} sản phẩm phần mềm.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
