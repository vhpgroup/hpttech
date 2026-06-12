import { cleanText } from "./text";
import type { ExtractedProductData, ScrapedImage } from "./types";

const PDF_TEXT_PREFIX = "__PDF_TEXT__\n";

function firstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = cleanText(match?.[1]);
    if (value) return value;
  }
  return undefined;
}

function isPdfTextSource(value?: string) {
  return value?.startsWith(PDF_TEXT_PREFIX) === true;
}

function pdfText(value: string) {
  return value.slice(PDF_TEXT_PREFIX.length);
}

function extractJsonLd(html: string) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(cleanText(block[1]));
      const entries = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.["@graph"])
          ? parsed["@graph"]
          : [parsed];
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

function jsonLdEntries(html: string) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((block) => {
      try {
        const parsed = JSON.parse(cleanText(block[1]));
        return Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.["@graph"])
            ? parsed["@graph"]
            : [parsed];
      } catch {
        return [];
      }
    });
}

function absoluteImageUrl(pageUrl: string, value?: string) {
  const cleanValue = cleanText(value);
  if (!cleanValue) return undefined;
  try {
    const url = new URL(cleanValue, pageUrl);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function imageKey(url: string) {
  const parsed = new URL(url);
  parsed.search = "";
  return parsed.toString();
}

function isProductImage(url: string) {
  const normalized = url.toLowerCase();
  return (
    /\/media\/\d+\/catalog\//.test(normalized) &&
    !normalized.includes("default-image") &&
    /\.(avif|gif|jpe?g|png|webp)(?:$|\?)/i.test(normalized)
  );
}

function addImage(
  images: ScrapedImage[],
  seen: Set<string>,
  image: ScrapedImage | undefined,
) {
  if (!image?.url || !isProductImage(image.url)) return;
  const key = imageKey(image.url);
  if (seen.has(key)) return;
  seen.add(key);
  images.push({
    ...image,
    url: key,
  });
}

export function extractProductImagesFromHtml(
  pageUrl: string,
  html?: string,
): ScrapedImage[] {
  if (!html || isPdfTextSource(html)) return [];

  const images: ScrapedImage[] = [];
  const seen = new Set<string>();
  const title =
    firstMatch(html, [
      /<meta[^>]+property=["']og:image:alt["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    ]) || undefined;

  for (const entry of jsonLdEntries(html)) {
    const imageValue = (entry as Record<string, unknown>)?.image;
    const values = Array.isArray(imageValue) ? imageValue : [imageValue];
    for (const value of values) {
      const url =
        typeof value === "string"
          ? absoluteImageUrl(pageUrl, value)
          : value && typeof value === "object"
            ? absoluteImageUrl(
                pageUrl,
                String((value as Record<string, unknown>).url || ""),
              )
            : undefined;
      addImage(images, seen, {
        alt: title,
        source: "json-ld",
        url: url || "",
      });
    }
  }

  for (const pattern of [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+property=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
  ]) {
    for (const match of html.matchAll(pattern)) {
      const url = absoluteImageUrl(pageUrl, match[1]);
      addImage(images, seen, {
        alt: title,
        source: "meta",
        url: url || "",
      });
    }
  }

  const galleryHtml =
    html.match(/<div[^>]+id=["']pd-gallery-container["'][\s\S]*?(?=<div class=["']pd__data)/i)?.[0] ||
    html.match(/<div[^>]+id=["']pd-gallery-container["'][\s\S]*?(?=<div class=["']pd__spot-light)/i)?.[0] ||
    "";
  for (const match of galleryHtml.matchAll(
    /<(?:a|img)\b[^>]+(?:href|data-zoom|data-medium-image|src)=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi,
  )) {
    const url = absoluteImageUrl(pageUrl, match[1]);
    addImage(images, seen, {
      alt: cleanText(match[2]) || title,
      source: "gallery",
      url: url || "",
    });
  }

  return images.slice(0, Number(process.env.SCRAPER_MAX_IMAGES || 10));
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

function extractHpttechHighlights(html: string) {
  const block =
    html.match(/<div[^>]+class=["'][^"']*pd__spot-light-container[^"']*["'][\s\S]*?<\/ul>\s*<\/div>/i)?.[0] ||
    "";
  if (!block) return undefined;

  const title = firstMatch(block, [/<h2[^>]*>([\s\S]*?)<\/h2>/i]) || "Điểm nổi bật";
  const items = [...block.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
  if (!items.length) return undefined;

  return [title, "", ...items.map((item) => `- ${item}`)].join("\n");
}

function lineValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = cleanText(match?.[1]);
    if (value) return value;
  }
  return undefined;
}

function extractSpecsFromText(text: string) {
  const normalized = text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  const specs: Array<{ label: string; value: string }> = [];
  const add = (label: string, value?: string) => {
    const cleanValue = cleanText(value);
    if (cleanValue && !specs.some((spec) => spec.label === label)) {
      specs.push({ label, value: cleanValue });
    }
  };

  add(
    "Toc do quet",
    lineValue(normalized, [
      /(?:scan speed|scanning speed|simplex)[^\n:]*[:\s]+([^\n]*(?:ppm|ipm)[^\n]*)/i,
      /(\d+(?:[.,]\d+)?\s*ppm[^\n]*)/i,
    ]),
  );
  add(
    "Toc do quet hai mat",
    lineValue(normalized, [
      /([^\n]*(?:double\s+sided|duplex|2-sided|two-sided)[^\n]*\d+(?:[.,]\d+)?\s*(?:ipm|ppm|pages?\s+per\s+minute)[^\n]*)/i,
      /(?:double\s+sided|duplex|2-sided|two-sided)[^\n:]*[:\s]+([^\n]*(?:ipm|ppm|pages?\s+per\s+minute)[^\n]*)/i,
      /(?:duplex|2-sided|two-sided)[^\n:]*[:\s]+([^\n]*(?:ipm|ppm)[^\n]*)/i,
      /(\d+(?:[.,]\d+)?\s*ipm[^\n]*)/i,
    ]),
  );
  add(
    "ADF",
    lineValue(normalized, [
      /((?:ADF|automatic document feeder)[^\n]*(?:up to|maximum)?\s*\d+\s*(?:sheets?|pages?)[^\n]*)/i,
      /(?:adf|automatic document feeder)[^\n:]*[:\s]+([^\n]*(?:sheets?|pages?)[^\n]*)/i,
      /(\d+\s*(?:sheets?|pages?)\s*(?:adf|automatic document feeder)[^\n]*)/i,
    ]),
  );
  add(
    "Do phan giai",
    lineValue(normalized, [
      /(?:optical resolution|scan resolution|resolution)[^\n:]*[:\s]+([^\n]*dpi[^\n]*)/i,
      /(\d{3,4}\s*(?:x|×)\s*\d{3,4}\s*dpi[^\n]*)/i,
    ]),
  );
  add(
    "Ket noi",
    lineValue(normalized, [
      /(?:interfaces?|connectivity|connection)[^\n:]*[:\s]+([^\n]*(?:usb|ethernet|lan|wireless|wi-?fi)[^\n]*)/i,
    ]),
  );
  add(
    "Kho giay toi da",
    lineValue(normalized, [
      /((?:standard paper size|paper size|document size)[^\n]*(?:a4|a3|legal|letter)[^\n]*)/i,
      /(?:document size|paper size|media size)[^\n:]*[:\s]+([^\n]*(?:a4|a3|legal|letter)[^\n]*)/i,
    ]),
  );
  add(
    "Kho giay toi thieu",
    lineValue(normalized, [
      /((?:document size|paper width|width|length)[^\n]*(?:\d+(?:[.,]\d+)?\s*(?:to|-)\s*\d+(?:[.,]\d+)?)[^\n]*(?:mm|in\.|inch)[^\n]*)/i,
    ]),
  );
  add(
    "Cong suat ngay",
    lineValue(normalized, [
      /(?:daily duty cycle|daily volume|recommended daily)[^\n:]*[:\s]+([^\n]*(?:pages?|sheets?)[^\n]*)/i,
    ]),
  );
  add(
    "He dieu hanh",
    lineValue(normalized, [
      /((?:twain|wia|ica|isis)[^\n]*(?:windows|macintosh|mac|linux)[^\n]*)/i,
      /(?:operating systems?|supported os|os compatibility)[^\n:]*[:\s]+([^\n]*(?:windows|mac|linux)[^\n]*)/i,
    ]),
  );
  add(
    "Kich thuoc trong luong",
    lineValue(normalized, [
      /((?:dimensions?|weights?)[^\n]*(?:mm|inch|in\.|kg|lb)[^\n]*)/i,
      /(?:dimensions?|weight)[^\n:]*[:\s]+([^\n]*(?:mm|inch|kg|lb)[^\n]*)/i,
    ]),
  );
  add(
    "Tinh nang",
    [
      /\bduplex\b/i.test(normalized) ? "Duplex" : undefined,
      /\bocr\b/i.test(normalized) ? "OCR" : undefined,
      /\bplastic card|id card|business card\b/i.test(normalized)
        ? "Plastic card"
        : undefined,
      /\bpassport\b/i.test(normalized) ? "Passport" : undefined,
      /\bcolor|colour\b/i.test(normalized) ? "Color scan" : undefined,
    ]
      .filter(Boolean)
      .join(", "),
  );

  return specs;
}

function extractSku(title: string, productName: string) {
  const source = `${title} ${productName}`;
  return firstMatch(source, [
    /\b((?:L|G|MF|LBP|TS|TR|IM|SP)[-\s]?[A-Z]?\d{3,5}[A-Z0-9-]*)\b/i,
    /\b([A-Z]{1,4}-?[A-Z]?\d{3,5}[A-Z0-9-]*)\b/i,
  ]);
}

function cleanProductTitle(value: string) {
  return value
    .replace(
      /\s*[|–—]\s*(Brother|Canon|Epson|Ricoh|HP|Avision|Plustek|Kodak|Panasonic)[^|–—]*$/i,
      "",
    )
    .trim();
}

export async function extractProductFromUrl(
  url: string,
  productName: string,
  html?: string,
): Promise<ExtractedProductData> {
  if (!html || url.includes("google.com/search")) {
    return {
      specs: [],
      title: productName,
    };
  }
  if (isPdfTextSource(html)) {
    return {
      description: `PDF source: ${url}`,
      specs: extractSpecsFromText(pdfText(html)),
      summary: `PDF source: ${url}`,
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

  const metadataDescription =
    cleanText(typeof jsonLd?.description === "string" ? jsonLd.description : undefined) ||
    firstMatch(html, [
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ]);
  const hpttechHighlights = url.includes("hpttech.vn")
    ? extractHpttechHighlights(html)
    : undefined;
  const description = [metadataDescription, hpttechHighlights]
    .filter((item): item is string => Boolean(item))
    .join("\n\n");

  return {
    description: description || undefined,
    price:
      jsonLd?.offers && typeof jsonLd.offers === "object"
        ? cleanText(
            String(
              (Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers)
                ?.price ?? "",
            ),
          )
        : firstMatch(html, [/"price"\s*:\s*"?([^",}]+)"?/i]),
    sku:
      cleanText(typeof jsonLd?.sku === "string" ? jsonLd.sku : undefined) ||
      extractSku(title, productName),
    specs: extractSpecs(html),
    summary: description,
    title: cleanProductTitle(title),
  };
}

type ExtractedSource = {
  data: ExtractedProductData;
  sourceType: "manufacturer" | "retailer";
};

function firstValue(
  sources: ExtractedSource[],
  key: keyof Omit<ExtractedProductData, "specs">,
  preferredType?: ExtractedSource["sourceType"],
) {
  const ordered = preferredType
    ? [
        ...sources.filter((source) => source.sourceType === preferredType),
        ...sources.filter((source) => source.sourceType !== preferredType),
      ]
    : sources;
  for (const source of ordered) {
    const value = source.data[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function mergeExtractedProducts(
  sources: ExtractedSource[],
): ExtractedProductData {
  const specMap = new Map<string, { label: string; value: string }>();
  const orderedSpecs = [
    ...sources.filter((source) => source.sourceType === "manufacturer"),
    ...sources.filter((source) => source.sourceType !== "manufacturer"),
  ];
  for (const source of orderedSpecs) {
    for (const spec of source.data.specs) {
      const key = cleanText(spec.label).toLowerCase();
      if (key && !specMap.has(key)) specMap.set(key, spec);
    }
  }

  const merged = {
    compareAtPrice: firstValue(sources, "compareAtPrice", "retailer"),
    description: firstValue(sources, "description", "manufacturer"),
    origin: firstValue(sources, "origin", "manufacturer"),
    price: firstValue(sources, "price", "retailer"),
    sku: firstValue(sources, "sku", "manufacturer"),
    specs: [...specMap.values()],
    summary: firstValue(sources, "summary", "manufacturer"),
    title:
      firstValue(sources, "title", "manufacturer") ||
      firstValue(sources, "title") ||
      "",
    warranty: firstValue(sources, "warranty", "manufacturer"),
  };
  return {
    ...merged,
    title: cleanProductTitle(merged.title),
  };
}

type HtmlSource = {
  html: string;
  sourceType: ExtractedSource["sourceType"];
  url: string;
};

function htmlForModel(html: string) {
  if (isPdfTextSource(html)) {
    return pdfText(html)
      .replace(/\s+/g, " ")
      .slice(0, Number(process.env.SCRAPER_MAX_PDF_TEXT_CHARS || 80_000));
  }
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/\s+/g, " ")
    .slice(0, Number(process.env.SCRAPER_MAX_HTML_CHARS || 60_000));
}

function parseJsonObject<T>(value: string): T | undefined {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const json = fenced || value.match(/\{[\s\S]*\}/)?.[0] || value;
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

function validAiProduct(value: unknown): value is ExtractedProductData {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<ExtractedProductData>;
  return (
    typeof product.title === "string" &&
    Array.isArray(product.specs) &&
    product.specs.every(
      (spec) =>
        spec &&
        typeof spec === "object" &&
        typeof spec.label === "string" &&
        typeof spec.value === "string",
    )
  );
}

export async function gptExtractProduct(
  htmlSources: HtmlSource[],
  productName: string,
): Promise<ExtractedProductData> {
  const deterministic = await Promise.all(
    htmlSources.map(async (source) => ({
      data: await extractProductFromUrl(source.url, productName, source.html),
      sourceType: source.sourceType,
    })),
  );
  const fallback = mergeExtractedProducts(deterministic);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    body: JSON.stringify({
      messages: [
        {
          content: [
            "Trích xuất đúng một sản phẩm từ các nguồn HTML.",
            "Không suy đoán hoặc bịa thông số.",
            "Ưu tiên thông số/SKU từ manufacturer và giá VND từ retailer.",
            "Không trả về URL ảnh hoặc dữ liệu ảnh.",
            'Trả JSON: {"title":"","sku":"","price":"","compareAtPrice":"","description":"","summary":"","origin":"","warranty":"","specs":[{"label":"","value":""}]}',
            `Sản phẩm cần tìm: ${productName}`,
            JSON.stringify(
              htmlSources.map((source) => ({
                html: htmlForModel(source.html),
                sourceType: source.sourceType,
                url: source.url,
              })),
            ),
          ].join("\n"),
          role: "user",
        },
      ],
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(
      Number(process.env.OPENAI_SCRAPER_TIMEOUT_MS || 45_000),
    ),
  }).catch(() => undefined);
  if (!response?.ok) return fallback;

  const payload = (await response.json().catch(() => undefined)) as
    | {
        choices?: Array<{ message?: { content?: string } }>;
      }
    | undefined;
  const content = payload?.choices?.[0]?.message?.content;
  const extracted = content
    ? parseJsonObject<ExtractedProductData>(content)
    : undefined;
  if (!validAiProduct(extracted)) return fallback;

  return mergeExtractedProducts([
    { data: fallback, sourceType: "manufacturer" },
    { data: extracted, sourceType: "manufacturer" },
  ]);
}
