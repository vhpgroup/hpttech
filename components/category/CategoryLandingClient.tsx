"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState } from "react";
import { ChevronDown, Filter, SlidersHorizontal, X } from "lucide-react";
import { ProductQuickInfoTrigger } from "@/components/home/HomeCategoryCarouselsClient";
import { ProductCard } from "@/components/product/ProductCard";
import type { CatalogProduct } from "@/lib/catalog";
import type { ProductListFacets } from "@/lib/catalog-payload";
import { FILTER_CRUMB_ORDER, filterCrumbLabel, filterGroupsForCategory } from "@/lib/product-filter-labels";

type TrailItem = { name: string; slug: string };

type SortValue = "best" | "price-asc" | "price-desc" | "newest" | "popular";

const SORT_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Phù hợp nhất", value: "best" },
  { label: "Giá tăng dần", value: "price-asc" },
  { label: "Giá giảm dần", value: "price-desc" },
  { label: "Mới nhất", value: "newest" },
  { label: "Bán chạy", value: "popular" },
];

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

function FilterPill({
  id,
  label,
  active,
  openFilter,
  onOpen,
  children,
}: {
  id: string;
  label: string;
  active: boolean;
  openFilter: string | null;
  onOpen: (key: string | null) => void;
  children: ReactNode;
}) {
  const open = openFilter === id;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpen(open ? null : id)}
        className={`inline-flex h-10 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-bold transition ${
          active || open
            ? "border-[#0A4BFF] bg-blue-50 text-[#0A4BFF]"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        }`}
      >
        {label}
        <ChevronDown size={14} className={open ? "rotate-180 transition" : "transition"} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.35)]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm text-slate-700 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-[#0A4BFF] focus:ring-[#0A4BFF]"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {typeof count === "number" ? <span className="text-xs font-semibold text-slate-400">{count}</span> : null}
    </label>
  );
}

