import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import type { Where } from "payload";
import type { CatalogProduct } from "@/lib/catalog";
import { isHomeDeviceType } from "@/lib/home-category-sections";
import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";
import { canonicalizeCategorySlug, SCANNER_CATEGORY_SLUG } from "@/lib/product-category";
import { pageMetadata } from "@/lib/seo";

export const FACET_SEGMENT = {
  industry: "nganh",
  need: "nhu-cau",
  brand: "hang",
} as const;

export const SEGMENT_FACET = {
  nganh: "industry",
  "nhu-cau": "need",
  hang: "brand",
} as const;

export type LandingFacetType = keyof typeof FACET_SEGMENT;
export type LandingProductGroup = "may-scan" | "may-in" | "may-photocopy";

type RelationDoc = {
  accentKey?: string;
  code?: string;
  id?: string | number;
  icon?: string;
  name?: string;
  slug?: string;
};

export type LandingProductQuery = {
  brand?: string;
  bookScanner?: boolean;
  brands?: Array<string | number | RelationDoc>;
  largeFormat?: boolean;
  maxPaperSize?: "A4" | "A3" | "A2" | "A1" | "A0";
  minDailyDuty?: number;
  minScanSpeedPpm?: number;
  needsA3?: boolean;
  needsCardScan?: boolean;
  needsDuplex?: boolean;
  needsNetwork?: boolean;
  needsOcr?: boolean;
  needsPassport?: boolean;
  prefersFlatbed?: boolean;
  wideFormat?: boolean;
};

export type LandingPageDoc = {
  _status?: "draft" | "published";
  brandRef?: string | number | RelationDoc;
  criteria?: Array<{ need?: string; spec?: string }>;
  facetSlug?: string;
  facetType?: LandingFacetType;
  faqs?: Array<{ answer?: string; question?: string }>;
  h1?: string;
  id?: string | number;
  industryRef?: string | number | RelationDoc;
  intro?: unknown;
  needRef?: string | number | RelationDoc;
  painPoints?: Array<{ text?: string }>;
  pathname?: string;
  productGroup?: LandingProductGroup;
  productQuery?: LandingProductQuery;
  recommendedProducts?: Array<string | number | ProductDoc>;
  relatedPages?: Array<string | number | LandingPageDoc>;
  seo?: {
    canonical?: string;
    description?: string;
    image?: { url?: string } | string | number;
    noIndex?: boolean;
    title?: string;
  };
  slug?: string;
  sortOrder?: number;
  title?: string;
  updatedAt?: string;
  workflow?: Array<{ detail?: string; step?: string }>;
};

type ProductDoc = {
  _status?: string;
  brand?: string | number | RelationDoc;
  category?: string | number | RelationDoc;
  compareAtPrice?: string;
  discountBadge?: string;
  featured?: boolean;
  id?: string | number;
  images?: Array<{ id?: string | number; url?: string }>;
  model?: string;
  name?: string;
  price?: string;
  productType?: string | number | RelationDoc;
  promoText?: string;
  rating?: number;
  reviewCount?: number;
  scannerSpecs?: ScannerSpecs;
  shortDescription?: string;
  sku?: string;
  slug?: string;
  specProfile?: string;
  status?: string;
  stockStatus?: string;
  summaryHTML?: string;
  title?: string;
};

type ScannerSpecs = Record<string, unknown> & {
  connectivity?: string;
  dailyDuty?: number;
  duplexScan?: boolean;
  maxPaperSize?: string;
  ocr?: boolean;
  ocrText?: string;
  passportScan?: boolean;
  passportScanText?: string;
  plasticCardScan?: boolean;
  plasticCardScanText?: string;
  scannerType?: string;
  scanSpeedDuplexIpm?: number;
  scanSpeedSimplexPpm?: number;
};

type LandingPageOptions = {
  facetType?: LandingFacetType;
  productGroup?: LandingProductGroup;
};

type ScannerQueryOptions = {
  limit?: number;
  recommendedProducts?: LandingPageDoc["recommendedProducts"];
};

