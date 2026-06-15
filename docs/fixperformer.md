Performance Optimization Plan — HPT Tech Next.js
Context
Stack: Next.js 15, PayloadCMS 3.x, PostgreSQL (Neon), Vercel, Tailwind CSS
Vấn đề: trang web load chậm, delay rõ rệt khi vào trang sản phẩm và các trang khác
Issue 1 — CRITICAL: Product detail page loads entire catalog on every request
File: app/(site)/san-pham/[slug]/page.tsx

Problem:

const [product, rawSettings, allProducts] = await Promise.all([
  getProductBySlugFromPayload(slug),
  getSiteSettingsFromPayload(),
  getProductsFromPayload(), // fetches ALL 1000+ products with depth:2 just for "related products" section
]);
Fix:

Add two new functions to 
catalog-payload.ts
:

getProductsByCategoryFromPayload(categoryName: string, excludeSlug: string, limit: number) — fetches products filtered by category
getProductsByBrandFromPayload(brandName: string, excludeSlug: string, limit: number) — fetches products filtered by brand
Both should use limit: 8, depth: 1, filter by status: published
In app/(site)/san-pham/[slug]/page.tsx, replace getProductsFromPayload() with targeted queries:

// After fetching `product`, use product.category and product.brand
const [similarProducts, sameBrandProducts] = await Promise.all([
  product.category 
    ? getProductsByCategoryFromPayload(product.category, slug, 8)
    : Promise.resolve([]),
  product.brand
    ? getProductsByBrandFromPayload(product.brand, slug, 8)
    : Promise.resolve([]),
]);
Remove the allProducts variable entirely. Replace all uses of otherProducts, similarProducts, sameBrandProducts, fallbackRelatedProducts with the new targeted results.

For relatedProducts — use product.relatedProducts directly (already fetched with depth:2 in getProductBySlugFromPayload).

The relationSections array should be built from the new targeted results.

Issue 2 — HIGH: SiteSettings fetched on every request in root layout
File: app/(site)/layout.tsx

Problem:

// Runs on every single page request — no caching
const settings = await getSiteSettingsFromPayload().then(normalizeSiteSettings);
Fix:

In 
content-payload.ts
, wrap getSiteSettingsFromPayload with Next.js unstable_cache:
import { unstable_cache } from "next/cache";

export const getSiteSettingsFromPayload = unstable_cache(
  async (): Promise<PublicSiteSettings | null> => {
    try {
      const payload = await getPayloadClient();
      return (await payload.findGlobal({ slug: "site-settings" })) as PublicSiteSettings;
    } catch (error) {
      handlePayloadReadError("site-settings", error);
      return null;
    }
  },
  ["site-settings"],
  { revalidate: 300, tags: ["site-settings"] }
);
Do the same for getBannersFromPayload, getSolutionsFromPayload, getEnterpriseServicesFromPayload — these are also called in layout/home and rarely change:
Cache key: ["banners"], ["solutions"], ["enterprise-services"]
revalidate: 300
Issue 3 — HIGH: ISR not effective — no pages pre-rendered
File: app/(site)/san-pham/[slug]/page.tsx

Problem:

export async function generateStaticParams() {
  return []; // ← no pages pre-rendered, all are on-demand SSR
}
Fix:

In 
catalog-payload.ts
, add a function getPublishedProductSlugs() that fetches only slugs:
export async function getPublishedProductSlugs(): Promise<string[]> {
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: "products",
    depth: 0,
    limit: 500,
    select: { slug: true },
    where: {
      and: [
        { status: { equals: "published" } },
        { _status: { equals: "published" } },
      ],
    },
  });
  return res.docs
    .map((doc) => (doc as { slug?: string }).slug)
    .filter((slug): slug is string => Boolean(slug));
}
In app/(site)/san-pham/[slug]/page.tsx, update generateStaticParams:
export async function generateStaticParams() {
  const slugs = await getPublishedProductSlugs();
  return slugs.map((slug) => ({ slug }));
}
Keep dynamicParams = true — new products not in the static list will still be rendered on-demand.
Issue 4 — MEDIUM: Extra PostgreSQL connection for HTML fields
File: 
catalog-payload.ts
 — function loadRawProductHTML

Problem: Opens a raw pg.Client connection outside of Payload's connection pool on every product detail page load.

Fix:

Cache the result using unstable_cache per product ID:
const getCachedRawProductHTML = unstable_cache(
  async (id: string | number): Promise<RawProductHTML> => {
    // existing loadRawProductHTML logic here
  },
  ["raw-product-html"],
  { revalidate: 300 }
);
In getProductBySlugFromPayload, replace loadRawProductHTML(id) with getCachedRawProductHTML(id).
Issue 5 — MEDIUM: next.config.ts missing image optimization settings
File: next.config.ts

Fix: Add image optimization config:

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24h
    remotePatterns: [
      { protocol: "https", hostname: "hpttech.vn" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.anphatpc.com.vn" },
    ],
  },
};
Issue 6 — LOW: Product list page has no pagination awareness in catalog fetch
File: 
catalog-payload.ts
 — getProductListPageFromPayload

Verify that this function uses Payload's built-in page + limit pagination (not fetching all then slicing in memory). If it fetches all and slices, fix to use Payload pagination params.

Summary of files to change
File	Change
catalog-payload.ts
Add getProductsByCategoryFromPayload, getProductsByBrandFromPayload, getPublishedProductSlugs; wrap getProductBySlugFromPayload raw HTML call with unstable_cache
content-payload.ts
Wrap getSiteSettingsFromPayload, getBannersFromPayload, getSolutionsFromPayload with unstable_cache
app/(site)/san-pham/[slug]/page.tsx	Replace getProductsFromPayload() with targeted queries; update generateStaticParams
next.config.ts	Add formats, minimumCacheTTL to images config
Expected result
Product detail page: ~3–5x faster (no more full catalog load)
Layout/header: cached 5 min — no DB hit on most requests
Product pages: ISR pre-rendered — near-instant for published products
Image delivery: AVIF/WebP served automatically