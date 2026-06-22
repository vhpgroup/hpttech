import { createHash } from "node:crypto";
import { extractRequestedModel, textContainsModel } from "./model-identity";

type SourceCandidate = {
  productName: string;
  productSKU?: string;
  productUrl: string;
};

function normalizedText(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&#0*38;/gi, "&")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function normalizeSourceUrl(value: string, baseUrl?: string) {
  const url = new URL(value, baseUrl);
  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

export function usableSourceSku(value?: string) {
  const sku = value?.trim();
  return sku && sku !== "0" ? sku : undefined;
}

export function sourceIdentityKey(sourceUrl: string) {
  const normalized = normalizeSourceUrl(sourceUrl);
  const host = new URL(normalized).hostname.split(".")[0].toUpperCase();
  const hash = createHash("sha1").update(normalized).digest("hex").slice(0, 16).toUpperCase();
  return `${host}-${hash}`;
}

export function sourceVariantSku(sourceUrl: string, sourceSku?: string) {
  const sku = usableSourceSku(sourceSku);
  if (sku) {
    const host = new URL(normalizeSourceUrl(sourceUrl)).hostname.split(".")[0].toUpperCase();
    return `${host}-${sku.toUpperCase()}`;
  }
  return sourceIdentityKey(sourceUrl);
}

function modelFilteredCandidates<T extends SourceCandidate>(candidates: T[], query: string) {
  const requestedModel = extractRequestedModel(query);
  if (!requestedModel) return [];

  return candidates.filter((candidate) => {
    const sku = usableSourceSku(candidate.productSKU);
    return (
      textContainsModel(candidate.productName, requestedModel) ||
      textContainsModel(candidate.productUrl, requestedModel) ||
      (sku ? textContainsModel(sku, requestedModel) : false)
    );
  });
}

export function findExactSourceCandidate<T extends SourceCandidate>(
  candidates: T[],
  query: string,
  baseUrl?: string,
): T {
  const queryUrl = /^https?:\/\//i.test(query)
    ? normalizeSourceUrl(query, baseUrl)
    : undefined;
  if (queryUrl) {
    const byUrl = candidates.find(
      (candidate) => normalizeSourceUrl(candidate.productUrl, baseUrl) === queryUrl,
    );
    if (byUrl) return byUrl;
    throw new Error(`Không tìm thấy URL sản phẩm chính xác: ${query}`);
  }

  const normalizedQuery = normalizedText(query);
  const exactNames = candidates.filter(
    (candidate) => normalizedText(candidate.productName) === normalizedQuery,
  );
  if (exactNames.length === 1) return exactNames[0];
  if (exactNames.length > 1) {
    const exactModelMatches = modelFilteredCandidates(exactNames, query);
    if (exactModelMatches.length === 1) return exactModelMatches[0];
    throw new Error(`Tên sản phẩm không duy nhất trong nguồn: ${query}`);
  }

  const querySku = usableSourceSku(query);
  if (querySku) {
    const exactSkus = candidates.filter(
      (candidate) => usableSourceSku(candidate.productSKU)?.toLowerCase() === querySku.toLowerCase(),
    );
    if (exactSkus.length === 1) return exactSkus[0];
  }

  const modelMatches = modelFilteredCandidates(candidates, query);
  if (modelMatches.length === 1) return modelMatches[0];

  throw new Error(
    `Không tìm thấy sản phẩm khớp chính xác: ${query}. Không dùng fuzzy match để tránh ghép nhầm biến thể.`,
  );
}

export function normalizedSourceName(value: string) {
  return normalizedText(value);
}

export function sourceMatchMethod(
  candidate: SourceCandidate,
  query: string,
): "name" | "sku" | "url" {
  if (/^https?:\/\//i.test(query)) return "url";
  if (usableSourceSku(candidate.productSKU)?.toLowerCase() === query.trim().toLowerCase()) {
    return "sku";
  }
  return "name";
}
