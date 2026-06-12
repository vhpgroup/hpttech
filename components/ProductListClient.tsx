"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  Filter,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import QuoteButton from "@/components/quote/QuoteButton";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductQuickInfoTrigger } from "@/components/home/HomeCategoryCarouselsClient";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

type ProductListClientProps = {
  products: CatalogProduct[];
};

type MultiFilterKey = "categories" | "brands" | "scanSpeeds" | "duplex" | "adf" | "connectivity" | "paperSizes";

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

const CATEGORY_OPTIONS: FilterOption[] = [
  { label: "Máy scan", value: "may-scan" },
  { label: "Máy in", value: "may-in" },
  { label: "Photocopy", value: "photocopy" },
];

const BRAND_OPTIONS = ["Brother", "Ricoh", "Epson", "HP", "Canon", "Fujitsu"];

const SCAN_SPEED_OPTIONS: FilterOption[] = [
  { label: "Dưới 30 trang/phút", value: "under-30" },
  { label: "30-40 trang/phút", value: "30-40" },
  { label: "40-60 trang/phút", value: "40-60" },
  { label: "Trên 60 trang/phút", value: "over-60" },
];

const DUPLEX_OPTIONS: FilterOption[] = [
  { label: "Có", value: "yes" },
  { label: "Không", value: "no" },
];

const ADF_OPTIONS: FilterOption[] = [
  { label: "50 tờ", value: "50" },
  { label: "60 tờ", value: "60" },
  { label: "80 tờ", value: "80" },
  { label: "Trên 100 tờ", value: "over-100" },
];

const CONNECTIVITY_OPTIONS: FilterOption[] = [
  { label: "USB", value: "usb" },
  { label: "LAN", value: "lan" },
  { label: "WiFi", value: "wifi" },
];

