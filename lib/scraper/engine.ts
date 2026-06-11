import { detectBrand } from "./brand-detector";
import { crawlProductPage, crawlProductSource, normalizeProductSourceUrl } from "./crawler";
import { enrichProductContent } from "./enricher";
import {
  extractProductFromUrl,
  extractProductImagesFromHtml,
  gptExtractProduct,
} from "./extractor";
import { findBrandByUrl } from "./brands";
import { generateSeo } from "./seo-generator";
import { alignExtractedProductModel } from "./model-identity";
import { findOfficialProductUrl } from "./searcher";
import {
  selectProductSources,
  tavilyMultiSourceSearch,
} from "./tavily-searcher";
import type { ScrapedProduct } from "./types";
import { validateExtractedProduct } from "./validator";

export async function searchProduct(query: string): Promise<ScrapedProduct> {
  const productName = query.trim();
  if (!productName) throw new Error("Vui long nhap ten san pham.");
  if (process.env.TAVILY_API_KEY) {
    return searchProductMultiSource(productName);
  }

  const brand = await detectBrand(productName);
  const search = await findOfficialProductUrl(productName, brand);
  const html = await crawlProductPage(search.url, brand);
  const data = await extractProductFromUrl(search.url, productName, html);
  const images = extractProductImagesFromHtml(search.url, html);
  const generated = await enrichProductContent(data, brand.name);
  const seo = generateSeo(data, brand.name);
  const validation = validateExtractedProduct(data, !search.warning);

  return {
    confidence: validation.confidence,
    data,
    generated,
    images,
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

export async function searchProductMultiSource(
  query: string,
): Promise<ScrapedProduct> {
  const productName = query.trim();
  if (!productName) throw new Error("Vui long nhap ten san pham.");

  const brand = await detectBrand(productName);
  const searchResults = await tavilyMultiSourceSearch(productName);
  const selectedSources = selectProductSources(searchResults, productName);
  if (!selectedSources.length) {
    throw new Error("Tavily khong tim thay nguon phu hop trong whitelist.");
  }

  const crawlResults = await Promise.allSettled(
    selectedSources.map(async (source) => {
      const method = source.isManufacturer ? brand.crawlMethod : "fetch";
      const url = normalizeProductSourceUrl(source.url);
      const html = await crawlProductSource(url, method);
      if (!html) throw new Error(`Nguon khong co HTML: ${url}`);
      return {
        html,
        snippet: source.content,
        sourceType: source.sourceType,
        url,
      };
    }),
  );
  const htmlSources = crawlResults.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
  const extractionSources = [
    ...htmlSources,
    ...htmlSources.flatMap((source) =>
      source.snippet
        ? [
            {
              html: `__PDF_TEXT__\n${source.snippet}`,
              sourceType: source.sourceType,
              url: source.url,
            },
          ]
        : [],
    ),
  ];
  if (!htmlSources.length) {
    const errors = crawlResults
      .flatMap((result) =>
        result.status === "rejected" ? [String(result.reason)] : [],
      )
      .join(" | ");
    throw new Error(`Khong crawl duoc nguon nao. ${errors}`);
  }

  const data = alignExtractedProductModel(
    await gptExtractProduct(extractionSources, productName),
    productName,
  );
  const images = htmlSources.flatMap((source) =>
    extractProductImagesFromHtml(source.url, source.html),
  );
  const generated = await enrichProductContent(data, brand.name);
  const seo = generateSeo(data, brand.name);
  const validation = validateExtractedProduct(data, true);
  const crawlWarnings = crawlResults.flatMap((result, index) =>
    result.status === "rejected"
      ? [`Khong crawl duoc ${selectedSources[index].url}: ${String(result.reason)}`]
      : [],
  );

  return {
    confidence: Math.max(
      0.35,
      Number((validation.confidence - crawlWarnings.length * 0.06).toFixed(2)),
    ),
    data,
    generated,
    images,
    reviewStatus:
      crawlWarnings.length || validation.reviewStatus === "needs_human_input"
        ? "needs_human_input"
        : "ready_to_review",
    seo,
    source: {
      brand: brand.name,
      searchQuery: productName,
      url: htmlSources[0].url,
      urls: htmlSources.map((source) => source.url),
    },
    warnings: [...crawlWarnings, ...validation.warnings],
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
  const images = extractProductImagesFromHtml(productUrl, html);
  const generated = await enrichProductContent(data, brand.name);
  const seo = generateSeo(data, brand.name);
  const validation = validateExtractedProduct(data, true);

  return {
    confidence: validation.confidence,
    data,
    generated,
    images,
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
