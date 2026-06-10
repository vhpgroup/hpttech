import {
  normalizeExternalProduct,
  sourceNameFromUrl,
  type ExternalProduct,
  type ProductSearchOptions,
  type ProductSearchResult,
  type SearchProvider,
} from "@/lib/search/search-provider";

type SerpShoppingResult = {
  extracted_price?: number;
  link?: string;
  price?: string;
  product_link?: string;
  source?: string;
  thumbnail?: string;
  title?: string;
};

type SerpOrganicResult = {
  displayed_link?: string;
  link?: string;
  snippet?: string;
  title?: string;
};

type SerpResponse = {
  error?: string;
  organic_results?: SerpOrganicResult[];
  shopping_results?: SerpShoppingResult[];
};

const VIETNAM_MARKETPLACES = ["shopee.", "lazada.", "tiki.vn", "sendo.vn"];

const FOREIGN_SELLER_PATTERNS = [
  "amazon",
  "ebay",
  "ubuy",
  "microless",
  "tejar",
  "desertcart",
  "fruugo",
  "walmart",
  "newegg",
  "best buy",
  "bestbuy",
  "alibaba",
  "aliexpress",
  "dhgate",
  "noon",
  "cart2india",
  "scribd",
  "mediaserver",
  "manualslib",
];

const VIETNAM_HINT_PATTERNS = [
  ".vn",
  "vietnam",
  "viet nam",
  "cong ty",
  "cty",
  "tnhh",
  "jsc",
  "may van phong",
  "thiet bi",
  "vien thong",
  "tin hoc",
  "ha noi",
  "hanoi",
  "hai phong",
  "ho chi minh",
  "hcm",
  "sai gon",
];

const NON_PRODUCT_PATTERNS = [
  "review",
  "danh gia",
  "so sanh",
  "top ",
  "huong dan",
  "manual",
  "driver",
  "support",
];

function normalizeMarketText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function isVietnamMarketplace(source: string, url: string) {
  const text = normalizeMarketText(`${source} ${url}`);
  return VIETNAM_MARKETPLACES.some((pattern) => text.includes(pattern));
}

function isForeignSeller(source: string, url: string) {
  const text = normalizeMarketText(`${source} ${url}`);
  return FOREIGN_SELLER_PATTERNS.some((pattern) => text.includes(pattern));
}

function isVietnameseMarket(url: string, source = "") {
  if (isForeignSeller(source, url)) return false;
  const host = sourceNameFromUrl(url);
  const urlForMarketHints = host.includes("google.") ? "" : url;
  const text = normalizeMarketText(`${urlForMarketHints} ${source}`);
  if (VIETNAM_HINT_PATTERNS.some((pattern) => text.includes(pattern))) return true;
  return isVietnamMarketplace(source, url);
}

function sourceType(source: string, url: string): ExternalProduct["marketSourceType"] {
  if (isVietnamMarketplace(source, url)) return "marketplace";
  const host = sourceNameFromUrl(url);
  if (host.includes("brother") || host.includes("epson") || host.includes("ricoh") || host.includes("canon") || host.includes("hp.")) {
    return "official";
  }
  return "merchant";
}

export function parseVietnamPrice(value?: string | number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = Math.round(value);
    return parsed >= 1_000_000 ? parsed : undefined;
  }
  const raw = String(value || "");
  const text = normalizeMarketText(raw);
  if (!text) return undefined;

  const hasPriceSignal =
    text.includes("vnd") ||
    text.includes("dong") ||
    text.includes("trieu") ||
    /\d\s*tr\b/.test(text) ||
    raw.includes("₫");
  if (!hasPriceSignal) return undefined;

  const million = text.match(/(\d+(?:[,.]\d+)?)\s*(trieu|tr|million)/i);
  if (million) {
    const parsed = Number(million[1].replace(",", "."));
    return Number.isFinite(parsed) ? Math.round(parsed * 1_000_000) : undefined;
  }

  const vndMatch = text.match(/(\d[\d.,\s]{3,})\s*(vnd|dong|d)?/i);
  if (!vndMatch) return undefined;
  const digits = vndMatch[1].replace(/[^\d]/g, "");
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed >= 100_000 ? parsed : undefined;
}

function priceText(value?: string, priceValue?: number) {
  if (value?.trim()) return value.trim();
  if (typeof priceValue === "number") return `${priceValue.toLocaleString("vi-VN")} VND`;
  return undefined;
}

function organicPrice(snippet?: string, title?: string) {
  return parseVietnamPrice(`${title || ""} ${snippet || ""}`);
}

