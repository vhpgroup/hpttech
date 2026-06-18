import fs from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { extractHighlightBulletPoints } from "@/lib/scraper/text";
import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";
import type { CatalogProduct } from "@/lib/catalog";
import { Pool } from "pg";
import {
  canonicalAttributeSpecs,
  loadCanonicalCommercialProjections,
  type CanonicalCommercialProjection,
} from "@/lib/catalog-projection";

type PayloadProductDoc = Record<string, unknown>;

type RawProductHTML = {
  descriptionHTML?: string;
  shortDescription?: string;
  summaryHTML?: string;
};

const DEFAULT_HOME_PRODUCTS_LIMIT = 96;
const HOME_PRODUCTS_POOL_LIMIT = 500;
const DEFAULT_PRODUCT_LIST_LIMIT = 24;

export type ProductListPageResult = {
  products: CatalogProduct[];
  page: number;
  limit: number;
  totalProducts: number;
  totalPages: number;
};

function normalizeSearchText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä‘/g, "d")
    .replace(/Ä/g, "D")
    .toLowerCase();
}

function loadLocalCatalogFixtures(): CatalogProduct[] {
  const fixturePath = process.env.LOCAL_CATALOG_FIXTURE_PATH;
  if (process.env.NODE_ENV === "production" || !fixturePath) return [];

  try {
    const absolutePath = path.resolve(process.cwd(), fixturePath);
    const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (product): product is CatalogProduct =>
        Boolean(
          product &&
            typeof product === "object" &&
            "title" in product &&
            typeof product.title === "string" &&
            "slug" in product &&
            typeof product.slug === "string",
        ),
    );
  } catch (error) {
    console.warn(`[catalog] Cannot load local fixture from ${fixturePath}.`, error);
    return [];
  }
}

const uploadDisplayWidths: Record<string, string> = {
  full: "100%",
  large: "75%",
  medium: "50%",
  small: "35%",
};



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

