import { Suspense } from "react";
import type { Metadata } from "next";
import {
  getCategoryBreadcrumbTrail,
  getProductSearchPageFromPayload,
  type ProductSearchParams,
} from "@/lib/catalog-payload";
import ProductListClient from "@/components/ProductListClient";
import { pageMetadata } from "@/lib/seo";
import { getSanPhamHubData } from "@/lib/san-pham-hub";
import { SanPhamHub } from "@/components/san-pham/SanPhamHub";

export const revalidate = 300;

// ---------------------------------------------------------------------------
// Whitelist param điều khiển listing (spec mục 3.1)
// Chỉ các key này mới bật nhánh listing; param rác (utm_*, fbclid...) bị bỏ qua.
// ---------------------------------------------------------------------------
const LISTING_PARAM_KEYS: ReadonlySet<string> = new Set([
  "page",
  "search",
  "category",
  "brand",
  "sort",
  "priceMin",
  "priceMax",
  "size",
  "speed",
  "feature",
  "func",
  "pspeed",
  "pfeat",
  "lic",
  "aud",
  "fb",
  "mau",
  "orig",
  "cpu",
  "ram",
  "gpu",
  "sc",
  "line",
  "ccolor",
  "cspeed",
  "cfeat",
]);

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Kiểm tra xem resolved searchParams có chứa BẤT KỲ param điều khiển listing
 * nào với giá trị không rỗng không.
 * utm_*, fbclid, gclid và các param lạ khác KHÔNG thuộc whitelist → trả false → hub.
 */
function hasListingParams(
  resolved: Record<string, string | string[] | undefined>,
): boolean {
  for (const key of Object.keys(resolved)) {
    if (!LISTING_PARAM_KEYS.has(key)) continue;
    const value = firstParam(resolved[key]);
    if (value && value.trim() !== "") return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
      path: `/${encodeURIComponent(canonicalSlug)}`,
    });
  }

  if (search) {
    return pageMetadata({
      title: `Kết quả tìm kiếm: ${search}`,
      description: "Kết quả tìm kiếm sản phẩm chính hãng tại HPT Tech.",
      path: "/san-pham",
    });
  }

  // Nhánh "không param" → hub (spec mục 6.1)
  return pageMetadata({
    title: "Sản phẩm chính hãng cho doanh nghiệp",
    description:
      "Máy scan, máy in, máy photocopy, mực in, laptop, PC – máy chủ, thiết bị mạng và phần mềm bản quyền chính hãng tại HPT Tech. Tư vấn cấu hình, báo giá nhanh, xuất hóa đơn VAT, giao toàn quốc.",
    path: "/san-pham",
  });
}

// ---------------------------------------------------------------------------
// Helpers parse listing params (giữ nguyên logic cũ)
// ---------------------------------------------------------------------------

function parseProductsSearchParams(
  params: Record<string, string | string[] | undefined>,
): ProductSearchParams {
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
    ccolor: firstParam(params.ccolor) || "",
    cspeed: firstParam(params.cspeed) || "",
    cfeat: firstParam(params.cfeat) || "",
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};

  // Rẽ nhánh: có param listing → listing cũ; không có → hub mới.
  if (hasListingParams(resolvedSearchParams)) {
    // ===== NHÁNH LISTING (giữ nguyên toàn bộ logic cũ) =====
    const parsed = parseProductsSearchParams(resolvedSearchParams);
    const [result, categoryTrail] = await Promise.all([
      getProductSearchPageFromPayload(parsed),
      parsed.category
        ? getCategoryBreadcrumbTrail(parsed.category)
        : Promise.resolve([]),
    ]);
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
          categoryTrail={categoryTrail}
        />
      </Suspense>
    );
  }

  // ===== NHÁNH HUB (không có param listing) =====
  const hub = await getSanPhamHubData();
  return <SanPhamHub data={hub} />;
}
