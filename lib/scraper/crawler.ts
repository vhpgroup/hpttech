import type { BrandConfig, CrawlMethod } from "./types";

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36";
const PDF_TEXT_PREFIX = "__PDF_TEXT__\n";

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

  return response.text();
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
  if (url.includes("google.com/search")) {
    return undefined;
  }

  if (new URL(url).pathname.toLowerCase().endsWith(".pdf")) {
    return fetchPdfText(url);
  }

  if (method === "playwright") {
    return playwrightHtml(url);
  }

  return fetchHtml(url);
}
