import type { BrandConfig, CrawlMethod } from "./types";

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36";
const PDF_TEXT_PREFIX = "__PDF_TEXT__\n";

function htmlDecode(value: string) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractAjaxComponents(html: string) {
  return [...html.matchAll(/<div\b[^>]*class=["'][^"']*\bajax-component\b[^"']*["'][^>]*>/gi)]
    .map((match) => match[0])
    .map((tag) => {
      const name = tag.match(/\bdata-name=(["'])(.*?)\1/i)?.[2];
      const moduleName = tag.match(/\bdata-module=(["'])(.*?)\1/i)?.[2] || "";
      const query = tag.match(/\bdata-query=(["'])(.*?)\1/i)?.[2] || "{}";
      return {
        moduleName: htmlDecode(moduleName),
        name: htmlDecode(name || ""),
        query: htmlDecode(query),
      };
    })
    .filter((component) => component.name === "ProductSpecification");
}

async function fetchAjaxComponent(
  pageUrl: string,
  component: { moduleName: string; name: string; query: string },
) {
  const response = await fetch("https://hpttech.vn/common/AjaxComponent", {
    body: new URLSearchParams({
      arguments: component.query,
      componentName: component.name,
      moduleName: component.moduleName,
    }),
    headers: {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "accept-language": "vi,en;q=0.8",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "referer": pageUrl,
      "user-agent": userAgent,
      "x-requested-with": "XMLHttpRequest",
    },
    method: "POST",
    signal: AbortSignal.timeout(Number(process.env.SCRAPER_FETCH_TIMEOUT_MS || 10000)),
  });
  if (!response.ok) return "";

  const payload = (await response.json().catch(() => undefined)) as
    | { result?: string }
    | undefined;
  return payload?.result || "";
}

async function hydrateHpttechAjaxComponents(url: string, html: string) {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return html;
  }
  if (hostname !== "hpttech.vn") return html;

  const components = extractAjaxComponents(html);
  if (!components.length) return html;

  const fragments = (
    await Promise.all(
      components.map((component) =>
        fetchAjaxComponent(url, component).catch(() => ""),
      ),
    )
  ).filter(Boolean);

  return fragments.length ? `${html}\n${fragments.join("\n")}` : html;
}

export function normalizeProductSourceUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.replace(/^www\./, "") === "download.brother.com" &&
      parsed.pathname.toLowerCase().endsWith(".pdf")
    ) {
      parsed.pathname = parsed.pathname.replace(
        /_(?:bpr|bra|br|pt|por|esp|fr|de|ita|jpn|kor)_usr_/i,
        "_use_usr_",
      );
      return parsed.toString();
    }
  } catch {
    return url;
  }
  return url;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "accept-language": "vi,en;q=0.8",
      "user-agent": userAgent,
    },
    signal: AbortSignal.timeout(Number(process.env.SCRAPER_FETCH_TIMEOUT_MS || 10000)),
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Khong tai duoc trang san pham: ${url}. ${message}`);
  });

  if (!response.ok) {
    throw new Error(`Khong tai duoc trang san pham (${response.status}): ${url}`);
  }

  const html = await response.text();
  return hydrateHpttechAjaxComponents(url, html);
}

async function fetchPdfText(url: string) {
  const response = await fetch(url, {
    headers: {
      "accept": "application/pdf,*/*;q=0.8",
      "accept-language": "vi,en;q=0.8",
      "user-agent": userAgent,
    },
    signal: AbortSignal.timeout(Number(process.env.SCRAPER_FETCH_TIMEOUT_MS || 10000)),
  }).catch((error) => {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Khong tai duoc PDF san pham: ${url}. ${message}`);
  });

  if (!response.ok) {
    throw new Error(`Khong tai duoc PDF san pham (${response.status}): ${url}`);
  }

  const maxBytes = Number(process.env.SCRAPER_MAX_PDF_BYTES || 15 * 1024 * 1024);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) {
    throw new Error(`PDF vuot qua gioi han ${maxBytes} bytes: ${url}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > maxBytes) {
    throw new Error(`PDF vuot qua gioi han ${maxBytes} bytes: ${url}`);
  }

  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: bytes });
  try {
    const parsed = await parser.getText();
    return `${PDF_TEXT_PREFIX}${parsed.text}`;
  } finally {
    await parser.destroy();
  }
}

async function playwrightHtml(url: string) {
  if (process.env.VERCEL) {
    throw new Error("Playwright scraper chi ho tro chay local, khong chay tren Vercel.");
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
  });

  try {
    const page = await browser.newPage({
      userAgent,
      viewport: { height: 900, width: 1440 },
    });

    await page.goto(url, {
      timeout: Number(process.env.PLAYWRIGHT_TIMEOUT_MS || 30000),
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle", {
      timeout: Number(process.env.PLAYWRIGHT_IDLE_TIMEOUT_MS || 8000),
    }).catch(() => undefined);

    return await page.content();
  } finally {
    await browser.close();
  }
}

export async function crawlProductPage(url: string, brand: BrandConfig) {
  return crawlProductSource(url, brand.crawlMethod);
}

export async function crawlProductSource(url: string, method: CrawlMethod) {
  const normalizedUrl = normalizeProductSourceUrl(url);
  if (url.includes("google.com/search")) {
    return undefined;
  }

  if (new URL(normalizedUrl).pathname.toLowerCase().endsWith(".pdf")) {
    return fetchPdfText(normalizedUrl);
  }

  if (method === "playwright") {
    return playwrightHtml(normalizedUrl);
  }

  return fetchHtml(normalizedUrl);
}
