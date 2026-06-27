import type { ExcelRow, ScrapedProduct } from "./types";
import { extractRequestedModel } from "./model-identity";
import { normalizeScrapedSpecs } from "./spec-normalizer";
import {
  INK_CATEGORY_NAME,
  LAPTOP_GAMING_CATEGORY_NAME,
  PHOTOCOPIER_CATEGORY_NAME,
  PRINTER_CATEGORY_NAME,
  SCANNER_CATEGORY_NAME,
  SOFTWARE_CATEGORY_NAME,
} from "@/lib/product-category";
import {
  sourceIdentityKey,
  sourceVariantSku,
} from "./source-identity";

export type CanonicalScraperRow = Record<string, string>;

function modelFromTitle(value: string) {
  return value
    .match(/\b[A-Z]{1,6}(?:[-\s]?[A-Z0-9]){2,16}\b/gi)
    ?.map((item) => item.replace(/\s+/g, "-"))
    .find((item) => /\d/.test(item));
}

function vndPrice(value?: string) {
  if (!value) return "";
  const text = value.trim();
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/lien he|call|contact/.test(normalized)) return "";
  const million = normalized.match(/(\d+(?:[,.]\d+)?)\s*(trieu|tr)\b/);
  if (million) {
    const amount = Number(million[1].replace(",", "."));
    return Number.isFinite(amount) ? String(Math.round(amount * 1_000_000)) : "";
  }
  const decimalNumber = text.match(/^\s*(\d{6,})(?:[.,]\d{1,2})?\s*(?:vnd|vnđ|đ)?\s*$/i);
  if (decimalNumber) return decimalNumber[1];
  const digits = text.replace(/[^\d]/g, "");
  return digits && Number(digits) >= 100_000 ? digits : "";
}

function specValue(product: ScrapedProduct, labelPattern: RegExp) {
  return product.data.specs.find((spec) => labelPattern.test(spec.label))?.value || "";
}

function priceTarget() {
  return process.env.SCRAPER_PRICE_TARGET === "compareAtPrice"
    ? "compareAtPrice"
    : "price";
}

function hptSku(model: string, sourceUrl?: string) {
  const normalizedModel = model
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  const sourceSuffix = sourceUrl
    ? `-${sourceIdentityKey(sourceUrl).replace(/^HPT-/, "").slice(0, 4)}`
    : "";
  return `HPT-${normalizedModel}${sourceSuffix}`;
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function inferScrapedProductTypeCode(inputName: string, requestedTypeCode: string) {
  const text = normalized(inputName);
  if (/\bmay\s+photocopy\b/.test(text) || /\bphotocop(y|ier)\b/.test(text)) {
    return "photocopier";
  }
  if (/\bmay\s+scan\b/.test(text) || /\bscanner\b/.test(text)) {
    return "scanner";
  }
  if (/\bphan\s+mem\b/.test(text) || /\bsoftware\b/.test(text)) {
    return "software";
  }
  if (/\b(muc\s+in|muc\s+may\s+in|hop\s+muc|toner|cartridge|drum|muc\s+photo|vat\s+tu\s+may\s+in|phu\s+kien\s+may\s+in|linh\s+kien\s+may\s+in)\b/.test(text)) {
    return "ink";
  }
  if (/\blaptop\b/.test(text) || /\bnotebook\b/.test(text)) {
    return "laptop";
  }
  return requestedTypeCode;
}

function categoryNameForProductType(productTypeCode: string, fallback: string) {
  if (productTypeCode === "photocopier") return PHOTOCOPIER_CATEGORY_NAME;
  if (productTypeCode === "printer") return PRINTER_CATEGORY_NAME;
  if (productTypeCode === "scanner") return SCANNER_CATEGORY_NAME;
  if (productTypeCode === "software") return SOFTWARE_CATEGORY_NAME;
  if (productTypeCode === "ink") return INK_CATEGORY_NAME;
  if (productTypeCode === "laptop") return LAPTOP_GAMING_CATEGORY_NAME;
  return fallback;
}

function photocopierModel(inputName: string, fallback?: string) {
  const model = extractRequestedModel(inputName) || fallback || modelFromTitle(inputName);
  if (!model) return undefined;
  const text = normalized(inputName);
  const speed = inputName.match(/tốc\s*độ\s*(\d+)/i)?.[1];
  const prefix = text.includes("apeosport")
    ? "APEOSPORT"
    : text.includes("docucentre")
      ? "DOCUCENTRE"
      : text.includes("apeos")
        ? "APEOS"
        : "";
  return [prefix, model, speed ? `${speed}PPM` : ""]
    .filter(Boolean)
    .join("-")
    .replace(/\s+/g, "-")
    .toUpperCase();
}

export function buildCanonicalImportRow(
  input: ExcelRow,
  product: ScrapedProduct,
  productTypeCode: string,
  options: { publish?: boolean } = {},
): CanonicalScraperRow {
  const effectiveProductTypeCode = inferScrapedProductTypeCode(
    input.name,
    productTypeCode,
  );
  const model =
    effectiveProductTypeCode === "photocopier"
      ? photocopierModel(input.name, product.data.sku?.trim())
      : effectiveProductTypeCode === "software" && product.data.sku?.trim()
        ? product.data.sku.trim()
      : extractRequestedModel(input.name) ||
        product.data.sku?.trim() ||
        modelFromTitle(product.data.title) ||
        modelFromTitle(input.name);
  if (!model) {
    throw new Error("Không xác định được model/SKU để nhập Catalog chuẩn.");
  }
  const normalizedSpecs = normalizeScrapedSpecs(
    product.data.specs,
    effectiveProductTypeCode,
  );
  const price = vndPrice(product.data.price);
  const useCompareAtPrice =
    effectiveProductTypeCode !== "software" && priceTarget() === "compareAtPrice";

  return {
    attributesJSON: JSON.stringify(normalizedSpecs.attributes),
    brandName: product.source.brand,
    categoryName: categoryNameForProductType(effectiveProductTypeCode, input.category),
    currency: "VND",
    internalId: product.source.identity?.key || sourceIdentityKey(product.source.url),
    isPrimary: "true",
    model,
    price: useCompareAtPrice ? "" : price,
    productName: input.name,
    productStatus: "draft",
    productTypeCode: effectiveProductTypeCode,
    quantity: "0",
    saleStatus: !useCompareAtPrice && price ? "active" : "contact",
    sku: (product.source.url.includes("anphatpc.com.vn") || product.source.url.includes("vietbis.vn")) && effectiveProductTypeCode !== "laptop"
      ? hptSku(model, product.source.url)
      : sourceVariantSku(product.source.url, product.data.sku),
    sourceType: "scraper",
    sourceUrl: product.source.url,
    stockStatus: "unknown",
    variantName: "Phiên bản tiêu chuẩn",
    variantStatus: options.publish ? "active" : "draft",
    vatIncluded: "true",
    vatRate: "10",
    warranty: product.data.warranty || specValue(product, /bảo hành|bao hanh/i),
    warehouseName: "Kho chính",
  };
}
