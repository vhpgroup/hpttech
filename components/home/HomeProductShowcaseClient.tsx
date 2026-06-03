"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ArrowRight, Package, Printer, ScanLine, Sparkles } from "lucide-react";
import { HPT_DATA } from "@/lib/data";
import type { CatalogProduct } from "@/lib/catalog";
import { quoteMailHref } from "@/lib/site-settings";

const CompareDock = dynamic(() => import("@/components/home/CompareDock"), {
  ssr: false,
});

const COMPARE_LIMIT = 4;

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

function getProductIcon(product: CatalogProduct) {
  if (product.category === "Máy in") return <Printer size={16} />;
  if (product.category === "Máy scan") return <ScanLine size={16} />;
  return <Package size={16} />;
}

type HomeProductShowcaseClientProps = {
  products: CatalogProduct[];
  quoteEmail: string;
};

export default function HomeProductShowcaseClient({ products, quoteEmail }: HomeProductShowcaseClientProps) {
  const [activeProductTab, setActiveProductTab] = useState("Nổi bật");
  const [activeCompareList, setActiveCompareList] = useState<CatalogProduct[]>([]);
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

  const toggleCompare = (product: CatalogProduct) => {
    setActiveCompareList((prev) => {
      const key = productKey(product);
      const exists = prev.some((p) => productKey(p) === key);
      if (exists) return prev.filter((p) => productKey(p) !== key);
      if (prev.length >= COMPARE_LIMIT) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  };

  const addCompareProduct = (product: CatalogProduct) => {
    setActiveCompareList((prev) => {
      const key = productKey(product);
      const exists = prev.some((p) => productKey(p) === key);
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
              onChange={(e) => setProductSearch(e.target.value)}
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
            const comparing = activeCompareList.some((p) => productKey(p) === productKey(product));
            return (
              <article key={productKey(product)} className="product-card">
                {product.tag ? <span className="product-tag">{product.tag}</span> : null}
                <a href={product.href} target="_blank" rel="noreferrer">
                  {product.image ? (
                    <Image src={product.image} alt={product.title} width={260} height={180} />
                  ) : null}
                </a>
                <div className="product-meta">
                  <span className="product-brand">
                    {getProductIcon(product)} {product.brand}
                  </span>
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
                    <a className="btn-action primary-btn" href={quoteMailHref(quoteEmail, `Yêu cầu báo giá ${product.title}`)}>
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
        products={products}
        onAdd={addCompareProduct}
        onRemove={toggleCompare}
        onClear={() => setActiveCompareList([])}
      />
    </>
  );
}
