import { detectBrand } from "./brand-detector";
import { decodeHTML } from "entities";
import { crawlProductPage, crawlProductSource, normalizeProductSourceUrl } from "./crawler";
import { enrichProductContent } from "./enricher";
import {
  extractAnphatDescriptionHTML,
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
import {
  findExactSourceCandidate,
  normalizeSourceUrl,
  normalizedSourceName,
  sourceIdentityKey,
  sourceMatchMethod,
} from "./source-identity";
import { cleanText } from "./text";
import type { ScrapedImage, ScrapedProduct } from "./types";
import { validateExtractedProduct } from "./validator";

let hpttechSitemapPromise: Promise<string[]> | undefined;
const anphatCategoryProductsPromises = new Map<
  string,
  Promise<AnphatCategoryProduct[]>
>();
const vietbisCategoryProductsPromises = new Map<
  string,
  Promise<AnphatCategoryProduct[]>
>();

type AnphatCategoryProduct = {
  marketPrice?: string | number;
  price?: string | number;
  productImage?: {
    large?: string;
    medium?: string;
    small?: string;
  };
  productName: string;
  productSKU?: string;
  productSummary?: string;
  productUrl: string;
  specialOffer?: {
    all?: AnphatPromotion[];
    other?: AnphatPromotion[];
    service?: AnphatPromotion[];
  };
};

type AnphatPromotion = {
  description?: string;
  id?: string;
};

function vietbisOriginalProductImageUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.replace(/^www\./, "") !== "vietbis.vn") return url;
    parsed.pathname = parsed.pathname.replace(
      /\/Image\/_thumbs\/Picture\//i,
      "/Image/Picture/",
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

async function fetchSourceWithRetry(
  url: string,
  init: RequestInit,
  attempts = Number(process.env.SCRAPER_FETCH_RETRIES || 3),
) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(
          Number(process.env.SCRAPER_FETCH_TIMEOUT_MS || 20_000),
        ),
      });
      if (response.ok || response.status < 500) return response;
      lastError = new Error(`HTTP ${response.status}: ${url}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Không tải được nguồn: ${url}`);
}

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
    "photocopy",
    "photocopier",
    "tai",
    "lieu",
    "toc",
    "do",
  ]);
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !stopWords.has(token));
}

