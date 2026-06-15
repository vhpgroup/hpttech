import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { getPayloadClient } from "../lib/payload";

async function main() {
  const payload = await getPayloadClient();
  const products = await payload.find({
    collection: "products",
    limit: 1000,
    sort: "-createdAt"
  });

  const noImages = products.docs.filter(p => !p.images || p.images.length === 0);
  console.log(`Total products: ${products.docs.length}`);
  console.log(`Products without images: ${noImages.length}`);
  if (noImages.length > 0) {
    console.log("Example:", noImages[0].title);
  }
  process.exit(0);
}

main().catch(console.error);
