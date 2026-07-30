"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";
import { HOME_CATEGORY_SECTION_DEFS, isHomeDeviceType } from "@/lib/home-category-sections";
import { QuickInfoProductCard } from "@/components/product/ProductQuickInfoPopup";

type TabMode = "brand" | "category" | "none";

type HomeCategorySectionConfig = {
  id: string;
  title: string;
  categoryParam: string;
  enabled: boolean;
  order: number;
  tabMode: TabMode;
  selectedTabs?: string[];
  autoplay: boolean;
  match: (product: CatalogProduct) => boolean;
};

const HOME_CATEGORY_SECTIONS: HomeCategorySectionConfig[] = [
  {
    id: "scanner",
    title: "Máy scan",
    categoryParam: "may-scan",
    enabled: true,
    order: 1,
    tabMode: "none",
    autoplay: true,
    match: (product) => isHomeDeviceType(product, "scanner"),
  },
  {
    id: "printer",
    title: "Máy in",
    categoryParam: "may-in",
    enabled: true,
    order: 2,
    tabMode: "none",
    autoplay: true,
    match: (product) => isHomeDeviceType(product, "printer"),
  },
  {
    id: "photocopier",
    title: "Máy photocopy",
    categoryParam: "may-photocopy",
    enabled: true,
    order: 3,
    tabMode: "none",
    autoplay: true,
    match: (product) => isHomeDeviceType(product, "photocopier"),
  },
  // Khu danh mục bổ sung (laptop / PC-máy chủ / thiết bị mạng): lấy SP theo nhánh
  // danh mục ở server và gắn cờ homeSection, nên chỉ cần lọc theo cờ đó.
  ...HOME_CATEGORY_SECTION_DEFS.map((section, index) => ({
    id: section.id,
    title: section.title,
    categoryParam: section.categorySlug,
    enabled: true,
    order: 4 + index,
    tabMode: "none" as TabMode,
    autoplay: true,
    match: (product: CatalogProduct) => product.homeSection === section.id,
  })),
];

const HOME_CATEGORY_PRODUCT_LIMIT = 15;
const HOME_CATEGORY_PAGE_SIZE = 5;
const HOME_CATEGORY_CARD_GAP = 16;
const HOME_CATEGORY_AUTOPLAY_MS = 2500;

function productKey(product: CatalogProduct) {
  return String(product.id || product.slug || product.sku || product.title);
}

function loopProductsForCarousel(products: CatalogProduct[], cardsPerView: number) {
  if (products.length <= 1 || products.length > cardsPerView) return products;

  const targetCount = Math.max(cardsPerView + 1, products.length * 2);
  return Array.from({ length: targetCount }, (_, index) => products[index % products.length]);
}

// Tabs lọc thương hiệu/danh mục trong thanh section đã gỡ theo redesign 30/07
// (mọi section đều đặt tabMode: "none" nên trước đó đây là code chết không render).

