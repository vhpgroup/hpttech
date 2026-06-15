import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();

  const media = await payload.find({
    collection: "media",
    where: {
      url: { like: "/api/media/file/" }
    },
    limit: 1000,
    depth: 0,
  });

  console.log(`Tìm thấy ${media.totalDocs} media docs cần cập nhật URL...`);

  let updatedCount = 0;
  for (const doc of media.docs) {
    if (typeof doc.url === 'string' && doc.url.startsWith("/api/media/file/")) {
      const newUrl = doc.url.replace("/api/media/file/", "/api/r2-media/");
      await payload.update({
        collection: "media",
        id: doc.id,
        data: {
          url: newUrl
        },
        overrideAccess: true,
      });
      updatedCount++;
    }
  }

  console.log(`Đã cập nhật thành công ${updatedCount} URLs thành /api/r2-media/...`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
