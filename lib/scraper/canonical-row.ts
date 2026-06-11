import type { ExcelRow, ScrapedProduct } from "./types";
import {
  extractRequestedModel,
  textContainsModel,
} from "./model-identity";
import { normalizeScrapedSpecs } from "./spec-normalizer";

export type CanonicalScraperRow = Record<string, string>;

function modelFromTitle(value: string) {
  return value
    .match(/\b[A-Z]{1,6}(?:[-\s]?[A-Z0-9]){2,16}\b/gi)
    ?.map((item) => item.replace(/\s+/g, "-"))
    .find((item) => /\d/.test(item));
}

function vndPrice(value?: string) {
  if (!value) return "";
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const million = normalized.match(/(\d+(?:[,.]\d+)?)\s*(trieu|tr)\b/);
  if (million) {
    const amount = Number(million[1].replace(",", "."));
    return Number.isFinite(amount) ? String(Math.round(amount * 1_000_000)) : "";
  }
  const digits = value.replace(/[^\d]/g, "");
  return digits && Number(digits) >= 100_000 ? digits : "";
}

function productTitleFromSource(title: string | undefined, model: string) {
  if (!title || !textContainsModel(title, model)) return undefined;
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (
    /\b(downloads?|drivers?|manuals?|support|firmware|specifications?)\b/.test(
      normalized,
    )
  ) {
    return undefined;
  }
  return title;
}

export function buildCanonicalImportRow(
  input: ExcelRow,
  product: ScrapedProduct,
  productTypeCode: string,
): CanonicalScraperRow {
  const model =
    extractRequestedModel(input.name) ||
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

  return {
    attributesJSON: JSON.stringify(normalizedSpecs.attributes),
    brandName: product.source.brand,
    categoryName: input.category,
    currency: "VND",
    isPrimary: "true",
    model,
    price: vndPrice(product.data.price),
    productName: productTitleFromSource(product.data.title, model) || input.name,
    productStatus: "draft",
    productTypeCode,
    quantity: "0",
    saleStatus: "contact",
    sku: model,
    sourceType: "scraper",
    sourceUrl: product.source.url,
    stockStatus: "unknown",
    variantName: "Phiên bản tiêu chuẩn",
    variantStatus: "draft",
    vatIncluded: "true",
    vatRate: "10",
    warranty: product.data.warranty || "",
    warehouseName: "Kho chính",
  };
}
