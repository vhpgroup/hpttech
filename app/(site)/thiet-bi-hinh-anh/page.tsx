import Link from "next/link";
import { ArrowRight, Images, PhoneCall } from "lucide-react";
import { SubpageBreadcrumb } from "@/components/layout/SubpageHeader";
import { renderCategoryLanding } from "@/components/category/CategoryLanding";
import { pageMetadata } from "@/lib/seo";

// Route danh mục chuyên biệt /thiet-bi-hinh-anh.
// - Khi danh mục "thiet-bi-hinh-anh" ĐÃ có trong CMS (sau khi import dữ liệu từ
//   nguồn ngoài) → dùng chung renderCategoryLanding như route [slug] (đầy đủ bộ
//   lọc, facet, phân trang). KHÔNG cần sửa lại code khi có dữ liệu.
// - Khi CHƯA có dữ liệu → hiện scaffold "đang cập nhật" thay vì 404.
// Landing đọc searchParams (bộ lọc) → PHẢI force-dynamic.
export const dynamic = "force-dynamic";

const CATEGORY_SLUG = "thiet-bi-hinh-anh";
const CATEGORY_NAME = "Thiết bị hình ảnh";
const CATEGORY_DESC =
  "Máy scan, camera vật thể, máy chiếu vật thể và thiết bị số hóa hình ảnh chính hãng cho doanh nghiệp — báo giá nhanh, xuất hóa đơn VAT, giao hàng toàn quốc.";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata() {
  return pageMetadata({
    title: `${CATEGORY_NAME} chính hãng, giá tốt`,
    description: CATEGORY_DESC,
    path: `/${CATEGORY_SLUG}`,
  });
}

export default async function ThietBiHinhAnhPage({ searchParams }: PageProps) {
  const landing = await renderCategoryLanding(CATEGORY_SLUG, searchParams);
  if (landing) return landing;

  // Chưa có danh mục trong CMS → scaffold "đang cập nhật".
  return (
    <main className="subpage-main">
      <SubpageBreadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: CATEGORY_NAME },
        ]}
      />

      <section className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-6 p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-primary-700">
              <Images size={24} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">HPT Tech</p>
              <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{CATEGORY_NAME}</h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-slate-600">{CATEGORY_DESC}</p>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6">
            <p className="text-base font-semibold text-slate-950">Sản phẩm đang được cập nhật</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Danh mục sẽ sớm có sản phẩm. Cần tư vấn hoặc báo giá ngay, vui lòng liên hệ đội ngũ HPT Tech.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="tel:0967286889"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white transition hover:bg-primary-700"
              >
                <PhoneCall size={16} /> Gọi tư vấn: 0967 286 889
              </a>
              <Link
                href="/san-pham"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-bold text-slate-800 transition hover:border-primary-300 hover:text-primary-700"
              >
                Xem tất cả sản phẩm <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
