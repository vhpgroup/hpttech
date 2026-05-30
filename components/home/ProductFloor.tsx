"use client";

import type { Product } from "@/lib/data";
import type { FloorConfig } from "@/lib/floors";
import { ProductCard } from "./ProductCard";

type Props = {
  title: string;
  tabs: FloorConfig[];
  activeId: string;
  onSelectTab: (id: string) => void;
  products: Product[];
  onToggleCompare: (product: Product) => void;
  isComparing: (id: string) => boolean;
};

export function ProductFloor({
  title,
  tabs,
  activeId,
  onSelectTab,
  products,
  onToggleCompare,
  isComparing,
}: Props) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto mt-6 w-[var(--shell-width)] overflow-hidden rounded-b-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
      <div className="flex min-h-11 items-stretch overflow-x-auto border-t-[3px] border-blue-600 bg-white">
        <h2 className="relative flex shrink-0 items-center bg-blue-600 px-5 pr-8 text-sm font-extrabold uppercase text-white after:absolute after:right-[-22px] after:top-0 after:h-full after:w-8 after:skew-x-[-28deg] after:bg-blue-600">
          {title}
        </h2>
        <div className="flex min-w-0 flex-1 items-stretch pl-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`shrink-0 px-5 text-sm font-bold uppercase tracking-normal transition ${
                activeId === tab.id
                  ? "text-blue-700"
                  : "text-slate-900 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onToggleCompare={onToggleCompare}
            isComparing={isComparing(product.id)}
          />
        ))}
      </div>
    </section>
  );
}
