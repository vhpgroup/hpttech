import { getPayloadClient } from "@/lib/payload";
import type { CatalogProduct } from "@/lib/catalog";

function relationName(value: unknown) {
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name;
  }

  return typeof value === "string" ? value : undefined;
}

function mediaURL(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  if ("url" in value && typeof value.url === "string") return value.url;
  return undefined;
}

function mediaID(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  if ("id" in value && (typeof value.id === "string" || typeof value.id === "number")) return value.id;
  return undefined;
}

function normalizeProduct(doc: any): CatalogProduct {
  const images = Array.isArray(doc.images)
    ? doc.images
        .map((image: unknown) => ({
          id: mediaID(image),
          url: mediaURL(image),
        }))
        .filter((image: { url?: string }) => Boolean(image.url))
    : [];

  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    brand: relationName(doc.brand),
    category: relationName(doc.category),
    price: doc.price,
    detail: doc.summary,
    images,
    image: images[0]?.url,
    specs: Array.isArray(doc.specs) ? doc.specs.map((s: any) => ({ label: s.label, value: s.value })) : [],
    href: doc.slug ? `/san-pham/${doc.slug}` : undefined,
    tag: doc.tag || (doc.featured ? "Nổi bật" : undefined),
  };
}

export async function getProductsFromPayload(): Promise<CatalogProduct[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1000,
    where: {
      status: {
        equals: "published",
      },
    },
  });

  return res.docs.map(normalizeProduct);
}

export async function getProductBySlugFromPayload(slug: string): Promise<CatalogProduct | null> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
  });
  const doc = res.docs[0];
  return doc ? normalizeProduct(doc) : null;
}
