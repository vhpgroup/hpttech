import type { CatalogProduct } from "@/lib/catalog";
import type { ProductCategoryNavItem } from "@/lib/catalog-payload";
import type { PublicBanner, PublicPost, PublicSolution } from "@/lib/content-payload";
import HomeHeroClient from "@/components/home/HomeHeroClient";
import HomeProductShowcaseClient from "@/components/home/HomeProductShowcaseClient";
import HomeCategoryCarouselsClient from "@/components/home/HomeCategoryCarouselsClient";
import HomeStaticSections, { TrustStrip } from "@/components/home/HomeStaticSections";
import Image from "next/image";
import Link from "next/link";

type HomePageClientProps = {
  initialProducts: CatalogProduct[];
  categorySectionProducts?: CatalogProduct[];
  categories: ProductCategoryNavItem[];
  initialBanners: PublicBanner[];
  initialSolutions: PublicSolution[];
  initialPosts: PublicPost[];
  quoteEmail: string;
};

const SIDE_AD_IMAGE = "/api/r2-media/HPT_Microsoft_banner_200x600.png";
const SIDE_AD_LINK = "/tin-tuc/tin-tuc-hpt/thong-bao/ban-quyen-khong-kho-da-co-hpt";

export default function HomePageClient({
  initialProducts,
  categorySectionProducts = [],
  categories,
  initialBanners,
  initialSolutions,
  initialPosts,
  quoteEmail,
}: HomePageClientProps) {
  return (
    <main className="home-page">
      <SideAdBanners />
      <HomeHeroClient banners={initialBanners} categories={categories} />
      <TrustStrip />
      <HomeProductShowcaseClient products={initialProducts} quoteEmail={quoteEmail} />
      <HomeCategoryCarouselsClient
        products={initialProducts}
        categorySectionProducts={categorySectionProducts}
      />
      <HomeStaticSections solutions={initialSolutions} posts={initialPosts} />
    </main>
  );
}

function SideAdBanners() {
  return (
    <div className="home-side-ads" aria-label="Banner quảng cáo hai bên">
      <Link className="home-side-ad home-side-ad-left" href={SIDE_AD_LINK} aria-label="Xem ưu đãi bản quyền không khó đã có HPT">
        <Image src={SIDE_AD_IMAGE} alt="Ưu đãi Microsoft chính hãng tại HPT Tech" width={200} height={600} priority />
      </Link>
      <Link className="home-side-ad home-side-ad-right" href={SIDE_AD_LINK} aria-label="Xem ưu đãi bản quyền không khó đã có HPT">
        <Image src={SIDE_AD_IMAGE} alt="Ưu đãi Microsoft chính hãng tại HPT Tech" width={200} height={600} priority />
      </Link>
    </div>
  );
}
