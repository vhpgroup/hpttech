import { getPublishedProductSitemapEntries } from "@/lib/catalog-payload";

export const revalidate = 86400;

const SITEMAP_CHUNK_SIZE = 5000;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

function parsePage(value: string) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const base = siteURL();
  const products = await getPublishedProductSitemapEntries({
    page: parsePage(id),
    limit: SITEMAP_CHUNK_SIZE,
  });
  const urls = products.map((product) => url(`${base}/san-pham/${product.slug}`, product.updatedAt));

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
