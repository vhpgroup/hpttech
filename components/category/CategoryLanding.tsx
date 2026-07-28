import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SubpageBreadcrumb } from "@/components/layout/SubpageHeader";
import CategoryLandingClient from "@/components/category/CategoryLandingClient";
import {
  getCategoryBreadcrumbTrail,
  getProductSearchPageFromPayload,
  type ProductSearchParams,
} from "@/lib/catalog-payload";
import { absoluteURL } from "@/lib/seo";

// Helper dùng chung cho LANDING DANH MỤC rút gọn /<slug> (kiểu An Phát).
// Trước đây nằm trong app/(site)/[slug]/page.tsx; tách ra để route danh mục
// chuyên biệt (vd /thiet-bi-hinh-anh) tái dùng đúng 1 nguồn — không nhân bản
// logic catalog (theo AGENTS.md mục 11).

type LandingSearchParams = Promise<Record<string, string | string[] | undefined>> | undefined;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseLandingSearchParams(
  categorySlug: string,
  params: Record<string, string | string[] | undefined>,
): ProductSearchParams {
  const sort = firstParam(params.sort);
  return {
    page: Number(firstParam(params.page) || 1),
    // Landing /<slug> nay HỖ TRỢ free-text search: đọc ?search= để lọc trong danh mục.
    // getProductSearchPageFromPayload xử lý search (đã unaccent ở #47); facetScope vẫn
    // "category" nên facet giữ phạm vi danh mục.
    search: firstParam(params.search) || "",
    category: categorySlug,
    facetScope: "category",
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

/**
 * Landing danh mục tại URL rút gọn /<slug> (giống An Phát). Trả null nếu slug
 * không phải danh mục (để caller thử tiếp / notFound / scaffold).
 */
export async function renderCategoryLanding(slug: string, searchParams: LandingSearchParams) {
  const trail = await getCategoryBreadcrumbTrail(slug);
  const leaf = trail.length ? trail[trail.length - 1] : null;
  if (!leaf) return null;
  // Vào bằng tên/slug chưa chuẩn → về URL canonical rút gọn.
  if (leaf.slug !== slug) redirect(`/${encodeURIComponent(leaf.slug)}`);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const parsed = parseLandingSearchParams(leaf.slug, resolvedSearchParams);
  const result = await getProductSearchPageFromPayload(parsed);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: absoluteURL("/") },
      { "@type": "ListItem", position: 2, name: "Sản phẩm", item: absoluteURL("/san-pham") },
      ...trail.map((item, index) => ({
        "@type": "ListItem",
        position: 3 + index,
        name: item.name,
        item: absoluteURL(`/${encodeURIComponent(item.slug)}`),
      })),
    ],
  };

  return (
    <main className="subpage-main bg-slate-50/70 pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SubpageBreadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Sản phẩm", href: "/san-pham" },
          ...trail.map((item) => ({
            label: item.name,
            href: `/${encodeURIComponent(item.slug)}`,
          })),
        ]}
      />

      {/* Khối tiêu đề hiển thị (tên + badge + mô tả) đã BỎ theo yêu cầu 23/07 —
          giữ H1 ẩn cho SEO; số SP vẫn hiện ở thanh phân trang cuối trang. */}
      <h1 className="sr-only">{leaf.name} chính hãng, giá tốt | HPT Tech</h1>

      {/* CategoryLandingClient dùng useSearchParams → PHẢI bọc Suspense. */}
      <Suspense fallback={null}>
        <CategoryLandingClient
          leaf={leaf}
          trail={trail}
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
