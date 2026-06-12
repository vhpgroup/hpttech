import type { CatalogProduct } from "@/lib/catalog";
import type { PublicBanner, PublicSolution } from "@/lib/content-payload";
import HomeHeroClient from "@/components/home/HomeHeroClient";
import HomeProductShowcaseClient from "@/components/home/HomeProductShowcaseClient";
import HomeCategoryCarouselsClient from "@/components/home/HomeCategoryCarouselsClient";
import HomeStaticSections, { TrustStrip } from "@/components/home/HomeStaticSections";

type HomePageClientProps = {
  initialProducts: CatalogProduct[];
  initialBanners: PublicBanner[];
  initialSolutions: PublicSolution[];
  quoteEmail: string;
};

export default function HomePageClient({
  initialProducts,
  initialBanners,
  initialSolutions,
  quoteEmail,
}: HomePageClientProps) {
  return (
    <main>
      <HomeHeroClient banners={initialBanners} />
      <TrustStrip />
      <HomeProductShowcaseClient products={initialProducts} quoteEmail={quoteEmail} />
      <HomeCategoryCarouselsClient products={initialProducts} />
      <HomeStaticSections solutions={initialSolutions} />
    </main>
  );
}
