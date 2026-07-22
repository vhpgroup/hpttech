import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getCategoryBreadcrumbTrail,
  getProductSearchPageFromPayload,
  type ProductSearchParams,
} from "@/lib/catalog-payload";
import ProductListClient from "@/components/ProductListClient";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

// Metadata ĐỘNG: mỗi view danh mục là landing page riêng, self-canonical về
// /san-pham?category=<slug chuẩn> (gộp mọi bộ lọc brand/cpu/... về trang danh mục).
// Tìm kiếm / không danh mục → canonical /san-pham. (Bước đệm cho SEO kiểu An Phát,
// chưa đổi sang route path riêng.)
export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const resolved = searchParams ? await searchParams : {};
  const category = firstParam(resolved.category) || "";
  const search = firstParam(resolved.search) || "";

  if (category) {
    const trail = await getCategoryBreadcrumbTrail(category);
    const leaf = trail.length ? trail[trail.length - 1] : null;
    const name = leaf?.name || category;
    const canonicalSlug = leaf?.slug || category;
    return pageMetadata({
      title: `${name} chính hãng, giá tốt`,
      description: `${name} chính hãng tại HPT Tech — báo giá nhanh, xuất hóa đơn VAT, giao hàng toàn quốc. Tư vấn kỹ thuật tận nơi cho doanh nghiệp.`,
      path: `/san-pham?category=${encodeURIComponent(canonicalSlug)}`,
    });
  }

  if (search) {
    return pageMetadata({
      title: `Kết quả tìm kiếm: ${search}`,
      description: "Kết quả tìm kiếm sản phẩm chính hãng tại HPT Tech.",
      path: "/san-pham",
    });
  }

  return pageMetadata({
    title: "Sản phẩm",
    description: "Danh mục máy in, máy scan và thiết bị văn phòng chính hãng do HPT Tech tư vấn và triển khai.",
    path: "/san-pham",
  });
}

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
    lic: firstParam(params.lic) || "",
    aud: firstParam(params.aud) || "",
    fb: firstParam(params.fb) || "",
    mau: firstParam(params.mau) || "",
    orig: firstParam(params.orig) || "",
    cpu: firstParam(params.cpu) || "",
    ram: firstParam(params.ram) || "",
    gpu: firstParam(params.gpu) || "",
    sc: firstParam(params.sc) || "",
    line: firstParam(params.line) || "",
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const parsed = parseProductsSearchParams(resolvedSearchParams);
  const [result, categoryTrail] = await Promise.all([
    getProductSearchPageFromPayload(parsed),
    parsed.category ? getCategoryBreadcrumbTrail(parsed.category) : Promise.resolve([]),
  ]);
  const heading = parsed.search
    ? `Kết quả tìm kiếm: "${parsed.search}"`
    : parsed.category
      ? parsed.category
      : "Tất cả sản phẩm";

  return (
    <Suspense fallback={null}>
      {/* Khi xem danh mục, H1 nhìn thấy được do ProductListClient render (khối landing) —
          chỉ giữ H1 ẩn cho view tìm kiếm / không danh mục để tránh trùng 2 thẻ H1. */}
      {categoryTrail.length === 0 ? (
        <h1 className="sr-only">
          {heading} - Máy scan, máy in &amp; thiết bị văn phòng | HPT Tech
        </h1>
      ) : null}
      <ProductListClient
        products={result.products}
        facets={result.facets}
        page={result.page}
        totalPages={result.totalPages}
        totalProducts={result.totalProducts}
        categoryTrail={categoryTrail}
      />
    </Suspense>
  );
}
