"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { ProductQuickInfoTrigger } from "@/components/home/HomeCategoryCarouselsClient";
import { ProductCard } from "@/components/product/ProductCard";
import type { CatalogProduct } from "@/lib/catalog";
import { canonicalizeCategoryName } from "@/lib/product-category";
import type { ProductListFacets } from "@/lib/catalog-payload";

type MultiFilterKey =
  | "categories"
  | "brands"
  | "scanSpeeds"
  | "duplex"
  | "adf"
  | "connectivity"
  | "paperSizes";

type Filters = Record<MultiFilterKey, string[]> & {
  priceMin: string;
  priceMax: string;
};

type SortValue = "best" | "price-asc" | "price-desc" | "newest" | "popular";

type FilterOption = {
  label: string;
  value: string;
  count?: number;
};

type ProductListClientProps = {
  products: CatalogProduct[];
  facets?: ProductListFacets;
  page: number;
  totalPages: number;
  totalProducts: number;
};

const BRAND_OPTIONS = ["Brother", "Ricoh", "Epson", "HP", "Canon", "Fujitsu"];

const SCAN_SPEED_OPTIONS: FilterOption[] = [
  { label: "Dưới 30 trang/phút", value: "under-30" },
  { label: "30-40 trang/phút", value: "30-40" },
  { label: "40-60 trang/phút", value: "40-60" },
  { label: "Trên 60 trang/phút", value: "over-60" },
];

const ADF_OPTIONS: FilterOption[] = [
  { label: "50 tờ", value: "50" },
  { label: "60 tờ", value: "60" },
  { label: "80 tờ", value: "80" },
  { label: "Trên 100 tờ", value: "over-100" },
];

const SORT_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Phù hợp nhất", value: "best" },
  { label: "Giá tăng dần", value: "price-asc" },
  { label: "Giá giảm dần", value: "price-desc" },
  { label: "Mới nhất", value: "newest" },
  { label: "Bán chạy", value: "popular" },
];