export type LandingHubItem = {
  accentKey?: string;
  desc?: string;
  facetSlug: string;
  icon?: string;
  pathname: string;
  title: string;
};

export type LandingHubData = {
  scan: Record<LandingFacetType, LandingHubItem[]>;
};

const PRODUCT_SELECT = {
  id: true,
  name: true,
  title: true,
  slug: true,
  sku: true,
  model: true,
  brand: true,
  category: true,
  productType: true,
  price: true,
  compareAtPrice: true,
  rating: true,
  reviewCount: true,
  discountBadge: true,
  promoText: true,
  stockStatus: true,
  images: true,
  scannerSpecs: true,
  specProfile: true,
  shortDescription: true,
  summaryHTML: true,
  featured: true,
} as const;

function relationID(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: string | number }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return "";
}

function relationText(value: unknown) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value !== "object") return "";
  const record = value as RelationDoc;
  return [record.name, record.slug, record.id].filter(Boolean).join(" ");
}

function relationField(value: unknown, key: keyof RelationDoc) {
  if (!value || typeof value !== "object") return "";
  const field = (value as RelationDoc)[key];
  return typeof field === "string" || typeof field === "number" ? String(field) : "";
}

function relationName(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return relationField(value, "name") || relationField(value, "slug") || relationField(value, "id");
}

function relationSlug(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  return relationField(value, "slug") || relationField(value, "name") || relationField(value, "id");
}

function normalizeText(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function hasPositiveText(value: unknown) {
  const text = normalizeText(value);
  return text.includes("co") || text.includes("yes") || text.includes("support") || text.includes("ho tro");
}

function textFromRichText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textFromRichText).join(" ");
  if (typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  return [
    typeof record.text === "string" ? record.text : "",
    textFromRichText(record.children),
    textFromRichText(record.root),
  ]
    .filter(Boolean)
    .join(" ");
}

function countWords(value: unknown) {
  const text = textFromRichText(value).trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function payloadReadMessage(error: unknown) {
  const cause = error && typeof error === "object" && "cause" in error ? error.cause : undefined;
  const rawMessage = cause instanceof Error ? cause.message : error instanceof Error ? error.message : String(error);
  return rawMessage.split("\n")[0];
}

function isMissingLandingSchemaError(error: unknown) {
  const message = payloadReadMessage(error).toLowerCase();
  return (
    message.includes("does not exist") &&
    (message.includes("landing_pages") || message.includes("industries") || message.includes("scan_needs"))
  );
}

function handleLandingReadError(scope: string, error: unknown) {
  if (isMissingLandingSchemaError(error)) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`[payload-read:${scope}] pSEO schema is not migrated yet; returning empty landing data.`);
    }
    return;
  }

  handlePayloadReadError(scope, error);
}

function paperRank(value: unknown) {
  const text = normalizeText(value);
  if (text.includes("a0")) return 5;
  if (text.includes("a1")) return 4;
  if (text.includes("a2")) return 3;
  if (text.includes("a3")) return 2;
  if (text.includes("a4") || text.includes("legal")) return 1;
  return 0;
}

function requiredPaperRank(query: LandingProductQuery) {
  if (query.maxPaperSize) return paperRank(query.maxPaperSize);
  if (query.needsA3) return paperRank("A3");
  return 0;
}

function isScannerProduct(product: ProductDoc) {
  const productTypeCode = relationField(product.productType, "code") || relationSlug(product.productType);
  if (isHomeDeviceType({ productType: productTypeCode }, "scanner")) return true;

  const categorySlug = relationSlug(product.category);
  const categoryName = relationName(product.category);
  return canonicalizeCategorySlug(categorySlug, categoryName) === SCANNER_CATEGORY_SLUG;
}

function relationMatches(value: unknown, candidates: string[]) {
  if (!candidates.length) return true;
  const haystack = [
    relationID(value),
    relationField(value, "slug"),
    relationField(value, "name"),
    relationText(value),
  ].map(normalizeText);
  return candidates.some((candidate) => {
    const normalized = normalizeText(candidate);
    return Boolean(normalized) && haystack.some((item) => item === normalized || item.includes(normalized));
  });
}

