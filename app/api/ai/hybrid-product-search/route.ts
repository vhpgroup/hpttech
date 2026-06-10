import { NextResponse } from "next/server";
import {
  createProductSearchPlanWithOpenAI,
  recommendProductsWithOpenAI,
  type AIRecommendedProduct,
  type ProductIntent,
  type ProductSearchPlanResult,
} from "@/lib/ai/product-recommendation";
import {
  type EnrichedRecommendedProduct,
} from "@/lib/catalog/match-hpt-product";
import { SerpAPIProvider } from "@/lib/search/serpapi-provider";
import { TavilySearchProvider } from "@/lib/search/tavily-provider";
import type { ExternalProduct, ProductSearchResult } from "@/lib/search/search-provider";

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
    queries?: string[];
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

function mergeProductSearchResults(results: ProductSearchResult[], queries: string[]): ProductSearchResult {
  const seen = new Set<string>();
  const products = results
    .flatMap((result) => result.products)
    .sort((a, b) => b.confidence - a.confidence)
    .filter((product) => {
      const key = product.modelNormalized || `${product.name}|${product.sourceUrl}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 15);

  return {
    error: results.map((result) => result.error).filter(Boolean).join("; ") || undefined,
    products,
    provider: results.map((result) => result.provider).some((provider) => provider.includes("serpapi"))
      ? "serpapi-vn"
      : queries.length > 1
        ? "tavily-multi-query"
        : "tavily",
    responseTimeMs: Math.max(0, ...results.map((result) => result.responseTimeMs)),
  };
}

function applyBudgetGate<T extends { priceValue?: number }>(products: T[], intent: ProductIntent) {
  if (!intent.budgetMax) return products;
  return products.filter((product) => product.priceValue === undefined || product.priceValue <= intent.budgetMax!);
}

function uniqueQueries(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalizeScoreText(value).replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildMarketQueries(searchPlan: ProductSearchPlanResult) {
  const candidateQueries = searchPlan.candidateModels.map((candidate) => {
    const modelName = [candidate.brand, candidate.model].filter(Boolean).join(" ");
    return `${modelName || candidate.name || candidate.model} gia Viet Nam`;
  });

  return uniqueQueries([...candidateQueries, ...searchPlan.searchQueries]);
}

async function searchMarketProducts(queries: string[]): Promise<ProductSearchResult | undefined> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return undefined;

  const provider = new SerpAPIProvider(apiKey);
  const maxQueries = Math.max(1, Math.min(5, Number(process.env.SERPAPI_MAX_QUERIES || 5)));
  const cleanQueries = queries.map((query) => query.trim()).filter(Boolean).slice(0, maxQueries);
  if (!cleanQueries.length) return undefined;
  const results = await Promise.all(
    cleanQueries.map((query) =>
      provider.searchProducts(query, {
        maxResults: Number(process.env.SERPAPI_MAX_RESULTS || 10),
        timeoutMs: Number(process.env.SERPAPI_TIMEOUT_MS || 14_000),
      }),
    ),
  );
  return mergeProductSearchResults(results, cleanQueries);
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

function priceFitScore(intent: ProductIntent, product: AIRecommendedProduct) {
  const price = product.priceValue;
  if (!intent.budgetMax || !price) return price ? 12 : 4;
  if (price <= intent.budgetMax) return 30;
  if (price <= intent.budgetMax * 1.1) return 16;
  if (price <= intent.budgetMax * 1.25) return 4;
  return -28;
}

function normalizeScoreText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function productSearchText(product: AIRecommendedProduct) {
  return normalizeScoreText(
    `${product.name} ${product.category || ""} ${product.specsSummary || ""} ${product.reason || ""} ${product.sourceName || ""}`,
  );
}

function extractSpeedPpm(text: string) {
  const matches = [...text.matchAll(/(\d{2,3})\s*(ppm|ipm|trang\/phut|to\/phut|trang phut|to phut)/gi)];
  if (!matches.length) return undefined;
  const values = matches.map((match) => Number(match[1])).filter((value) => Number.isFinite(value));
  return values.length ? Math.max(...values) : undefined;
}

function hasConnectivity(text: string, item: string) {
  const normalized = normalizeScoreText(item);
  if (normalized.includes("lan")) return /\b(lan|ethernet|network|mang)\b/.test(text);
  if (normalized.includes("wifi") || normalized.includes("wi-fi")) return /\b(wifi|wi-fi|wireless)\b/.test(text);
  if (normalized.includes("usb")) return /\busb\b/.test(text);
  return text.includes(normalized);
}

function modelSuggestsConnectivity(product: AIRecommendedProduct, item: string) {
  const normalized = normalizeScoreText(item);
  const model = product.modelNormalized;
  if (!model) return false;
  if (normalized.includes("lan")) {
    return [
      "ads4300n",
      "ads3300w",
      "ads4700w",
      "ads4900w",
      "ds730n",
      "ds790wn",
      "fi8040",
    ].some((knownModel) => model.includes(knownModel));
  }
  if (normalized.includes("wifi") || normalized.includes("wi-fi")) {
    return ["ads3300w", "ads4700w", "ads4900w", "ds790wn"].some((knownModel) => model.includes(knownModel));
  }
  return false;
}

function matchesConnectivity(product: AIRecommendedProduct, text: string, item: string) {
  return hasConnectivity(text, item) || modelSuggestsConnectivity(product, item);
}

function specFitScore(intent: ProductIntent, product: AIRecommendedProduct) {
  const text = productSearchText(product);
  let score = 0;
  if (intent.category && text.includes(normalizeScoreText(intent.category))) score += 8;
  if (intent.speedPPM) {
    const parsed = extractSpeedPpm(text);
    if (parsed && parsed >= intent.speedPPM * 0.85) score += 10;
  }
  for (const item of intent.connectivity || []) {
    if (item && matchesConnectivity(product, text, item)) score += 5;
  }
  for (const item of intent.requiredFeatures || []) {
    if (item && text.includes(normalizeScoreText(item))) score += 4;
  }
  return Math.min(30, score);
}

function constraintPenalty(intent: ProductIntent, product: AIRecommendedProduct) {
  const text = productSearchText(product);
  let penalty = 0;

  if (intent.speedPPM) {
    const speed = extractSpeedPpm(text);
    if (!speed) penalty -= 8;
    else if (speed < intent.speedPPM * 0.85) penalty -= 18;
  }

  for (const item of intent.connectivity || []) {
    if (item && !matchesConnectivity(product, text, item)) penalty -= 14;
  }

  const uncertaintyPatterns = [
    "can xac nhan",
    "chua ro",
    "khong ro",
    "khong dat",
    "thieu",
    "can tu van",
    "co the khong",
  ];
  if (uncertaintyPatterns.some((pattern) => text.includes(pattern))) penalty -= 10;

  return penalty;
}

function sourceConfidenceScore(product: AIRecommendedProduct) {
  let score = 0;
  if (product.sourceUrl?.includes(".vn")) score += 5;
  if (product.priceValue) score += 8;
  if (product.marketSourceType === "merchant") score += 6;
  if (product.marketSourceType === "official") score += 4;
  if (product.marketSourceType === "marketplace") score -= 5;
  return score;
}

function marketScore(intent: ProductIntent, product: AIRecommendedProduct) {
  const relevance = Math.round((product.aiScore || 70) * 0.4);
  return Math.max(
    1,
    Math.min(
      100,
      relevance + priceFitScore(intent, product) + specFitScore(intent, product) + sourceConfidenceScore(product) + constraintPenalty(intent, product),
    ),
  );
}

function enrichMarketRecommendations(products: AIRecommendedProduct[], intent: ProductIntent): EnrichedRecommendedProduct[] {
  return products
    .map((product, index) => {
      const score = marketScore(intent, product);
      const overBudget = Boolean(intent.budgetMax && product.priceValue && product.priceValue > intent.budgetMax * 1.1);
      return {
        ...product,
        cta: overBudget ? "Cần tư vấn thêm" : "Liên hệ đặt hàng",
        hptLabel: overBudget ? "Vượt ngân sách - cần cân nhắc" : "Giá thị trường Việt Nam",
        hptMatchConfidence: 0,
        hptStatus: overBudget ? "need_verify" : "orderable",
        rank: index + 1,
        score,
      } satisfies EnrichedRecommendedProduct;
    })
    .sort((a, b) => b.score - a.score)
    .map((product, index) => ({ ...product, rank: index + 1 }));
}

function mergeMarketData(products: AIRecommendedProduct[], candidates: ExternalProduct[]) {
  return products.map((product) => {
    const exact = candidates.find((candidate) => candidate.modelNormalized && candidate.modelNormalized === product.modelNormalized);
    const fallback = candidates.find(
      (candidate) =>
        candidate.brand &&
        product.brand &&
        candidate.brand.toLowerCase() === product.brand.toLowerCase() &&
        (candidate.name.toLowerCase().includes(product.name.toLowerCase()) ||
          product.name.toLowerCase().includes(candidate.name.toLowerCase())),
    );
    const match = exact || fallback;
    return match
      ? {
          ...product,
          imageUrl: product.imageUrl || match.imageUrl,
          marketSourceType: match.marketSourceType,
          priceCurrency: product.priceCurrency || match.priceCurrency,
          priceText: product.priceText || match.priceText,
          priceValue: product.priceValue || match.priceValue,
          sourceName: product.sourceName || match.sourceName,
          sourceUrl: product.sourceUrl || match.sourceUrl,
          specsSummary: product.specsSummary || match.specsSummary,
        }
      : product;
  });
}

function candidateToRecommendation(candidate: ExternalProduct, index: number): AIRecommendedProduct {
  return {
    aiScore: Math.round(candidate.confidence * 100) - index,
    brand: candidate.brand,
    category: candidate.category || "scanner",
    imageUrl: candidate.imageUrl,
    marketSourceType: candidate.marketSourceType,
    model: candidate.model,
    modelNormalized: candidate.modelNormalized,
    name: candidate.name,
    priceCurrency: candidate.priceCurrency,
    priceText: candidate.priceText,
    priceValue: candidate.priceValue,
    reason: "Tim thay ung vien tren thi truong Viet Nam, can doi chieu them thong so chi tiet truoc khi bao gia.",
    sourceName: candidate.sourceName,
    sourceUrl: candidate.sourceUrl,
    specsSummary: candidate.specsSummary,
  };
}

function marketFirstProducts(products: AIRecommendedProduct[], candidates: ExternalProduct[]) {
  if (!candidates.length) return products;

  const candidatesByModel = new Map(candidates.map((candidate) => [candidate.modelNormalized, candidate]));
  const selected: AIRecommendedProduct[] = [];
  const selectedModels = new Set<string>();

  for (const product of products) {
    const candidate = candidatesByModel.get(product.modelNormalized);
    if (!candidate || selectedModels.has(candidate.modelNormalized)) continue;
    selectedModels.add(candidate.modelNormalized);
    selected.push({
      ...product,
      brand: candidate.brand || product.brand,
      category: candidate.category || product.category || "scanner",
      imageUrl: candidate.imageUrl || product.imageUrl,
      marketSourceType: candidate.marketSourceType,
      model: candidate.model || product.model,
      modelNormalized: candidate.modelNormalized,
      name: candidate.name,
      priceCurrency: candidate.priceCurrency,
      priceText: candidate.priceText,
      priceValue: candidate.priceValue,
      reason: "Tim thay ung vien tren thi truong Viet Nam, can doi chieu them thong so chi tiet truoc khi bao gia.",
      sourceName: candidate.sourceName,
      sourceUrl: candidate.sourceUrl,
      specsSummary: candidate.specsSummary,
    });
  }

  for (const candidate of candidates) {
    if (selected.length >= 5) break;
    if (selectedModels.has(candidate.modelNormalized)) continue;
    selectedModels.add(candidate.modelNormalized);
    selected.push(candidateToRecommendation(candidate, selected.length));
  }

  return selected.slice(0, 5);
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

  if (!process.env.SERPAPI_API_KEY) {
    warnings.push("Chua bat SERPAPI_API_KEY, GPT dang de xuat theo kien thuc noi tai va khong co gia thi truong Viet Nam.");
  }

  const searchPlan = await createProductSearchPlanWithOpenAI(query);
  if (searchPlan.source === "fallback" && searchPlan.error && process.env.OPENAI_API_KEY) {
    warnings.push(`OpenAI search-plan fallback: ${searchPlan.error}`);
  }

  const marketQueries = buildMarketQueries(searchPlan);
  const marketSearch = await searchMarketProducts(marketQueries);
  if (marketSearch?.error) {
    warnings.push(`SerpAPI fallback: ${marketSearch.error}`);
  } else if (marketSearch && marketSearch.products.length === 0) {
    warnings.push("SerpAPI khong tra ve ung vien san pham/gia phu hop tai Viet Nam, GPT dang de xuat theo kien thuc noi tai.");
  } else if (marketSearch && marketSearch.products.length < 5) {
    warnings.push(`SerpAPI chi tra ve ${marketSearch.products.length} ung vien sach, GPT se dung cac ung vien nay truoc roi bo sung neu can.`);
  }

  const externalProducts = applyBudgetGate(marketSearch?.products || [], searchPlan.intent);
  if (marketSearch?.products.length && externalProducts.length === 0) {
    warnings.push("SerpAPI co du lieu thi truong nhung khong co san pham dat ngan sach/nguon hop le. Khong tu bo sung san pham ngoai nguon.");
    return NextResponse.json({
      intent: searchPlan.intent,
      model: searchPlan.model,
      products: [],
      search: {
        candidateCount: marketSearch.products.length,
        error: marketSearch.error,
        provider: marketSearch.provider,
        queries: marketQueries,
        responseTimeMs: marketSearch.responseTimeMs,
        verifiedCount: 0,
      },
      source: searchPlan.source,
      warnings,
    } satisfies HybridProductSearchResponse);
  }

  const recommendation = await recommendProductsWithOpenAI(query, {
    externalProducts,
    intent: searchPlan.intent,
    searchQueries: searchPlan.searchQueries,
  });
  if (recommendation.source === "fallback" && recommendation.error && process.env.OPENAI_API_KEY) {
    warnings.push(`OpenAI fallback: ${recommendation.error}`);
  }

  const marketFirstRecommendations = marketFirstProducts(recommendation.products, externalProducts);
  const verification = externalProducts.length
    ? { products: marketFirstRecommendations, responseTimeMs: 0, searchCount: 0 }
    : await verifyProductsWithTavily(query, marketFirstRecommendations);

  const products = applyBudgetGate(enrichMarketRecommendations(
    mergeMarketData(verification.products, externalProducts),
    recommendation.intent,
  ), recommendation.intent);

  return NextResponse.json({
    intent: recommendation.intent,
    model: recommendation.model,
    products,
    search: marketSearch
      ? {
          candidateCount: marketSearch.products.length,
          error: marketSearch.error,
          provider: marketSearch.provider,
          queries: marketQueries,
          responseTimeMs: marketSearch.responseTimeMs + verification.responseTimeMs,
          verifiedCount: verification.searchCount,
        }
      : undefined,
    source: recommendation.source,
    warnings,
  } satisfies HybridProductSearchResponse);
}
