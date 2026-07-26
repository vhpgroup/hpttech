"use client";

import { ArrowRight } from "lucide-react";
import type { CatalogProduct } from "@/lib/catalog";
import { QuickInfoProductCard } from "@/components/home/HomeCategoryCarouselsClient";

type HomeProductShowcaseClientProps = {
  products: CatalogProduct[];
  quoteEmail: string;
};

const HOME_FEATURED_LIMIT = 10;

export default function HomeProductShowcaseClient({ products }: HomeProductShowcaseClientProps) {
  // Khu "Sản phẩm nổi bật": ưu tiên sản phẩm có tag (Nổi bật / Mới / Bán chạy…),
  // nếu chưa có thì lấy chung. Đã bỏ tab lọc + ô tìm kiếm theo yêu cầu.
  const featured = products.filter((product) => product.tag);
  const visibleProducts = (featured.length ? featured : products).slice(0, HOME_FEATURED_LIMIT);

  const addToCompare = (product: CatalogProduct) => {
    window.dispatchEvent(new CustomEvent<CatalogProduct>("hpt:compare:add", { detail: product }));
  };

  return (
    <section className="products home-featured-products" id="products">
      <div className="section-head home-featured-bar">
        <h2>Sản phẩm nổi bật</h2>
        <a href="/san-pham">
          Xem tất cả <ArrowRight size={16} />
        </a>
      </div>

      <div
        className="home-featured-grid grid gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        id="productGrid"
      >
        {visibleProducts.map((product) => (
          <QuickInfoProductCard key={product.slug || product.title} product={product} onCompare={addToCompare} />
        ))}
      </div>
    </section>
  );
}
