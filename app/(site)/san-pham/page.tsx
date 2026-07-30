import { Suspense } from "react";
import type { Metadata } from "next";
import CategoryLandingClient from "@/components/category/CategoryLandingClient";
import { SubpageBreadcrumb } from "@/components/layout/SubpageHeader";
import {
  getCategoryBreadcrumbTrail,
  getProductSearchPageFromPayload,
  type ProductSearchParams,
} from "@/lib/catalog-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";

export const revalidate = 300;

type ProductsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

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

  return pageMetadata({
    title: "Sản phẩm chính hãng cho doanh nghiệp",
    description:
      "Máy scan, máy in, máy photocopy, mực in, laptop, PC – máy chủ, thiết bị mạng và phần mềm bản quyền chính hãng tại HPT Tech. Tư vấn cấu hình, báo giá nhanh, xuất hóa đơn VAT, giao toàn quốc.",
    path: "/san-pham",
  });
}

// ---------------------------------------------------------------------------
// Parse search params (giữ nguyên bộ param filter hiện hành — đích link mega-menu)
// ---------------------------------------------------------------------------

function parseProductsSearchParams(
  params: Record<string, string | string[] | undefined>,
): ProductSearchParams {
  const sort = firstParam(params.sort);
  const category = firstParam(params.category) || "";

  return {
    page: Number(firstParam(params.page) || 1),
    search: firstParam(params.search) || "",
    category,
    // Có danh mục → facet (Phân loại/Hãng) scope theo nhánh, đồng nhất trải nghiệm
    // với landing /<slug>; không có → facet toàn catalog (hành vi /san-pham gốc).
    facetScope: category ? "category" : "global",
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
// Page — layout landing (thanh bộ lọc ngang + lưới full-width, kiểu An Phát)
// dùng chung CategoryLandingClient với các landing /<slug>. KHÔNG còn sidebar dọc.
// ---------------------------------------------------------------------------

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const parsed = parseProductsSearchParams(resolvedSearchParams);

  const [result, categoryTrail] = await Promise.all([
    getProductSearchPageFromPayload(parsed),
    parsed.category ? getCategoryBreadcrumbTrail(parsed.category) : Promise.resolve([]),
  ]);

  const catLeaf = categoryTrail.length ? categoryTrail[categoryTrail.length - 1] : null;
  // leaf/trail cho CategoryLandingClient: có ?category → ngữ cảnh nhánh đó
  // (spec pills theo nhóm, facet đã scope); không có → ngữ cảnh "Tất cả sản phẩm".
  const leaf = catLeaf ?? { name: "Tất cả sản phẩm", slug: "san-pham" };

  const heading = parsed.search
    ? `Kết quả tìm kiếm: "${parsed.search}"`
    : catLeaf
      ? catLeaf.name
      : "Tất cả sản phẩm";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: absoluteURL("/") },
      { "@type": "ListItem", position: 2, name: "Sản phẩm", item: absoluteURL("/san-pham") },
      ...categoryTrail.map((item, index) => ({
        "@type": "ListItem",
        position: 3 + index,
        name: item.name,
        item: absoluteURL(`/${encodeURIComponent(item.slug)}`),
      })),
    ],
  };

  return (
    <main className="subpage-main bg-slate-50/70 pb-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <SubpageBreadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Sản phẩm", href: "/san-pham" },
          ...categoryTrail.map((item) => ({
            label: item.name,
            href: `/${encodeURIComponent(item.slug)}`,
          })),
        ]}
      />

      <h1 className="sr-only">
        {heading} - Máy scan, máy in &amp; thiết bị văn phòng | HPT Tech
      </h1>

      {/* CategoryLandingClient dùng useSearchParams → PHẢI bọc Suspense. */}
      <Suspense fallback={null}>
        <CategoryLandingClient
          leaf={leaf}
          trail={categoryTrail}
          products={result.products}
          facets={result.facets}
          page={result.page}
          totalPages={result.totalPages}
          totalProducts={result.totalProducts}
        />
      </Suspense>
    </main>
  );
}
