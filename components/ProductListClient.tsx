"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import type { CatalogProduct } from "@/lib/catalog";

const PAGE_SIZE = 12;

type ProductListClientProps = {
  products: CatalogProduct[];
};

function initialSelectValue(value: string | undefined, options: string[]) {
  return value && options.includes(value) ? value : "all";
}

function cleanFilterValue(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 120) : "";
}

export default function ProductListClient({ products }: ProductListClientProps) {
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const initialFilters = {
    search: cleanFilterValue(searchParams.get("search")),
    category: cleanFilterValue(searchParams.get("category")),
    brand: cleanFilterValue(searchParams.get("brand")),
  };

  return <ProductListInner key={queryKey} products={products} initialFilters={initialFilters} />;
}

function ProductListInner({
  products,
  initialFilters,
}: ProductListClientProps & {
  initialFilters: {
    search: string;
    category: string;
    brand: string;
  };
}) {
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((item): item is string => Boolean(item)))).sort(),
    [products],
  );
  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter((item): item is string => Boolean(item)))).sort(),
    [products],
  );
  const [query, setQuery] = useState(initialFilters?.search || "");
  const [category, setCategory] = useState(() => initialSelectValue(initialFilters?.category, categories));
  const [brand, setBrand] = useState(() => initialSelectValue(initialFilters?.brand, brands));
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !q || [product.title, product.detail, product.brand, product.category].join(" ").toLowerCase().includes(q);
      const matchesCategory = category === "all" || product.category === category;
      const matchesBrand = brand === "all" || product.brand === brand;
      return matchesQuery && matchesCategory && matchesBrand;
    });
  }, [brand, category, products, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = Boolean(query.trim() || category !== "all" || brand !== "all");

  const updateFilter = (fn: () => void) => { fn(); setPage(1); };
  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setBrand("all");
    setPage(1);
  };

  return (
    <main className="subpage-main">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Catalog thiết bị</p>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Sản phẩm</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">Danh mục máy scan, máy in và thiết bị văn phòng.</p>
          </div>
          <div className="text-sm font-semibold text-slate-600">{filtered.length} sản phẩm</div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
            <input className="w-full bg-transparent text-sm outline-none" value={query} onChange={(e) => updateFilter(() => setQuery(e.target.value))} placeholder="Tìm sản phẩm, hãng, danh mục..." type="search" />
          </label>
          <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
            <select className="w-full bg-transparent text-sm outline-none" value={category} onChange={(e) => updateFilter(() => setCategory(e.target.value))}>
              <option value="all">Tất cả danh mục</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
            <select className="w-full bg-transparent text-sm outline-none" value={brand} onChange={(e) => updateFilter(() => setBrand(e.target.value))}>
              <option value="all">Tất cả thương hiệu</option>
              {brands.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
        {hasActiveFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>Đang lọc:</span>
            {query.trim() ? <b className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">Từ khóa: {query.trim()}</b> : null}
            {category !== "all" ? <b className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">Danh mục: {category}</b> : null}
            {brand !== "all" ? <b className="rounded-md bg-blue-50 px-2 py-1 text-blue-700">Thương hiệu: {brand}</b> : null}
            <button className="rounded-md border border-slate-200 px-2 py-1 font-semibold text-slate-700" type="button" onClick={clearFilters}>
              Xóa lọc
            </button>
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.length ? visibleProducts.map((product) => {
          const productImage = product.images?.[0]?.url || product.image;

          return (
          <article key={product.slug} className="flex min-h-[360px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Link href={`/san-pham/${product.slug}`} className="grid h-40 place-items-center rounded-md bg-slate-50">
              {productImage ? (
                <Image className="max-h-36 object-contain" src={productImage} alt={product.title} width={220} height={160} />
              ) : null}
            </Link>
            <div className="mt-4 flex flex-1 flex-col">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{product.brand}</p>
              <h2 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-slate-950"><Link href={`/san-pham/${product.slug}`}>{product.title}</Link></h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{product.detail}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <strong className="text-sm text-orange-600">{product.price}</strong>
                <div className="flex gap-2">
                  <AddToCartButton
                    product={product}
                    label="Thêm"
                    className="inline-flex items-center justify-center gap-1 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                  />
                  <Link className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800" href={`/san-pham/${product.slug}`}>Chi tiết</Link>
                </div>
              </div>
            </div>
          </article>
          );
        }) : (
          <div className="col-span-full rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            Không tìm thấy sản phẩm phù hợp. Hãy thử từ khóa hoặc bộ lọc khác.
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <span className="font-medium text-slate-600">Trang {page}/{totalPages}</span>
        <div className="flex gap-2">
          <button className="rounded-md border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
          <button className="rounded-md border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</button>
        </div>
      </div>
    </main>
  );
}
