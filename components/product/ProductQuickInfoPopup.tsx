"use client";

import { Gift } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { CatalogProduct } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";

/**
 * Popup "thông tin nhanh" khi hover card sản phẩm (desktop).
 *
 * Kiến trúc: render qua portal ở document.body vì các carousel/lưới sản phẩm
 * có overflow ẩn — popup đặt trong card sẽ bị cắt. Vị trí tính từ DOMRect của
 * card: mở bên phải card, tự lật sang trái khi sát mép màn hình, và kẹp theo
 * chiều cao THẬT của popup (đo sau khi render) để không tràn đáy viewport.
 *
 * Thiết kế: header gradient đỏ thương hiệu (chip hãng + badge giảm giá),
 * bảng thông số key–value, khối giá viền đứt kèm pill "Tiết kiệm", và dải
 * khuyến mại. Popup thuần thông tin — không chứa nút hành động.
 */

type ProductInfoPopup = {
  product: CatalogProduct;
  anchor: DOMRect;
};

const ProductPopupContext = createContext<{
  showPopup: (product: CatalogProduct, anchor: DOMRect) => void;
  hidePopup: (immediate?: boolean) => void;
} | null>(null);

const POPUP_WIDTH = 390;
const POPUP_GAP = 12;
const VIEWPORT_MARGIN = 12;
const SHOW_DELAY_MS = 200;
const HIDE_DELAY_MS = 140;

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

