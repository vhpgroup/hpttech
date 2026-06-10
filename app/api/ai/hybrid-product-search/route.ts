import { NextResponse } from "next/server";
import { getProductAIProfilesFromPayload, type ProductAIProfile } from "@/lib/ai/products";
import {
  recommendProductsWithOpenAI,
  type AIRecommendedProduct,
  type ProductIntent,
} from "@/lib/ai/product-recommendation";
import {
  enrichRecommendationsWithHPTStatus,
  type EnrichedRecommendedProduct,
} from "@/lib/catalog/match-hpt-product";
import { TavilySearchProvider } from "@/lib/search/tavily-provider";
import type { ProductSearchResult } from "@/lib/search/search-provider";

const MAX_QUERY_LENGTH = 1200;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export type HybridProductSearchResponse = {
  intent: ProductIntent;
  model?: string;
  products: EnrichedRecommendedProduct[];
  search?: {
    candidateCount: number;
    error?: string;
    provider: string;
    responseTimeMs: number;
    verifiedCount?: number;
  };
  source: "fallback" | "openai";
  warnings: string[];
};

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(key: string) {
  const now = Date.now();
  for (const [entryKey, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) rateLimitStore.delete(entryKey);
  }

  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function cleanQuery(value: unknown) {
  return String(value || "")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);
}

async function searchMarketProducts(query: string): Promise<ProductSearchResult | undefined> {
  const apiKey = process.env.TAVILY_API_KEY || process.env.SEARCH_API_KEY;
  if (!apiKey) return undefined;

  return new TavilySearchProvider(apiKey).searchProducts(query, {
    maxResults: Number(process.env.TAVILY_MAX_RESULTS || 10),
    timeoutMs: Number(process.env.TAVILY_TIMEOUT_MS || 12_000),
  });
}

async function verifyProductsWithTavily(
  query: string,
  products: AIRecommendedProduct[],
): Promise<{ products: AIRecommendedProduct[]; searchCount: number; responseTimeMs: number }> {
  const apiKey = process.env.TAVILY_API_KEY || process.env.SEARCH_API_KEY;
  if (!apiKey || products.length === 0) {
    return { products, responseTimeMs: 0, searchCount: 0 };
  }

  const provider = new TavilySearchProvider(apiKey);
  const startedAt = Date.now();
  const results = await Promise.all(
    products.slice(0, 5).map(async (product) => {
      const exactQuery = `${product.name} ${product.model || ""} official specifications price ${query}`;
      const search = await provider.searchProducts(exactQuery, {
        maxResults: 5,
        timeoutMs: Number(process.env.TAVILY_VERIFY_TIMEOUT_MS || 8_000),
      });
      const exactModel = product.modelNormalized;
      const verified =
        search.products.find((candidate) => candidate.modelNormalized === exactModel) ||
        search.products.find((candidate) => candidate.brand && product.brand && candidate.brand === product.brand) ||
        search.products[0];

      return verified
        ? {
            ...product,
            priceText: product.priceText || verified.priceText,
            sourceName: verified.sourceName,
            sourceUrl: verified.sourceUrl,
            specsSummary: product.specsSummary || verified.specsSummary,
          }
        : product;
    }),
  );

  return {
    products: results,
    responseTimeMs: Date.now() - startedAt,
    searchCount: results.filter((product) => product.sourceUrl).length,
  };
}

export async function POST(request: Request) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: "Bạn gửi hơi nhanh. Vui lòng thử lại sau ít phút." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const query = cleanQuery((body as { query?: unknown }).query);
  if (!query) {
    return NextResponse.json({ error: "Thiếu nhu cầu tìm kiếm." }, { status: 400 });
  }

  const warnings: string[] = [];
  if (!process.env.OPENAI_API_KEY) {
    warnings.push("Chưa bật OPENAI_API_KEY, hệ thống đang dùng fallback rule-based.");
  }

  if (!process.env.TAVILY_API_KEY && !process.env.SEARCH_API_KEY) {
    warnings.push("Chua bat TAVILY_API_KEY/SEARCH_API_KEY, GPT dang de xuat theo kien thuc noi tai.");
  }

  const profilesPromise = getProductAIProfilesFromPayload({ status: "all", limit: 2000 }).catch(() => {
    warnings.push("Khong doc duoc Payload CMS, ket qua se chi hien thi trang thai lien he dat hang.");
    return [] as ProductAIProfile[];
  });

  const marketSearch = await searchMarketProducts(query);
  if (marketSearch?.error) {
    warnings.push(`Tavily fallback: ${marketSearch.error}`);
  } else if (marketSearch && marketSearch.products.length === 0) {
    warnings.push("Tavily khong tra ve ung vien san pham phu hop, GPT dang de xuat theo kien thuc noi tai.");
  } else if (marketSearch && marketSearch.products.length < 5) {
    warnings.push("Tavily tra ve duoi 5 ung vien sach, GPT dang de xuat theo kien thuc noi tai.");
  }

  const externalProducts = marketSearch && marketSearch.products.length >= 5 ? marketSearch.products : [];

  const [recommendation, profiles] = await Promise.all([
    recommendProductsWithOpenAI(query, { externalProducts }),
    profilesPromise,
  ]);
  if (recommendation.source === "fallback" && recommendation.error && process.env.OPENAI_API_KEY) {
    warnings.push(`OpenAI fallback: ${recommendation.error}`);
  }

  const verification = externalProducts.length
    ? { products: recommendation.products, responseTimeMs: 0, searchCount: 0 }
    : await verifyProductsWithTavily(query, recommendation.products);

  const products = enrichRecommendationsWithHPTStatus(verification.products, profiles);
  if (!products.some((product) => product.hptStatus === "in_hpt")) {
    warnings.push("Chưa tìm thấy sản phẩm khớp chắc chắn trong HPT CMS.");
  }

  return NextResponse.json({
    intent: recommendation.intent,
    model: recommendation.model,
    products,
    search: marketSearch
      ? {
          candidateCount: marketSearch.products.length,
          error: marketSearch.error,
          provider: marketSearch.provider,
          responseTimeMs: marketSearch.responseTimeMs + verification.responseTimeMs,
          verifiedCount: verification.searchCount,
        }
      : undefined,
    source: recommendation.source,
    warnings,
  } satisfies HybridProductSearchResponse);
}
