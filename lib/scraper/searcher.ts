import type { BrandConfig } from "./types";

type GoogleSearchItem = {
  link?: string;
  title?: string;
};

type GoogleSearchResponse = {
  items?: GoogleSearchItem[];
};

type GeminiSearchResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    groundingMetadata?: unknown;
  }>;
};

type GeminiUrlResponse = {
  url?: string;
};

type ProductUrlSearchResult = {
  searchQuery: string;
  url: string;
  warning?: string;
};

function isLikelyProductUrl(url: string, brand: BrandConfig) {
  try {
    const parsed = new URL(url);
    const normalizedDomain = brand.domain.replace(/^www\./, "").replace(/\/.*$/, "");
    const blockedPathTerms = [
      "/support",
      "/download",
      "/driver",
      "/drivers",
      "/manual",
      "/news",
      "/blog",
      ".pdf",
    ];
    const path = parsed.pathname.toLowerCase();
    return parsed.hostname.includes(normalizedDomain) && !blockedPathTerms.some((term) => path.includes(term));
  } catch {
    return false;
  }
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

function extractUrlFromText(value: string) {
  return value.match(/https?:\/\/[^\s"'<>`)]+/i)?.[0];
}

function extractUrlsFromText(value: string) {
  return [...value.matchAll(/https?:\/\/[^\s"'<>`)]+/gi)].map((match) =>
    match[0].replace(/&amp;/g, "&"),
  );
}

function productTokens(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

function rankUrl(url: string, productName: string) {
  const lower = url.toLowerCase();
  const tokenScore = productTokens(productName).filter((token) => lower.includes(token)).length;
  const productPageScore = lower.includes("/p/") ? 5 : 0;
  const supportPenalty = lower.includes("/support") ? -10 : 0;
  return tokenScore + productPageScore + supportPenalty;
}

async function findWithGeminiGrounding(
  productName: string,
  brand: BrandConfig,
): Promise<ProductUrlSearchResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY for Gemini Search grounding.");
  }
  const geminiApiKey = apiKey;

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const searchQuery = `site:${brand.domain} ${productName}`;
  async function askGemini(prompt: string) {
    const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
        },
        tools: [{ google_search: {} }],
      }),
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": geminiApiKey,
      },
      method: "POST",
      signal: AbortSignal.timeout(Number(process.env.GEMINI_SEARCH_TIMEOUT_MS || 30000)),
    },
  );

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Gemini Search grounding loi ${response.status}: ${text.slice(0, 500)}`);
    }

    const result = (await response.json()) as GeminiSearchResponse;
    const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    const metadataText = JSON.stringify(result.candidates?.[0]?.groundingMetadata || {});
    return `${text}\n${metadataText}`;
  }

  const text = await askGemini(
    [
      `Search Google for: site:${brand.domain} ${productName}`,
      "Return a direct URL that appears in the search results.",
      "Do not invent, normalize, shorten, or rewrite the URL path.",
      "For Epson, prefer product URLs that contain /p/ and a product code.",
      "Reject support/download/manual/PDF pages.",
      'Return only JSON: {"url":"..."}',
    ].join("\n"),
  );
  const parsed = text ? parseJsonObject<GeminiUrlResponse>(text) : undefined;
  const urls = [
    ...(parsed?.url ? [parsed.url] : []),
    ...(text ? extractUrlsFromText(text) : []),
    ...(text ? [extractUrlFromText(text)].filter((url): url is string => Boolean(url)) : []),
  ]
    .filter((url, index, all) => all.indexOf(url) === index)
    .filter((url) => isLikelyProductUrl(url, brand))
    .sort((a, b) => rankUrl(b, productName) - rankUrl(a, productName));
  const url = urls[0];

  if (url && isLikelyProductUrl(url, brand)) {
    return { searchQuery, url };
  }

  throw new Error(
    `Gemini Search grounding chua tra ve URL san pham chinh hang hop le. Response: ${text.slice(0, 300)}`,
  );
}

export async function findOfficialProductUrl(
  productName: string,
  brand: BrandConfig,
): Promise<ProductUrlSearchResult> {
  const searchQuery = `site:${brand.domain} ${productName}`;
  if (process.env.GEMINI_API_KEY) {
    return findWithGeminiGrounding(productName, brand);
  }

  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    return {
      searchQuery,
      url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
      warning:
        "Chua cau hinh GOOGLE_SEARCH_API_KEY/GOOGLE_SEARCH_ENGINE_ID nen chi tao query tim kiem, chua co URL san pham chinh xac.",
    };
  }

  const params = new URLSearchParams({
    cx,
    key: apiKey,
    num: "5",
    q: searchQuery,
  });
  const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Google Search API loi ${response.status}`);
  }

  const result = (await response.json()) as GoogleSearchResponse;
  const url = result.items?.map((item) => item.link).find((link): link is string =>
    Boolean(link && isLikelyProductUrl(link, brand)),
  );

  if (!url) {
    throw new Error("Khong tim thay URL san pham chinh hang tu Google Custom Search.");
  }

  return { searchQuery, url };
}
