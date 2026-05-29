"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { HPT_DATA, Product } from "@/lib/data";
import CompareDock from "@/components/home/CompareDock";

const COMPARE_LIMIT = 4;

export default function FeaturedSection() {
  const [activeProductTab, setActiveProductTab] = useState("Nổi bật");
  const [activeCompareList, setActiveCompareList] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const tabFiltered = (() => {
      if (activeProductTab === "Nổi bật") return HPT_DATA.products.filter((p) => p.tag);
      if (activeProductTab === "Máy scan") return HPT_DATA.products.filter((p) => p.category === "Máy scan");
      if (activeProductTab === "Máy in") return HPT_DATA.products.filter((p) => p.category === "Máy in");
      if (activeProductTab === "Thiết bị văn phòng") {
        return HPT_DATA.products.filter((p) => p.category === "Máy in" || p.category === "Máy scan");
      }
      if (activeProductTab === "HP") return HPT_DATA.products.filter((p) => p.brand === "HP");
      if (activeProductTab === "Brother") return HPT_DATA.products.filter((p) => p.brand === "Brother");
      return HPT_DATA.products;
    })();

    const q = productSearch.trim().toLowerCase();
    if (!q) return tabFiltered;

    return tabFiltered.filter((p) =>
      [p.title, p.detail, p.brand, p.category].join(" ").toLowerCase().includes(q)
    );
  }, [activeProductTab, productSearch]);

  const toggleCompare = (product: Product) => {
    setActiveCompareList((prev) => {
      const exists = prev.some((p) => p.title === product.title);
      if (exists) return prev.filter((p) => p.title !== product.title);
      if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), product];
      return [...prev, product];
    });
  };

  const addCompareProduct = (product: Product) => {
    setActiveCompareList((prev) => {
      const exists = prev.some((p) => p.title === product.title);
      if (exists) return prev;
      if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), product];
      return [...prev, product];
    });
  };

  return (
    <>
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
              onChange={(event) => setProductSearch(event.target.value)}
              type="search"
              placeholder="Tìm sản phẩm..."
            />
          </label>
          <a href="https://hpttech.vn/" target="_blank" rel="noreferrer">
            Xem tất cả <ArrowRight size={16} />
          </a>
        </div>

        <div className="product-grid" id="productGrid">
          {filteredProducts.slice(0, 10).map((product) => {
            const comparing = activeCompareList.some((p) => p.title === product.title);
            return (
              <article key={product.title} className="product-card">
                {product.tag ? <span className="product-tag">{product.tag}</span> : null}
                <a href={product.href} target="_blank" rel="noreferrer">
                  <img src={product.image} alt={product.title} />
                </a>
                <div className="product-meta">
                  <span className="product-brand">{product.brand}</span>
                  <h3>
                    <a href={product.href} target="_blank" rel="noreferrer">
                      {product.title}
                    </a>
                  </h3>
                  <p>{product.detail}</p>
                  <div className="product-price">{product.price}</div>
                  <div className="product-actions">
                    <button
                      type="button"
                      className={`compare-card-btn ${comparing ? "active" : ""}`}
                      onClick={() => toggleCompare(product)}
                    >
                      <span className="compare-card-label">{comparing ? "Đã chọn" : "So sánh"}</span>
                    </button>
                    <a className="btn-action primary-btn" href={`mailto:lienhe@hpttech.vn?subject=Yêu cầu báo giá ${product.title}`}>
                      Nhận báo giá
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <CompareDock
        items={activeCompareList}
        products={HPT_DATA.products}
        onAdd={addCompareProduct}
        onRemove={toggleCompare}
        onClear={() => setActiveCompareList([])}
      />
    </>
  );
}
