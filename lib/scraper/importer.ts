import { getPayloadClient } from "@/lib/payload";
import { formatSlug } from "@/lib/payload/utils/slugify";
import type { Where } from "payload";
import { lexicalParagraphs } from "./text";
import type { ImportProductInput } from "./types";
import { importScrapedImages } from "./media";

type PayloadRelationshipDoc = {
  id: string | number;
  name?: string;
  slug?: string;
};

async function findBySlugOrName(collection: "brands" | "categories", name: string) {
  const payload = await getPayloadClient();
  const slug = formatSlug(name);
  const result = await payload.find({
    collection,
    limit: 1,
    where: {
      or: [{ slug: { equals: slug } }, { name: { equals: name } }],
    },
  });

  return result.docs[0] as PayloadRelationshipDoc | undefined;
}

async function findOrCreateBrand(name: string) {
  const existing = await findBySlugOrName("brands", name);
  if (existing) return existing;

  const payload = await getPayloadClient();
  return payload.create({
    collection: "brands",
    data: {
      name,
      slug: formatSlug(name),
    },
    overrideAccess: true,
  }) as Promise<PayloadRelationshipDoc>;
}

async function findFallbackCategory() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "categories",
    limit: 1,
    sort: "sortOrder",
  });

  return result.docs[0] as PayloadRelationshipDoc | undefined;
}

async function findDuplicateProduct(sku: string | undefined, title: string) {
  const payload = await getPayloadClient();
  const conditions: Where[] = sku
    ? [{ sku: { equals: sku } }, { title: { equals: title } }]
    : [{ title: { equals: title } }];

  const result = await payload.find({
    collection: "products",
    limit: 1,
    where: {
      or: conditions,
    },
  });

  return result.docs[0] as { id: string | number } | undefined;
}

export async function importScrapedProduct(input: ImportProductInput) {
  const payload = await getPayloadClient();
  const { product } = input;
  const brand = await findOrCreateBrand(product.source.brand);

  const category = input.categoryId
    ? { id: input.categoryId }
    : await findFallbackCategory();

  if (!category) {
    throw new Error("Chua co category nao trong Payload de gan cho san pham.");
  }

  const duplicate = await findDuplicateProduct(product.data.sku, product.data.title);
  if (duplicate) {
    return {
      duplicate: true,
      productId: duplicate.id,
      status: "draft",
    };
  }

  let uploadedImages: Array<{ id: string | number; url: string }> = [];
  let imageWarning = "";
  try {
    uploadedImages = await importScrapedImages(product);
  } catch (error) {
    imageWarning = `Image import failed: ${error instanceof Error ? error.message : String(error)}`;
  }

  const created = await payload.create({
    collection: "products",
    data: {
      brand: brand.id,
      category: category.id,
      compareAtPrice: product.data.compareAtPrice,
      description: lexicalParagraphs(product.generated.description),
      images: uploadedImages.map((image) => image.id),
      internalNote: [
        `Auto-filled by scraper MVP.`,
        `Source: ${product.source.url}`,
        `Confidence: ${product.confidence}`,
        uploadedImages.length ? `Images imported: ${uploadedImages.map((image) => image.url).join(" | ")}` : "",
        imageWarning,
        product.warnings.length ? `Warnings: ${product.warnings.join(" | ")}` : "",
      ].filter(Boolean).join("\n"),
      origin: product.data.origin,
      price: product.data.price,
      seo: {
        canonical: product.seo.canonical,
        description: product.seo.description,
        noIndex: false,
        title: product.seo.title,
      },
      sku: product.data.sku,
      slug: formatSlug(product.data.title),
      specs: product.data.specs,
      status: "draft",
      stockStatus: "in_stock",
      summary: lexicalParagraphs(product.generated.summary),
      title: product.data.title,
      warranty: product.data.warranty,
    },
    overrideAccess: true,
  });

  return {
    duplicate: false,
    productId: created.id,
    status: created.status,
  };
}
