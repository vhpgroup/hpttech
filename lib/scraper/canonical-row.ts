import type { ExcelRow, ScrapedProduct } from "./types";
import { extractRequestedModel } from "./model-identity";
import { normalizeScrapedSpecs } from "./spec-normalizer";
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

function hptSku(model: string) {
  return `HPT-${model.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toUpperCase()}`;
}

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
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
  const model =
    productTypeCode === "photocopier"
      ? photocopierModel(input.name, product.data.sku?.trim())
      : productTypeCode === "software" && product.data.sku?.trim()
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
    productTypeCode,
  );
  const price = vndPrice(product.data.price);
  const useCompareAtPrice =
    productTypeCode !== "software" && priceTarget() === "compareAtPrice";

  return {
    attributesJSON: JSON.stringify(normalizedSpecs.attributes),
    brandName: product.source.brand,
    categoryName: input.category,
    currency: "VND",
    internalId: product.source.identity?.key || sourceIdentityKey(product.source.url),
    isPrimary: "true",
    model,
    price: useCompareAtPrice ? "" : price,
    productName: input.name,
    productStatus: "draft",
    productTypeCode,
    quantity: "0",
    saleStatus: !useCompareAtPrice && price ? "active" : "contact",
    sku: product.source.url.includes("anphatpc.com.vn")
      ? hptSku(model)
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
