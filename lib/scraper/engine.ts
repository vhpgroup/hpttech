import { detectBrand } from "./brand-detector";
import { crawlProductPage } from "./crawler";
import { enrichProductContent } from "./enricher";
import { extractProductFromUrl } from "./extractor";
import { findBrandByUrl } from "./brands";
import { generateSeo } from "./seo-generator";
import { findOfficialProductUrl } from "./searcher";
import type { ScrapedProduct } from "./types";
import { validateExtractedProduct } from "./validator";

export async function searchProduct(query: string): Promise<ScrapedProduct> {
  const productName = query.trim();
  if (!productName) throw new Error("Vui long nhap ten san pham.");

  const brand = await detectBrand(productName);
  const search = await findOfficialProductUrl(productName, brand);
  const html = await crawlProductPage(search.url, brand);
  const data = await extractProductFromUrl(search.url, productName, html);
  const generated = await enrichProductContent(data, brand.name);
  const seo = generateSeo(data, brand.name);
  const validation = validateExtractedProduct(data, !search.warning);

  return {
    confidence: validation.confidence,
    data,
    generated,
    reviewStatus: validation.reviewStatus,
    seo,
    source: {
      brand: brand.name,
      searchQuery: search.searchQuery,
      url: search.url,
    },
    warnings: search.warning ? [search.warning, ...validation.warnings] : validation.warnings,
  };
}

export async function scrapeProductUrl(url: string): Promise<ScrapedProduct> {
  const productUrl = url.trim();
  if (!productUrl) throw new Error("Vui long nhap URL san pham.");

  const brand = findBrandByUrl(productUrl);
  if (!brand) {
    throw new Error("URL nay chua thuoc brand duoc ho tro trong MVP.");
  }

  const html = await crawlProductPage(productUrl, brand);
  const data = await extractProductFromUrl(productUrl, brand.name, html);
  const generated = await enrichProductContent(data, brand.name);
  const seo = generateSeo(data, brand.name);
  const validation = validateExtractedProduct(data, true);

  return {
    confidence: validation.confidence,
    data,
    generated,
    reviewStatus: validation.reviewStatus,
    seo,
    source: {
      brand: brand.name,
      searchQuery: "",
      url: productUrl,
    },
    warnings: validation.warnings,
  };
}
