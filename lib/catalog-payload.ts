import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";
import type { CatalogProduct } from "@/lib/catalog";

type PayloadProductDoc = Record<string, unknown>;



function textField(doc: PayloadProductDoc, key: string) {
  const value = doc[key];
  return typeof value === "string" ? value : undefined;
}

function numberField(doc: PayloadProductDoc, key: string) {
  const value = doc[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanField(doc: PayloadProductDoc, key: string) {
  const value = doc[key];
  return typeof value === "boolean" ? value : undefined;
}

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

function normalizeDatasheets(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const url = typeof obj.url === "string" ? obj.url : undefined;
      if (!url) return null;
      return {
        id: mediaID(item),
        url,
        filename: typeof obj.filename === "string" ? obj.filename : undefined,
        mimeType: typeof obj.mimeType === "string" ? obj.mimeType : undefined,
      };
    })
    .filter(Boolean) as Array<{ id?: string | number; url: string; filename?: string; mimeType?: string }>;
}

function normalizeRelatedProducts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is PayloadProductDoc => Boolean(item) && typeof item === "object")
    .map((item) => normalizeProduct(item, false))
    .filter((product) => product.title && product.slug);
}

function normalizeProduct(doc: PayloadProductDoc, includeRelated = true): CatalogProduct {
  const images = Array.isArray(doc.images)
    ? doc.images
        .map((image: unknown) => ({
          id: mediaID(image),
          url: mediaURL(image),
        }))
        .filter((image: { url?: string }) => Boolean(image.url))
    : [];
  const id = doc.id;

  return {
    id: typeof id === "string" || typeof id === "number" ? id : undefined,
    title: textField(doc, "title") || "",
    slug: textField(doc, "slug") || "",
    sku: textField(doc, "sku"),
    brand: relationName(doc.brand),
    category: relationName(doc.category),
    price: textField(doc, "price"),
    compareAtPrice: textField(doc, "compareAtPrice"),
    rating: numberField(doc, "rating"),
    reviewCount: numberField(doc, "reviewCount"),
    viewCount: numberField(doc, "viewCount"),
    vatIncluded: booleanField(doc, "vatIncluded"),
    discountBadge: textField(doc, "discountBadge"),
    promoText: textField(doc, "promoText"),
    promoStart: textField(doc, "promoStart"),
    promoEnd: textField(doc, "promoEnd"),
    stockStatus: textField(doc, "stockStatus"),
    detail: textField(doc, "summary"),
    description: typeof doc.description === "string" ? doc.description : undefined,
    warranty: textField(doc, "warranty"),
    origin: textField(doc, "origin"),
    images,
    datasheets: normalizeDatasheets(doc.datasheets),
    image: images[0]?.url,
    specs: Array.isArray(doc.specs)
      ? doc.specs
          .filter((spec): spec is PayloadProductDoc => Boolean(spec) && typeof spec === "object")
          .map((spec) => ({ label: textField(spec, "label") || "", value: textField(spec, "value") || "" }))
      : [],
    relatedProducts: includeRelated ? normalizeRelatedProducts(doc.relatedProducts) : [],
    href: textField(doc, "slug") ? `/san-pham/${textField(doc, "slug")}` : undefined,
    tag: textField(doc, "tag") || (doc.featured ? "Nổi bật" : undefined),
  };
}

export async function getProductsFromPayload(): Promise<CatalogProduct[]> {

  try {
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

    return (res.docs as unknown as PayloadProductDoc[]).map((doc) => normalizeProduct(doc));
  } catch (error) {
    handlePayloadReadError("products", error);
    return [];
  }
}

export async function getProductBySlugFromPayload(slug: string): Promise<CatalogProduct | null> {

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 2,
      limit: 1,
      where: {
        and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
      },
    });
    const doc = res.docs[0] as unknown as PayloadProductDoc | undefined;
    return doc ? normalizeProduct(doc) : null;
  } catch (error) {
    handlePayloadReadError(`products:${slug}`, error);
    return null;
  }
}