/** Rút số tiền (VND) từ chuỗi giá dạng "8.990.000đ"; null nếu không phải giá. */
function parsePriceDigits(value?: string) {
  if (!value) return null;
  const digits = value.replace(/[^\d]/g, "");
  // Giá VND thực tế luôn >= 4 chữ số — tránh nhầm chuỗi kiểu "24/7".
  if (digits.length < 4) return null;
  const parsed = Number(digits);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatVnd(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function stockInfo(stockStatus?: string) {
  if (stockStatus === "out_of_stock") {
    return { label: "Hết hàng", dotClassName: "bg-white/70" };
  }
  if (stockStatus === "preorder") {
    return { label: "Đặt trước", dotClassName: "bg-amber-300" };
  }
  return { label: "Còn hàng", dotClassName: "bg-emerald-300" };
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
        showTimerRef.current = setTimeout(() => setPopup({ product, anchor }), SHOW_DELAY_MS);
      },
      hidePopup: (immediate = false) => {
        if (showTimerRef.current) clearTimeout(showTimerRef.current);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        if (immediate) {
          setPopup(null);
          return;
        }
        hideTimerRef.current = setTimeout(() => setPopup(null), HIDE_DELAY_MS);
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
  const cardRef = useRef<HTMLElement | null>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  // Đo chiều cao thật sau khi render (trước paint) để kẹp vị trí chính xác.
  useLayoutEffect(() => {
    if (cardRef.current) setMeasuredHeight(cardRef.current.offsetHeight);
  }, [popup]);

  const promotions = product.promotions ?? [];
  const featuredPromotion = promotions[0];
  const promoItems = [
    ...(featuredPromotion?.benefits?.filter(Boolean) ?? []),
    ...(featuredPromotion?.description ? [featuredPromotion.description] : []),
  ].slice(0, 3);
  const extraPromotionCount = Math.max(
    (product.promotionCount ?? promotions.length) - 1,
    0,
  );
  const quickSpecs = popupSpecs(product);
  const stock = stockInfo(product.stockStatus);
  const rating =
    typeof product.rating === "number" && Number.isFinite(product.rating)
      ? Math.max(0, Math.min(5, product.rating))
      : 0;
  const reviewCount = product.reviewCount ?? 0;
  const priceValue = product.priceValue ?? parsePriceDigits(product.price);
  const compareAtValue = parsePriceDigits(product.compareAtPrice);
  const savings =
    priceValue && compareAtValue && compareAtValue > priceValue
      ? compareAtValue - priceValue
      : null;

  const viewportWidth = typeof window === "undefined" ? 1440 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 900 : window.innerHeight;
  const openLeft = anchor.right + POPUP_WIDTH + POPUP_GAP + VIEWPORT_MARGIN > viewportWidth;
  const left = openLeft
    ? Math.max(VIEWPORT_MARGIN, anchor.left - POPUP_WIDTH - POPUP_GAP)
    : Math.min(viewportWidth - POPUP_WIDTH - VIEWPORT_MARGIN, anchor.right + POPUP_GAP);
  const estimatedHeight = measuredHeight ?? 440;
  const top = Math.max(
    VIEWPORT_MARGIN,
    Math.min(anchor.top, viewportHeight - estimatedHeight - VIEWPORT_MARGIN),
  );
  // Mũi tên bám theo card nhưng kẹp trong dải header đỏ để giữ đúng màu nền.
  const arrowTop = Math.min(Math.max(anchor.top + 26 - top, 18), 60);

  return (
    <aside
      ref={cardRef}
      className="pointer-events-none fixed z-[95] hidden w-[390px] md:block"
      style={{ left, top }}
      aria-label={`Thông tin nhanh ${product.title}`}
    >
      <div
        className={
          openLeft
            ? "relative animate-[popup-enter-left_220ms_cubic-bezier(0.16,1,0.3,1)]"
            : "relative animate-[popup-enter-right_220ms_cubic-bezier(0.16,1,0.3,1)]"
        }
      >
        <span
          aria-hidden
          className={`absolute h-3.5 w-3.5 rotate-45 bg-red-600 ${
            openLeft ? "-right-1.5" : "-left-1.5"
          }`}
          style={{ top: arrowTop }}
        />

        <div className="overflow-hidden rounded-[18px] bg-white text-slate-800 shadow-[0_14px_34px_-10px_rgba(185,28,28,0.35),0_32px_72px_-20px_rgba(15,23,42,0.30)]">
          <header className="relative overflow-hidden bg-gradient-to-br from-red-500 to-red-700 px-5 pb-4 pt-4 text-white">
            <span aria-hidden className="absolute -right-12 -top-14 h-36 w-36 rounded-full bg-white/10" />
            <span aria-hidden className="absolute -bottom-16 right-6 h-28 w-28 rounded-full bg-white/[0.07]" />

            {product.brand || product.discountBadge ? (
              <div className="relative mb-2 flex items-center justify-between gap-2">
                {product.brand ? (
                  <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.08em]">
                    {product.brand}
                  </span>
                ) : (
                  <span aria-hidden />
                )}
                {product.discountBadge ? (
                  <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-extrabold text-amber-900 shadow-sm">
                    {product.discountBadge}
                  </span>
                ) : null}
              </div>
            ) : null}

            <h3 className="relative text-[15px] font-extrabold leading-6">{product.title}</h3>

            <div className="relative mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/85">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${stock.dotClassName}`} />
                {stock.label}
              </span>
              {rating > 0 ? (
                <>
                  <span aria-hidden className="text-white/40">
                    •
                  </span>
                  <span aria-hidden className="text-amber-300">
                    ★
                  </span>
                  <span>
                    <span className="font-bold text-white">{rating.toFixed(1)}</span>
                    {reviewCount > 0 ? ` (${reviewCount} đánh giá)` : null}
                  </span>
                </>
              ) : null}
            </div>
          </header>

          <div className="px-5 pb-5 pt-3">
            {quickSpecs.length ? (
              <ul className="mb-3">
                {quickSpecs.map((spec) => (
                  <li
                    key={`${spec.label}-${spec.value}`}
                    className="flex items-baseline justify-between gap-4 border-b border-slate-100 py-2 text-[13px] leading-5 last:border-b-0"
                  >
                    <span className="flex shrink-0 items-center gap-2 text-slate-500">
                      <span aria-hidden className="h-[5px] w-[5px] shrink-0 rounded-[2px] bg-red-600" />
                      {spec.label}
                    </span>
                    <span className="min-w-0 text-right font-semibold text-slate-800">
                      {spec.value}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex items-center justify-between gap-3 rounded-[13px] border border-dashed border-red-300 bg-red-50/60 px-4 py-3">
              <div className="min-w-0">
                {product.compareAtPrice ? (
                  <span className="block text-xs text-slate-400 line-through">
                    {product.compareAtPrice}
                  </span>
                ) : null}
                <span className="block truncate text-[23px] font-extrabold leading-tight tracking-tight text-red-600">
                  {product.price || "Liên hệ"}
                </span>
              </div>
              {savings ? (
                <span className="shrink-0 rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-extrabold uppercase leading-none text-amber-900">
                  Tiết kiệm {formatVnd(savings)}
                </span>
              ) : null}
            </div>

            {featuredPromotion ? (
              <section className="mt-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-700">
                <p className="flex items-center gap-2 font-bold">
                  <Gift size={14} className="shrink-0" />
                  <span className="min-w-0">{featuredPromotion.title || "Khuyến mại"}</span>
                </p>
                {promoItems.length ? (
                  <ul className="mt-1.5 space-y-1">
                    {promoItems.map((item, index) => (
                      <li key={`${item}-${index}`} className="flex gap-2">
                        <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-red-400" />
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {extraPromotionCount > 0 ? (
                  <p className="mt-1.5 font-semibold text-red-500">
                    +{extraPromotionCount} ưu đãi khác
                  </p>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      </div>
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
