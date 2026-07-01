import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingTemplateA } from "@/components/landing/LandingTemplateA";
import {
  buildLandingMetadata,
  FACET_SEGMENT,
  getLandingPageByPath,
  getPublishedLandingPages,
  getScannersForQuery,
  meetsQualityGate,
  SEGMENT_FACET,
} from "@/lib/landing-pages";

export const revalidate = 3600;
export const dynamicParams = true;

type RouteContext = {
  params: Promise<{
    facet: string;
    value: string;
  }>;
};

function isFacetSegment(value: string): value is keyof typeof SEGMENT_FACET {
  return value in SEGMENT_FACET;
}

export async function generateStaticParams() {
  const pages = await getPublishedLandingPages({ productGroup: "may-scan" });
  return pages
    .filter((page) => page.facetType && page.facetSlug)
    .map((page) => ({
      facet: FACET_SEGMENT[page.facetType!],
      value: page.facetSlug!,
    }));
}

export async function generateMetadata({ params }: RouteContext): Promise<Metadata> {
  const { facet, value } = await params;
  if (!isFacetSegment(facet)) return {};

  const page = await getLandingPageByPath(`/giai-phap/may-scan/${facet}/${value}`);
  if (!page) return {};

  const products = await getScannersForQuery(page.productQuery, {
    limit: 4,
    recommendedProducts: page.recommendedProducts,
  });
  const metadata = buildLandingMetadata(page);
  if (page.seo?.noIndex || !meetsQualityGate(page, products.length)) {
    metadata.robots = { index: false, follow: true };
  }
  return metadata;
}

export default async function ScannerLandingPage({ params }: RouteContext) {
  const { facet, value } = await params;
  if (!isFacetSegment(facet)) notFound();

  const page = await getLandingPageByPath(`/giai-phap/may-scan/${facet}/${value}`);
  if (!page || page.productGroup !== "may-scan") notFound();

  const products = await getScannersForQuery(page.productQuery, {
    limit: 12,
    recommendedProducts: page.recommendedProducts,
  });

  return <LandingTemplateA doc={page} products={products} />;
}
