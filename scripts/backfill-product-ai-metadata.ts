import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

type ProductDocument = {
  brand?: { name?: string } | string | number;
  id: string | number;
  name?: string;
  sellingPoints?: Array<{ text?: string }>;
  source?: { url?: string };
  specs?: Array<{ label?: string; value?: string }>;
  title?: string;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

async function main() {
  const { getPayloadClient } = await import("../lib/payload");
  const payload = await getPayloadClient();
  const [products, metadata] = await Promise.all([
    payload.find({
      collection: "products",
      depth: 1,
      limit: 5000,
      overrideAccess: true,
    }),
    payload.find({
      collection: "product-ai-metadata",
      depth: 0,
      limit: 5000,
      overrideAccess: true,
    }),
  ]);
  const existingProductIds = new Set(
    metadata.docs.flatMap((row) => {
      const product =
        row.product && typeof row.product === "object"
          ? row.product.id
          : row.product;
      return product === undefined || product === null ? [] : [String(product)];
    }),
  );

  let created = 0;
  for (const product of products.docs as ProductDocument[]) {
    if (existingProductIds.has(String(product.id))) continue;
    const productId = numericPayloadID(product.id);
    if (productId === undefined) continue;
    const productName = text(product.name) || text(product.title);
    const brandName =
      product.brand && typeof product.brand === "object"
        ? text(product.brand.name)
        : "";
    const keywords = [
      productName,
      brandName,
      ...(product.specs || []).slice(0, 6).map((spec) => text(spec.label)),
    ].filter(Boolean);
    const advantages = (product.sellingPoints || [])
      .map((item) => text(item.text))
      .filter(Boolean)
      .slice(0, 8);

    await payload.create({
      collection: "product-ai-metadata",
      data: {
        advantages: advantages.map((value) => ({ value })),
        aiGenerated: false,
        keywords: keywords.map((value) => ({ value })),
        note: `Backfill từ dữ liệu catalog hiện có${
          product.source?.url ? `. Nguồn: ${product.source.url}` : ""
        }.`,
        product: productId,
        useCases: [],
        verified: false,
      },
      overrideAccess: true,
    });
    created += 1;
  }

  console.log(
    JSON.stringify(
      {
        created,
        existing: existingProductIds.size,
        products: products.totalDocs,
      },
      null,
      2,
    ),
  );
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
