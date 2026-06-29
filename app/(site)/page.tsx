import HomePageClient from "@/components/home/HomePageClient";
import { getHomeProductsFromPayload, getProductCategoryNavFromPayload } from "@/lib/catalog-payload";
import { getBannersFromPayload, getSiteSettingsFromPayload, getSolutionsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "HPT Tech - Thiết bị văn phòng & giải pháp số hóa",
  description:
    "HPT Tech cung cấp máy in, máy scan, thiết bị văn phòng và giải pháp số hóa tài liệu cho doanh nghiệp.",
});

export default async function HomePage() {
  const [products, categories, banners, solutions, rawSettings] = await Promise.all([
    getHomeProductsFromPayload(),
    getProductCategoryNavFromPayload(),
    getBannersFromPayload(),
    getSolutionsFromPayload(),
    getSiteSettingsFromPayload(),
  ]);
  const settings = normalizeSiteSettings(rawSettings);

  return (
    <>
      <h1 className="sr-only">
        Máy scan, máy in &amp; thiết bị văn phòng chính hãng cho doanh nghiệp - HPT Tech
      </h1>
      <HomePageClient
        initialProducts={products}
        categories={categories}
        initialBanners={banners}
        initialSolutions={solutions}
        quoteEmail={settings.email}
      />
    </>
  );
}
