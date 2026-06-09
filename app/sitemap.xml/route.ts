import { getProductsFromPayload } from "@/lib/catalog-payload";
import { getPostCategoriesFromPayload, getPostsFromPayload } from "@/lib/content-payload";
import { helpLinks } from "@/lib/help-links";

export const revalidate = 300;

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

function url(loc: string) {
  return `<url><loc>${escapeXML(loc)}</loc></url>`;
}

export async function GET() {
  const base = siteURL();
  const [products, posts, postCategories] = await Promise.all([
    getProductsFromPayload(),
    getPostsFromPayload(),
    getPostCategoriesFromPayload(),
  ]);
  const staticPaths = [
    "/",
    "/san-pham",
    "/ai-search",
    "/compare",
    "/giai-phap",
    "/thuong-hieu",
    "/du-an",
    "/dich-vu",
    "/tin-tuc",
    "/ve-hpt",
    "/lien-he",
    ...helpLinks.map((link) => link.href),
  ];

  const urls = [
    ...staticPaths.map((path) => url(`${base}${path}`)),
    ...products.filter((product) => product.slug).map((product) => url(`${base}/san-pham/${product.slug}`)),
    ...postCategories.filter((category) => category.fullSlug).map((category) => url(`${base}/tin-tuc/${category.fullSlug}`)),
    ...posts.filter((post) => post.fullPath || post.slug).map((post) => url(`${base}${post.href || `/tin-tuc/${post.slug}`}`)),
  ];

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
