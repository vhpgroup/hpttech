"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getProductBrands, getProductCategories, getProducts } from "@/lib/catalog";

const PAGE_SIZE = 12;

export default function ProductsPage() {
  return (
    <Suspense fallback={<main className="subpage-main">Đang tải catalog...</main>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const products = useMemo(() => getProducts(), []);
  const categories = useMemo(() => getProductCategories(), []);
  const brands = useMemo(() => getProductBrands(), []);
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialBrand = searchParams.get("brand") || "all";
  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : "all");
  const [brand, setBrand] = useState(brands.includes(initialBrand) ? initialBrand : "all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setQuery(initialSearch);
    setCategory(categories.includes(initialCategory) ? initialCategory : "all");
    setBrand(brands.includes(initialBrand) ? initialBrand : "all");
    setPage(1);
  }, [brands, categories, initialBrand, initialCategory, initialSearch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !q ||
        [product.title, product.detail, product.brand, product.category].join(" ").toLowerCase().includes(q);
      const matchesCategory = category === "all" || product.category === category;
      const matchesBrand = brand === "all" || product.brand === brand;
      return matchesQuery && matchesCategory && matchesBrand;
    });
  }, [brand, category, products, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const updateFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <main className="subpage-main">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Catalog thiết bị</p>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Sản phẩm</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Danh mục máy scan, máy in và thiết bị văn phòng. Hiện dùng dữ liệu seed, sẵn sàng đổi sang WordPress.
            </p>
          </div>
          <div className="text-sm font-semibold text-slate-600">{filtered.length} sản phẩm</div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
            <Search size={18} className="text-slate-500" />
            <input
              className="w-full bg-transparent text-sm outline-none"
              value={query}
              onChange={(event) => updateFilter(() => setQuery(event.target.value))}
              placeholder="Tìm sản phẩm, hãng, danh mục..."
              type="search"
            />
          </label>
          <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
            <Filter size={18} className="text-slate-500" />
            <select
              className="w-full bg-transparent text-sm outline-none"
              value={category}
              onChange={(event) => updateFilter(() => setCategory(event.target.value))}
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-11 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
            <select
              className="w-full bg-transparent text-sm outline-none"
              value={brand}
              onChange={(event) => updateFilter(() => setBrand(event.target.value))}
            >
              <option value="all">Tất cả thương hiệu</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <article key={product.slug} className="flex min-h-[360px] flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Link href={`/san-pham/${product.slug}`} className="grid h-40 place-items-center rounded-md bg-slate-50">
              <img className="max-h-36 object-contain" src={product.image} alt={product.title} />
            </Link>
            <div className="mt-4 flex flex-1 flex-col">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{product.brand}</p>
              <h2 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-slate-950">
                <Link href={`/san-pham/${product.slug}`}>{product.title}</Link>
              </h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{product.detail}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <strong className="text-sm text-orange-600">{product.price}</strong>
                <Link className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800" href={`/san-pham/${product.slug}`}>
                  Chi tiết
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      {visibleProducts.length ? null : (
        <section className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          Không tìm thấy sản phẩm phù hợp.
        </section>
      )}

      <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <span className="font-medium text-slate-600">
          Trang {page}/{totalPages}
        </span>
        <div className="flex gap-2">
          <button className="rounded-md border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Trước
          </button>
          <button className="rounded-md border border-slate-200 px-3 py-2 font-semibold disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
            Sau
          </button>
        </div>
      </div>
    </main>
  );
}
