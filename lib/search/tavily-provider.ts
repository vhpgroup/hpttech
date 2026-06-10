import {
  normalizeExternalProduct,
  type ProductSearchOptions,
  type ProductSearchResult,
  type SearchProvider,
} from "@/lib/search/search-provider";

type TavilyResult = {
  content?: string;
  score?: number;
  title?: string;
  url?: string;
};

type TavilyResponse = {
  response_time?: string;
  results?: TavilyResult[];
};

function cleanTitle(value: string) {
  return value
    .replace(/\s*[|-]\s*(Amazon|Shopee|Lazada|eBay|Official Site|Official Website).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchQuery(query: string) {
  const normalized = query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const scannerTerms = normalized.includes("scan")
    ? "document scanner sheetfed scanner ADF duplex LAN 40ppm product page Brother Epson Canon Ricoh HP Avision Kodak"
    : "office equipment product model specifications price";
  return [
    query,
    scannerTerms,
  ].join(" ");
}

function isGenericSearchResult(value: TavilyResult) {
  const text = `${value.title || ""} ${value.content || ""}`.toLowerCase();
  return [
    "best sellers",
    "best scanner",
    "best scanners",
    "buying guide",
    "how to",
    "pcmag",
    "techradar",
    "small business",
    "scan & share",
    "scanner reviews",
  ].some((pattern) => text.includes(pattern));
}

export class TavilySearchProvider implements SearchProvider {
  constructor(private readonly apiKey: string) {}

  async searchProducts(query: string, options: ProductSearchOptions = {}): Promise<ProductSearchResult> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 12_000);

    try {
      const response = await fetch("https://api.tavily.com/search", {
        body: JSON.stringify({
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: options.maxResults ?? 10,
          query: buildSearchQuery(query),
          search_depth: process.env.TAVILY_SEARCH_DEPTH || "basic",
          topic: "general",
        }),
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => undefined);
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : `Tavily request failed with status ${response.status}.`;
        return {
          error: message,
          products: [],
          provider: "tavily",
          responseTimeMs: Date.now() - startedAt,
        };
      }

      const payload = (await response.json().catch(() => ({}))) as TavilyResponse;
      const seen = new Set<string>();
      const products = (payload.results || [])
        .filter((item) => item.title && item.url)
        .filter((item) => !isGenericSearchResult(item))
        .map((item) =>
          normalizeExternalProduct({
            confidence: item.score,
            name: cleanTitle(item.title || ""),
            sourceUrl: item.url || "",
            specsSummary: item.content?.slice(0, 500),
          }),
        )
        .filter((product) => product.brand && product.model)
        .filter((product) => {
          const key = product.modelNormalized || `${product.name}|${product.sourceUrl}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return Boolean(product.name && product.sourceUrl);
        });

      return {
        products,
        provider: "tavily",
        responseTimeMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Tavily search failed.",
        products: [],
        provider: "tavily",
        responseTimeMs: Date.now() - startedAt,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
