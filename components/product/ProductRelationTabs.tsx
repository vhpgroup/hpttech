"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductQuickInfoTrigger } from "@/components/home/HomeCategoryCarouselsClient";

export type ProductRelationSection = {
  id: "similar" | "same-brand" | "related";
  label: string;
  products: CatalogProduct[];
  emptyMessage: string;
};

type ProductRelationTabsProps = {
  sections: ProductRelationSection[];
  allProductsHref?: string;
};

const PRODUCT_RELATION_PAGE_SIZE = 5;

export function ProductRelationTabs({ sections, allProductsHref = "/san-pham" }: ProductRelationTabsProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "similar");
  const [currentPage, setCurrentPage] = useState(0);
  const activeSection = sections.find((section) => section.id === activeId) ?? sections[0];
  const safeProducts = useMemo(() => activeSection?.products ?? [], [activeSection]);

  const totalPages = Math.max(1, Math.ceil(safeProducts.length / PRODUCT_RELATION_PAGE_SIZE));
  const currentProducts = useMemo(
    () =>
      safeProducts.slice(
        currentPage * PRODUCT_RELATION_PAGE_SIZE,
        (currentPage + 1) * PRODUCT_RELATION_PAGE_SIZE,
      ),
    [safeProducts, currentPage],
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [activeId]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages - 1));
  }, [totalPages]);

  if (!sections.length || !activeSection) return null;

  return (
    <section className="mt-6 rounded-[20px] bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">
          {sections.map((section) => {
            const isActive = section.id === activeSection.id;

            return (
              <button
                key={section.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`product-relation-panel-${section.id}`}
                onClick={() => setActiveId(section.id)}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-extrabold uppercase tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 sm:px-4 sm:text-base lg:text-lg",
                  isActive ? "bg-primary-50 text-primary-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700",
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>

        <Link
          href={allProductsHref}
          className="shrink-0 text-sm font-semibold text-slate-500 transition-colors hover:text-primary-600"
        >
          Xem toàn bộ sản phẩm
        </Link>
      </div>

      <div id={`product-relation-panel-${activeSection.id}`} role="tabpanel" className="mt-5">
        {activeSection.products.length ? (
          <div className="space-y-5">
            <div className="grid gap-4 min-[420px]:grid-cols-2 xl:grid-cols-5">
              {currentProducts.map((item) => (
                <ProductQuickInfoTrigger key={item.slug || item.title} product={item}>
                  <ProductCard product={item} className="h-full home-category-product-card" />
                </ProductQuickInfoTrigger>
              ))}
            </div>

            {activeSection.products.length > PRODUCT_RELATION_PAGE_SIZE ? (
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                  disabled={currentPage === 0}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  Trước
                </button>
                <span className="text-sm font-medium text-slate-500">
                  Trang {currentPage + 1}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Sau
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
            {activeSection.emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}
