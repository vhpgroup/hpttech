import fs from "node:fs";
import path from "node:path";
import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";
import type { CatalogProduct } from "@/lib/catalog";
import {
  canonicalAttributeSpecs,
  loadCanonicalCommercialProjections,
  type CanonicalCommercialProjection,
} from "@/lib/catalog-projection";

type PayloadProductDoc = Record<string, unknown>;

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
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
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
  const manualSpecs = Array.isArray(doc.specs)
    ? doc.specs
        .filter((spec): spec is PayloadProductDoc => Boolean(spec) && typeof spec === "object")
        .map((spec) => ({ label: textField(spec, "label") || "", value: textField(spec, "value") || "" }))
        .filter((spec) => spec.label && spec.value)
    : [];

  const scannerSpecs = specsFromGroup(doc.scannerSpecs, [
    ["scannerType", "Loại máy scan"],
    ["functions", "Chức năng"],
    ["scanSpeedSimplexPpm", "Tốc độ scan"],
    ["scanSpeedDuplexIpm", "Tốc độ scan 2 mặt"],
    ["scanModes", "Chế độ quét"],
    ["scanResolution", "Độ phân giải"],
    ["adfSheets", "ADF"],
    ["adfCapacitySheets", "Sức chứa ADF"],
    ["maxPaperSize", "Khổ giấy tối đa"],
    ["minPaperSize", "Khổ giấy tối thiểu"],
    ["dailyDuty", "Công suất/ngày"],
    ["passportScanText", "Scan hộ chiếu"],
    ["duplexScanText", "Scan hai mặt"],
    ["colorScanText", "Scan màu"],
    ["ocrText", "OCR"],
    ["plasticCardScanText", "Scan thẻ nhựa"],
    ["connectivity", "Kết nối"],
    ["supportedOs", "Hệ điều hành hỗ trợ"],
    ["dimensionsWeight", "Kích thước / Trọng lượng"],
  ]);

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

  const combined = canonicalSpecs.length
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
    description: htmlOrTextField(doc, "descriptionHTML", "description"),
    usageGuide: htmlOrTextField(doc, "usageGuideHTML", "usageGuide"),
    warranty: commercial?.warranty || textField(doc, "warranty"),
    origin: textField(doc, "origin"),
    images,
    datasheets: normalizeDatasheets(doc.datasheets),
    image: images[0]?.url,
    specs: normalizeSpecs(doc),
    relatedProducts: includeRelated
      ? normalizeRelatedProducts(doc.relatedProducts, projections)
      : [],
    href: textField(doc, "slug") ? `/san-pham/${textField(doc, "slug")}` : undefined,
    tag: textField(doc, "tag") || (doc.featured ? "Nổi bật" : undefined),
  };
}

export async function getProductsFromPayload(): Promise<CatalogProduct[]> {
  const localProducts = loadLocalCatalogFixtures();
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
      normalizeProduct(
        doc,
        true,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
        projections,
      ),
    );
    const payloadSlugs = new Set(products.map((product) => product.slug));
    return [...products, ...localProducts.filter((product) => !payloadSlugs.has(product.slug))];
  } catch (error) {
    handlePayloadReadError("products", error);
    return localProducts;
  }
}

export async function getProductBySlugFromPayload(slug: string): Promise<CatalogProduct | null> {
  const localProduct = loadLocalCatalogFixtures().find((product) => product.slug === slug) || null;
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
    return normalizeProduct(
      doc,
      true,
      id !== undefined ? projections.get(String(id)) : undefined,
      projections,
    );
  } catch (error) {
    handlePayloadReadError(`products:${slug}`, error);
    return localProduct;
  }
}
