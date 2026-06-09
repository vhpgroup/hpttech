import { cleanText } from "./text";
import type { ExtractedProductData } from "./types";

function firstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = cleanText(match?.[1]);
    if (value) return value;
  }
  return undefined;
}

function extractJsonLd(html: string) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(cleanText(block[1]));
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      const product = entries.find((entry) => {
        const type = entry?.["@type"];
        return type === "Product" || (Array.isArray(type) && type.includes("Product"));
      });
      if (product) return product as Record<string, unknown>;
    } catch {
      // Keep trying other JSON-LD blocks.
    }
  }

  return undefined;
}

function normalizeImageUrls(value: unknown) {
  if (!value) return [];
  const urls = Array.isArray(value) ? value : [value];
  return urls.filter((url): url is string => typeof url === "string" && /^https?:\/\//.test(url));
}

function extractImages(html: string, jsonLd?: Record<string, unknown>) {
  const fromJsonLd = normalizeImageUrls(jsonLd?.image);
  const fromMeta = [...html.matchAll(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1])
    .filter(Boolean);

  return [...new Set([...fromJsonLd, ...fromMeta])].slice(0, 8);
}

function extractSpecs(html: string) {
  const specs: Array<{ label: string; value: string }> = [];
  const rowMatches = html.matchAll(/<tr[\s\S]*?<\/tr>/gi);

  for (const row of rowMatches) {
    const cells = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      cleanText(cell[1]),
    );
    if (cells.length >= 2 && cells[0] && cells[1]) {
      specs.push({ label: cells[0], value: cells.slice(1).join(" ") });
    }
    if (specs.length >= 40) break;
  }

  return specs;
}

function extractSku(title: string, productName: string) {
  const source = `${title} ${productName}`;
  return firstMatch(source, [
    /\b((?:L|G|MF|LBP|TS|TR|IM|SP)[-\s]?[A-Z]?\d{3,5}[A-Z0-9-]*)\b/i,
    /\b([A-Z]{1,4}-?[A-Z]?\d{3,5}[A-Z0-9-]*)\b/i,
  ]);
}

export async function extractProductFromUrl(
  url: string,
  productName: string,
  html?: string,
): Promise<ExtractedProductData> {
  if (!html || url.includes("google.com/search")) {
    return {
      imageUrls: [],
      specs: [],
      title: productName,
    };
  }
  const jsonLd = extractJsonLd(html);
  const title =
    cleanText(typeof jsonLd?.name === "string" ? jsonLd.name : undefined) ||
    firstMatch(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i,
    ]) ||
    productName;

  const description =
    cleanText(typeof jsonLd?.description === "string" ? jsonLd.description : undefined) ||
    firstMatch(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ]);

  return {
    description,
    imageUrls: extractImages(html, jsonLd),
    price: firstMatch(html, [/"price"\s*:\s*"?([^",}]+)"?/i]),
    sku:
      cleanText(typeof jsonLd?.sku === "string" ? jsonLd.sku : undefined) ||
      extractSku(title, productName),
    specs: extractSpecs(html),
    summary: description,
    title,
  };
}
