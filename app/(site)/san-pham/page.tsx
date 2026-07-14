import { Suspense } from "react";
import { getProductSearchPageFromPayload, type ProductSearchParams } from "@/lib/catalog-payload";
import ProductListClient from "@/components/ProductListClient";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Sản phẩm",
  description: "Danh mục máy in, máy scan và thiết bị văn phòng chính hãng do HPT Tech tư vấn và triển khai.",
  path: "/san-pham",
});

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseProductsSearchParams(params: Record<string, string | string[] | undefined>): ProductSearchParams {
  const sort = firstParam(params.sort);

  return {
    page: Number(firstParam(params.page) || 1),
    search: firstParam(params.search) || "",
    category: firstParam(params.category) || "",
    brand: firstParam(params.brand) || "",
    sort:
      sort === "price-asc" ||
      sort === "price-desc" ||
      sort === "newest" ||
      sort === "popular" ||
      sort === "best"
        ? sort
        : "best",
    priceMin: firstParam(params.priceMin) || "",
    priceMax: firstParam(params.priceMax) || "",
    size: firstParam(params.size) || "",
    speed: firstParam(params.speed) || "",
    feature: firstParam(params.feature) || "",
    func: firstParam(params.func) || "",
    pspeed: firstParam(params.pspeed) || "",
    pfeat: firstParam(params.pfeat) || "",
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const parsed = parseProductsSearchParams(resolvedSearchParams);
  const result = await getProductSearchPageFromPayload(parsed);
  const heading = parsed.search
    ? `Kết quả tìm kiếm: "${parsed.search}"`
    : parsed.category
      ? parsed.category
      : "Tất cả sản phẩm";

  return (
    <Suspense fallback={null}>
      <h1 className="sr-only">
        {heading} - Máy scan, máy in &amp; thiết bị văn phòng | HPT Tech
      </h1>
      <ProductListClient
        products={result.products}
        facets={result.facets}
        page={result.page}
        totalPages={result.totalPages}
        totalProducts={result.totalProducts}
      />
    </Suspense>
  );
}
