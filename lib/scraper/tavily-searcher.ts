import { detectBrand } from "./brand-detector";
import {
  extractRequestedModel,
  textContainsModel,
} from "./model-identity";
import type { BrandConfig, TavilySearchResult } from "./types";

type TavilyResult = {
  content?: string;
  score?: number;
  title?: string;
  url?: string;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

export const RETAILER_DOMAINS = [
  "anphatpc.com.vn",
  "phucanh.vn",
  "hacom.vn",
  "gearvn.com",
  "thegioiscan.vn",
  "vietbis.vn",
  "tanhungha.com.vn",
  "mayvanphonghabac.com.vn",
  "sieuviet.com.vn",
  "mucinthanhdat.com",
  "hpttech.vn",
] as const;

function configuredAllowedDomains() {
  const raw =
    process.env.SCRAPER_ALLOWED_DOMAINS ||
    process.env.TAVILY_ALLOWED_DOMAINS;
  return raw
    ?.split(",")
    .map((domain) =>
      domain
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .toLowerCase(),
    )
    .filter(Boolean);
}

const RETAILER_PRIORITY = new Map(
  RETAILER_DOMAINS.map((domain, index) => [domain, index]),
);

function hostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizedBrandDomain(brand: BrandConfig) {
  return brand.domain.replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase();
}

function normalizedBrandDomains(brand: BrandConfig) {
  return [
    normalizedBrandDomain(brand),
    ...(brand.extraDomains || []).map((domain) =>
      domain.replace(/^www\./, "").replace(/\/.*$/, "").toLowerCase(),
    ),
  ].filter((domain, index, domains) => domain && domains.indexOf(domain) === index);
}

function matchesDomain(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

function retailerPriority(domain: string) {
  return RETAILER_PRIORITY.get(domain as (typeof RETAILER_DOMAINS)[number]) ?? 999;
}

function pdfLanguagePriority(result: TavilySearchResult) {
  const text = `${result.url} ${result.title}`.toLowerCase();
  if (/\b(bpr|bra|br|pt|por|esp|fr|de|ita|jpn|kor)_/.test(text)) return 80;
  if (/c=br|lang=pt|portugu[eê]s|brasil/.test(text)) return 80;
  if (/\b(use|usa|uke|eng|en)_/.test(text) || /brother usa|united states|english/.test(text)) {
    return -40;
  }
  return 0;
}

function manufacturerPagePriority(result: TavilySearchResult) {
  const text = `${result.url} ${result.title}`.toLowerCase();
  if (text.includes("spec.aspx") || text.includes("specification")) return -1300;
  if (text.includes("/products/") || text.includes("/devices/")) return -1250;
  if (isPdfSource(result.url)) return -1200 + pdfLanguagePriority(result);
  if (text.includes("manual")) return -1100;
  return -1150;
}

function sourceGroup(result: TavilySearchResult) {
  const text = `${result.url} ${result.title}`.toLowerCase();
  if (isPdfSource(result.url)) return "pdf";
  if (text.includes("spec.aspx") || text.includes("specification")) return "spec";
  if (text.includes("/products/") || text.includes("/devices/")) return "product";
  if (text.includes("manual")) return "manual";
  return "other";
}

function resultPriority(result: TavilySearchResult) {
  if (result.isManufacturer) return manufacturerPagePriority(result) - result.score;
  return retailerPriority(result.domain) * 10 - result.score;
}

function isPdfSource(url: string) {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
}

function isCrawlableSource(result: TavilySearchResult) {
  try {
    const parsed = new URL(result.url);
    const path = parsed.pathname.toLowerCase();
    const text = `${path} ${parsed.search}`.toLowerCase();
    if (path.endsWith(".pdf")) return result.isManufacturer;
    return !/\b(download|downloadtop|driver|firmware)\b/.test(text);
  } catch {
    return false;
  }
}

export function selectProductSources(
  results: TavilySearchResult[],
  productName: string,
) {
  const requestedModel = extractRequestedModel(productName);
  const exactResults = requestedModel
    ? results.filter(
        (result) =>
          isCrawlableSource(result) &&
          textContainsModel(`${result.title} ${result.url}`, requestedModel),
      )
    : results.filter((result) => isCrawlableSource(result));
  const sorted = exactResults.sort(
    (a, b) => resultPriority(a) - resultPriority(b),
  );
  const manufacturer = sorted.find((result) => result.isManufacturer);
  const manufacturerPdf = sorted.find(
    (result) =>
      result.isManufacturer &&
      isPdfSource(result.url) &&
      result.url !== manufacturer?.url,
  );
  const retailer = sorted.find((result) => !result.isManufacturer);
  const selected = [manufacturer, manufacturerPdf, retailer].filter(
    (result): result is TavilySearchResult => Boolean(result),
  );

  if (selected.length < 3) {
    const selectedUrls = new Set(selected.map((result) => result.url));
    const selectedGroups = new Set(selected.map((result) => sourceGroup(result)));
    const fallback =
      sorted.find(
        (result) =>
          !selectedUrls.has(result.url) && !selectedGroups.has(sourceGroup(result)),
      ) || sorted.find((result) => !selectedUrls.has(result.url));
    if (fallback) selected.push(fallback);
  }
  return selected.slice(0, 3);
}

export async function tavilyMultiSourceSearch(
  productName: string,
): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("Thiếu TAVILY_API_KEY.");

  const brand = await detectBrand(productName);
  const allowedDomains = configuredAllowedDomains();
  const manufacturerDomains = allowedDomains ? [] : normalizedBrandDomains(brand);
  const retailerDomains = allowedDomains || [...RETAILER_DOMAINS];
  const includeDomains = [...retailerDomains, ...manufacturerDomains];
  const response = await fetch("https://api.tavily.com/search", {
    body: JSON.stringify({
      include_answer: false,
      include_domains: includeDomains,
      include_images: false,
      include_raw_content: false,
      max_results: 20,
      query: `${productName} thông số kỹ thuật giá specifications datasheet manual pdf`,
      search_depth: process.env.TAVILY_SEARCH_DEPTH || "advanced",
      topic: "general",
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(
      Number(process.env.TAVILY_SEARCH_TIMEOUT_MS || 20_000),
    ),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Tavily lỗi ${response.status}: ${body.slice(0, 300)}`);
  }

  const payload = (await response.json()) as TavilyResponse;
  const seen = new Set<string>();
  return (payload.results || [])
    .flatMap((item): TavilySearchResult[] => {
      if (!item.url || !item.title) return [];
      const host = hostname(item.url);
      const retailerDomain = retailerDomains.find((domain) =>
        matchesDomain(host, domain),
      );
      const manufacturerDomain = manufacturerDomains.find((domain) =>
        matchesDomain(host, domain),
      );
      const isManufacturer = Boolean(manufacturerDomain);
      if (!retailerDomain && !isManufacturer) return [];
      return [
        {
          content: item.content,
          domain: isManufacturer ? manufacturerDomain! : retailerDomain!,
          isManufacturer,
          score: Math.max(0, Math.min(1, item.score ?? 0.5)),
          sourceType: isManufacturer ? "manufacturer" : "retailer",
          title: item.title,
          url: item.url,
        },
      ];
    })
    .filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
}