function cleanFilterValue(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

function normalizeText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function slugifyFilterValue(value?: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategoryFilterLabel(value?: string) {
  return canonicalizeCategoryName(cleanFilterValue(value));
}

function formatVND(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function firstNumber(value?: string) {
  const match = normalizeText(value).match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : undefined;
}

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

function specHaystack(product: CatalogProduct) {
  return normalizeText((product.specs || []).map((spec) => `${spec.label} ${spec.value}`).join(" "));
}

function findSpecValue(product: CatalogProduct, patterns: string[]) {
  const normalizedPatterns = patterns.map(normalizeText);
  return (product.specs || []).find((spec) => {
    const label = normalizeText(spec.label);
    return normalizedPatterns.some((pattern) => label.includes(pattern));
  })?.value;
}

function scanSpeed(product: CatalogProduct) {
  const value =
    findSpecValue(product, ["Toc do scan", "Toc do quet"]) ||
    (normalizeText(product.category).includes("scan") ? findSpecValue(product, ["Toc do"]) : undefined);
  return firstNumber(value);
}

function adfSheets(product: CatalogProduct) {
  return firstNumber(findSpecValue(product, ["Suc chua ADF", "ADF", "Khay ADF"]));
}

function productCategoryBucket(product: CatalogProduct) {
  if (product.category) {
    const categoryValue = slugifyFilterValue(normalizeCategoryFilterLabel(product.category));
    if (categoryValue) return categoryValue;
  }

  const text = normalizeText(`${product.productType || ""} ${product.category || ""} ${product.title || ""}`);
  if (text.includes("scan")) return "may-scan";
  if (text.includes("photocopy") || text.includes("photo") || text.includes("copy")) return "photocopy";
  if (text.includes("may in") || text.includes("printer") || text.includes("laserjet")) return "may-in";
  return "";
}

function buildCategoryOptions(products: CatalogProduct[]): FilterOption[] {
  const categoryMap = new Map<string, FilterOption>();

  for (const product of products) {
    const label = normalizeCategoryFilterLabel(product.category);
    if (!label) continue;

    const value = slugifyFilterValue(label);
    if (!value || categoryMap.has(value)) continue;

    categoryMap.set(value, { label, value });
  }

  return Array.from(categoryMap.values()).sort((a, b) => a.label.localeCompare(b.label, "vi"));
}

function hasDuplex(product: CatalogProduct) {
  const text = specHaystack(product);
  const mentionsDuplex = text.includes("duplex") || text.includes("2 mat") || text.includes("hai mat");
  if (!mentionsDuplex) return undefined;
  if (text.includes("khong")) return "no";
  return "yes";
}

function matchesScanSpeed(product: CatalogProduct, value: string) {
  const speed = scanSpeed(product);
  if (speed === undefined) return false;
  if (value === "under-30") return speed < 30;
  if (value === "30-40") return speed >= 30 && speed <= 40;
  if (value === "40-60") return speed >= 40 && speed <= 60;
  if (value === "over-60") return speed > 60;
  return false;
}

function matchesAdf(product: CatalogProduct, value: string) {
  const sheets = adfSheets(product);
  if (sheets === undefined) return false;
  if (value === "over-100") return sheets > 100;
  return Math.round(sheets) === Number(value);
}

function matchesConnectivity(product: CatalogProduct, value: string) {
  const text = specHaystack(product);
  if (value === "wifi") return text.includes("wifi") || text.includes("wi-fi");
  return text.includes(value);
}

function matchesPaper(product: CatalogProduct, value: string) {
  return specHaystack(product).includes(value);
}

function countOption(products: CatalogProduct[], key: MultiFilterKey, value: string) {
  return products.filter((product) => {
    if (key === "categories") return productCategoryBucket(product) === value;
    if (key === "brands") return product.brand === value;
    if (key === "scanSpeeds") return matchesScanSpeed(product, value);
    if (key === "duplex") return hasDuplex(product) === value;
    if (key === "adf") return matchesAdf(product, value);
    if (key === "connectivity") return matchesConnectivity(product, value);
    if (key === "paperSizes") return matchesPaper(product, value);
    return false;
  }).length;
}

function emptyFilters(): Filters {
  return {
    categories: [],
    brands: [],
    scanSpeeds: [],
    duplex: [],
    adf: [],
    connectivity: [],
    paperSizes: [],
    priceMin: "",
    priceMax: "",
  };
}

function initialFiltersFromParams(searchParams: URLSearchParams, categoryOptions: FilterOption[]): Filters {
  const category = cleanFilterValue(searchParams.get("category"));
  const brand = cleanFilterValue(searchParams.get("brand"));
  const categoryValue = categoryOptions.find((option) => option.label === category || option.value === category)?.value;

  return {
    ...emptyFilters(),
    categories: categoryValue ? [categoryValue] : [],
    brands: brand ? [brand] : [],
  };
}

function activeFilterCount(filters: Filters) {
  return (
    filters.categories.length +
    filters.brands.length +
    filters.scanSpeeds.length +
    filters.duplex.length +
    filters.adf.length +
    filters.connectivity.length +
    filters.paperSizes.length +
    (filters.priceMin ? 1 : 0) +
    (filters.priceMax ? 1 : 0)
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="border-b border-slate-100 py-4 last:border-b-0" open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-extrabold uppercase tracking-wide text-slate-800">
        {title}
        <ChevronDown size={16} className="text-slate-400" />
      </summary>
      <div className="mt-3 space-y-2">{children}</div>
    </details>
  );
}

function FilterCheckbox({
  option,
  checked,
  onChange,
}: {
  option: FilterOption;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300 text-[#0A4BFF] focus:ring-[#0A4BFF]"
      />
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {typeof option.count === "number" ? <span className="text-xs font-semibold text-slate-400">{option.count}</span> : null}
    </label>
  );
}

function ProductFilters({
  products,
  categoryOptions,
  brandOptions,
  filters,
  onToggle,
  onPriceChange,
  onClear,
  onApply,
}: {
  products: CatalogProduct[];
  categoryOptions: FilterOption[];
  brandOptions: FilterOption[];
  filters: Filters;
  onToggle: (key: MultiFilterKey, value: string) => void;
  onPriceChange: (key: "priceMin" | "priceMax", value: string) => void;
  onClear: () => void;
  onApply?: () => void;
}) {
  const categoryOptionsWithCount = categoryOptions.map((option) => ({ ...option, count: option.count ?? countOption(products, "categories", option.value) }));

  const renderOptions = (key: MultiFilterKey, options: FilterOption[]) =>
    options.map((option) => (
      <FilterCheckbox
        key={option.value}
        option={option}
        checked={filters[key].includes(option.value)}
        onChange={() => onToggle(key, option.value)}
      />
    ));

  return (
    <aside className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-950">Bộ lọc sản phẩm</h2>
        <button type="button" onClick={onClear} className="text-xs font-bold text-[#0A4BFF] hover:text-blue-700">
          Xóa tất cả
        </button>
      </div>

      <FilterSection title="Danh mục">{renderOptions("categories", categoryOptionsWithCount)}</FilterSection>
      <FilterSection title="Thương hiệu">{renderOptions("brands", brandOptions)}</FilterSection>

      <FilterSection title="Khoảng giá">
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Từ</span>
            <input
              type="number"
              min={0}
              value={filters.priceMin}
              onChange={(event) => onPriceChange("priceMin", event.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0A4BFF]"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Đến</span>
            <input
              type="number"
              min={0}
              value={filters.priceMax}
              onChange={(event) => onPriceChange("priceMax", event.target.value)}
              placeholder="50000000"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0A4BFF]"
            />
          </label>
        </div>
      </FilterSection>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onClear} className="h-10 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Xóa
        </button>
        <button
          type="button"
          onClick={onApply}
          className="h-10 rounded-lg bg-[#0A4BFF] text-sm font-bold text-white shadow-[0_14px_30px_-20px_rgba(10,75,255,0.8)] hover:bg-blue-700"
        >
          Áp dụng
        </button>
      </div>
    </aside>
  );
}

function removeValue(values: string[], value: string) {
  return values.filter((item) => item !== value);
}

export default function ProductListClient({ products, facets, page, totalPages, totalProducts }: ProductListClientProps) {
  const searchParams = useSearchParams();
  const safeSearchParams = searchParams ?? new URLSearchParams();
  const queryKey = safeSearchParams.toString();
  const initialSearch = cleanFilterValue(safeSearchParams.get("search"));
  const initialSort = (cleanFilterValue(safeSearchParams.get("sort")) || "best") as SortValue;
  const categoryOptions = useMemo(
    () => facets?.categories.length ? facets.categories : buildCategoryOptions(products),
    [facets?.categories, products],
  );
  const brandOptions = useMemo(
    () =>
      facets?.brands.length
        ? facets.brands
        : Array.from(new Set([...BRAND_OPTIONS, ...products.map((item) => item.brand).filter((brand): brand is string => Boolean(brand))]))
            .sort((a, b) => a.localeCompare(b, "vi"))
            .map((brand) => ({ label: brand, value: brand, count: countOption(products, "brands", brand) })),
    [facets?.brands, products],
  );
  const initialFilters = initialFiltersFromParams(safeSearchParams, categoryOptions);
  initialFilters.priceMin = cleanFilterValue(safeSearchParams.get("priceMin"));
  initialFilters.priceMax = cleanFilterValue(safeSearchParams.get("priceMax"));

  return (
    <ProductListInner
      key={queryKey}
      products={products}
      categoryOptions={categoryOptions}
      brandOptions={brandOptions}
      initialSearch={initialSearch}
      initialFilters={initialFilters}
      initialSort={initialSort}
      page={page}
      totalPages={totalPages}
      totalProducts={totalProducts}
    />
  );
}

function ProductListInner({
  products,
  categoryOptions,
  brandOptions,
  initialSearch,
  initialFilters,
  initialSort,
  page,
  totalPages,
  totalProducts,
}: ProductListClientProps & {
  categoryOptions: FilterOption[];
  brandOptions: FilterOption[];
  initialSearch: string;
  initialFilters: Filters;
  initialSort: SortValue;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialSearch);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sort, setSort] = useState<SortValue>(initialSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [compareProducts, setCompareProducts] = useState<CatalogProduct[]>([]);

  const activeCount = activeFilterCount(filters);
  const selectedKeys = useMemo(() => new Set(compareProducts.map(productKey)), [compareProducts]);

  const pushCatalogState = (next: {
    filters?: Filters;
    query?: string;
    sort?: SortValue;
    page?: number;
  }) => {
    const nextFilters = next.filters ?? filters;
    const params = new URLSearchParams(searchParams?.toString());
    const nextQuery = next.query ?? query;
    const nextSort = next.sort ?? sort;
    const nextPage = next.page ?? 1;

    params.delete("category");
    params.delete("brand");
    params.delete("priceMin");
    params.delete("priceMax");
    params.delete("search");
    params.delete("sort");
    params.delete("page");

    if (nextFilters.categories[0]) params.set("category", nextFilters.categories[0]);
    if (nextFilters.brands[0]) params.set("brand", nextFilters.brands[0]);
    if (nextFilters.priceMin) params.set("priceMin", nextFilters.priceMin);
    if (nextFilters.priceMax) params.set("priceMax", nextFilters.priceMax);
    if (nextQuery.trim()) params.set("search", nextQuery.trim());
    if (nextSort !== "best") params.set("sort", nextSort);
    if (nextPage > 1) params.set("page", String(nextPage));

    const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    startTransition(() => router.push(href, { scroll: false }));
  };

  const toggleFilter = (key: MultiFilterKey, value: string) => {
    const exists = filters[key].includes(value);
    const nextFilters = {
      ...filters,
      [key]: exists ? filters[key].filter((item) => item !== value) : [value],
    };
    setFilters(nextFilters);
    pushCatalogState({ filters: nextFilters });
  };

  const updatePrice = (key: "priceMin" | "priceMax", value: string) => {
    const nextFilters = { ...filters, [key]: value.replace(/[^\d]/g, "") };
    setFilters(nextFilters);
    pushCatalogState({ filters: nextFilters });
  };

  const clearFilters = () => {
    const nextFilters = emptyFilters();
    setFilters(nextFilters);
    setQuery("");
    setSort("best");
    pushCatalogState({ filters: nextFilters, query: "", sort: "best" });
  };

  const removeChip = (key: MultiFilterKey, value: string) => {
    const nextFilters = { ...filters, [key]: removeValue(filters[key], value) };
    setFilters(nextFilters);
    pushCatalogState({ filters: nextFilters });
  };

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <div className="sticky top-28">
            <ProductFilters
              products={products}
              categoryOptions={categoryOptions}
              brandOptions={brandOptions}
              filters={filters}
              onToggle={toggleFilter}
              onPriceChange={updatePrice}
              onClear={clearFilters}
            />
          </div>
        </div>

        <section className="min-w-0">
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row">
              <label className="flex h-12 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-sm focus-within:border-[#0A4BFF]">
                <Search size={18} className="text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") pushCatalogState({ query });
                  }}
                  onBlur={() => pushCatalogState({ query })}
                  placeholder="Tìm máy scan 2 mặt tốc độ 40 trang/phút..."
                  type="search"
                />
              </label>

              <div className="grid grid-cols-2 gap-3 sm:flex">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800 shadow-sm lg:hidden"
                >
                  <Filter size={17} />
                  Bộ lọc {activeCount ? `(${activeCount})` : ""}
                </button>
                <label className="inline-flex h-12 min-w-52 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 shadow-sm">
                  <SlidersHorizontal size={17} className="text-slate-400" />
                  <select
                    className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
                    value={sort}
                    onChange={(event) => {
                      const nextSort = event.target.value as SortValue;
                      setSort(nextSort);
                      pushCatalogState({ sort: nextSort });
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        Sắp xếp: {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {activeCount || query.trim() ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-slate-700">Đang lọc:</span>
                {query.trim() ? (
                  <button type="button" onClick={() => {
                    setQuery("");
                    pushCatalogState({ query: "" });
                  }} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                    {query.trim()} <X size={14} />
                  </button>
                ) : null}
                {filters.categories.map((value) => (
                  <button key={value} type="button" onClick={() => removeChip("categories", value)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
                    {categoryOptions.find((item) => item.value === value)?.label || value} <X size={14} />
                  </button>
                ))}
                {filters.brands.map((value) => (
                  <button key={value} type="button" onClick={() => removeChip("brands", value)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
                    {value} <X size={14} />
                  </button>
                ))}
                {filters.duplex.map((value) => (
                  <button key={value} type="button" onClick={() => removeChip("duplex", value)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
                    {value === "yes" ? "Duplex" : "Không duplex"} <X size={14} />
                  </button>
                ))}
                {filters.scanSpeeds.map((value) => (
                  <button key={value} type="button" onClick={() => removeChip("scanSpeeds", value)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
                    {SCAN_SPEED_OPTIONS.find((item) => item.value === value)?.label || value} <X size={14} />
                  </button>
                ))}
                {filters.adf.map((value) => (
                  <button key={value} type="button" onClick={() => removeChip("adf", value)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
                    {ADF_OPTIONS.find((item) => item.value === value)?.label || value} <X size={14} />
                  </button>
                ))}
                {[...filters.connectivity, ...filters.paperSizes].map((value) => (
                  <button key={value} type="button" onClick={() => removeChip(filters.connectivity.includes(value) ? "connectivity" : "paperSizes", value)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
                    {value.toUpperCase()} <X size={14} />
                  </button>
                ))}
                {filters.priceMin || filters.priceMax ? (
                  <button type="button" onClick={() => {
                    const nextFilters = { ...filters, priceMin: "", priceMax: "" };
                    setFilters(nextFilters);
                    pushCatalogState({ filters: nextFilters });
                  }} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
                    {filters.priceMin ? `Từ ${formatVND(Number(filters.priceMin))}` : ""} {filters.priceMax ? `Đến ${formatVND(Number(filters.priceMax))}` : ""} <X size={14} />
                  </button>
                ) : null}
                <button type="button" onClick={clearFilters} className="ml-auto text-sm font-bold text-slate-500 hover:text-[#0A4BFF]">
                  Xóa tất cả
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                Không tìm thấy sản phẩm phù hợp. Hãy thử từ khóa hoặc bộ lọc khác.
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <span className="font-medium text-slate-600">Trang {page}/{totalPages}</span>
            <div className="flex gap-2">
              <button className="rounded-lg border border-slate-200 px-4 py-2 font-bold disabled:opacity-40" disabled={page <= 1} onClick={() => pushCatalogState({ page: Math.max(1, page - 1) })}>Trước</button>
              <button className="rounded-lg border border-slate-200 px-4 py-2 font-bold disabled:opacity-40" disabled={page >= totalPages} onClick={() => pushCatalogState({ page: Math.min(totalPages, page + 1) })}>Sau</button>
            </div>
          </div>
        </section>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden">
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-950">Bộ lọc sản phẩm</h2>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <ProductFilters
              products={products}
              categoryOptions={categoryOptions}
              brandOptions={brandOptions}
              filters={filters}
              onToggle={toggleFilter}
              onPriceChange={updatePrice}
              onClear={clearFilters}
              onApply={() => setMobileFiltersOpen(false)}
            />
          </div>
        </div>
      ) : null}

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