export default function CategoryLandingClient({
  leaf,
  trail,
  products,
  facets,
  page,
  totalPages,
  totalProducts,
}: {
  leaf: TrailItem;
  trail: TrailItem[];
  products: CatalogProduct[];
  facets?: ProductListFacets;
  page: number;
  totalPages: number;
  totalProducts: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const rootSlug = trail[0]?.slug;
  const specGroups = filterGroupsForCategory(rootSlug);

  const brand = clean(searchParams?.get("brand"));
  const sort = (clean(searchParams?.get("sort")) || "best") as SortValue;
  const priceMin = clean(searchParams?.get("priceMin"));
  const priceMax = clean(searchParams?.get("priceMax"));
  const specValues: Record<string, string> = {};
  for (const groupDef of specGroups) {
    const raw = clean(searchParams?.get(groupDef.param));
    if (raw) specValues[groupDef.param] = raw;
  }

  // Danh mục con trong nhánh (facet đã scope server-side) — bỏ chính danh mục đang xem.
  const childCategories = (facets?.categories ?? []).filter((option) => option.value !== leaf.slug);
  const brandOptions = facets?.brands ?? [];
  const activeCount =
    (brand ? 1 : 0) + Object.keys(specValues).length + (priceMin ? 1 : 0) + (priceMax ? 1 : 0);

  const navigate = (params: URLSearchParams) => {
    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.push(href, { scroll: false }));
  };

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (value == null || clean(params.get(key)) === value) params.delete(key);
    else params.set(key, value);
    params.delete("page");
    navigate(params);
  };

  const clearAll = () => {
    setOpenFilter(null);
    const params = new URLSearchParams();
    navigate(params);
  };

  const goPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (nextPage > 1) params.set("page", String(nextPage));
    else params.delete("page");
    navigate(params);
  };

  const chips: Array<{ key: string; label: string; onRemove: () => void }> = [
    ...(brand ? [{ key: "brand", label: brand, onRemove: () => setParam("brand", null) }] : []),
    ...FILTER_CRUMB_ORDER.filter((key) => key !== "brand" && specValues[key]).map((key) => ({
      key,
      label: filterCrumbLabel(key, specValues[key]),
      onRemove: () => setParam(key, null),
    })),
    ...(priceMin || priceMax
      ? [
          {
            key: "price",
            label: `Giá ${priceMin || "0"}đ – ${priceMax || "∞"}đ`,
            onRemove: () => {
              const params = new URLSearchParams(searchParams?.toString());
              params.delete("priceMin");
              params.delete("priceMax");
              params.delete("page");
              navigate(params);
            },
          },
        ]
      : []),
  ];

  return (
    <>
      {openFilter ? (
        <button
          type="button"
          aria-label="Đóng bộ lọc"
          className="fixed inset-0 z-30 cursor-default bg-transparent"
          onClick={() => setOpenFilter(null)}
        />
      ) : null}

      {/* THANH BỘ LỌC ngang (kiểu An Phát) — chỉ chứa bộ lọc CỦA danh mục này. */}
      <div className="relative z-40 mt-5 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 pr-1 text-xs font-black uppercase tracking-wide text-slate-800">
            <Filter size={15} /> Bộ lọc
          </span>

          {childCategories.length ? (
            <FilterPill id="cat" label="Phân loại" active={false} openFilter={openFilter} onOpen={setOpenFilter}>
              <div className="flex max-h-80 flex-col gap-1 overflow-auto">
                {childCategories.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setOpenFilter(null);
                      startTransition(() => router.push(`/danh-muc/${encodeURIComponent(option.value)}`));
                    }}
                    className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0A4BFF]"
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {typeof option.count === "number" ? (
                      <span className="text-xs font-bold text-slate-400">{option.count}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </FilterPill>
          ) : null}

          {brandOptions.length ? (
            <FilterPill
              id="brand"
              label={brand ? `Hãng: ${brand}` : "Hãng"}
              active={Boolean(brand)}
              openFilter={openFilter}
              onOpen={setOpenFilter}
            >
              <div className="flex max-h-80 flex-col gap-1 overflow-auto">
                {brandOptions.map((option) => (
                  <CheckRow
                    key={option.value}
                    label={option.label}
                    count={option.count}
                    checked={brand === option.value}
                    onChange={() => setParam("brand", option.value)}
                  />
                ))}
              </div>
            </FilterPill>
          ) : null}

          {specGroups.map((groupDef) => (
            <FilterPill
              key={groupDef.param}
              id={groupDef.param}
              label={
                specValues[groupDef.param]
                  ? filterCrumbLabel(groupDef.param, specValues[groupDef.param])
                  : groupDef.title
              }
              active={Boolean(specValues[groupDef.param])}
              openFilter={openFilter}
              onOpen={setOpenFilter}
            >
              <div className="flex max-h-80 flex-col gap-1 overflow-auto">
                {groupDef.options.map((option) => (
                  <CheckRow
                    key={option.value}
                    label={option.label}
                    checked={specValues[groupDef.param] === option.value}
                    onChange={() => setParam(groupDef.param, option.value)}
                  />
                ))}
              </div>
            </FilterPill>
          ))}

          <FilterPill
            id="price"
            label={priceMin || priceMax ? "Giá: đã đặt" : "Giá"}
            active={Boolean(priceMin || priceMax)}
            openFilter={openFilter}
            onOpen={setOpenFilter}
          >
            <PriceForm
              initialMin={priceMin}
              initialMax={priceMax}
              onApply={(min, max) => {
                const params = new URLSearchParams(searchParams?.toString());
                if (min) params.set("priceMin", min);
                else params.delete("priceMin");
                if (max) params.set("priceMax", max);
                else params.delete("priceMax");
                params.delete("page");
                setOpenFilter(null);
                navigate(params);
              }}
            />
          </FilterPill>

          <label className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm shadow-sm">
            <SlidersHorizontal size={15} className="text-slate-400" />
            <select
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none"
              value={sort}
              onChange={(event) => setParam("sort", event.target.value === "best" ? null : event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sắp xếp: {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {chips.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm">
            <span className="font-semibold text-slate-700">Đang lọc:</span>
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]"
              >
                {chip.label} <X size={14} />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto text-xs font-bold text-slate-500 hover:text-[#0A4BFF]"
            >
              Xóa tất cả {activeCount ? `(${activeCount})` : ""}
            </button>
          </div>
        ) : null}
      </div>

      {/* LƯỚI SẢN PHẨM full-width */}
      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {products.length ? (
          products.map((product) => (
            <ProductQuickInfoTrigger key={productKey(product)} product={product}>
              <ProductCard product={product} className="h-full" />
            </ProductQuickInfoTrigger>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-600">
            Không tìm thấy sản phẩm phù hợp trong {leaf.name}. Hãy thử bỏ bớt bộ lọc.
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <span className="font-medium text-slate-600">
          Trang {page}/{totalPages} · {totalProducts.toLocaleString("vi-VN")} sản phẩm
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 font-bold disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => goPage(Math.max(1, page - 1))}
          >
            Trước
          </button>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 font-bold disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => goPage(Math.min(totalPages, page + 1))}
          >
            Sau
          </button>
        </div>
      </div>
    </>
  );
}

function PriceForm({
  initialMin,
  initialMax,
  onApply,
}: {
  initialMin: string;
  initialMax: string;
  onApply: (min: string, max: string) => void;
}) {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  return (
    <div className="grid w-56 grid-cols-2 gap-2">
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">Từ</span>
        <input
          type="number"
          min={0}
          value={min}
          onChange={(event) => setMin(event.target.value.replace(/[^\d]/g, ""))}
          placeholder="0"
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0A4BFF]"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs font-semibold text-slate-500">Đến</span>
        <input
          type="number"
          min={0}
          value={max}
          onChange={(event) => setMax(event.target.value.replace(/[^\d]/g, ""))}
          placeholder="50000000"
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0A4BFF]"
        />
      </label>
      <button
        type="button"
        onClick={() => onApply(min, max)}
        className="col-span-2 h-9 rounded-lg bg-[#0A4BFF] text-sm font-bold text-white hover:bg-blue-700"
      >
        Áp dụng
      </button>
    </div>
  );
}