async function fetchAnphatCategoryProducts(categoryUrl: string) {
  const normalizedCategoryUrl = normalizeSourceUrl(categoryUrl);
  const categoryOrigin = new URL(normalizedCategoryUrl).origin;
  let pending = anphatCategoryProductsPromises.get(normalizedCategoryUrl);
  if (!pending) {
    pending = (async () => {
      const categoryResponse = await fetchSourceWithRetry(normalizedCategoryUrl, {
        headers: {
          "accept-language": "vi,en;q=0.8",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        },
      });
      if (!categoryResponse.ok) {
        throw new Error(
          `Không tải được danh mục An Phát (${categoryResponse.status}).`,
        );
      }
      const categoryHTML = await categoryResponse.text();
      const categoryId =
        categoryHTML.match(/show_more_product\(['"](\d+)['"]/i)?.[1] ||
        normalizedCategoryUrl.match(/_dm(\d+)\.html/i)?.[1];
      if (!categoryId) {
        throw new Error(`Không xác định được category ID từ ${normalizedCategoryUrl}.`);
      }

      const products: AnphatCategoryProduct[] = [];
      for (let page = 1; ; page += 1) {
        const url = `${categoryOrigin}/ajax/get_json.php?action=product&action_type=product-list&type=&category=${categoryId}&collection=&show=30&page=${page}&sort=order-last-update`;
        const response = await fetchSourceWithRetry(url, {
          headers: {
            accept: "application/json, text/javascript, */*; q=0.01",
            "accept-language": "vi,en;q=0.8",
            referer: normalizedCategoryUrl,
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
            "x-requested-with": "XMLHttpRequest",
          },
        });
        if (!response.ok) {
          throw new Error(`Không tải được API An Phát (${response.status}).`);
        }
        const payload = (await response.json()) as {
          list?: AnphatCategoryProduct[];
          total?: number;
        };
        const list = payload.list || [];
        products.push(...list);
        const total = Number(payload.total || 0);
        if (!list.length || (total > 0 && products.length >= total)) break;
      }
      return products.filter((product) => product.productName && product.productUrl);
    })();
    anphatCategoryProductsPromises.set(normalizedCategoryUrl, pending);
  }
  return pending;
}

async function fetchVietbisCategoryProducts(categoryUrl: string): Promise<AnphatCategoryProduct[]> {
  const normalizedCategoryUrl = normalizeSourceUrl(categoryUrl);
  let pending = vietbisCategoryProductsPromises.get(normalizedCategoryUrl);
  if (!pending) {
    pending = (async () => {
      const firstPageResponse = await fetchSourceWithRetry(normalizedCategoryUrl, {
        headers: {
          "accept-language": "vi,en;q=0.8",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        },
      });
      if (!firstPageResponse.ok) {
        throw new Error(`Khong tai duoc danh muc Vietbis (${firstPageResponse.status}).`);
      }

      const firstPageHtml = await firstPageResponse.text();
      const pageCount = Number(firstPageHtml.match(/\bclass=["']Paging["'][^>]*\bpages=["'](\d+)["']/i)?.[1] || 1);
      const products = parseVietbisCategoryProducts(firstPageHtml, normalizedCategoryUrl);
      for (let page = 2; page <= pageCount; page += 1) {
        const response = await fetchSourceWithRetry(vietbisPageUrl(normalizedCategoryUrl, page), {
          headers: {
            "accept-language": "vi,en;q=0.8",
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
          },
        });
        if (!response.ok) {
          throw new Error(`Khong tai duoc danh muc Vietbis trang ${page} (${response.status}).`);
        }
        products.push(...parseVietbisCategoryProducts(await response.text(), normalizedCategoryUrl));
      }
      const seen = new Set<string>();
      return products.filter((product) => {
        const key = product.productUrl;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    })();
    vietbisCategoryProductsPromises.set(normalizedCategoryUrl, pending);
  }
  return pending;
}

function vietbisPageUrl(categoryUrl: string, page: number) {
  if (page <= 1) return categoryUrl;
  const url = new URL(categoryUrl);
  url.pathname = url.pathname.replace(/(?:-pi=\d+)?\.html$/i, `-pi=${page}.html`);
  return url.toString();
}

function parseVietbisCategoryProducts(html: string, normalizedCategoryUrl: string): AnphatCategoryProduct[] {
  return [...html.matchAll(/<a\b[^>]*class=["'][^"']*\bcenter-block\b[^"']*["'][^>]*href=["']([^"']+)["'][^>]*title=["']([^"']+)["'][\s\S]*?<\/a>\s*<button\b/gi)]
    .map((match) => {
      const block = match[0];
      const productName =
        cleanText(block.match(/<h3\b[^>]*class=["'][^"']*\bProductName\b[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i)?.[1]) ||
        cleanText(decodeHTML(match[2]));
      const productUrl = normalizeSourceUrl(decodeHTML(match[1]), normalizedCategoryUrl);
      const productSKU =
        cleanText(block.match(/<span\b[^>]*class=["'][^"']*\bProductSerial\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) ||
        cleanText(block.match(/<span\b[^>]*class=["'][^"']*\bProductId\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i)?.[1]) ||
        undefined;
      const priceData = block.match(/<b\b[^>]*class=["'][^"']*\bProductPriceNew\b[^"']*["'][^>]*\bdata=["']([^"']*)["'][^>]*>/i)?.[1];
      const priceText = cleanText(block.match(/<b\b[^>]*class=["'][^"']*\bProductPriceNew\b[^"']*["'][^>]*>([\s\S]*?)<\/b>/i)?.[1]);
      const image = block.match(/<img\b[^>]*(?:data-original|src)=["']([^"']+)["'][^>]*>/i)?.[1];
      return {
        price: priceData && priceData !== "0" ? priceData : priceText || undefined,
        productImage: image
          ? {
              large:
                vietbisOriginalProductImageUrl(
                  normalizeSourceUrl(decodeHTML(image), normalizedCategoryUrl),
                ) || normalizeSourceUrl(decodeHTML(image), normalizedCategoryUrl),
            }
          : undefined,
        productName,
        productSKU,
        productUrl,
      };
    })
    .filter((product) => {
      const normalizedName = product.productName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return product.productName && product.productUrl && !normalizedName.startsWith("dich vu sua chua");
    });
}

export async function discoverSourceCategory(categoryUrl: string) {
  const url = normalizeSourceUrl(categoryUrl);
  const host = new URL(url).hostname.replace(/^www\./, "");
  const products =
    host === "vietbis.vn"
      ? await fetchVietbisCategoryProducts(url)
      : await fetchAnphatCategoryProducts(url);
  const response = await fetchSourceWithRetry(url, {
    headers: {
      "accept-language": "vi,en;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`Không tải được danh mục nguồn (${response.status}).`);
  }
  const html = await response.text();
  const title =
    cleanText(
      html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
        html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
        "",
    ) || new URL(url).pathname;
  return { products, title, url };
}

function anphatSyntheticHTML(product: AnphatCategoryProduct) {
  const specs = (product.productSummary || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      return value
        ? `<tr><td>${label.trim()}</td><td>${value}</td></tr>`
        : `<tr><td>Thông tin</td><td>${line}</td></tr>`;
    })
    .join("");
  const image =
    anphatOriginalProductImageUrl(product.productImage?.large) ||
    anphatOriginalProductImageUrl(product.productImage?.medium) ||
    anphatOriginalProductImageUrl(product.productImage?.small) ||
    "";
  return `
    <html>
      <head>
        <meta property="og:title" content="${product.productName}">
        <meta property="og:image" content="${image}">
        <script type="application/ld+json">
          ${JSON.stringify({
            "@type": "Product",
            image,
            name: product.productName,
            offers: { price: product.price },
            sku: product.productSKU,
          })}
        </script>
      </head>
      <body>
        <h1>${product.productName}</h1>
        <p>${product.productSummary || ""}</p>
        <table>${specs}</table>
      </body>
    </html>
  `;
}

function categorySyntheticHTML(product: AnphatCategoryProduct) {
  const image =
    anphatOriginalProductImageUrl(product.productImage?.large) ||
    anphatOriginalProductImageUrl(product.productImage?.medium) ||
    anphatOriginalProductImageUrl(product.productImage?.small) ||
    "";
  return `
    <html>
      <head>
        <meta property="og:title" content="${product.productName}">
        <meta property="og:image" content="${image}">
        <script type="application/ld+json">
          ${JSON.stringify({
            "@type": "Product",
            image,
            name: product.productName,
            offers: { price: product.price },
            sku: product.productSKU,
          })}
        </script>
      </head>
      <body>
        <h1>${product.productName}</h1>
        <p>${product.productSummary || ""}</p>
      </body>
    </html>
  `;
}

function anphatSummarySpecs(product: AnphatCategoryProduct) {
  return (product.productSummary || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const [label, ...rest] = line.split(":");
      const value = rest.join(":").trim();
      return value
        ? [{ label: label.trim(), value }]
        : [];
    });
}

function anphatSummarySellingPoints(product: AnphatCategoryProduct) {
  return (product.productSummary || "")
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean);
}

function anphatOriginalProductImageUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!/anphat/i.test(parsed.hostname) || !/\/media\/product\//i.test(parsed.pathname)) {
      return url;
    }
    parsed.pathname = parsed.pathname.replace(
      /\/media\/product\/(?:75|120|250)_/i,
      "/media/product/",
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

function prioritizeAnphatImages(images: ScrapedImage[]) {
  return [...images].sort((left, right) => {
    const score = (image: ScrapedImage) => {
      let total = 0;
      if (image.source === "api") total -= 100;
      if (/\/media\/product\/(?:75|120|250)_/i.test(image.url)) total += 50;
      if (image.source === "json-ld") total += 20;
      if (image.source === "meta") total += 10;
      if (image.source === "gallery") total -= 10;
      if (/\/media\/product\/\d+_/i.test(image.url)) total -= 5;
      if (/\/media\/lib\//i.test(image.url)) total -= 3;
      return total;
    };
    return score(left) - score(right);
  });
}

function mergeAnphatSpecs(
  summarySpecs: Array<{ label: string; value: string }>,
  extractedSpecs: Array<{ label: string; value: string }>,
) {
  const seen = new Set<string>();
  return [...extractedSpecs, ...summarySpecs].filter((spec) => {
    const key = cleanText(spec.label)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function anphatPromotionText(product: AnphatCategoryProduct) {
  const preferred = [
    ...(product.specialOffer?.service || []),
    ...(product.specialOffer?.other || []),
  ];
  const entries = preferred.length ? preferred : product.specialOffer?.all || [];
  const seen = new Set<string>();
  const lines: string[] = [];

  for (const entry of entries) {
    const description = String(entry.description || "")
      .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n");
    for (const line of description.split(/\r?\n/)) {
      const text = cleanText(line).replace(/\s*Xem ngay\s*$/i, "").trim();
      const key = text.toLocaleLowerCase("vi");
      if (!text || seen.has(key)) continue;
      seen.add(key);
      lines.push(text);
    }
  }

  return lines.join("\n") || undefined;
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
    /\/(?:may-scan|may-in|canon-|plustek-|microtek-|hp-scanjet|epson-|ricoh-|kodak-|brother-|kyocera-|xprinter-)/.test(
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
  const validation = validateExtractedProduct(data, true, {
    hasImages: images.length > 0,
    sourceExact: true,
  });

  return {
    confidence: validation.confidence,
    data,
    generated,
    images,
    reviewStatus: validation.reviewStatus,
    seo,
    source: {
      brand: brand.name,
      identity: {
        exact: true,
        key: sourceIdentityKey(url),
        method: "url",
      },
      searchQuery: productName,
      url,
      urls: [url],
    },
    warnings: validation.warnings,
  };
}

async function searchProductFromCategory(
  productName: string,
  categoryUrl: string,
): Promise<ScrapedProduct> {
  const brand = await detectBrand(productName);
  const category = await discoverSourceCategory(categoryUrl);
  const match = findExactSourceCandidate(
    category.products,
    productName,
    category.url,
  );
  const url = normalizeSourceUrl(match.productUrl, category.url);
  const html = await crawlProductSource(url, "fetch");
  if (!html) throw new Error(`Trang nguồn không có HTML: ${url}`);

  const isAnphat =
    new URL(category.url).hostname.replace(/^www\./, "") === "anphatpc.com.vn";
  const syntheticHTML = isAnphat ? anphatSyntheticHTML(match) : categorySyntheticHTML(match);
  const extracted = await gptExtractProduct(
    [
      { html, sourceType: "retailer", url },
      { html: syntheticHTML, sourceType: "retailer", url },
    ],
    productName,
  );
  const data = {
    ...extracted,
    compareAtPrice:
      match.marketPrice !== undefined ? String(match.marketPrice) : extracted.compareAtPrice,
    price: match.price !== undefined ? String(match.price) : extracted.price,
    promoText: isAnphat ? anphatPromotionText(match) : undefined,
    sellingPoints: isAnphat ? anphatSummarySellingPoints(match) : undefined,
    sku: extracted.sku,
    specs: isAnphat ? mergeAnphatSpecs(anphatSummarySpecs(match), extracted.specs) : extracted.specs,
    title: productName,
  };
  data.descriptionHTML =
    data.descriptionHTML || (isAnphat ? extractAnphatDescriptionHTML(html, productName) : undefined);
  const apiImage =
    anphatOriginalProductImageUrl(match.productImage?.large) ||
    anphatOriginalProductImageUrl(match.productImage?.medium) ||
    anphatOriginalProductImageUrl(match.productImage?.small);
  const images = prioritizeAnphatImages([
    ...(apiImage
      ? [{ alt: data.title, source: "api" as const, url: apiImage }]
      : []),
    ...extractProductImagesFromHtml(url, html),
    ...extractProductImagesFromHtml(url, syntheticHTML),
  ]);
  const generated = await enrichProductContent(data, brand.name);
  const seo = generateSeo(data, brand.name);
  const validation = validateExtractedProduct(data, true, {
    hasImages: images.length > 0,
    sourceExact: true,
  });

  return {
    confidence: validation.confidence,
    data,
    generated,
    images,
    reviewStatus: validation.reviewStatus,
    seo,
    source: {
      brand: brand.name,
      identity: {
        exact: true,
        key: sourceIdentityKey(url),
        method: sourceMatchMethod(match, productName),
      },
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
  const sourceExact = !search.warning;
  const validation = validateExtractedProduct(data, sourceExact, {
    hasImages: images.length > 0,
    sourceExact,
  });

  return {
    confidence: validation.confidence,
    data,
    generated,
    images,
    reviewStatus: validation.reviewStatus,
    seo,
    source: {
      brand: brand.name,
      identity: {
        exact: sourceExact,
        key: sourceIdentityKey(search.url),
        method: "url",
      },
      searchQuery: search.searchQuery,
      url: search.url,
    },
    warnings: search.warning ? [search.warning, ...validation.warnings] : validation.warnings,
  };
}

export async function searchProductMultiSource(
  query: string,
  categoryUrl?: string,
): Promise<ScrapedProduct> {
  const productName = query.trim();
  if (!productName) throw new Error("Vui long nhap ten san pham.");
  if (categoryUrl) {
    return searchProductFromCategory(productName, categoryUrl);
  }
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
  const requestedModel = extractRequestedModel(productName);
  const modelExact = requestedModel
    ? textContainsModel(`${data.title} ${data.sku || ""}`, requestedModel)
    : selectedSources.some(
        (source) =>
          normalizedSourceName(source.title) === normalizedSourceName(productName),
      );
  const validation = validateExtractedProduct(data, true, {
    hasImages: images.length > 0,
    sourceExact: modelExact,
  });
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
      identity: {
        exact: modelExact,
        key: sourceIdentityKey(htmlSources[0].url),
        method: "name",
      },
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

  const configuredBrand = findBrandByUrl(productUrl);
  const isAnphat = new URL(productUrl).hostname.replace(/^www\./, "") === "anphatpc.com.vn";
  if (!configuredBrand && !isAnphat) {
    throw new Error("URL này chưa thuộc nguồn được hỗ trợ.");
  }

  const html = configuredBrand
    ? await crawlProductPage(productUrl, configuredBrand)
    : await crawlProductSource(productUrl, "fetch");
  if (!html) throw new Error(`Trang nguồn không có HTML: ${productUrl}`);
  const preliminary = await extractProductFromUrl(
    productUrl,
    configuredBrand?.name || "",
    html,
  );
  const brand = configuredBrand || (await detectBrand(preliminary.title));
  const data = configuredBrand
    ? preliminary
    : await extractProductFromUrl(productUrl, brand.name, html);
  const images = extractProductImagesFromHtml(productUrl, html);
  const generated = await enrichProductContent(data, brand.name);
  const seo = generateSeo(data, brand.name);
  const validation = validateExtractedProduct(data, true, {
    hasImages: images.length > 0,
    sourceExact: true,
  });

  return {
    confidence: validation.confidence,
    data,
    generated,
    images,
    reviewStatus: validation.reviewStatus,
    seo,
    source: {
      brand: brand.name,
      identity: {
        exact: true,
        key: sourceIdentityKey(productUrl),
        method: "url",
      },
      searchQuery: "",
      url: productUrl,
    },
    warnings: validation.warnings,
  };
}
