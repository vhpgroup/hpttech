import { getPublishedLandingSitemapEntries } from "@/lib/landing-pages";

export const revalidate = 86400;

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

function url(loc: string, lastmod?: string) {
  return `<url><loc>${escapeXML(loc)}</loc>${lastmod ? `<lastmod>${escapeXML(lastmod)}</lastmod>` : ""}</url>`;
}

export async function GET() {
  const base = siteURL();
  const entries = await getPublishedLandingSitemapEntries();
  const urls = [
    url(`${base}/giai-phap/may-scan`),
    ...entries.map((entry) => url(`${base}${entry.pathname}`, entry.updatedAt)),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`,
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
