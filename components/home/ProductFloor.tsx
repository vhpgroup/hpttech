"use client";

import { useState } from "react";
import { ArrowRight, Printer, ScanLine } from "lucide-react";
import { formatPrice, Product } from "@/lib/data";

interface ProductFloorProps {
  id: string;
  badge: string;
  title: string;
  category: string;
  brands: string[];
  promoImage: string;
  promoTitle: string;
  promoSubtitle: string;
  promoLink: string;
  products: Product[];
  compareList: Product[];
  onToggleCompare: (product: Product) => void;
  icon?: "printer" | "scanner";
}

export default function ProductFloor({
  id,
  badge,
  title,
  category,
  brands,
  promoImage,
  promoTitle,
  promoSubtitle,
  promoLink,
  products,
  compareList,
  onToggleCompare,
  icon = "printer",
}: ProductFloorProps) {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  // Filter products by category
  let floorProducts = products.filter((p) => p.category === category);
  
  // Filter by brand if a brand is selected
  if (activeBrand) {
    floorProducts = floorProducts.filter((p) => p.brand === activeBrand);
  }
  
  // Get max 8 products for the floor grid
  floorProducts = floorProducts.slice(0, 8);

  const getProductIcon = (product: Product) => {
    if (product.category === "Máy in") return <Printer size={14} className="category-icon" />;
    if (product.category === "Máy scan") return <ScanLine size={14} className="category-icon" />;
    return null;
  };

  return (
    <section className="product-floor" id={id}>
      <div className="floor-header">
        <h2>
          <span className="floor-badge">{badge}</span>
          {title}
        </h2>
        
        <div className="floor-actions">
          <div className="floor-filters">
            <button
              type="button"
              className={activeBrand === null ? "active" : ""}
              onClick={() => setActiveBrand(null)}
            >
              Tất cả
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                className={activeBrand === brand ? "active" : ""}
                onClick={() => setActiveBrand(brand)}
              >
                {brand}
              </button>
            ))}
          </div>
          <a href={`/san-pham?category=${encodeURIComponent(category)}`} className="floor-view-all">
            Xem tất cả <ArrowRight size={16} />
          </a>
        </div>
      </div>

      <div className="floor-body">
        <div className="floor-promo">
          <div className="floor-promo-inner">
            <div className="floor-promo-content">
              <h3>{promoTitle}</h3>
              <p>{promoSubtitle}</p>
              <a href={promoLink} className="promo-btn">
                Khám phá ngay <ArrowRight size={14} />
              </a>
            </div>
            <img src={promoImage} alt={promoTitle} />
          </div>
        </div>

        <div className="floor-products">
          {floorProducts.map((product) => {
            const comparing = compareList.some((p) => p.id === product.id);
            return (
              <article key={product.id} className="product-card floor-card">
                {product.tag ? <span className="product-tag">{product.tag}</span> : null}
                <a href={product.href} target="_blank" rel="noreferrer">
                  <img src={product.image} alt={product.title} />
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
                  <div className="product-price">{formatPrice(product.price)}</div>
                  <div className="product-actions">
                    <button
                      type="button"
                      className={`compare-card-btn ${comparing ? "active" : ""}`}
                      onClick={() => onToggleCompare(product)}
                    >
                      <span className="compare-card-label">{comparing ? "Đã chọn" : "So sánh"}</span>
                    </button>
                    <a
                      className="btn-action primary-btn"
                      href={`mailto:lienhe@hpttech.vn?subject=Yêu cầu báo giá ${product.title}`}
                    >
                      Nhận báo giá
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
          
          {floorProducts.length === 0 && (
            <div className="floor-empty">
              <p>Chưa có sản phẩm nào cho thương hiệu này.</p>
              <button className="btn-action" onClick={() => setActiveBrand(null)}>Xem tất cả</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
