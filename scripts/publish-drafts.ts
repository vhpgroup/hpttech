import { getPayload } from "payload";
import configPromise from "../payload.config";

async function main() {
  const payload = await getPayload({ config: configPromise });
  const drafts = await payload.find({
    collection: "products",
    where: { _status: { equals: "draft" } },
    depth: 0,
    limit: 5,
  });

  console.log(`Found ${drafts.docs.length} draft products.`);

  for (const doc of drafts.docs) {
    try {
      console.log(`Publishing: ${doc.title}...`);
      await payload.update({
        collection: "products",
        id: doc.id,
        data: { _status: "published" },
      });
      console.log(`  => Success: ${doc.title} is now published.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  => Failed to publish ${doc.title}: ${message}`);
    }
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
