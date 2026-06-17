"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { HPT_DATA } from "@/lib/data";
import type { CatalogProduct } from "@/lib/catalog";
import { QuickInfoProductCard } from "@/components/home/HomeCategoryCarouselsClient";

type HomeProductShowcaseClientProps = {
  products: CatalogProduct[];
  quoteEmail: string;
};

const HOME_FEATURED_PAGE_SIZE = 5;

export default function HomeProductShowcaseClient({ products }: HomeProductShowcaseClientProps) {
  const [activeProductTab, setActiveProductTab] = useState(HPT_DATA.productTabs[0] || "Noi bat");
  const [productSearch, setProductSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  const filteredProducts = useMemo(() => {
    const tabFiltered = (() => {
      if (activeProductTab === "Noi bat" || activeProductTab === "Nổi bật") {
        return products.filter((product) => product.tag);
      }
      if (activeProductTab === "May scan" || activeProductTab === "Máy scan") {
        return products.filter((product) => product.category === "Máy scan");
      }
      if (activeProductTab === "May in" || activeProductTab === "Máy in") {
        return products.filter((product) => product.category === "Máy in");
      }
      if (activeProductTab === "Thiet bi van phong" || activeProductTab === "Thiết bị văn phòng") {
        return products.filter((product) => product.category === "Máy in" || product.category === "Máy scan");
      }
      if (activeProductTab === "HP") return products.filter((product) => product.brand === "HP");
      if (activeProductTab === "Brother") return products.filter((product) => product.brand === "Brother");
      return products;
    })();

    const visibleTabProducts =
      (activeProductTab === "Noi bat" || activeProductTab === "Nổi bật") && tabFiltered.length === 0
        ? products
        : tabFiltered;
    const query = productSearch.trim().toLowerCase();
    if (!query) return visibleTabProducts;

    return visibleTabProducts.filter((product) =>
      [product.title, product.detail, product.brand, product.category].join(" ").toLowerCase().includes(query),
    );
  }, [activeProductTab, productSearch, products]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / HOME_FEATURED_PAGE_SIZE));
  const currentProducts = filteredProducts.slice(
    currentPage * HOME_FEATURED_PAGE_SIZE,
    (currentPage + 1) * HOME_FEATURED_PAGE_SIZE,
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [activeProductTab, productSearch]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages - 1));
  }, [totalPages]);

  const addToCompare = (product: CatalogProduct) => {
    window.dispatchEvent(new CustomEvent<CatalogProduct>("hpt:compare:add", { detail: product }));
  };

  return (
    <section className="products home-featured-products" id="products">
      <div className="section-head home-featured-bar">
        <h2>Sản phẩm nổi bật</h2>
        <div className="tabs" id="productTabs">
          {HPT_DATA.productTabs.map((tab) => (
            <button
              key={tab}
              className={activeProductTab === tab ? "active" : ""}
              type="button"
              onClick={() => setActiveProductTab(tab)}
              style={tab === "HP" ? { color: "#0096d6" } : tab === "Brother" ? { color: "#0067b1" } : undefined}
            >
              {tab}
            </button>
          ))}
        </div>
        <label className="product-search" aria-label="Tìm kiếm sản phẩm nổi bật">
          <Sparkles size={18} />
          <input
            value={productSearch}
            onChange={(event) => setProductSearch(event.target.value)}
            type="search"
            placeholder="Tìm sản phẩm..."
          />
        </label>
        <a href="/san-pham">
          Xem tất cả <ArrowRight size={16} />
        </a>
      </div>

      <div className="home-featured-grid grid gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" id="productGrid">
        {currentProducts.map((product) => (
          <QuickInfoProductCard key={product.slug || product.title} product={product} onCompare={addToCompare} />
        ))}
      </div>

      
    </section>
  );
}