function productMatchesQuery(product: ProductDoc, query: LandingProductQuery = {}) {
  if (!isScannerProduct(product)) return false;
  const specs = product.scannerSpecs || {};
  const scannerType = normalizeText(specs.scannerType);
  const connectivity = normalizeText(specs.connectivity);
  const maxPaper = paperRank(specs.maxPaperSize);
  const requiredPaper = requiredPaperRank(query);

  if (requiredPaper && maxPaper < requiredPaper) return false;
  if (query.needsDuplex && !(specs.duplexScan === true || numberValue(specs.scanSpeedDuplexIpm))) return false;
  if (query.needsNetwork && !/(lan|ethernet|network|wifi|wi-fi|mang)/i.test(connectivity)) return false;
  if (query.needsOcr && !(specs.ocr === true || hasPositiveText(specs.ocrText))) return false;
  if (query.needsCardScan && !(specs.plasticCardScan === true || hasPositiveText(specs.plasticCardScanText))) return false;
  if (query.needsPassport && !(specs.passportScan === true || hasPositiveText(specs.passportScanText))) return false;
  if (query.minDailyDuty && (numberValue(specs.dailyDuty) || 0) < query.minDailyDuty) return false;
  if (query.minScanSpeedPpm && (numberValue(specs.scanSpeedSimplexPpm) || 0) < query.minScanSpeedPpm) return false;
  if (query.largeFormat && maxPaper <= paperRank("A3")) return false;

  if (query.wideFormat) {
    const wideText = `${scannerType} ${normalizeText(specs.maxPaperSize)}`;
    if (!/(wide|large|ban ve|kho rong|a0|a1|a2)/i.test(wideText)) return false;
  }

  if (query.bookScanner && !/(book|sach|overhead|czur)/i.test(scannerType)) return false;

  const brandCandidates = [
    query.brand,
    ...(query.brands || []).flatMap((brand) => [
      relationID(brand),
      relationField(brand, "slug"),
      relationField(brand, "name"),
    ]),
  ].filter((value): value is string => Boolean(value));
  if (brandCandidates.length && !relationMatches(product.brand, brandCandidates)) return false;

  return true;
}

function productScore(product: ProductDoc, query: LandingProductQuery = {}) {
  const specs = product.scannerSpecs || {};
  let score = 0;
  if (query.prefersFlatbed && normalizeText(specs.scannerType).includes("flatbed")) score += 10;
  if (product.featured) score += 2;
  score += Math.min(numberValue(specs.scanSpeedSimplexPpm) || 0, 120) / 120;
  return score;
}

function mediaURL(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  if ("url" in value && typeof value.url === "string") return value.url;
  return undefined;
}

function toCatalogProduct(product: ProductDoc): CatalogProduct {
  const images = Array.isArray(product.images)
    ? product.images.map((image) => ({ id: image.id, url: mediaURL(image) })).filter((image) => image.url)
    : [];

  return {
    id: product.id,
    title: product.name || product.title || "",
    slug: product.slug || "",
    sku: product.sku,
    model: product.model,
    brand: relationName(product.brand),
    category: relationName(product.category),
    productType: relationField(product.productType, "code") || relationSlug(product.productType),
    price: product.price || "Liên hệ",
    compareAtPrice: product.compareAtPrice,
    rating: product.rating,
    reviewCount: product.reviewCount,
    discountBadge: product.discountBadge,
    promoText: product.promoText,
    stockStatus: product.stockStatus,
    detail: product.shortDescription,
    images,
    image: images[0]?.url,
    href: product.slug ? `/san-pham/${product.slug}` : undefined,
    tag: product.featured ? "Nổi bật" : undefined,
  };
}

