"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { ProductQuickInfoTrigger } from "@/components/home/HomeCategoryCarouselsClient";
import { ProductCard } from "@/components/product/ProductCard";
import type { CatalogProduct } from "@/lib/catalog";

type ProductListClientProps = {
  products: CatalogProduct[];
  page: number;
  totalPages: number;
  totalProducts: number;
};

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

export default function ProductListClient({
  products,
  page,
  totalPages,
  totalProducts,
}: ProductListClientProps) {
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() || "";
  const [compareProducts, setCompareProducts] = useState<CatalogProduct[]>([]);
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams(queryString);
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const nextQuery = params.toString();
    return nextQuery ? `/san-pham?${nextQuery}` : "/san-pham";
  };

  const selectedKeys = useMemo(
    () => new Set(compareProducts.map(productKey)),
    [compareProducts],
  );

  const toggleCompare = (product: CatalogProduct) => {
    setCompareProducts((current) => {
      const key = productKey(product);
      if (current.some((item) => productKey(item) === key)) {
        return current.filter((item) => productKey(item) !== key);
      }
      return [...current, product].slice(0, 4);
    });
  };

  return (
    <main className="subpage-main bg-slate-50/70 pb-28">
      <SubpageHeader
        eyebrow="Catalog thiết bị"
        title="Sản phẩm"
        description="Danh mục máy scan, máy in và thiết bị văn phòng cho doanh nghiệp."
        badge={`${totalProducts} sản phẩm`}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Sản phẩm" },
        ]}
      />

      <section className="mt-6 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Danh sách sản phẩm</h2>
            <p className="mt-1 text-sm text-slate-600">
              Hiển thị {products.length} sản phẩm trên trang {currentPage}/{totalPages}.
            </p>
          </div>
          <Link
            href="/san-pham"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Làm mới
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.length ? products.map((product) => (
          <ProductQuickInfoTrigger key={productKey(product)} product={product}>
            <ProductCard
              product={product}
              isComparing={selectedKeys.has(productKey(product))}
              onCompare={toggleCompare}
              className="h-full"
            />
          </ProductQuickInfoTrigger>
        )) : (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
            Không tìm thấy sản phẩm phù hợp.
          </div>
        )}
      </section>

      <nav className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm" aria-label="Phân trang sản phẩm">
        <span className="font-medium text-slate-600">Trang {currentPage}/{totalPages}</span>
        <div className="flex gap-2">
          {currentPage <= 1 ? (
            <span className="rounded-lg border border-slate-200 px-4 py-2 font-bold opacity-40">Trước</span>
          ) : (
            <Link className="rounded-lg border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50" href={pageHref(currentPage - 1)}>Trước</Link>
          )}
          {currentPage >= totalPages ? (
            <span className="rounded-lg border border-slate-200 px-4 py-2 font-bold opacity-40">Sau</span>
          ) : (
            <Link className="rounded-lg border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50" href={pageHref(currentPage + 1)}>Sau</Link>
          )}
        </div>
      </nav>

      {compareProducts.length ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-blue-100 bg-white/95 px-4 py-3 shadow-[0_-18px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Đã chọn so sánh</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {compareProducts.map((product) => (
                  <button
                    key={productKey(product)}
                    type="button"
                    onClick={() => toggleCompare(product)}
                    className="inline-flex max-w-[220px] items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-[#0A4BFF]"
                  >
                    <span className="truncate">{product.title}</span>
                    <X size={14} />
                  </button>
                ))}
              </div>
            </div>
            <Link
              href={`/compare?products=${encodeURIComponent(compareProducts.map(productKey).join(","))}`}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0A4BFF] px-5 text-sm font-extrabold text-white hover:bg-blue-700"
            >
              So sánh ngay
            </Link>
          </div>
        </div>
      ) : null}
    </main>
  );
}