const PAPER_OPTIONS: FilterOption[] = [
  { label: "A4", value: "a4" },
  { label: "A3", value: "a3" },
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

function parsePrice(value?: string) {
  const digits = value?.replace(/[^\d]/g, "") || "";
  return digits ? Number(digits) : undefined;
}

function formatVND(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

function firstNumber(value?: string) {
  const match = normalizeText(value).match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(",", ".")) : undefined;
}

function productHref(product: CatalogProduct) {
  return product.slug ? `/san-pham/${product.slug}` : product.href || "/san-pham";
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
    findSpecValue(product, ["Tốc độ scan", "Tốc độ quét"]) ||
    (normalizeText(product.category).includes("scan") ? findSpecValue(product, ["Tốc độ"]) : undefined);
  return firstNumber(value);
}

function adfSheets(product: CatalogProduct) {
  return firstNumber(findSpecValue(product, ["Sức chứa ADF", "ADF", "Khay ADF"]));
}

function productCategoryBucket(product: CatalogProduct) {
  const text = normalizeText(`${product.category || ""} ${product.title || ""}`);
  if (text.includes("scan")) return "may-scan";
  if (text.includes("photocopy") || text.includes("photo") || text.includes("copy")) return "photocopy";
  if (text.includes("may in") || text.includes("printer") || text.includes("laserjet")) return "may-in";
  return "";
}

function hasDuplex(product: CatalogProduct) {
  const text = specHaystack(product);
  const mentionsDuplex = text.includes("duplex") || text.includes("2 mat") || text.includes("hai mat");
  if (!mentionsDuplex) return undefined;
  if (text.includes("khong") || text.includes("không")) return "no";
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

function productSearchText(product: CatalogProduct) {
  return normalizeText([
    product.title,
    product.sku,
    product.brand,
    product.category,
    product.detail,
    (product.specs || []).map((spec) => `${spec.label} ${spec.value}`).join(" "),
  ].join(" "));
}

function productMatchesFilters(product: CatalogProduct, filters: Filters) {
  const price = parsePrice(product.price);
  const min = Number(filters.priceMin || 0);
  const max = Number(filters.priceMax || 0);

  if (filters.categories.length && !filters.categories.includes(productCategoryBucket(product))) return false;
  if (filters.brands.length && !filters.brands.includes(product.brand || "")) return false;
  if (filters.scanSpeeds.length && !filters.scanSpeeds.some((value) => matchesScanSpeed(product, value))) return false;
  if (filters.duplex.length && !filters.duplex.includes(hasDuplex(product) || "")) return false;
  if (filters.adf.length && !filters.adf.some((value) => matchesAdf(product, value))) return false;
  if (filters.connectivity.length && !filters.connectivity.some((value) => matchesConnectivity(product, value))) return false;
  if (filters.paperSizes.length && !filters.paperSizes.some((value) => matchesPaper(product, value))) return false;
  if (min > 0 && (!price || price < min)) return false;
  if (max > 0 && (!price || price > max)) return false;

  return true;
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

function initialFiltersFromParams(searchParams: URLSearchParams): Filters {
  const category = cleanFilterValue(searchParams.get("category"));
  const brand = cleanFilterValue(searchParams.get("brand"));
  const categoryValue = CATEGORY_OPTIONS.find((option) => option.label === category || option.value === category)?.value;

  return {
    categories: categoryValue ? [categoryValue] : [],
    brands: brand ? [brand] : [],
    scanSpeeds: [],
    duplex: [],
    adf: [],
    connectivity: [],
    paperSizes: [],
    priceMin: "",
    priceMax: "",
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

function removeValue(values: string[], value: string) {
  return values.filter((item) => item !== value);
}

function pickSpecChips(product: CatalogProduct) {
  const chips: string[] = [];
  const speed = scanSpeed(product);
  const adf = adfSheets(product);
  const duplex = hasDuplex(product);
  const connectivity = findSpecValue(product, ["Kết nối"]);

  if (speed !== undefined) chips.push(`${speed} trang/phút`);
  if (adf !== undefined) chips.push(`ADF ${adf} tờ`);
  if (duplex === "yes") chips.push("Duplex");
  if (connectivity) chips.push(connectivity.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 2).join(" + "));

  for (const spec of product.specs || []) {
    if (chips.length >= 4) break;
    const value = spec.value?.trim();
    if (value && !chips.includes(value)) chips.push(value);
  }

  return chips.slice(0, 4);
}

function productBadges(product: CatalogProduct) {
  const badges: Array<{ label: string; className: string }> = [];
  if ((product.reviewCount || 0) >= 20 || normalizeText(product.tag).includes("noi bat")) {
    badges.push({ label: "Bán chạy", className: "bg-[#0A4BFF] text-white" });
  }
  if (product.discountBadge || product.promoText) {
    badges.push({ label: "Khuyến mãi", className: "bg-red-600 text-white" });
  }
  if (!badges.length && product.tag) {
    badges.push({ label: product.tag, className: "bg-emerald-500 text-white" });
  }
  return badges.slice(0, 2);
}

function sortProducts(products: CatalogProduct[], sort: SortValue) {
  const ranked = [...products];
  ranked.sort((a, b) => {
    if (sort === "price-asc") return (parsePrice(a.price) ?? Number.MAX_SAFE_INTEGER) - (parsePrice(b.price) ?? Number.MAX_SAFE_INTEGER);
    if (sort === "price-desc") return (parsePrice(b.price) ?? 0) - (parsePrice(a.price) ?? 0);
    if (sort === "popular") return (b.reviewCount || 0) - (a.reviewCount || 0);
    if (sort === "newest") return String(b.id || "").localeCompare(String(a.id || ""), "vi");
    return (b.reviewCount || 0) - (a.reviewCount || 0) || (parsePrice(b.price) ?? 0) - (parsePrice(a.price) ?? 0);
  });
  return ranked;
}

function ProductRating({ rating = 0, reviewCount = 0 }: { rating?: number; reviewCount?: number }) {
  const score = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`${score} trên 5 sao`}>
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            size={14}
            className={index + 1 <= Math.round(score) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
            strokeWidth={1.5}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500">({reviewCount || 0})</span>
    </div>
  );
}

function ModernProductCard({
  product,
  selected,
  onToggleCompare,
}: {
  product: CatalogProduct;
  selected: boolean;
  onToggleCompare: (product: CatalogProduct) => void;
}) {
  const href = productHref(product);
  const image = product.images?.[0]?.url || product.image;
  const price = product.price || "Liên hệ";
  const chips = pickSpecChips(product);
  const badges = productBadges(product);

  return (
    <article className="group flex min-h-[468px] flex-col rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-100 hover:shadow-[0_22px_46px_-28px_rgba(15,23,42,0.35)]">
      <Link href={href} className="relative grid h-48 place-items-center overflow-hidden rounded-lg bg-slate-50 p-4">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {badges.map((badge) => (
            <span key={badge.label} className={cn("rounded-full px-2.5 py-1 text-[10px] font-extrabold", badge.className)}>
              {badge.label}
            </span>
          ))}
        </div>
        {image ? (
          <Image
            src={image}
            alt={product.title}
            width={300}
            height={220}
            className="max-h-40 w-auto object-contain transition duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 260px"
          />
        ) : (
          <div className="h-28 w-full rounded-lg bg-slate-100" />
        )}
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="line-clamp-2 min-h-[44px] text-[15px] font-bold leading-6 text-slate-950">
          <Link href={href} className="hover:text-[#0A4BFF]">
            {product.title}
          </Link>
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {chips.map((chip) => (
            <span key={chip} className="truncate rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-3">
          <ProductRating rating={product.rating} reviewCount={product.reviewCount} />
        </div>

        <div className="mt-3 min-h-[54px]">
          {product.compareAtPrice ? <p className="text-sm font-medium text-slate-400 line-through">{product.compareAtPrice}</p> : null}
          <p className="text-[22px] font-extrabold leading-8 text-red-600">{price}</p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
          <QuoteButton
            product={product}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0A4BFF] px-3 text-xs font-bold text-white transition hover:bg-blue-700"
          />
          <button
            type="button"
            onClick={() => onToggleCompare(product)}
            className={cn(
              "h-10 rounded-lg border px-3 text-xs font-bold transition",
              selected
                ? "border-[#0A4BFF] bg-blue-50 text-[#0A4BFF]"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-[#0A4BFF]",
            )}
          >
            {selected ? "Đã chọn" : "So sánh"}
          </button>
        </div>
      </div>
    </article>
  );
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
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
  filters,
  onToggle,
  onPriceChange,
  onClear,
  onApply,
}: {
  products: CatalogProduct[];
  filters: Filters;
  onToggle: (key: MultiFilterKey, value: string) => void;
  onPriceChange: (key: "priceMin" | "priceMax", value: string) => void;
  onClear: () => void;
  onApply?: () => void;
}) {
  const brandOptions = Array.from(new Set([...BRAND_OPTIONS, ...products.map((item) => item.brand).filter((brand): brand is string => Boolean(brand))]))
    .sort((a, b) => a.localeCompare(b, "vi"))
    .map((brand) => ({ label: brand, value: brand, count: countOption(products, "brands", brand) }));
  const categoryOptions = CATEGORY_OPTIONS.map((option) => ({ ...option, count: countOption(products, "categories", option.value) }));
  const scanSpeedOptions = SCAN_SPEED_OPTIONS.map((option) => ({ ...option, count: countOption(products, "scanSpeeds", option.value) }));
  const duplexOptions = DUPLEX_OPTIONS.map((option) => ({ ...option, count: countOption(products, "duplex", option.value) }));
  const adfOptions = ADF_OPTIONS.map((option) => ({ ...option, count: countOption(products, "adf", option.value) }));
  const connectivityOptions = CONNECTIVITY_OPTIONS.map((option) => ({ ...option, count: countOption(products, "connectivity", option.value) }));
  const paperOptions = PAPER_OPTIONS.map((option) => ({ ...option, count: countOption(products, "paperSizes", option.value) }));

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

      <FilterSection title="Danh mục">{renderOptions("categories", categoryOptions)}</FilterSection>
      <FilterSection title="Thương hiệu">{renderOptions("brands", brandOptions)}</FilterSection>
      <FilterSection title="Tốc độ scan">{renderOptions("scanSpeeds", scanSpeedOptions)}</FilterSection>
      <FilterSection title="Scan hai mặt">{renderOptions("duplex", duplexOptions)}</FilterSection>
      <FilterSection title="Khay nạp ADF">{renderOptions("adf", adfOptions)}</FilterSection>
      <FilterSection title="Kết nối">{renderOptions("connectivity", connectivityOptions)}</FilterSection>
      <FilterSection title="Khổ giấy">{renderOptions("paperSizes", paperOptions)}</FilterSection>

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
              placeholder="50.000.000"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#0A4BFF]"
            />
          </label>
        </div>
      </FilterSection>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onClear} className="h-10 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50">
          Xóa tất cả
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

export default function ProductListClient({ products }: ProductListClientProps) {
  const searchParams = useSearchParams();
  const safeSearchParams = searchParams ?? new URLSearchParams();
  const queryKey = safeSearchParams.toString();
  const initialFilters = {
    search: cleanFilterValue(safeSearchParams.get("search")),
    filters: initialFiltersFromParams(safeSearchParams),
  };

  return <ProductListInner key={queryKey} products={products} initialSearch={initialFilters.search} initialFilters={initialFilters.filters} />;
}

function ProductListInner({
  products,
  initialSearch,
  initialFilters,
}: ProductListClientProps & {
  initialSearch: string;
  initialFilters: Filters;
}) {
  const [query, setQuery] = useState(initialSearch);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [sort, setSort] = useState<SortValue>("best");
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [compareProducts, setCompareProducts] = useState<CatalogProduct[]>([]);

  const filteredProducts = useMemo(() => {
    const q = normalizeText(query.trim());
    const matched = products.filter((product) => {
      const matchesQuery = !q || productSearchText(product).includes(q);
      return matchesQuery && productMatchesFilters(product, filters);
    });
    return sortProducts(matched, sort);
  }, [filters, products, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const visibleProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = activeFilterCount(filters);

  const updateFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const toggleFilter = (key: MultiFilterKey, value: string) => {
    updateFilter(() => {
      setFilters((current) => {
        const exists = current[key].includes(value);
        return {
          ...current,
          [key]: exists ? current[key].filter((item) => item !== value) : [...current[key], value],
        };
      });
    });
  };

  const updatePrice = (key: "priceMin" | "priceMax", value: string) => {
    updateFilter(() => setFilters((current) => ({ ...current, [key]: value.replace(/[^\d]/g, "") })));
  };

  const clearFilters = () => {
    setFilters(emptyFilters());
    setQuery("");
    setPage(1);
  };

  const removeChip = (key: MultiFilterKey, value: string) => {
    updateFilter(() => setFilters((current) => ({ ...current, [key]: removeValue(current[key], value) })));
  };

  const toggleCompare = (product: CatalogProduct) => {
    setCompareProducts((current) => {
      const key = productKey(product);
      if (current.some((item) => productKey(item) === key)) return current.filter((item) => productKey(item) !== key);
      return [...current, product].slice(0, 4);
    });
  };

  const selectedKeys = new Set(compareProducts.map(productKey));

  return (
    <main className="subpage-main bg-slate-50/70 pb-28">
      <SubpageHeader
        eyebrow="Catalog thiết bị"
        title="Sản phẩm"
        description="Danh mục máy scan, máy in và thiết bị văn phòng cho doanh nghiệp."
        badge={`${filteredProducts.length} sản phẩm`}
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
                  onChange={(event) => updateFilter(() => setQuery(event.target.value))}
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
                    onChange={(event) => updateFilter(() => setSort(event.target.value as SortValue))}
                  >
                    {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>Sắp xếp: {option.label}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {activeCount || query.trim() ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-slate-700">Đang lọc:</span>
                {query.trim() ? (
                  <button type="button" onClick={() => updateFilter(() => setQuery(""))} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                    {query.trim()} <X size={14} />
                  </button>
                ) : null}
                {filters.categories.map((value) => (
                  <button key={value} type="button" onClick={() => removeChip("categories", value)} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
                    {CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value} <X size={14} />
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
                {(filters.priceMin || filters.priceMax) ? (
                  <button type="button" onClick={() => updateFilter(() => setFilters((current) => ({ ...current, priceMin: "", priceMax: "" })))} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 font-bold text-[#0A4BFF]">
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
            {visibleProducts.length ? visibleProducts.map((product) => (
              <ProductQuickInfoTrigger key={productKey(product)} product={product}>
                <ModernProductCard
                  product={product}
                  selected={selectedKeys.has(productKey(product))}
                  onToggleCompare={toggleCompare}
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
              <button className="rounded-lg border border-slate-200 px-4 py-2 font-bold disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Trước</button>
              <button className="rounded-lg border border-slate-200 px-4 py-2 font-bold disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Sau</button>
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