function stripHTML(value?: string) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHTML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHTML(value?: string) {
  if (!value) return undefined;
  return escapeHTML(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function collectUploadWidths(value: unknown) {
  const widths: string[] = [];

  function visit(node: unknown) {
    const obj = recordValue(node);
    if (!obj) return;

    if (obj.type === "upload") {
      const fields = recordValue(obj.fields);
      const displayWidth = typeof fields?.displayWidth === "string" ? fields.displayWidth : undefined;
      widths.push(uploadDisplayWidths[displayWidth || "full"] || uploadDisplayWidths.full);
    }

    if (Array.isArray(obj.children)) {
      obj.children.forEach(visit);
    }
  }

  visit(value);
  return widths;
}

function withImageStyle(tag: string, maxWidth: string) {
  const style = `display:block;margin-left:auto;margin-right:auto;max-width:${maxWidth};width:100%;height:auto;`;
  const styleMatch = tag.match(/\sstyle=(["'])(.*?)\1/i);

  if (styleMatch) {
    return tag.replace(styleMatch[0], ` style=${styleMatch[1]}${styleMatch[2]};${style}${styleMatch[1]}`);
  }

  return tag.replace("<img", `<img style="${style}"`);
}

function applyRichTextImageWidths(html: string, lexicalValue: unknown) {
  const widths = collectUploadWidths(lexicalValue);
  if (!widths.length) return html;

  let imageIndex = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const width = widths[imageIndex];
    imageIndex += 1;
    return width ? withImageStyle(tag, width) : tag;
  });
}

function htmlOrTextField(doc: PayloadProductDoc, htmlKey: string, textKey: string) {
  const html = textField(doc, htmlKey);
  if (html) return applyRichTextImageWidths(html, doc[textKey]);
  return textToHTML(textField(doc, textKey));
}

function databaseURL() {
  return (
    process.env.DATABASE_URI ||
    process.env.POSTGRES_URL ||
    (!process.env.VERCEL
      ? "postgres://payload:payload@127.0.0.1:5433/hpttech_payload"
      : undefined)
  );
}

let pgPool: Pool | undefined;

function getPgPool() {
  if (pgPool) return pgPool;
  const connectionString = databaseURL();
  if (!connectionString) return undefined;
  pgPool = new Pool({ connectionString, max: 5 });
  return pgPool;
}

async function loadRawProductHTML(id: string | number): Promise<RawProductHTML> {
  const pool = getPgPool();
  if (!pool) return {};

  try {
    const result = await pool.query<{
      description_html: string | null;
      short_description: string | null;
      summary_html: string | null;
    }>(
      `
        select
          coalesce(p.description_h_t_m_l, v.version_description_h_t_m_l) as description_html,
          coalesce(p.short_description, v.version_short_description) as short_description,
          coalesce(p.summary_h_t_m_l, v.version_summary_h_t_m_l) as summary_html
        from products p
        left join lateral (
          select version_description_h_t_m_l, version_short_description, version_summary_h_t_m_l
          from _products_v
          where parent_id = p.id
            and version__status = 'published'
          order by created_at desc
          limit 1
        ) v on true
        where p.id = $1
        limit 1
      `,
      [id],
    );
    const row = result.rows[0];
    return {
      descriptionHTML: row?.description_html || undefined,
      shortDescription: row?.short_description || undefined,
      summaryHTML: row?.summary_html || undefined,
    };
  } catch {
    return {};
  }
}

function relationName(value: unknown) {
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name;
  }
  return typeof value === "string" ? value : undefined;
}

function relationCode(value: unknown) {
  if (value && typeof value === "object" && "code" in value && typeof value.code === "string") {
    return value.code;
  }
  return undefined;
}

function mediaURL(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  if ("filename" in value && typeof value.filename === "string") {
    const generated = mediaPublicURL(value.filename);
    if (generated) return generated;
    return mediaProxyURL(value.filename);
  }
  if ("url" in value && typeof value.url === "string") return value.url;
  return undefined;
}

function mediaPublicURL(filename: string) {
  const base =
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.MEDIA_PUBLIC_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/${encodeURIComponent(filename)}`;
}

function mediaProxyURL(filename: string) {
  if (
    !process.env.R2_BUCKET ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_ENDPOINT
  ) {
    return `/api/media/file/${encodeURIComponent(filename)}`;
  }
  return `/api/r2-media/${encodeURIComponent(filename)}`;
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

function normalizeRelatedProducts(
  value: unknown,
  projections?: Map<string, CanonicalCommercialProjection>,
) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is PayloadProductDoc => Boolean(item) && typeof item === "object")
    .map((item) =>
      normalizeProduct(
        item,
        false,
        item.id !== undefined ? projections?.get(String(item.id)) : undefined,
        projections,
      ),
    )
    .filter((product) => product.title && product.slug);
}

function specValue(group: Record<string, unknown> | undefined, key: string) {
  const value = group?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    if (key === "dailyDuty") return `${value.toLocaleString("vi-VN")} trang/ngày`;
    return String(value);
  }
  return typeof value === "string" ? value.trim() : "";
}

function specsFromGroup(value: unknown, fields: Array<[string, string]>) {
  const group = recordValue(value);
  if (!group) return [];

  return fields
    .map(([key, label]) => ({ label, value: specValue(group, key) }))
    .filter((spec) => spec.value);
}

function normalizeSpecs(doc: PayloadProductDoc) {
  const canonicalSpecs = canonicalAttributeSpecs(doc);
  const specProfile = textField(doc, "specProfile");
  const manualSpecs = Array.isArray(doc.specs)
    ? doc.specs
        .filter((spec): spec is PayloadProductDoc => Boolean(spec) && typeof spec === "object")
        .map((spec) => ({ label: textField(spec, "label") || "", value: textField(spec, "value") || "" }))
        .filter((spec) => spec.label && spec.value)
    : [];

  const scannerSpecs = [
    ...[
      { label: "Thương hiệu", value: relationName(doc.brand) || "" },
      { label: "Bảo hành", value: textField(doc, "warranty") || "" },
    ].filter((spec) => spec.value),
    ...specsFromGroup(doc.scannerSpecs, [
    ["scannerType", "Loại máy scan"],
    ["functions", "Chức năng"],
    ["scanSpeedSimplexPpm", "Tốc độ scan"],
    ["scanSpeedDuplexIpm", "Tốc độ scan 2 mặt"],
    ["scanModes", "Chế độ quét"],
    ["scanResolution", "Độ phân giải"],
    ["displayScreen", "Màn hình hiển thị"],
    ["scanTechnology", "Công nghệ quét"],
    ["adfSheets", "ADF"],
    ["adfCapacitySheets", "Sức chứa ADF"],
    ["maxPaperSize", "Khổ giấy tối đa"],
    ["minPaperSize", "Khổ giấy tối thiểu"],
    ["dailyDuty", "Chu kỳ hoạt động"],
    ["passportScanText", "Scan hộ chiếu"],
    ["duplexScanText", "Scan hai mặt"],
    ["colorScanText", "Scan màu"],
    ["ocrText", "OCR"],
    ["plasticCardScanText", "Scan thẻ nhựa"],
    ["connectivity", "Kết nối"],
    ["supportedOs", "Hệ điều hành hỗ trợ"],
    ["dimensions", "Kích thước"],
    ["weight", "Trọng lượng"],
    ]),
  ];

  const printerSpecs = specsFromGroup(doc.printerSpecs, [
    ["printerType", "Loại máy in"],
    ["functions", "Chức năng"],
    ["printTechnology", "Công nghệ in"],
    ["printSpeed", "Tốc độ in"],
    ["printResolution", "Độ phân giải in"],
    ["maxPaperSize", "Khổ giấy tối đa"],
    ["colorPrintText", "In màu"],
    ["autoDuplexPrintText", "In đảo mặt tự động"],
    ["standardPaperTray", "Khay giấy tiêu chuẩn"],
    ["maxPaperTray", "Khay giấy tối đa"],
    ["memoryRam", "Bộ nhớ RAM"],
    ["connectivity", "Kết nối"],
    ["supportedOs", "Hệ điều hành hỗ trợ"],
    ["recommendedMonthlyVolumeText", "Công suất khuyến nghị/tháng"],
    ["maxMonthlyDuty", "Công suất tối đa/tháng"],
    ["dimensions", "Kích thước"],
    ["weight", "Trọng lượng"],
  ]);

  const photocopierSpecs = specsFromGroup(doc.photocopierSpecs, [
    ["copierType", "Loại máy"],
    ["functions", "Chức năng"],
    ["copySpeed", "Tốc độ copy"],
    ["printSpeed", "Tốc độ in"],
    ["scanSpeed", "Tốc độ scan"],
    ["maxPaperSize", "Khổ giấy tối đa"],
    ["copyResolution", "Độ phân giải copy"],
    ["printResolution", "Độ phân giải in"],
    ["scanResolution", "Độ phân giải scan"],
    ["colorPrintText", "In màu"],
    ["autoDuplexPrintText", "In hai mặt tự động"],
    ["adfText", "ADF"],
    ["adfCapacity", "Sức chứa ADF"],
    ["memoryRam", "Bộ nhớ RAM"],
    ["connectivity", "Kết nối"],
    ["monthlyDuty", "Công suất/tháng"],
    ["dimensionsWeight", "Kích thước / Trọng lượng"],
  ]);

  const combined =
    specProfile === "scanner"
      ? [...scannerSpecs, ...manualSpecs]
      : canonicalSpecs.length
        ? [...canonicalSpecs, ...manualSpecs]
        : [...scannerSpecs, ...printerSpecs, ...photocopierSpecs, ...manualSpecs];
  const seen = new Set<string>();
  return combined.filter((spec) => {
    const key = spec.label.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractSellingPoints(html?: string) {
  return extractHighlightBulletPoints(stripHTML(html));
}

function normalizeSellingPoints(value: unknown, html?: string) {
  const points = Array.isArray(value)
    ? value
        .map((item) =>
          item && typeof item === "object" && "text" in item && typeof item.text === "string"
            ? item.text.trim()
            : "",
        )
        .filter(Boolean)
    : [];
  return points.length ? points : extractSellingPoints(html);
}

function normalizeProduct(
  doc: PayloadProductDoc,
  includeRelated = true,
  commercial?: CanonicalCommercialProjection,
  projections?: Map<string, CanonicalCommercialProjection>,
): CatalogProduct {
  const images = Array.isArray(doc.images)
    ? doc.images
        .map((image: unknown) => ({
          id: mediaID(image),
          url: mediaURL(image),
        }))
        .filter((image: { url?: string }) => Boolean(image.url))
    : [];
  const id = doc.id;
  const descriptionHTML = htmlOrTextField(doc, "descriptionHTML", "description");

  return {
    id: typeof id === "string" || typeof id === "number" ? id : undefined,
    internalId: textField(doc, "internalId"),
    title: textField(doc, "name") || textField(doc, "title") || "",
    slug: textField(doc, "slug") || "",
    sku: commercial?.sku || textField(doc, "sku"),
    model: textField(doc, "model"),
    productType: relationCode(doc.productType),
    brand: relationName(doc.brand),
    category: relationName(doc.category),
    price: commercial?.price || textField(doc, "price"),
    priceValue: commercial?.priceValue,
    compareAtPrice: commercial?.compareAtPrice || textField(doc, "compareAtPrice"),
    rating: numberField(doc, "rating"),
    reviewCount: numberField(doc, "reviewCount"),
    viewCount: numberField(doc, "viewCount"),
    vatIncluded: commercial?.vatIncluded ?? booleanField(doc, "vatIncluded"),
    discountBadge: textField(doc, "discountBadge"),
    promoText: textField(doc, "promoText"),
    promoStart: textField(doc, "promoStart"),
    promoEnd: textField(doc, "promoEnd"),
    stockQuantity: commercial?.quantity,
    stockStatus: commercial?.stockStatus || textField(doc, "stockStatus"),
    detail:
      textField(doc, "shortDescription") ||
      stripHTML(htmlOrTextField(doc, "summaryHTML", "summary")),
    description: descriptionHTML,
    descriptionRichText: doc.description,
    usageGuide: htmlOrTextField(doc, "usageGuideHTML", "usageGuide"),
    usageGuideRichText: doc.usageGuide,
    warranty: commercial?.warranty || textField(doc, "warranty"),
    origin: textField(doc, "origin"),
    images,
    datasheets: normalizeDatasheets(doc.datasheets),
    image: images[0]?.url,
    sellingPoints: normalizeSellingPoints(doc.sellingPoints, descriptionHTML),
    specs: normalizeSpecs(doc),
    relatedProducts: includeRelated
      ? normalizeRelatedProducts(doc.relatedProducts, projections)
      : [],
    href: textField(doc, "slug") ? `/san-pham/${textField(doc, "slug")}` : undefined,
    tag: textField(doc, "tag") || (doc.featured ? "Nổi bật" : undefined),
  };
}

const getCachedRawProductHTML = unstable_cache(
  async (id: string | number): Promise<RawProductHTML> => loadRawProductHTML(id),
  ["raw-product-html"],
  { revalidate: 300, tags: ["products"] },
);

function toProductCardData(
  doc: PayloadProductDoc,
  commercial?: CanonicalCommercialProjection,
): CatalogProduct {
  const images = Array.isArray(doc.images)
    ? doc.images
        .map((image: unknown) => ({
          id: mediaID(image),
          url: mediaURL(image),
        }))
        .filter((image: { url?: string }) => Boolean(image.url))
    : [];
  const id = doc.id;
  const slug = textField(doc, "slug") || "";
  const shortDetail =
    textField(doc, "shortDescription") ||
    stripHTML(htmlOrTextField(doc, "summaryHTML", "summary"));

  return {
    id: typeof id === "string" || typeof id === "number" ? id : undefined,
    internalId: textField(doc, "internalId"),
    title: textField(doc, "name") || textField(doc, "title") || "",
    slug,
    sku: commercial?.sku || textField(doc, "sku"),
    model: textField(doc, "model"),
    productType: relationCode(doc.productType),
    brand: relationName(doc.brand),
    category: relationName(doc.category),
    price: commercial?.price || textField(doc, "price"),
    priceValue: commercial?.priceValue,
    compareAtPrice: commercial?.compareAtPrice || textField(doc, "compareAtPrice"),
    rating: numberField(doc, "rating"),
    reviewCount: numberField(doc, "reviewCount"),
    vatIncluded: commercial?.vatIncluded ?? booleanField(doc, "vatIncluded"),
    discountBadge: textField(doc, "discountBadge"),
    promoText: textField(doc, "promoText"),
    stockQuantity: commercial?.quantity,
    stockStatus: commercial?.stockStatus || textField(doc, "stockStatus"),
    detail: shortDetail,
    warranty: commercial?.warranty || textField(doc, "warranty"),
    images,
    image: images[0]?.url,
    specs: normalizeSpecs(doc).slice(0, 4),
    href: slug ? `/san-pham/${slug}` : undefined,
    tag: textField(doc, "tag") || (doc.featured ? "Ná»•i báº­t" : undefined),
  };
}

function toProductListData(
  doc: PayloadProductDoc,
  commercial?: CanonicalCommercialProjection,
): CatalogProduct {
  return {
    ...toProductCardData(doc, commercial),
    origin: textField(doc, "origin"),
    viewCount: numberField(doc, "viewCount"),
    specs: normalizeSpecs(doc),
  };
}

async function loadHomeProductsFromPayload(limit = DEFAULT_HOME_PRODUCTS_LIMIT): Promise<CatalogProduct[]> {
  const safeLimit = Math.max(1, Math.min(limit, 500));
  const localProducts = loadLocalCatalogFixtures().slice(0, safeLimit);

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: Math.max(safeLimit, HOME_PRODUCTS_POOL_LIMIT),
      sort: "-updatedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);
    const products = docs.map((doc) =>
      toProductCardData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );
    const selected = selectHomeProducts(products, safeLimit);
    const payloadSlugs = new Set(selected.map((product) => product.slug));

    return [...selected, ...localProducts.filter((product) => !payloadSlugs.has(product.slug))]
      .slice(0, safeLimit);
  } catch (error) {
    handlePayloadReadError("home-products", error);
    return localProducts;
  }
}

export const getHomeProductsFromPayload = unstable_cache(
  loadHomeProductsFromPayload,
  ["home-products"],
  { revalidate: 300, tags: ["products"] },
);

function selectHomeProducts(products: CatalogProduct[], limit: number) {
  const selected: CatalogProduct[] = [];
  const seen = new Set<string>();

  const addGroup = (group: CatalogProduct[], groupLimit: number) => {
    for (const product of group) {
      const key = product.slug || product.title;
      if (!key || seen.has(key)) continue;
      selected.push(product);
      seen.add(key);
      if (selected.length >= limit) return;
      groupLimit -= 1;
      if (groupLimit <= 0) return;
    }
  };

  const text = (product: CatalogProduct) =>
    normalizeSearchText(`${product.productType || ""} ${product.category || ""} ${product.brand || ""} ${product.title || ""}`);

  addGroup(products.filter((product) => product.tag), 12);
  addGroup(
    Array.from(
      products.reduce((groups, product) => {
        const value = text(product);
        const kind = value.includes("scan")
          ? "scanner"
          : value.includes("photocop") || value.includes("copier") || value.includes("may photo")
            ? "photocopier"
            : value.includes("printer") || value.includes("may in") || value.includes("laserjet")
              ? "printer"
              : "";
        if (!kind || !product.brand) return groups;

        const key = `${kind}:${product.brand}`;
        if (!groups.has(key)) groups.set(key, product);
        return groups;
      }, new Map<string, CatalogProduct>()).values(),
    ),
    limit,
  );
  addGroup(products.filter((product) => text(product).includes("scan")), 20);
  addGroup(
    products.filter((product) => {
      const value = text(product);
      const isPhotocopier = value.includes("photocop") || value.includes("copier") || value.includes("may photo");
      return !isPhotocopier && (value.includes("printer") || value.includes("may in") || value.includes("laserjet"));
    }),
    20,
  );
  addGroup(
    products.filter((product) => {
      const value = text(product);
      return value.includes("photocop") || value.includes("copier") || value.includes("may photo");
    }),
    20,
  );
  addGroup(products.filter((product) => product.brand === "HP"), 8);
  addGroup(products.filter((product) => product.brand === "Brother"), 8);
  addGroup(
    Array.from(
      products.reduce((brands, product) => {
        if (product.brand && !brands.has(product.brand)) brands.set(product.brand, product);
        return brands;
      }, new Map<string, CatalogProduct>()).values(),
    ),
    limit,
  );
  addGroup(products, limit - selected.length);

  return selected.slice(0, limit);
}

async function loadProductsFromPayload(): Promise<CatalogProduct[]> {
  const localProducts = loadLocalCatalogFixtures();
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: 1000,
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .flatMap((doc) => [
        doc.id,
        ...(Array.isArray(doc.relatedProducts)
          ? doc.relatedProducts.map((related) =>
              related && typeof related === "object" && "id" in related
                ? related.id
                : undefined,
            )
          : []),
      ])
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);
    const products = docs.map((doc) =>
      toProductListData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );
    const payloadSlugs = new Set(products.map((product) => product.slug));
    return [...products, ...localProducts.filter((product) => !payloadSlugs.has(product.slug))];
  } catch (error) {
    handlePayloadReadError("products", error);
    return localProducts;
  }
}

const getCachedProductsFromPayload = unstable_cache(
  loadProductsFromPayload,
  ["all-products"],
  { revalidate: 300, tags: ["products"] },
);

export async function getProductsFromPayload(): Promise<CatalogProduct[]> {
  return getCachedProductsFromPayload();
}

async function loadProductListPageFromPayload({
  page = 1,
  limit = DEFAULT_PRODUCT_LIST_LIMIT,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<ProductListPageResult> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.max(1, Math.min(Math.floor(limit) || DEFAULT_PRODUCT_LIST_LIMIT, 60));
  const localProducts = loadLocalCatalogFixtures();

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: safeLimit,
      page: safePage,
      sort: "-updatedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);
    const products = docs.map((doc) =>
      toProductCardData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );

    return {
      products,
      page: typeof res.page === "number" ? res.page : safePage,
      limit: safeLimit,
      totalProducts: typeof res.totalDocs === "number" ? res.totalDocs : products.length,
      totalPages: typeof res.totalPages === "number" ? res.totalPages : Math.max(1, Math.ceil(products.length / safeLimit)),
    };
  } catch (error) {
    handlePayloadReadError("product-list-page", error);
    const start = (safePage - 1) * safeLimit;
    const products = localProducts.slice(start, start + safeLimit);

    return {
      products,
      page: safePage,
      limit: safeLimit,
      totalProducts: localProducts.length,
      totalPages: Math.max(1, Math.ceil(localProducts.length / safeLimit)),
    };
  }
}

const getCachedProductListPageFromPayload = unstable_cache(
  (page?: number, limit?: number) => loadProductListPageFromPayload({ page, limit }),
  ["product-list-page"],
  { revalidate: 300, tags: ["products"] },
);

export async function getProductListPageFromPayload({
  page = 1,
  limit = DEFAULT_PRODUCT_LIST_LIMIT,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<ProductListPageResult> {
  return getCachedProductListPageFromPayload(page, limit);
}

async function loadRelatedProductsFromPayload({
  field,
  value,
  excludeSlug,
  limit,
  readLabel,
}: {
  field: "category" | "brand";
  value: string;
  excludeSlug: string;
  limit: number;
  readLabel: string;
}): Promise<CatalogProduct[]> {
  if (!value) return [];

  try {
    const payload = await getPayloadClient();

    // Payload PostgreSQL adapter does not support filtering by relation field name
    // directly (e.g. "category.name"). We need to resolve the relation ID first.
    const collection = field === "category" ? "categories" : "brands";
    const relRes = await payload.find({
      collection: collection as never,
      depth: 0,
      limit: 1,
      where: { name: { equals: value } },
    });
    const relId = (relRes.docs[0] as { id?: string | number } | undefined)?.id;
    if (!relId) return [];

    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: Math.max(1, Math.min(limit, 24)),
      sort: "-updatedAt",
      where: {
        and: [
          { slug: { not_in: [excludeSlug] } },
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
          { [field]: { equals: relId } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);

    return docs.map((doc) =>
      toProductCardData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );
  } catch (error) {
    handlePayloadReadError(readLabel, error);
    return loadLocalCatalogFixtures()
      .filter((product) => product.slug !== excludeSlug && product[field] === value)
      .slice(0, limit);
  }
}

const getCachedRelatedProductsFromPayload = unstable_cache(
  loadRelatedProductsFromPayload,
  ["related-products"],
  { revalidate: 300, tags: ["products"] },
);

export function getProductsByCategoryFromPayload(
  categoryName: string,
  excludeSlug: string,
  limit = 8,
): Promise<CatalogProduct[]> {
  return getCachedRelatedProductsFromPayload({
    field: "category",
    value: categoryName,
    excludeSlug,
    limit,
    readLabel: `products:category:${categoryName}`,
  });
}

export function getProductsByBrandFromPayload(
  brandName: string,
  excludeSlug: string,
  limit = 8,
): Promise<CatalogProduct[]> {
  return getCachedRelatedProductsFromPayload({
    field: "brand",
    value: brandName,
    excludeSlug,
    limit,
    readLabel: `products:brand:${brandName}`,
  });
}

function productStaticParamsLimit() {
  const configured = Number(process.env.PRODUCT_STATIC_PARAMS_LIMIT);
  if (Number.isFinite(configured) && configured > 0) return Math.floor(configured);
  return 50;
}

export async function getPublishedProductSlugs(limit = productStaticParamsLimit()): Promise<string[]> {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 0,
      limit: Math.max(1, Math.min(limit, 1000)),
      sort: "-updatedAt",
      select: { slug: true },
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    return (res.docs as Array<{ slug?: string }>)
      .map((doc) => doc.slug)
      .filter((slug): slug is string => Boolean(slug));
  } catch (error) {
    handlePayloadReadError("product-slugs", error);
    return loadLocalCatalogFixtures().map((product) => product.slug).filter(Boolean).slice(0, limit);
  }
}

async function loadProductBySlugFromPayload(slug: string): Promise<CatalogProduct | null> {
  const localProduct = loadLocalCatalogFixtures().find((product) => product.slug === slug) || null;
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 2,
      limit: 1,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });
    const doc = res.docs[0] as unknown as PayloadProductDoc | undefined;
    if (!doc) return localProduct;
    const id = doc.id;
    const relatedIDs = Array.isArray(doc.relatedProducts)
      ? doc.relatedProducts
          .map((related) =>
            related && typeof related === "object" && "id" in related
              ? related.id
              : undefined,
          )
          .filter(
            (relatedID): relatedID is string | number =>
              typeof relatedID === "string" || typeof relatedID === "number",
          )
      : [];
    const projectionIDs =
      typeof id === "string" || typeof id === "number" ? [id, ...relatedIDs] : relatedIDs;
    const projections = await loadCanonicalCommercialProjections(
      payload,
      projectionIDs,
    );
    const product = normalizeProduct(
      doc,
      true,
      id !== undefined ? projections.get(String(id)) : undefined,
      projections,
    );
    if (typeof id === "string" || typeof id === "number") {
      const raw = await getCachedRawProductHTML(id);
      product.description = raw.descriptionHTML || product.description;
      product.detail =
        raw.shortDescription ||
        stripHTML(raw.summaryHTML) ||
        product.detail;
    }
    return product;
  } catch (error) {
    handlePayloadReadError(`products:${slug}`, error);
    return localProduct;
  }
}

const getCachedProductBySlugFromPayload = unstable_cache(
  loadProductBySlugFromPayload,
  ["product-by-slug"],
  { revalidate: 300, tags: ["products"] },
);

export async function getProductBySlugFromPayload(slug: string): Promise<CatalogProduct | null> {
  return getCachedProductBySlugFromPayload(slug);
}
