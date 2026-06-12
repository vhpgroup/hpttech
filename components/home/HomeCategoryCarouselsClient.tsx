"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Tag,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

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

type ProductInfoPopup = {
  product: CatalogProduct;
  anchor: DOMRect;
};

const ProductPopupContext = createContext<{
  showPopup: (product: CatalogProduct, anchor: DOMRect) => void;
  hidePopup: () => void;
} | null>(null);

const HOME_CATEGORY_SECTIONS: HomeCategorySectionConfig[] = [
  {
    id: "scanner",
    title: "Máy scan",
    categoryParam: "may-scan",
    enabled: true,
    order: 1,
    tabMode: "brand",
    autoplay: true,
    match: (product) => normalizeText(`${product.productType} ${product.category} ${product.title}`).includes("scan"),
  },
  {
    id: "printer",
    title: "Máy in",
    categoryParam: "may-in",
    enabled: true,
    order: 2,
    tabMode: "brand",
    autoplay: true,
    match: (product) => {
      const text = normalizeText(`${product.productType} ${product.category} ${product.title}`);
      return text.includes("printer") || text.includes("may in") || text.includes("laserjet");
    },
  },
  {
    id: "photocopier",
    title: "Máy photocopy",
    categoryParam: "photocopy",
    enabled: true,
    order: 3,
    tabMode: "brand",
    autoplay: true,
    match: (product) => {
      const text = normalizeText(`${product.productType} ${product.category} ${product.title}`);
      return text.includes("photocop") || text.includes("copier") || text.includes("may photo");
    },
  },
];

function normalizeText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function productKey(product: CatalogProduct) {
  return String(product.id || product.slug || product.sku || product.title);
}

function popupSpecs(product: CatalogProduct) {
  return (product.specs || [])
    .filter((spec) => spec.label.trim() && spec.value.trim())
    .slice(0, 5);
}

export function ProductInfoPopupLayer({ children }: { children: ReactNode }) {
  const [popup, setPopup] = useState<ProductInfoPopup | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const value = useMemo(
    () => ({
      showPopup: (product: CatalogProduct, anchor: DOMRect) => setPopup({ product, anchor }),
      hidePopup: () => setPopup(null),
    }),
    [],
  );

  return (
    <ProductPopupContext.Provider value={value}>
      {children}
      {mounted && popup
        ? createPortal(
            <ProductInfoPopupCard popup={popup} />,
            document.body,
          )
        : null}
    </ProductPopupContext.Provider>
  );
}

