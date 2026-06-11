import { loadEnvConfig } from "@next/env";
import { getPayload } from "payload";
import configPromise from "../payload.config";

loadEnvConfig(process.cwd());

async function clearDB() {
  const payload = await getPayload({ config: configPromise });

  const inventory = await payload.delete({
    collection: "product-inventory",
    overrideAccess: true,
    where: { id: { exists: true } },
  });
  const offers = await payload.delete({
    collection: "product-offers",
    overrideAccess: true,
    where: { id: { exists: true } },
  });
  const aiMetadata = await payload.delete({
    collection: "product-ai-metadata",
    overrideAccess: true,
    where: { id: { exists: true } },
  });
  const variants = await payload.delete({
    collection: "product-variants",
    overrideAccess: true,
    where: { id: { exists: true } },
  });
  const scraperJobs = await payload.delete({
    collection: "scraper-jobs",
    overrideAccess: true,
    where: { id: { exists: true } },
  });
  const products = await payload.delete({
    collection: "products",
    overrideAccess: true,
    where: { id: { exists: true } },
  });
  const scraperMedia = await payload.delete({
    collection: "media",
    overrideAccess: true,
    where: { folder: { equals: "scraper/products" } },
  });

  console.log(
    JSON.stringify(
      {
        aiMetadata: aiMetadata.docs.length,
        inventory: inventory.docs.length,
        offers: offers.docs.length,
        products: products.docs.length,
        scraperJobs: scraperJobs.docs.length,
        scraperMedia: scraperMedia.docs.length,
        variants: variants.docs.length,
      },
      null,
      2,
    ),
  );
}

clearDB().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
