import fs from "node:fs";
import path from "node:path";
import type { CatalogProduct, ProductPromotion } from "@/lib/catalog";

type PromotionRule = ProductPromotion & {
  categories?: string[];
  productTypes?: string[];
  productSlugs?: string[];
};

const localFixturePath =
  process.env.LOCAL_PROMOTIONS_FIXTURE_PATH || "tmp/local-promotions.json";

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : undefined;
}

function normalizeRule(value: unknown): PromotionRule | null {
  if (!value || typeof value !== "object") return null;
  const rule = value as Record<string, unknown>;
  if (typeof rule.id !== "string" || typeof rule.title !== "string") return null;

  return {
    id: rule.id,
    kind: rule.kind === "product" ? "product" : "monthly",
    title: rule.title,
    description: typeof rule.description === "string" ? rule.description : undefined,
    benefits: stringList(rule.benefits),
    startDate: typeof rule.startDate === "string" ? rule.startDate : undefined,
    endDate: typeof rule.endDate === "string" ? rule.endDate : undefined,
    ctaLabel: typeof rule.ctaLabel === "string" ? rule.ctaLabel : undefined,
    ctaHref: typeof rule.ctaHref === "string" ? rule.ctaHref : undefined,
    categories: stringList(rule.categories),
    productTypes: stringList(rule.productTypes),
    productSlugs: stringList(rule.productSlugs),
  };
}

function loadLocalRules(): PromotionRule[] {
  if (process.env.NODE_ENV === "production") return [];

  try {
    const absolutePath = path.resolve(process.cwd(), localFixturePath);
    const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as unknown;
    return Array.isArray(parsed)
      ? parsed.map(normalizeRule).filter((rule): rule is PromotionRule => Boolean(rule))
      : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`[promotions] Cannot load local fixture from ${localFixturePath}.`, error);
    }
    return [];
  }
}

function normalize(value?: string) {
  return (value || "").trim().toLocaleLowerCase("vi");
}

function isActive(promotion: ProductPromotion, now = new Date()) {
  const start = promotion.startDate ? new Date(promotion.startDate) : null;
  const end = promotion.endDate ? new Date(promotion.endDate) : null;

  if (start && !Number.isNaN(start.getTime()) && now < start) return false;
  if (end && !Number.isNaN(end.getTime())) {
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setHours(23, 59, 59, 999);
    if (now > inclusiveEnd) return false;
  }

  return true;
}

function matchesProduct(rule: PromotionRule, product: CatalogProduct) {
  const hasSelectors = Boolean(
    rule.categories?.length || rule.productTypes?.length || rule.productSlugs?.length,
  );
  if (!hasSelectors) return true;

  return (
    rule.categories?.some((category) => normalize(category) === normalize(product.category)) ||
    rule.productTypes?.some((type) => normalize(type) === normalize(product.productType)) ||
    rule.productSlugs?.some((slug) => normalize(slug) === normalize(product.slug)) ||
    false
  );
}

function legacyPromotion(product: CatalogProduct): ProductPromotion | null {
  if (!product.promoText?.trim()) return null;

  return {
    id: `legacy:${product.slug}`,
    kind: "product",
    title: "Ưu đãi sản phẩm",
    description: product.promoText,
    startDate: product.promoStart,
    endDate: product.promoEnd,
  };
}

function toPromotion(rule: PromotionRule): ProductPromotion {
  return {
    id: rule.id,
    kind: rule.kind,
    title: rule.title,
    description: rule.description,
    benefits: rule.benefits,
    startDate: rule.startDate,
    endDate: rule.endDate,
    ctaLabel: rule.ctaLabel,
    ctaHref: rule.ctaHref,
  };
}

export function promotionsForProduct(product: CatalogProduct) {
  const promotions = loadLocalRules()
    .filter((rule) => matchesProduct(rule, product))
    .map(toPromotion);
  const legacy = legacyPromotion(product);
  if (legacy) promotions.push(legacy);

  const unique = new Map<string, ProductPromotion>();
  for (const promotion of promotions) {
    if (isActive(promotion) && !unique.has(promotion.id)) {
      unique.set(promotion.id, promotion);
    }
  }

  return [...unique.values()].sort((a, b) => {
    if (a.kind === b.kind) return 0;
    return a.kind === "product" ? -1 : 1;
  });
}

export function withProductPromotions(product: CatalogProduct): CatalogProduct {
  const promotions = promotionsForProduct(product);
  return {
    ...product,
    promotions,
    promotionCount: promotions.length,
  };
}
