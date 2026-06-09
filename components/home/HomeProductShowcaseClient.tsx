"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { HPT_DATA } from "@/lib/data";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

type HomeProductShowcaseClientProps = {
  products: CatalogProduct[];
  quoteEmail: string;
};

export default function HomeProductShowcaseClient({ products }: HomeProductShowcaseClientProps) {
  const [activeProductTab, setActiveProductTab] = useState("Nổi bật");
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const tabFiltered = (() => {
      if (activeProductTab === "Nổi bật") return products.filter((p) => p.tag);
      if (activeProductTab === "Máy scan") return products.filter((p) => p.category === "Máy scan");
      if (activeProductTab === "Máy in") return products.filter((p) => p.category === "Máy in");
      if (activeProductTab === "Thiết bị văn phòng") return products.filter((p) => p.category === "Máy in" || p.category === "Máy scan");
      if (activeProductTab === "HP") return products.filter((p) => p.brand === "HP");
      if (activeProductTab === "Brother") return products.filter((p) => p.brand === "Brother");
      return products;
    })();

    const q = productSearch.trim().toLowerCase();
    if (!q) return tabFiltered;

    return tabFiltered.filter((p) =>
      [p.title, p.detail, p.brand, p.category].join(" ").toLowerCase().includes(q)
    );
  }, [activeProductTab, productSearch, products]);

  const addToCompare = (product: CatalogProduct) => {
    window.dispatchEvent(new CustomEvent<CatalogProduct>("hpt:compare:add", { detail: product }));
  };

  return (
    <section className="products" id="products">
        <div className="section-head">
          <h2>Sản phẩm nổi bật</h2>
          <div className="tabs" id="productTabs">
            {HPT_DATA.productTabs.map((tab) => (
              <button
                key={tab}
                className={activeProductTab === tab ? "active" : ""}
                type="button"
                onClick={() => setActiveProductTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <label className="product-search" aria-label="Tìm kiếm sản phẩm nổi bật">
            <Sparkles size={18} />
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              type="search"
              placeholder="Tìm sản phẩm..."
            />
          </label>
          <a href="https://hpttech.vn/" target="_blank" rel="noreferrer">
            Xem tất cả <ArrowRight size={16} />
          </a>
        </div>

        <div className="grid gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" id="productGrid">
          {filteredProducts.slice(0, 10).map((product) => (
            <ProductCard key={productKey(product)} product={product} onCompare={addToCompare} />
          ))}
        </div>
      </section>
  );
}