function hubItemTitle(page: LandingPageDoc) {
  if (page.facetType === "industry" && page.industryRef) return relationName(page.industryRef) || page.title || "";
  if (page.facetType === "need" && page.needRef) return relationName(page.needRef) || page.title || "";
  if (page.facetType === "brand" && page.brandRef) return relationName(page.brandRef) || page.title || "";
  return page.title || page.facetSlug || "";
}

function hubItem(page: LandingPageDoc): LandingHubItem | null {
  if (!page.facetType || !page.facetSlug || !page.pathname) return null;
  const ref =
    page.facetType === "industry"
      ? page.industryRef
      : page.facetType === "need"
        ? page.needRef
        : page.brandRef;
  const refDoc = ref && typeof ref === "object" ? ref : undefined;
  return {
    accentKey: page.facetType === "industry" ? refDoc?.accentKey || page.facetSlug : undefined,
    desc: page.seo?.description,
    facetSlug: page.facetSlug,
    icon: refDoc && "icon" in refDoc && typeof refDoc.icon === "string" ? refDoc.icon : undefined,
    pathname: page.pathname,
    title: hubItemTitle(page),
  };
}

function landingWhere(opts: LandingPageOptions = {}) {
  const and: Where[] = [{ _status: { equals: "published" } }];
  if (opts.productGroup) and.push({ productGroup: { equals: opts.productGroup } });
  if (opts.facetType) and.push({ facetType: { equals: opts.facetType } });
  return { and };
}

async function loadPublishedLandingPages(opts: LandingPageOptions = {}) {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "landing-pages" as never,
      depth: 2,
      limit: 500,
      sort: "sortOrder",
      where: landingWhere(opts),
    });
    return res.docs as unknown as LandingPageDoc[];
  } catch (error) {
    handleLandingReadError("landing-pages", error);
    return [];
  }
}

export const getPublishedLandingPages = unstable_cache(
  loadPublishedLandingPages,
  ["published-landing-pages"],
  { revalidate: 300, tags: ["landing-pages:list"] },
);

async function loadLandingPageByPath(pathname: string) {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "landing-pages" as never,
      depth: 2,
      limit: 1,
      where: {
        and: [
          { pathname: { equals: pathname } },
          { _status: { equals: "published" } },
        ],
      },
    });
    return (res.docs[0] as unknown as LandingPageDoc | undefined) || null;
  } catch (error) {
    handleLandingReadError(`landing-page:${pathname}`, error);
    return null;
  }
}

async function loadLandingPagePreviewByPath(pathname: string) {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "landing-pages" as never,
      depth: 2,
      draft: true,
      limit: 1,
      overrideAccess: true,
      where: { pathname: { equals: pathname } },
    });
    return (res.docs[0] as unknown as LandingPageDoc | undefined) || null;
  } catch (error) {
    handleLandingReadError(`landing-page-preview:${pathname}`, error);
    return null;
  }
}

export async function getLandingPageByPath(pathname: string) {
  if (process.env.NODE_ENV !== "production") {
    return loadLandingPagePreviewByPath(pathname);
  }

  const getCachedLandingPage = unstable_cache(
    () => loadLandingPageByPath(pathname),
    ["landing-page-by-path", pathname],
    { revalidate: 300, tags: [`landing-page:${pathname}`] },
  );
  return getCachedLandingPage();
}

export async function getHubData(): Promise<LandingHubData> {
  const pages = process.env.NODE_ENV === "production"
    ? await getPublishedLandingPages({ productGroup: "may-scan" })
    : await loadLandingHubPreviewPages();
  const scan: LandingHubData["scan"] = { brand: [], industry: [], need: [] };

  for (const page of pages) {
    if (!page.facetType) continue;
    const item = hubItem(page);
    if (item) scan[page.facetType].push(item);
  }

  return { scan };
}

async function loadLandingHubPreviewPages() {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "landing-pages" as never,
      depth: 2,
      draft: true,
      limit: 500,
      overrideAccess: true,
      sort: "sortOrder",
      where: { productGroup: { equals: "may-scan" } },
    });
    return res.docs as unknown as LandingPageDoc[];
  } catch (error) {
    handleLandingReadError("landing-pages:preview", error);
    return [];
  }
}

