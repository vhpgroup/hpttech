import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const LOGOS = {
  Microsoft: "https://placehold.co/600x400/png?text=Microsoft+Software",
  Windows: "https://placehold.co/600x400/png?text=Microsoft+Software",
  Office: "https://placehold.co/600x400/png?text=Microsoft+Software",
  Kaspersky: "https://placehold.co/600x400/png?text=Kaspersky+Software",
  Canva: "https://placehold.co/600x400/png?text=Canva+Pro",
};

function productName(product: unknown) {
  if (!product || typeof product !== "object") return "";
  const record = product as Record<string, unknown>;
  return String(record.name || record.title || "");
}

function numericPayloadID(value: unknown) {
  const id =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value)
        ? Number(value)
        : undefined;
  return Number.isFinite(id) ? id : undefined;
}

function detectSoftwareBrand(name: string) {
  if (
    name.includes("Microsoft") ||
    name.includes("Windows") ||
    name.includes("Office") ||
    name.includes("SQL")
  ) {
    return "Microsoft";
  }
  if (name.includes("Kaspersky") || name.includes("virut")) return "Kaspersky";
  if (name.includes("Canva")) return "Canva";
  return "";
}

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();

  const products = await payload.find({
    collection: "products",
    limit: 1000,
    where: {
      or: [{ images: { equals: null } }, { images: { exists: false } }],
    },
  });

  console.log(`Found ${products.totalDocs} products without images.`);

  const uploadedMedia: Record<string, number> = {};
  let count = 0;

  for (const product of products.docs) {
    const name = productName(product);
    const brandName = detectSoftwareBrand(name);

    if (!brandName || !LOGOS[brandName as keyof typeof LOGOS]) {
      console.log(`Skip product without clear software brand: ${name}`);
      continue;
    }

    try {
      let mediaId = uploadedMedia[brandName];

      if (!mediaId) {
        console.log(`Uploading logo ${brandName}...`);
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

        mediaId = numericPayloadID(media.id) || 0;
        if (!mediaId) throw new Error(`Invalid media ID: ${String(media.id)}`);
        uploadedMedia[brandName] = mediaId;
      }

      await payload.update({
        collection: "products",
        data: {
          images: [mediaId],
        },
        id: product.id,
      });

      console.log(`Updated image for product: ${name}`);
      count += 1;
    } catch (err) {
      console.error(`Failed to update product ${name}:`, err);
    }
  }

  console.log(`Updated images for ${count} software products.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
