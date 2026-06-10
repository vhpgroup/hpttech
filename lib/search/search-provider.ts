import { normalizeProductModel } from "@/lib/ai/product-recommendation";

export type ExternalProduct = {
  brand?: string;
  category?: string;
  confidence: number;
  model?: string;
  modelNormalized: string;
  name: string;
  priceText?: string;
  sourceName: string;
  sourceUrl: string;
  specsSummary?: string;
};

export type ProductSearchOptions = {
  maxResults?: number;
  timeoutMs?: number;
};

export type ProductSearchResult = {
  error?: string;
  products: ExternalProduct[];
  provider: string;
  responseTimeMs: number;
};

export interface SearchProvider {
  searchProducts(query: string, options?: ProductSearchOptions): Promise<ProductSearchResult>;
}

const KNOWN_BRANDS = [
  "Avision",
  "Brother",
  "Canon",
  "Epson",
  "Fujitsu",
  "HP",
  "Kodak",
  "Panasonic",
  "Plustek",
  "Ricoh",
  "Xerox",
];

export function sourceNameFromUrl(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "web";
  }
}

export function inferBrand(value: string) {
  const normalized = value.toLowerCase();
  return KNOWN_BRANDS.find((brand) => normalized.includes(brand.toLowerCase()));
}

export function inferModel(value: string, brand?: string) {
  const withoutBrand = brand ? value.replace(new RegExp(brand, "ig"), " ") : value;
  const matches = withoutBrand.match(/\b[A-Z]{1,5}[-\s]?[A-Z0-9]{2,8}(?:[-\s]?[A-Z0-9]{1,8})?\b/g);
  return matches?.find((item) => /\d/.test(item))?.replace(/\s+/g, "-");
}

export function normalizeExternalProduct(input: {
  brand?: string;
  category?: string;
  confidence?: number;
  model?: string;
  name: string;
  priceText?: string;
  sourceName?: string;
  sourceUrl: string;
  specsSummary?: string;
}): ExternalProduct {
  const brand = input.brand || inferBrand(input.name);
  const model = input.model || inferModel(input.name, brand);
  return {
    brand,
    category: input.category,
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0.5)),
    model,
    modelNormalized: normalizeProductModel(model || input.name),
    name: input.name.trim(),
    priceText: input.priceText,
    sourceName: input.sourceName || sourceNameFromUrl(input.sourceUrl),
    sourceUrl: input.sourceUrl,
    specsSummary: input.specsSummary,
  };
}
