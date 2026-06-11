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
import {
  alignExtractedProductModel,
  extractRequestedModel,
  textContainsModel,
} from "./model-identity";
import { findOfficialProductUrl } from "./searcher";
import {
  selectProductSources,
  tavilyMultiSourceSearch,
} from "./tavily-searcher";
import type { ScrapedProduct } from "./types";
import { validateExtractedProduct } from "./validator";

let hpttechSitemapPromise: Promise<string[]> | undefined;

function hpttechOnlyMode() {
  const domains = (
    process.env.SCRAPER_ALLOWED_DOMAINS ||
    process.env.TAVILY_ALLOWED_DOMAINS ||
    ""
  )
    .split(",")
    .map((domain) => domain.trim().replace(/^www\./, "").toLowerCase())
    .filter(Boolean);
  return domains.length === 1 && domains[0] === "hpttech.vn";
}

async function hpttechSitemapUrls() {
  if (!hpttechSitemapPromise) {
    hpttechSitemapPromise = fetch("https://hpttech.vn/sitemap.xml", {
      headers: {
        "accept-language": "vi,en;q=0.8",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
      },
      signal: AbortSignal.timeout(
        Number(process.env.SCRAPER_FETCH_TIMEOUT_MS || 10_000),
      ),
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Không tải được sitemap HPTTech (${response.status}).`);
      }
      const xml = await response.text();
      return [...xml.matchAll(/<loc>(https:\/\/hpttech\.vn\/[^<]+)<\/loc>/gi)]
        .map((match) => match[1]);
    });
  }
  return hpttechSitemapPromise;
}

function normalizedSearchTokens(value: string) {
  const stopWords = new Set([
    "a3",
    "a4",
    "bao",
    "dong",
    "kho",
    "may",
    "mini",
    "sach",
    "scan",
    "scanner",
    "tai",
    "lieu",
  ]);
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !stopWords.has(token));
}

function hpttechUrlScore(url: string, productName: string) {
  const tokens = normalizedSearchTokens(productName);
  if (!tokens.length) return 0;
  const path = decodeURIComponent(new URL(url).pathname).toLowerCase();
  const matched = tokens.filter((token) => path.includes(token));
  const requiredModelTokens = tokens.filter((token) => /\d/.test(token));
  if (requiredModelTokens.some((token) => !path.includes(token))) return 0;
  const coverage = matched.length / tokens.length;
  const productBonus =
    /\/(?:may-scan|canon-|plustek-|microtek-|hp-scanjet|epson-|ricoh-|kodak-)/.test(
      path,
    )
      ? 0.15
      : 0;
  return coverage + productBonus;
}

export async function findHpttechProductUrl(productName: string) {
  const model = extractRequestedModel(productName);
  const urls = await hpttechSitemapUrls();
  const modelAlias =
    model === "X50S"
      ? "X50"
      : model === "LS-4600T"
        ? "LS-4600"
        : model;
  const modelMatches = modelAlias
    ? urls.filter((item) => textContainsModel(item, modelAlias))
    : [];
  const url =
    modelMatches
      .map((item) => ({ item, score: hpttechUrlScore(item, productName) }))
      .sort((a, b) => b.score - a.score)[0]?.item ||
    urls
      .map((item) => ({ item, score: hpttechUrlScore(item, productName) }))
      .filter((item) => item.score >= 0.75)
      .sort((a, b) => b.score - a.score)[0]?.item;
  if (!url) {
    throw new Error(
      `Không tìm thấy ${model ? `model ${model}` : productName} trong sitemap hpttech.vn.`,
    );
  }
  return url;
}

async function searchProductFromHpttech(
  productName: string,
): Promise<ScrapedProduct> {
  const brand = await detectBrand(productName);
  const url = await findHpttechProductUrl(productName);
  const html = await crawlProductSource(url, "fetch");
  if (!html) throw new Error(`Trang HPTTech không có HTML: ${url}`);

  const data = alignExtractedProductModel(
    await gptExtractProduct(
      [{ html, sourceType: "retailer", url }],
      productName,
    ),
    productName,
  );
  const images = extractProductImagesFromHtml(url, html);
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
      searchQuery: productName,
      url,
      urls: [url],
    },
    warnings: validation.warnings,
  };
}

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
  if (hpttechOnlyMode()) {
    return searchProductFromHpttech(productName);
  }

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
