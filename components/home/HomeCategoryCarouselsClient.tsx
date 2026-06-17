"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {  Check,
  ChevronLeft,
  ChevronRight,
  Gift} from "lucide-react";
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
  hidePopup: (immediate?: boolean) => void;
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
      const isPhotocopier = text.includes("photocop") || text.includes("copier") || text.includes("may photo");
      return !isPhotocopier && (text.includes("printer") || text.includes("may in") || text.includes("laserjet"));
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

const HOME_CATEGORY_PRODUCT_LIMIT = 15;
const HOME_CATEGORY_PAGE_SIZE = 5;
const HOME_CATEGORY_CARD_GAP = 16;
const HOME_CATEGORY_AUTOPLAY_MS = 2500;

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

function loopProductsForCarousel(products: CatalogProduct[], cardsPerView: number) {
  if (products.length <= 1 || products.length > cardsPerView) return products;

  const targetCount = Math.max(cardsPerView + 1, products.length * 2);
  return Array.from({ length: targetCount }, (_, index) => products[index % products.length]);
}

function popupSpecs(product: CatalogProduct) {
  const specs = product.specs ?? [];
  const preferred = [
    "cpu",
    "vga",
    "màn hình",
    "ram",
    "chức năng",
    "adf",
    "kết nối",
    "tốc độ",
    "độ phân giải",
  ];

  const selected = preferred
    .map((keyword) =>
      specs.find((spec) => normalizeText(spec.label).includes(normalizeText(keyword))),
    )
    .filter((item): item is { label: string; value: string } => Boolean(item));

  const seen = new Set<string>();
  const unique = selected.filter((item) => {
    const key = normalizeText(item.label);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length) return unique.slice(0, 4);
  return specs.slice(0, 4);
}

export function ProductInfoPopupLayer({ children }: { children: ReactNode }) {
  const [popup, setPopup] = useState<ProductInfoPopup | null>(null);
  const [mounted, setMounted] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setPopup(null), [pathname]);
  useEffect(
    () => () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    [],
  );

  const value = useMemo(
    () => ({
      showPopup: (product: CatalogProduct, anchor: DOMRect) => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        showTimerRef.current = setTimeout(() => setPopup({ product, anchor }), 250);
      },
      hidePopup: (immediate = false) => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (immediate) {
          setPopup(null);
          return;
        }
        hideTimerRef.current = setTimeout(() => setPopup(null), 120);
      },
    }),
    [],
  );

  return (
    <ProductPopupContext.Provider value={value}>
      {children}
      {mounted && popup
        ? createPortal(
            <ProductInfoPopupCard key={productKey(popup.product)} popup={popup} />,
            document.body,
          )
        : null}
    </ProductPopupContext.Provider>
  );
}

function ProductInfoPopupCard({ popup }: { popup: ProductInfoPopup }) {
  const { product, anchor } = popup;
  const promotions = product.promotions ?? [];
  const featuredPromotion = promotions[0];
  const promoItems = [
    ...(featuredPromotion?.benefits?.filter(Boolean) ?? []),
    ...(featuredPromotion?.description ? [featuredPromotion.description] : []),
  ].slice(0, 4);
  const quickSpecs = popupSpecs(product);
  const popupWidth = 390;
  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 900 : window.innerHeight;
  const openLeft = anchor.right + popupWidth + 16 > viewportWidth;
  const left = openLeft
    ? Math.max(12, anchor.left - popupWidth - 12)
    : Math.min(viewportWidth - popupWidth - 12, anchor.right + 12);
  const top = Math.max(12, Math.min(anchor.top, viewportHeight - 560));

  return (
    <aside
      className="pointer-events-none fixed z-[95] hidden w-[390px] animate-[popup-enter_180ms_ease-out] overflow-hidden rounded-[18px] border border-slate-200 bg-white text-slate-800 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] md:block"
      style={{ left, top }}
      aria-label={`Thông tin nhanh ${product.title}`}
    >
      <header className="bg-gradient-to-r from-[#2457e8] to-[#637cf5] px-4 py-3.5 text-white">
        <h3 className="text-[15px] font-extrabold leading-6">{product.title}</h3>
      </header>

      {featuredPromotion ? (
        <section className="mx-2 mt-2 border border-red-300 bg-white">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#e53935] to-[#f36b3c] px-3 py-2 text-sm font-black uppercase tracking-wide text-white [clip-path:polygon(0_0,100%_0,88%_100%,0_100%)]">
            <Gift size={15} className="shrink-0" />
            Khuyến mại
          </div>
          <div className="space-y-2 px-3 pb-3 pt-3 text-[15px] leading-6 text-slate-700">
            <p className="font-bold text-slate-800">{featuredPromotion.title}</p>
            {promoItems.map((item, index) => (
              <div key={`${item}-${index}`} className="flex gap-2">
                <span className="mt-1 text-[12px] leading-none text-slate-700">✦</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-2 px-4 py-3">
        {quickSpecs.map((spec) => (
          <div key={`${spec.label}-${spec.value}`} className="flex gap-2 text-[15px] leading-6 text-slate-700">
            <Check size={16} className="mt-1 shrink-0 rounded-full bg-orange-500 p-[2px] text-white" strokeWidth={3} />
            <span>
              <strong>{spec.label}:</strong> {spec.value}
            </span>
          </div>
        ))}
      </div>

      <footer className="px-4 pb-4 pt-1">
        {product.compareAtPrice ? (
          <p className="text-[15px] text-slate-700">
            Giá niêm yết:{" "}
            <span className="font-semibold text-slate-400 line-through">{product.compareAtPrice}</span>
          </p>
        ) : null}

        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-[15px] text-slate-700">
            Giá khuyến mại:{" "}
            <strong className="text-[18px] font-extrabold text-red-600">{product.price || "Liên hệ"}</strong>
          </p>

          {product.discountBadge ? (
            <span className="inline-flex h-12 min-w-12 items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-br from-amber-400 to-orange-500 px-2 text-sm font-black text-white shadow-sm">
              {product.discountBadge}
            </span>
          ) : null}
        </div>
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
      onClickCapture={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("a[href], button, [data-product-card-actions]")
        ) {
          popupContext?.hidePopup(true);
        }
      }}
      onPointerMove={(event) => {
        if (
          event.pointerType === "mouse" &&
          event.target instanceof Element &&
          event.target.closest("[data-product-card-actions]")
        ) {
          popupContext?.hidePopup(true);
        }
      }}
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
  const [reducedMotion, setReducedMotion] = useState(false);
  const [cardsPerView, setCardsPerView] = useState(HOME_CATEGORY_PAGE_SIZE);
  const railRef = useRef<HTMLDivElement>(null);
  const autoplayStartedRef = useRef(false);
  const autoplayIntervalRef = useRef<number | null>(null);
  const visibleTabs = showAllTabs ? tabs : tabs.slice(0, 5);

  const visibleProducts = useMemo(() => {
    const matchedProducts =
      activeTab === "all"
        ? allProducts
        : allProducts.filter((product) =>
            config.tabMode === "brand" ? product.brand === activeTab : product.category === activeTab,
          );
    return matchedProducts.slice(0, HOME_CATEGORY_PRODUCT_LIMIT);
  }, [activeTab, allProducts, config.tabMode]);
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
  }, [activeTab, carouselProducts.length]);

  useEffect(
    () => () => {
      clearSlideTimers();
    },
    [clearSlideTimers],
  );

  if (!allProducts.length) return null;

  const selectTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <section className="home-category-section" aria-labelledby={`home-category-${config.id}`}>
      <div className={`home-category-bar ${paused ? "is-paused" : ""}`}>
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
