import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";
import type { CatalogProduct } from "@/lib/catalog";

type PayloadProductDoc = Record<string, unknown>;

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

  return [...scannerSpecs, ...printerSpecs, ...photocopierSpecs, ...manualSpecs];
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
    detail: stripHTML(htmlOrTextField(doc, "summaryHTML", "summary")),
    description: htmlOrTextField(doc, "descriptionHTML", "description"),
    usageGuide: htmlOrTextField(doc, "usageGuideHTML", "usageGuide"),
    warranty: textField(doc, "warranty"),
    origin: textField(doc, "origin"),
    images,
    datasheets: normalizeDatasheets(doc.datasheets),
    image: images[0]?.url,
    specs: normalizeSpecs(doc),
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
