import type { CatalogProduct } from "@/lib/catalog";
import type { ProductCategoryNavItem } from "@/lib/catalog-payload";
import type { PublicBanner, PublicPost } from "@/lib/content-payload";
import HomeHeroClient from "@/components/home/HomeHeroClient";
import HomeProductShowcaseClient from "@/components/home/HomeProductShowcaseClient";
import HomeCategoryCarouselsClient from "@/components/home/HomeCategoryCarouselsClient";
import HomeStaticSections, { TrustStrip } from "@/components/home/HomeStaticSections";

type HomePageClientProps = {
  initialProducts: CatalogProduct[];
  categorySectionProducts?: CatalogProduct[];
  categories: ProductCategoryNavItem[];
  initialBanners: PublicBanner[];
  initialPosts: PublicPost[];
  quoteEmail: string;
};

export default function HomePageClient({
  initialProducts,
  categorySectionProducts = [],
  categories,
  initialBanners,
  initialPosts,
  quoteEmail,
}: HomePageClientProps) {
  return (
    <main>
      <HomeHeroClient banners={initialBanners} categories={categories} />
      <TrustStrip />
      <HomeProductShowcaseClient products={initialProducts} quoteEmail={quoteEmail} />
      <HomeCategoryCarouselsClient
        products={initialProducts}
        categorySectionProducts={categorySectionProducts}
      />
      <HomeStaticSections posts={initialPosts} />
    </main>
  );
}
