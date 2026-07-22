import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import {
  getCategoryBreadcrumbTrail,
  getProductSearchPageFromPayload,
  type ProductSearchParams,
} from "@/lib/catalog-payload";
import { SubpageBreadcrumb } from "@/components/layout/SubpageHeader";
import CategoryLandingClient from "@/components/category/CategoryLandingClient";
import { absoluteURL, pageMetadata } from "@/lib/seo";

// Landing đọc searchParams (bộ lọc ?brand/?cpu/...) = dynamic API → route PHẢI render
// dynamic. KHÔNG dùng revalidate/generateStaticParams ở đây: tổ hợp ISR + searchParams
// ném DYNAMIC_SERVER_USAGE → 500 (sự cố deploy 22/07). Dữ liệu nav/facet bên dưới đã có
// unstable_cache riêng nên không lo tải DB.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
    search: "",
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
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const trail = await getCategoryBreadcrumbTrail(decodeURIComponent(slug));
  const leaf = trail.length ? trail[trail.length - 1] : null;

  if (!leaf) {
    return pageMetadata({
      title: "Danh mục sản phẩm",
      description: "Danh mục sản phẩm chính hãng tại HPT Tech.",
      path: "/san-pham",
    });
  }

  return pageMetadata({
    title: `${leaf.name} chính hãng, giá tốt`,
    description: `${leaf.name} chính hãng tại HPT Tech — báo giá nhanh, xuất hóa đơn VAT, giao hàng toàn quốc. Tư vấn kỹ thuật tận nơi cho doanh nghiệp.`,
    path: `/danh-muc/${encodeURIComponent(leaf.slug)}`,
  });
}

export default async function CategoryLandingPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);
  const trail = await getCategoryBreadcrumbTrail(decoded);
  const leaf = trail.length ? trail[trail.length - 1] : null;

  if (!leaf) notFound();
  // Vào bằng tên/slug chưa chuẩn → chuyển về URL canonical của danh mục.
  if (leaf.slug !== decoded) redirect(`/danh-muc/${encodeURIComponent(leaf.slug)}`);

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
        item: absoluteURL(`/danh-muc/${encodeURIComponent(item.slug)}`),
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
            href: `/danh-muc/${encodeURIComponent(item.slug)}`,
          })),
        ]}
      />

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[28px]">{leaf.name}</h1>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-[#0A4BFF]">
            {result.totalProducts.toLocaleString("vi-VN")} sản phẩm
          </span>
        </div>
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
          {leaf.name} chính hãng tại HPT Tech — báo giá nhanh, xuất hóa đơn VAT, giao hàng toàn quốc, tư vấn
          kỹ thuật cho doanh nghiệp.
        </p>
      </header>

      {/* CategoryLandingClient dùng useSearchParams → PHẢI bọc Suspense (như /san-pham),
          nếu không SSR/ISR sẽ throw → 500 toàn route. */}
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
