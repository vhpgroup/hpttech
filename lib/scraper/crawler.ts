import type { BrandConfig } from "./types";

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36";

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
  if (url.includes("google.com/search")) {
    return undefined;
  }

  if (brand.crawlMethod === "playwright") {
    return playwrightHtml(url);
  }

  return fetchHtml(url);
}