function ProductInfoPopupCard({ popup }: { popup: ProductInfoPopup }) {
  const { product, anchor } = popup;
  const specs = popupSpecs(product);
  const popupWidth = 360;
  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 900 : window.innerHeight;
  const openLeft = anchor.right + popupWidth + 16 > viewportWidth;
  const left = openLeft
    ? Math.max(12, anchor.left - popupWidth - 12)
    : Math.min(viewportWidth - popupWidth - 12, anchor.right + 12);
  const top = Math.max(12, Math.min(anchor.top, viewportHeight - 490));

  return (
    <aside
      className="pointer-events-none fixed z-[95] hidden w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-800 shadow-2xl md:block"
      style={{ left, top }}
      aria-label={`Thông tin nhanh ${product.title}`}
    >
      <header className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-base font-black leading-6 text-slate-900">{product.title}</h3>
      </header>

      {product.promoText ? (
        <section className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center gap-2 text-sm font-black text-red-600">
            <span className="flex items-center gap-2">
              <Gift size={17} />
              Khuyến mãi
            </span>
          </div>
          <div className="mt-2 text-sm leading-5 text-red-700">
            <p className="font-semibold">{product.promoText}</p>
          </div>
        </section>
      ) : null}

      {specs.length ? (
        <ul className="space-y-2 px-4 py-4 text-sm leading-5">
          {specs.map((spec) => (
            <li key={`${spec.label}-${spec.value}`} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#0A4BFF]" />
              <span>
                <strong>{spec.label}:</strong> {spec.value}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <footer className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-3">
        <div>
          {product.compareAtPrice ? (
            <p className="text-sm text-slate-400">
              Giá niêm yết: <span className="line-through">{product.compareAtPrice}</span>
            </p>
          ) : null}
          <p className="mt-1 text-sm font-semibold text-slate-700">
            Giá bán: <strong className="text-xl text-red-600">{product.price || "Liên hệ"}</strong>
          </p>
        </div>
        {product.discountBadge ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 text-sm font-black text-white">
            <Tag size={15} />
            {product.discountBadge}
          </span>
        ) : null}
      </footer>
    </aside>
  );
}

export function QuickInfoProductCard({
  product,
  onCompare,
}: {
  product: CatalogProduct;
  onCompare?: (product: CatalogProduct) => void;
}) {
  return (
    <ProductQuickInfoTrigger product={product}>
      <ProductCard
        product={product}
        onCompare={onCompare}
        className="h-full home-category-product-card"
      />
    </ProductQuickInfoTrigger>
  );
}

export function ProductQuickInfoTrigger({
  product,
  children,
  className = "relative h-full",
}: {
  product: CatalogProduct;
  children: ReactNode;
  className?: string;
}) {
  const popupContext = useContext(ProductPopupContext);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const show = () => {
    if (!wrapperRef.current) return;
    popupContext?.showPopup(product, wrapperRef.current.getBoundingClientRect());
  };

  return (
    <div
      ref={wrapperRef}
      className={className}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") show();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") popupContext?.hidePopup();
      }}
    >
      {children}
    </div>
  );
}

function availableTabs(config: HomeCategorySectionConfig, products: CatalogProduct[]) {
  if (config.tabMode === "none") return [];
  const values = products
    .map((product) => (config.tabMode === "brand" ? product.brand : product.category))
    .filter((value): value is string => Boolean(value?.trim()));
  const unique = Array.from(new Set(values));
  if (!config.selectedTabs?.length) return unique;
  return config.selectedTabs.filter((tab) => unique.includes(tab));
}

const BRAND_COLORS: Record<string, string> = {
  Brother: "#0067b1",
  Canon: "#cc0000",
  Epson: "#003399",
  Fujitsu: "#e60012",
  HP: "#0096d6",
  Kodak: "#d89a00",
  Pantum: "#e53935",
  Ricoh: "#d71920",
  Sharp: "#e60012",
  Toshiba: "#e31b23",
  Xerox: "#d9222a",
  "Konica Minolta": "#009fe3",
};

function brandButtonStyle(brand: string) {
  return { "--brand-color": BRAND_COLORS[brand] || "#31527c" } as CSSProperties;
}

function HomeCategoryCarousel({
  config,
  products,
}: {
  config: HomeCategorySectionConfig;
  products: CatalogProduct[];
}) {
  const allProducts = useMemo(() => products.filter(config.match), [config, products]);
  const tabs = useMemo(() => availableTabs(config, allProducts), [allProducts, config]);
  const [activeTab, setActiveTab] = useState("all");
  const [paused, setPaused] = useState(false);
  const [showAllTabs, setShowAllTabs] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const autoplayStartedRef = useRef(false);
  const visibleTabs = showAllTabs ? tabs : tabs.slice(0, 5);

  const visibleProducts = useMemo(() => {
    if (activeTab === "all") return allProducts;
    return allProducts.filter((product) =>
      config.tabMode === "brand" ? product.brand === activeTab : product.category === activeTab,
    );
  }, [activeTab, allProducts, config.tabMode]);
  const shouldLoop = !mobile && visibleProducts.length > 4;
  const renderedProducts = shouldLoop ? [...visibleProducts, ...visibleProducts] : visibleProducts;

  useEffect(() => {
    const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMedia = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setReducedMotion(motionMedia.matches);
      setMobile(mobileMedia.matches);
    };
    sync();
    motionMedia.addEventListener("change", sync);
    mobileMedia.addEventListener("change", sync);
    return () => {
      motionMedia.removeEventListener("change", sync);
      mobileMedia.removeEventListener("change", sync);
    };
  }, []);

  const updateCanScroll = useCallback(() => {
    const rail = railRef.current;
    setCanScroll(Boolean(rail && rail.scrollWidth > rail.clientWidth + 8));
  }, []);

  useEffect(() => {
    updateCanScroll();
    window.addEventListener("resize", updateCanScroll);
    return () => window.removeEventListener("resize", updateCanScroll);
  }, [updateCanScroll, visibleProducts.length]);

  const move = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-carousel-card]");
    const step = card ? card.offsetWidth + 16 : rail.clientWidth;
    const loopSize = shouldLoop ? visibleProducts.length * step : 0;
    const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    const atStart = rail.scrollLeft <= 8;

    const continueAfterJump = (left: number) => {
      rail.style.scrollBehavior = "auto";
      rail.style.scrollSnapType = "none";
      rail.scrollTo({ left, behavior: "auto" });
      void rail.offsetWidth;
      window.requestAnimationFrame(() => {
        rail.style.scrollBehavior = "";
        rail.style.scrollSnapType = "";
        window.requestAnimationFrame(() => {
          rail.scrollBy({ left: direction * step, behavior: "smooth" });
        });
      });
    };

    if (shouldLoop && direction === -1 && atStart) {
      continueAfterJump(loopSize);
      return;
    }
    if (shouldLoop) {
      rail.scrollBy({ left: direction * step, behavior: "smooth" });
      if (direction === 1) {
        window.setTimeout(() => {
          if (!rail.isConnected || rail.scrollLeft < loopSize - step / 2) return;
          rail.style.scrollBehavior = "auto";
          rail.style.scrollSnapType = "none";
          rail.style.overflowX = "hidden";
          rail.scrollLeft -= loopSize;
          void rail.offsetWidth;
          window.requestAnimationFrame(() => {
            rail.style.scrollBehavior = "";
            rail.style.scrollSnapType = "";
            rail.style.overflowX = "";
          });
        }, 900);
      }
      return;
    }

    if (direction === 1 && atEnd) {
      rail.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction === -1 && atStart) {
      rail.scrollTo({ left: rail.scrollWidth, behavior: "smooth" });
      return;
    }
    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  }, [shouldLoop, visibleProducts.length]);

  useEffect(() => {
    if (!config.autoplay || paused || mobile || reducedMotion || !canScroll) return;

    let interval: number | undefined;
    const initialOffset = autoplayStartedRef.current ? 0 : (config.order - 1) * 700;
    const timeout = window.setTimeout(() => {
      move(1);
      autoplayStartedRef.current = true;
      interval = window.setInterval(() => move(1), 2_000);
    }, 2_000 + initialOffset);

    return () => {
      window.clearTimeout(timeout);
      if (interval) window.clearInterval(interval);
    };
  }, [canScroll, config.autoplay, config.order, mobile, move, paused, reducedMotion]);

  useEffect(() => {
    railRef.current?.scrollTo({ left: 0 });
    window.requestAnimationFrame(updateCanScroll);
  }, [activeTab, updateCanScroll]);

  if (!allProducts.length) return null;

  const selectTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <section
      className="home-category-section"
      aria-labelledby={`home-category-${config.id}`}
    >
      <div className="home-category-bar">
        <h2 id={`home-category-${config.id}`}>{config.title}</h2>
        {tabs.length ? (
          <div className="home-category-tabs" aria-label={`Lọc ${config.title}`}>
            <button
              type="button"
              className={activeTab === "all" ? "active" : ""}
              onClick={() => selectTab("all")}
            >
              Tất cả
            </button>
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`home-brand-tab ${activeTab === tab ? "active" : ""}`}
                style={brandButtonStyle(tab)}
                onClick={() => selectTab(tab)}
              >
                <span>{tab}</span>
              </button>
            ))}
            {tabs.length > 5 ? (
              <button
                type="button"
                className="home-category-tabs-more"
                onClick={() => setShowAllTabs((current) => !current)}
              >
                {showAllTabs ? "Thu gọn" : "Xem thêm"}
              </button>
            ) : null}
          </div>
        ) : null}
        <Link href={`/san-pham?category=${config.categoryParam}`} className="home-category-all">
          Xem tất cả
          <ChevronRight size={17} />
        </Link>
      </div>

      <div className="home-category-carousel">
        {canScroll ? (
          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow-prev"
            onClick={() => move(-1)}
            aria-label={`Xem sản phẩm ${config.title} trước`}
          >
            <ChevronLeft size={25} />
          </button>
        ) : null}

        <div ref={railRef} className="home-category-rail">
          {renderedProducts.map((product, index) => (
            <div
              key={`${productKey(product)}-${index >= visibleProducts.length ? "clone" : "original"}`}
              data-carousel-card
              aria-hidden={index >= visibleProducts.length}
              className="home-category-card"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
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
            className="home-carousel-arrow home-carousel-arrow-next"
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

export default function HomeCategoryCarouselsClient({ products }: { products: CatalogProduct[] }) {
  const sections = HOME_CATEGORY_SECTIONS.filter((section) => section.enabled).sort(
    (a, b) => a.order - b.order,
  );

  return (
    <div className="home-category-sections">
      {sections.map((section) => (
        <HomeCategoryCarousel key={section.id} config={section} products={products} />
      ))}
    </div>
  );
}
