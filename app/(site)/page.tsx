"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Package,
  Printer,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
} from "lucide-react";
import { HPT_DATA } from "@/lib/data";
import { getProducts, type CatalogProduct } from "@/lib/catalog";
import CompareDock from "@/components/home/CompareDock";
import CategoryPanel from "@/components/home/CategoryPanel";

const COMPARE_LIMIT = 4;

function getProductIcon(product: CatalogProduct) {
  if (product.category === "Máy in") return <Printer size={16} />;
  if (product.category === "Máy scan") return <ScanLine size={16} />;
  return <Package size={16} />;
}

export default function HomePage() {
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeProductTab, setActiveProductTab] = useState("Nổi bật");
  const [activeCompareList, setActiveCompareList] = useState<CatalogProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const products = useMemo(() => getProducts(), []);

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

  const prevBanner = () => setActiveBanner((prev) => (prev === 0 ? HPT_DATA.banners.length - 1 : prev - 1));
  const nextBanner = () => setActiveBanner((prev) => (prev === HPT_DATA.banners.length - 1 ? 0 : prev + 1));

  const toggleCompare = (product: CatalogProduct) => {
    setActiveCompareList((prev) => {
      const exists = prev.some((p) => p.title === product.title);
      if (exists) return prev.filter((p) => p.title !== product.title);
      if (prev.length >= COMPARE_LIMIT) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  };

  const addCompareProduct = (product: CatalogProduct) => {
    setActiveCompareList((prev) => {
      const exists = prev.some((p) => p.title === product.title);
      if (exists) return prev;
      if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), product];
      return [...prev, product];
    });
  };

  return (
    <>
      <main>
        <section className="hero-section">
          <CategoryPanel />

          <div className="hero-commerce-area">
            <section className="hero hero-banner" aria-label="Banner HPT Tech">
              <button className="slider-btn prev" onClick={prevBanner} aria-label="Slide trước">
                <ChevronLeft size={24} />
              </button>

              <a className="hero-slide-link" href="https://hpttech.vn/" target="_blank" rel="noreferrer">
                <img id="heroBannerImage" src={HPT_DATA.banners[activeBanner]} alt="HPT Tech banner" />
              </a>

              <button className="slider-btn next" onClick={nextBanner} aria-label="Slide sau">
                <ChevronRight size={24} />
              </button>

              <div className="dots">
                {HPT_DATA.banners.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === activeBanner ? "active" : ""}`}
                    onClick={() => setActiveBanner(index)}
                    aria-label={`Đi tới slide ${index + 1}`}
                  />
                ))}
              </div>
            </section>

            <aside className="commercial-stack" aria-label="Ưu đãi nhanh">
              <a className="commercial-tile scanner" href="/san-pham">
                <img
                  className="commercial-tile-image"
                  src="/assets/commercial-blocks/scanner.jpg"
                  alt="Commercial block máy scan"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).hidden = true;
                  }}
                />
                <span className="commercial-products">Máy scan</span>
                <strong>Số hóa tài liệu</strong>
                <small>Ricoh, Fujitsu, Epson, Plustek cho văn phòng hiện đại</small>
              </a>
              <a className="commercial-tile printer" href="/san-pham">
                <img
                  className="commercial-tile-image"
                  src="/assets/commercial-blocks/printer.jpg"
                  alt="Commercial block máy in"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).hidden = true;
                  }}
                />
                <span className="commercial-products">Máy in</span>
                <strong>In ấn doanh nghiệp</strong>
                <small>HP, Brother, Epson, Kyocera chính hãng, dễ triển khai</small>
              </a>
            </aside>

            <section className="commercial-row" aria-label="Khuyến mãi thương mại HPT Tech">
              <a className="commercial-tile office" href="/san-pham">
                <img
                  className="commercial-tile-image"
                  src="/assets/commercial-blocks/office.jpg"
                  alt="Commercial block thiết bị văn phòng"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).hidden = true;
                  }}
                />
                <span className="commercial-products">Thiết bị văn phòng</span>
                <strong>Combo tối ưu chi phí</strong>
                <small>Tư vấn cấu hình theo quy mô đội nhóm</small>
              </a>
              <a className="commercial-tile solution" href="/giai-phap">
                <img
                  className="commercial-tile-image"
                  src="/assets/commercial-blocks/solution.jpg"
                  alt="Commercial block giải pháp"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).hidden = true;
                  }}
                />
                <span className="commercial-products">Giải pháp</span>
                <strong>Triển khai trọn gói</strong>
                <small>Hạ tầng, mạng, bảo mật và thiết bị đồng bộ</small>
              </a>
              <a className="commercial-tile service" href="/dich-vu">
                <img
                  className="commercial-tile-image"
                  src="/assets/commercial-blocks/service.jpg"
                  alt="Commercial block dịch vụ"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).hidden = true;
                  }}
                />
                <span className="commercial-products">Dịch vụ</span>
                <strong>Hỗ trợ tận nơi</strong>
                <small>Lắp đặt, bảo hành, bảo trì nhanh cho doanh nghiệp</small>
              </a>
            </section>
          </div>
        </section>

        <section className="trust-strip" aria-label="Cam kết dịch vụ HPT Tech">
          <article className="trust-item">
            <BadgeCheck size={18} />
            <span>100% chính hãng</span>
          </article>
          <article className="trust-item">
            <Sparkles size={18} />
            <span>Giá ưu đãi</span>
          </article>
          <article className="trust-item">
            <Truck size={18} />
            <span>Miễn phí vận chuyển</span>
          </article>
          <article className="trust-item">
            <ShieldCheck size={18} />
            <span>Bảo hành nơi sử dụng</span>
          </article>
          <article className="trust-item">
            <ArrowRight size={18} />
            <span>Đổi trả lên đến 30 ngày</span>
          </article>
          <article className="trust-item">
            <ShoppingCart size={18} />
            <span>Thanh toán linh hoạt</span>
          </article>
        </section>

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
              const comparing = activeCompareList.some((p) => p.title === product.title);
              return (
                <article key={product.title} className="product-card">
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

        <section className="brand-strip" id="brands">
          <h2>Đối tác công nghệ hàng đầu</h2>
          <div id="brandLogos">
            {HPT_DATA.brands.map((brand) => (
              <span key={brand.name}>
                <img src={brand.logo} alt={brand.name} loading="lazy" />
                <b>{brand.name}</b>
              </span>
            ))}
          </div>
        </section>

        <section className="solutions" id="solutions">
          <div className="solution-intro">
            <h2>Giải pháp doanh nghiệp</h2>
            <p>HPT Tech cung cấp các giải pháp công nghệ toàn diện, giúp doanh nghiệp tối ưu vận hành và bứt phá thành công.</p>
            <a href="https://hpttech.vn/aboutus/" target="_blank" rel="noreferrer">
              Xem tất cả giải pháp <ArrowRight size={16} />
            </a>
          </div>

          <div className="solution-grid" id="solutionGrid">
            {HPT_DATA.solutions.map((sol) => (
              <article key={sol.title} className="solution-card">
                <i data-lucide={sol.icon} />
                <h3>{sol.title}</h3>
                <p>{sol.description}</p>
                <a href="/giai-phap">
                  Xem chi tiết <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="news" id="news">
          <div className="section-head">
            <h2>Tin tức & tiêu điểm</h2>
            <a href="https://hpttech.vn/blog/" target="_blank" rel="noreferrer">
              Xem tất cả <ArrowRight size={16} />
            </a>
          </div>

          <div className="news-grid" id="newsGrid">
            {HPT_DATA.posts.map((post) => (
              <article key={post.title} className="post-card">
                <a href={post.href} target="_blank" rel="noreferrer">
                  <img src={post.image} alt={post.title} />
                </a>
                <div className="post-info">
                  <span className="post-date">{post.date}</span>
                  <h3>
                    <a href={post.href} target="_blank" rel="noreferrer">
                      {post.title}
                    </a>
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

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
