import { getProductsFromPayload } from "@/lib/catalog-payload";
import { getPostsFromPayload } from "@/lib/content-payload";

export const dynamic = "force-dynamic";

function siteURL() {
  const raw = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://hpttech.vn";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`;
}

function url(loc: string) {
  return `<url><loc>${loc}</loc></url>`;
}

export async function GET() {
  const base = siteURL();
  const [products, posts] = await Promise.all([
    getProductsFromPayload().catch(() => []),
    getPostsFromPayload().catch(() => []),
  ]);
  const staticPaths = ["/", "/san-pham", "/compare", "/giai-phap", "/thuong-hieu", "/du-an", "/dich-vu", "/tin-tuc", "/ve-hpt", "/lien-he"];

  const urls = [
    ...staticPaths.map((path) => url(`${base}${path}`)),
    ...products.map((product) => url(`${base}/san-pham/${product.slug}`)),
    ...posts.map((post) => url(`${base}/tin-tuc/${post.slug}`)),
  ];

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