function HomeCategoryCarousel({
  config,
  products,
}: {
  config: HomeCategorySectionConfig;
  products: CatalogProduct[];
}) {
  const allProducts = useMemo(() => products.filter(config.match), [config, products]);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(HOME_CATEGORY_PAGE_SIZE);
  const railRef = useRef<HTMLDivElement>(null);
  const autoplayStartedRef = useRef(false);
  const autoplayIntervalRef = useRef<number | null>(null);

  const visibleProducts = useMemo(
    () => allProducts.slice(0, HOME_CATEGORY_PRODUCT_LIMIT),
    [allProducts],
  );
  const carouselProducts = useMemo(
    () => loopProductsForCarousel(visibleProducts, cardsPerView),
    [cardsPerView, visibleProducts],
  );

  const canScroll = carouselProducts.length > cardsPerView;

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(motionMedia.matches);
    };
    sync();
    motionMedia.addEventListener("change", sync);
    return () => {
      motionMedia.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    const syncCardsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1280) {
        setCardsPerView(5);
        return;
      }
      if (width >= 1024) {
        setCardsPerView(3);
        return;
      }
      if (width >= 420) {
        setCardsPerView(2);
        return;
      }
      setCardsPerView(1);
    };

    syncCardsPerView();
    window.addEventListener("resize", syncCardsPerView);
    return () => window.removeEventListener("resize", syncCardsPerView);
  }, []);

  const clearSlideTimers = useCallback(() => {
    if (autoplayIntervalRef.current) {
      window.clearInterval(autoplayIntervalRef.current);
      autoplayIntervalRef.current = null;
    }
  }, []);

  const move = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail || !canScroll) return;
    const card = rail.querySelector<HTMLElement>("[data-carousel-card]");
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap || "16") || HOME_CATEGORY_CARD_GAP;
    const step = card ? card.offsetWidth + gap : rail.clientWidth;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    const nextLeft = rail.scrollLeft + direction * step;

    if (direction === 1 && nextLeft >= maxScroll - 8) {
      rail.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction === -1 && nextLeft <= 8) {
      rail.scrollTo({ left: maxScroll, behavior: "smooth" });
      return;
    }
    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  }, [canScroll]);

  useEffect(() => {
    clearSlideTimers();
    if (!config.autoplay || paused || reducedMotion || !canScroll) return;

    const initialOffset = autoplayStartedRef.current ? 0 : (config.order - 1) * 350;
    const timeout = window.setTimeout(() => {
      autoplayStartedRef.current = true;
      move(1);
      autoplayIntervalRef.current = window.setInterval(() => move(1), HOME_CATEGORY_AUTOPLAY_MS);
    }, HOME_CATEGORY_AUTOPLAY_MS + initialOffset);

    return () => {
      window.clearTimeout(timeout);
      clearSlideTimers();
    };
  }, [canScroll, clearSlideTimers, config.autoplay, config.order, move, paused, reducedMotion]);

  useEffect(() => {
    railRef.current?.scrollTo({ left: 0 });
  }, [carouselProducts.length]);

  useEffect(
    () => () => {
      clearSlideTimers();
    },
    [clearSlideTimers],
  );

  if (!allProducts.length) return null;

  return (
    <section className="home-category-section" aria-labelledby={`home-category-${config.id}`}>
      <div className={`home-category-bar ${paused ? "is-paused" : ""}`}>
        <h2 id={`home-category-${config.id}`}>{config.title}</h2>
        {/* Landing page rút gọn /<slug> của danh mục (kiểu An Phát) — cùng đích với
            menu Danh mục, thay cho trang lọc /san-pham?category=... trước đây. */}
        <Link href={`/${encodeURIComponent(config.categoryParam)}`} className="home-category-all">
          Xem tất cả
          <ChevronRight size={17} />
        </Link>
      </div>

      <div className="relative home-category-carousel">
        {canScroll ? (
          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow-prev absolute left-[-18px] top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-lg"
            onClick={() => move(-1)}
            aria-label={`Xem sản phẩm ${config.title} trước`}
          >
            <ChevronLeft size={25} />
          </button>
        ) : null}

        <div
          ref={railRef}
          className="home-category-rail"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {carouselProducts.map((product, index) => (
            <div
              key={`${productKey(product)}-${index}`}
              data-carousel-card
              className="home-category-card"
              onFocusCapture={() => setPaused(true)}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
              }}
            >
              <QuickInfoProductCard product={product} />
            </div>
          ))}
        </div>

        {canScroll ? (
          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow-next absolute right-[-18px] top-1/2 z-10 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-2 shadow-lg"
            onClick={() => move(1)}
            aria-label={`Xem sản phẩm ${config.title} tiếp theo`}
          >
            <ChevronRight size={25} />
          </button>
        ) : null}
      </div>
    </section>
  );
}

export default function HomeCategoryCarouselsClient({
  products,
  categorySectionProducts = [],
}: {
  products: CatalogProduct[];
  /**
   * Sản phẩm cho các khu danh mục bổ sung (laptop / PC-máy chủ / thiết bị mạng),
   * đã được gắn cờ homeSection ở server. Gộp chung để các khu lọc theo cờ.
   */
  categorySectionProducts?: CatalogProduct[];
}) {
  const productPool = useMemo(
    () => [...products, ...categorySectionProducts],
    [products, categorySectionProducts],
  );
  const sections = HOME_CATEGORY_SECTIONS.filter((section) => section.enabled).sort(
    (a, b) => a.order - b.order,
  );

  return (
    <div className="home-category-sections">
      {sections.map((section) => (
        <HomeCategoryCarousel key={section.id} config={section} products={productPool} />
      ))}
    </div>
  );
}
