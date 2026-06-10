import type { ProductAIProfile } from "@/lib/ai/products";
import {
  normalizeProductModel,
  type AIRecommendedProduct,
} from "@/lib/ai/product-recommendation";

export type HPTProductStatus = "in_hpt" | "need_verify" | "orderable";

export type EnrichedRecommendedProduct = AIRecommendedProduct & {
  cta: "Báo giá" | "Cần tư vấn thêm" | "Liên hệ đặt hàng";
  hptHref?: string;
  hptLabel: string;
  hptMatchConfidence: number;
  hptProductId?: string;
  hptStatus: HPTProductStatus;
  rank: number;
  score: number;
  stockQuantity?: number;
  stockStatus?: string;
};

function normalizeText(value?: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(value?: string) {
  return normalizeText(value)
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
}

function jaccardSimilarity(left?: string, right?: string) {
  const leftTokens = new Set(tokens(left));
  const rightTokens = new Set(tokens(right));
  if (!leftTokens.size || !rightTokens.size) return 0;
  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union ? intersection / union : 0;
}

function brandMatches(left?: string, right?: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function categoryMatches(left?: string, right?: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

function profileModel(profile: ProductAIProfile) {
  return normalizeProductModel(profile.model || profile.name || profile.slug);
}

function matchScore(product: AIRecommendedProduct, profile: ProductAIProfile) {
  const productModel = normalizeProductModel(product.model || product.name);
  const hptModel = profileModel(profile);
  const modelExact = Boolean(productModel && hptModel && productModel === hptModel);
  const modelContains = Boolean(
    productModel &&
      hptModel &&
      productModel.length >= 4 &&
      hptModel.length >= 4 &&
      (productModel.includes(hptModel) || hptModel.includes(productModel)),
  );
  const brandExact = brandMatches(product.brand, profile.brand);
  const nameSimilarity = Math.max(
    jaccardSimilarity(product.name, profile.name),
    jaccardSimilarity(`${product.brand || ""} ${product.model || ""}`, `${profile.brand || ""} ${profile.model || ""}`),
  );
  const categoryExact = categoryMatches(product.category, profile.productType || profile.category);

  let score = 0;
  if (modelExact) score += 60;
  else if (modelContains) score += 42;
  if (brandExact) score += 20;
  if (nameSimilarity >= 0.75) score += 16;
  else if (nameSimilarity >= 0.5) score += 10;
  if (categoryExact) score += 4;

  return {
    brandExact,
    modelExact,
    modelContains,
    nameSimilarity,
    score,
  };
}

function labelForHPTProduct(product: ProductAIProfile) {
  if (typeof product.stockQuantity === "number" && product.stockQuantity > 0) {
    return `Có tại HPT - còn ${product.stockQuantity}`;
  }
  if (product.stockStatus === "in_stock") return "Có tại HPT";
  if (product.stockStatus === "preorder") return "Có tại HPT - đặt trước";
  if (product.stockStatus === "out_of_stock") return "Có tại HPT - tạm hết hàng";
  return "Có tại HPT - cần xác nhận tồn kho";
}

export function matchHPTProduct(
  product: AIRecommendedProduct,
  profiles: ProductAIProfile[],
) {
  const candidates = profiles
    .map((profile) => ({ profile, match: matchScore(product, profile) }))
    .sort((a, b) => b.match.score - a.match.score);
  const best = candidates[0];
  if (!best || best.match.score < 42) {
    return {
      confidence: 0,
      status: "orderable" as HPTProductStatus,
    };
  }

  const isCertain =
    (best.match.modelExact && best.match.brandExact) ||
    (best.match.modelExact && best.match.nameSimilarity >= 0.55) ||
    (best.match.modelContains && best.match.brandExact && best.match.nameSimilarity >= 0.45);

  if (!isCertain) {
    return {
      confidence: Math.min(0.79, best.match.score / 100),
      profile: best.profile,
      status: "need_verify" as HPTProductStatus,
    };
  }

  return {
    confidence: Math.min(1, best.match.score / 100),
    profile: best.profile,
    status: "in_hpt" as HPTProductStatus,
  };
}

export function enrichRecommendationsWithHPTStatus(
  products: AIRecommendedProduct[],
  profiles: ProductAIProfile[],
): EnrichedRecommendedProduct[] {
  return products
    .map((product, index) => {
      const match = matchHPTProduct(product, profiles);
      const profile = match.profile;
      const hptStatus = match.status;
      const hptLabel =
        hptStatus === "in_hpt" && profile
          ? labelForHPTProduct(profile)
          : hptStatus === "need_verify"
            ? "Cần HPT xác nhận model"
            : "Chưa có trong hệ thống - Liên hệ đặt hàng";
      return {
        ...product,
        cta:
          hptStatus === "in_hpt"
            ? "Báo giá"
            : hptStatus === "need_verify"
              ? "Cần tư vấn thêm"
              : "Liên hệ đặt hàng",
        hptHref: hptStatus === "in_hpt" ? profile?.href : undefined,
        hptLabel,
        hptMatchConfidence: match.confidence,
        hptProductId: profile?.id,
        hptStatus,
        rank: index + 1,
        score: Math.round(product.aiScore),
        stockQuantity: hptStatus === "in_hpt" ? profile?.stockQuantity : undefined,
        stockStatus: hptStatus === "in_hpt" ? profile?.stockStatus : undefined,
      } satisfies EnrichedRecommendedProduct;
    })
    .sort((a, b) => b.score - a.score)
    .map((product, index) => ({ ...product, rank: index + 1 }));
}