function recommendedProductDocs(value: LandingPageDoc["recommendedProducts"]) {
  return (value || []).filter((item): item is ProductDoc => Boolean(item) && typeof item === "object");
}

export async function getScannersForQuery(
  productQuery: LandingProductQuery = {},
  { limit = 12, recommendedProducts }: ScannerQueryOptions = {},
) {
  const recommended = recommendedProductDocs(recommendedProducts);

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: 200,
      select: PRODUCT_SELECT,
      sort: "-updatedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    const docs = [...recommended, ...((res.docs as unknown as ProductDoc[]) || [])];
    const seen = new Set<string>();
    const matched = docs
      .filter((product) => product.slug && productMatchesQuery(product, productQuery))
      .sort((a, b) => productScore(b, productQuery) - productScore(a, productQuery))
      .filter((product) => {
        const key = String(product.id || product.slug);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, Math.max(1, Math.min(limit, 24)));

    return matched.map(toCatalogProduct);
  } catch (error) {
    handlePayloadReadError("landing-scanners", error);
    return recommended
      .filter((product) => productMatchesQuery(product, productQuery))
      .slice(0, limit)
      .map(toCatalogProduct);
  }
}

export function evaluateLandingCompleteness(doc: LandingPageDoc, productCount?: number) {
  const introWordCount = countWords(doc.intro);
  const faqCount = doc.faqs?.filter((faq) => faq.question && faq.answer).length || 0;
  const painPointCount = doc.painPoints?.filter((item) => item.text).length || 0;
  const recommendedCount = recommendedProductDocs(doc.recommendedProducts).length;
  const visibleProductCount = productCount ?? recommendedCount;

  return {
    faqCount,
    introWordCount,
    painPointCount,
    productCount: visibleProductCount,
    hasEnoughIntro: introWordCount >= 400,
    hasEnoughFaqs: faqCount >= 3,
    hasEnoughPainPoints: painPointCount >= 3,
    hasEnoughProducts: visibleProductCount >= 3,
  };
}

export function meetsQualityGate(doc: LandingPageDoc, productCount?: number) {
  const score = evaluateLandingCompleteness(doc, productCount);
  return score.hasEnoughIntro && score.hasEnoughFaqs && score.hasEnoughPainPoints && score.hasEnoughProducts;
}

export function landingAccentKey(doc: LandingPageDoc) {
  if (doc.facetType !== "industry" || !doc.industryRef || typeof doc.industryRef !== "object") return undefined;
  return doc.industryRef.accentKey || doc.facetSlug;
}

function seoImageURL(image: unknown) {
  if (!image) return undefined;
  if (typeof image === "object" && "url" in image && typeof image.url === "string") return image.url;
  return undefined;
}

export function buildLandingMetadata(doc: LandingPageDoc): Metadata {
  return pageMetadata({
    title: doc.seo?.title || doc.title || "Giải pháp máy scan",
    description:
      doc.seo?.description ||
      `HPT Tech tư vấn ${doc.title || "giải pháp máy scan"} chính hãng, xuất VAT, giao toàn quốc cho doanh nghiệp.`,
    image: seoImageURL(doc.seo?.image),
    path: doc.seo?.canonical || doc.pathname || "/giai-phap/may-scan",
  });
}

export async function getPublishedLandingSitemapEntries() {
  const pages = await getPublishedLandingPages();
  const entries: Array<{ pathname: string; updatedAt?: string } | null> = await Promise.all(
    pages.map(async (page) => {
      const products = await getScannersForQuery(page.productQuery, {
        limit: 4,
        recommendedProducts: page.recommendedProducts,
      });
      return meetsQualityGate(page, products.length) && page.pathname
        ? { pathname: page.pathname, updatedAt: page.updatedAt }
        : null;
    }),
  );

  return entries.filter((entry): entry is { pathname: string; updatedAt?: string } => Boolean(entry));
}