function confidenceFor(product: {
  source: string;
  title: string;
  url: string;
  priceValue?: number;
  organic?: boolean;
}) {
  let score = product.organic ? 0.48 : 0.68;
  if (product.priceValue) score += 0.16;
  if (isVietnameseMarket(product.url, product.source)) score += 0.1;
  if (isVietnamMarketplace(product.source, product.url)) score -= 0.08;
  const title = normalizeMarketText(product.title);
  if (NON_PRODUCT_PATTERNS.some((pattern) => title.includes(pattern))) score -= 0.2;
  return Math.max(0.05, Math.min(0.98, score));
}

export class SerpAPIProvider implements SearchProvider {
  constructor(private readonly apiKey: string) {}

  private async request(params: Record<string, string | number>, signal: AbortSignal) {
    const url = new URL("https://serpapi.com/search.json");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
    url.searchParams.set("api_key", this.apiKey);

    const response = await fetch(url, { signal });
    const payload = (await response.json().catch(() => ({}))) as SerpResponse;
    if (!response.ok || payload.error) {
      throw new Error(payload.error || `SerpAPI request failed with status ${response.status}.`);
    }
    return payload;
  }

  private shoppingProduct(item: SerpShoppingResult): ExternalProduct | undefined {
    const name = item.title?.replace(/\s+/g, " ").trim();
    const sourceUrl = item.product_link || item.link || "";
    if (!name || !sourceUrl) return undefined;
    const source = item.source || sourceNameFromUrl(sourceUrl);
    const priceValue = parseVietnamPrice(item.extracted_price ?? item.price);
    return normalizeExternalProduct({
      confidence: confidenceFor({ priceValue, source, title: name, url: sourceUrl }),
      imageUrl: item.thumbnail,
      marketSourceType: sourceType(source, sourceUrl),
      name,
      priceCurrency: priceValue ? "VND" : undefined,
      priceText: priceText(item.price, priceValue),
      priceValue,
      sourceName: source,
      sourceUrl,
    });
  }

  private organicProduct(item: SerpOrganicResult): ExternalProduct | undefined {
    const name = item.title?.replace(/\s+/g, " ").trim();
    const sourceUrl = item.link || "";
    if (!name || !sourceUrl) return undefined;
    const source = item.displayed_link || sourceNameFromUrl(sourceUrl);
    const priceValue = organicPrice(item.snippet, item.title);
    if (!priceValue) return undefined;
    return normalizeExternalProduct({
      confidence: confidenceFor({ organic: true, priceValue, source, title: name, url: sourceUrl }),
      marketSourceType: "organic",
      name,
      priceCurrency: priceValue ? "VND" : undefined,
      priceText: priceText(undefined, priceValue),
      priceValue,
      sourceName: source,
      sourceUrl,
      specsSummary: item.snippet?.slice(0, 500),
    });
  }

  async searchProducts(query: string, options: ProductSearchOptions = {}): Promise<ProductSearchResult> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);

    try {
      const errors: string[] = [];
      const cleanProducts = (items: Array<ExternalProduct | undefined>) =>
        items
          .filter((product): product is ExternalProduct => Boolean(product))
          .filter((product) => product.brand && product.model)
          .filter((product) => isVietnameseMarket(product.sourceUrl, product.sourceName))
          .filter((product) => !NON_PRODUCT_PATTERNS.some((pattern) => normalizeMarketText(product.name).includes(pattern)));

      let products: ExternalProduct[] = [];

      try {
        const shopping = await this.request({
          engine: "google_shopping",
          gl: "vn",
          google_domain: "google.com.vn",
          hl: "vi",
          location: "Vietnam",
          num: options.maxResults ?? 10,
          q: query,
        }, controller.signal);
        products = cleanProducts((shopping.shopping_results || []).map((item) => this.shoppingProduct(item)));
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }

      if (products.length < 4) {
        try {
          const organic = await this.request({
            engine: "google",
            gl: "vn",
            google_domain: "google.com.vn",
            hl: "vi",
            location: "Vietnam",
            num: Math.min(options.maxResults ?? 10, 10),
            q: `${query} gia Viet Nam VND`,
          }, controller.signal);
          products = [
            ...products,
            ...cleanProducts((organic.organic_results || []).map((item) => this.organicProduct(item))),
          ];
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }

      const seen = new Set<string>();
      return {
        error: errors.join("; ") || undefined,
        products: products
          .sort((a, b) => b.confidence - a.confidence)
          .filter((product) => {
            const key = product.modelNormalized || `${product.name}|${product.sourceUrl}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          }),
        provider: "serpapi-vn",
        responseTimeMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "SerpAPI search failed.",
        products: [],
        provider: "serpapi-vn",
        responseTimeMs: Date.now() - startedAt,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
