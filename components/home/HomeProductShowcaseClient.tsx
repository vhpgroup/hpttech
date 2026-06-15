"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { HPT_DATA } from "@/lib/data";
import type { CatalogProduct } from "@/lib/catalog";
import {
  HomeBarLightTrace,
  QuickInfoProductCard,
} from "@/components/home/HomeCategoryCarouselsClient";

type HomeProductShowcaseClientProps = {
  products: CatalogProduct[];
  quoteEmail: string;
};

export default function HomeProductShowcaseClient({ products }: HomeProductShowcaseClientProps) {
  const [activeProductTab, setActiveProductTab] = useState("Nổi bật");
  const filteredProducts = useMemo(() => {
    const tabFiltered = (() => {
      if (activeProductTab === "Nổi bật") return products.filter((product) => product.tag);
      if (activeProductTab === "Máy scan") return products.filter((product) => product.category === "Máy scan");
      if (activeProductTab === "Máy in") return products.filter((product) => product.category === "Máy in");
      if (activeProductTab === "Thiết bị văn phòng") {
        return products.filter((product) => product.category === "Máy in" || product.category === "Máy scan");
      }
      if (activeProductTab === "HP") return products.filter((product) => product.brand === "HP");
      if (activeProductTab === "Brother") return products.filter((product) => product.brand === "Brother");
      return products;
    })();

    return tabFiltered;
  }, [activeProductTab, products]);

  return (
    <section className="products home-featured-products" id="products">
      <div className="section-head home-featured-bar">
        <HomeBarLightTrace variant="featured" />
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
        <a href="/san-pham">
          Xem tất cả <ArrowRight size={16} />
        </a>
      </div>

      <div className="home-featured-grid grid gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" id="productGrid">
        {filteredProducts.slice(0, 8).map((product) => (
          <QuickInfoProductCard
            key={product.slug || product.title}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}
