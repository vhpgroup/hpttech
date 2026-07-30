"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ProductInfoPopupLayer,
  QuickInfoProductCard,
} from "@/components/home/HomeCategoryCarouselsClient";
import type { SanPhamHubGroup } from "@/lib/san-pham-hub";

type HubProductGridProps = {
  group: SanPhamHubGroup;
  /** Xen kẽ nền: true → bg-surface, false → bg-white */
  altBg: boolean;
};

function formatCount(n: number): string {
  if (n <= 0) return "";
  return n.toLocaleString("vi-VN");
}

/**
 * Client component — chứa ProductCard (client) + ProductInfoPopupLayer (client).
 * Server component cha (HubGroupSection) không truyền JSX cần client qua "children
 * of Server Component" — thay vào đó toàn bộ section được render ở đây.
 */
export function HubProductGrid({ group, altBg }: HubProductGridProps) {
  const bgClass = altBg ? "bg-surface" : "bg-white";
  const countLabel = formatCount(group.totalCount);

  return (
    <section
      id={group.id}
      aria-labelledby={`section-title-${group.id}`}
      className={`${bgClass} px-4 py-12 font-sans sm:px-6 sm:py-14 lg:px-8`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2
              id={`section-title-${group.id}`}
              className="text-2xl font-extrabold text-ink sm:text-3xl"
            >
              {group.title}
            </h2>
            {group.subtitle && (
              <p className="mt-1 text-sm text-ink/60">{group.subtitle}</p>
            )}
            {countLabel && (
              <p className="mt-1 text-xs font-semibold text-primary-600">
                {countLabel} sản phẩm
              </p>
            )}
          </div>
          <Link
            href={group.viewAllHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-600 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
          >
            Xem tất cả
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Product grid wrapped in popup layer */}
        <ProductInfoPopupLayer>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {group.products.map((product) => (
              <div key={product.slug || product.id} className="relative">
                <QuickInfoProductCard product={product} />
              </div>
            ))}
          </div>
        </ProductInfoPopupLayer>

        {/* Mobile: link xem thêm lần nữa */}
        <div className="mt-6 flex justify-center sm:hidden">
          <Link
            href={group.viewAllHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 underline-offset-2 hover:underline"
          >
            Xem tất cả {group.title}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
