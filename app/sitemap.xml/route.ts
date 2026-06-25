import { getPublishedProductSitemapCount } from "@/lib/catalog-payload";
import { getPublishedPostSitemapCount } from "@/lib/content-payload";

export const revalidate = 86400;

const SITEMAP_CHUNK_SIZE = 5000;

function siteURL() {
  const raw = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://hpttech.vn";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`;
}

function escapeXML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sitemap(loc: string) {
  return `<sitemap><loc>${escapeXML(loc)}</loc></sitemap>`;
}

function chunkCount(total: number) {
  return Math.max(1, Math.ceil(total / SITEMAP_CHUNK_SIZE));
}

export async function GET() {
  const base = siteURL();
  const [productCount, postCount] = await Promise.all([
    getPublishedProductSitemapCount(),
    getPublishedPostSitemapCount(),
  ]);

  const sitemaps = [
    sitemap(`${base}/sitemap/static`),
    ...Array.from({ length: chunkCount(productCount) }, (_, index) =>
      sitemap(`${base}/sitemap/products/${index + 1}`),
    ),
    ...Array.from({ length: chunkCount(postCount) }, (_, index) =>
      sitemap(`${base}/sitemap/posts/${index + 1}`),
    ),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps.join("")}</sitemapindex>`,
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
