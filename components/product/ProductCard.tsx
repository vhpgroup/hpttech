"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageIcon, Scale, Star } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { useQuote } from "@/components/quote/QuoteProvider";
import type { CatalogProduct } from "@/lib/catalog";
import { cn } from "@/lib/cn";

type ProductCardProps = {
  product: CatalogProduct;
  className?: string;
  isComparing?: boolean;
  onCompare?: (product: CatalogProduct) => void;
};

function stockLabel(stockStatus?: string) {
  if (stockStatus === "out_of_stock") {
    return { label: "Hết hàng", className: "text-red-600", dotClassName: "bg-red-600" };
  }
  if (stockStatus === "preorder") {
    return { label: "Đặt trước", className: "text-amber-600", dotClassName: "bg-amber-500" };
  }
  return { label: "Còn hàng", className: "text-green-600", dotClassName: "bg-green-600" };
}

function productHref(product: CatalogProduct) {
  return product.slug ? `/san-pham/${product.slug}` : product.href || "/san-pham";
}

function ProductRating({ rating = 0, reviewCount = 0 }: { rating?: number; reviewCount?: number }) {
  const score = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`${score} trên 5 sao`}>
        {Array.from({ length: 5 }, (_, index) => {
          const active = index + 1 <= Math.round(score);
          return (
            <Star
              key={index}
              size={14}
              className={active ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      <span className="text-xs text-slate-500">({reviewCount || 0})</span>
    </div>
  );
}

export function ProductCard({ product, className, isComparing = false, onCompare }: ProductCardProps) {
  const router = useRouter();
  const { openQuote } = useQuote();
  const [globalComparing, setGlobalComparing] = useState(isComparing);
  const href = productHref(product);
  const initialImage = product.images?.[0]?.url || product.image;
  const [image, setImage] = useState(initialImage);
  const promotionCount = product.promotionCount ?? product.promotions?.length ?? (product.promoText ? 1 : 0);
  const stock = stockLabel(product.stockStatus);
  const selected = onCompare ? isComparing : globalComparing;

  useEffect(() => {
    setImage(initialImage);
  }, [initialImage]);

  useEffect(() => {
    if (onCompare) return;

    const handleState = (event: Event) => {
      const items = (event as CustomEvent<CatalogProduct[]>).detail;
      if (!Array.isArray(items)) return;
      setGlobalComparing(items.some((item) => (item.slug || item.title) === (product.slug || product.title)));
    };

    window.addEventListener("hpt:compare:state", handleState);
    window.dispatchEvent(new CustomEvent("hpt:compare:request-state"));
    return () => window.removeEventListener("hpt:compare:state", handleState);
  }, [onCompare, product.slug, product.title]);

  const toggleCompare = () => {
    if (onCompare) {
      onCompare(product);
      return;
    }

    window.dispatchEvent(
      new CustomEvent<CatalogProduct>(selected ? "hpt:compare:remove" : "hpt:compare:add", { detail: product }),
    );
  };

  const openProduct = (event: MouseEvent<HTMLElement>) => {
    if (
      event.target instanceof Element &&
      event.target.closest("a, button, input, select, textarea, [role='button']")
    ) {
      return;
    }

    router.push(href);
  };

  return (
    <article
      onClick={openProduct}
      className={cn(
        "group relative flex min-h-[355px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 transition duration-200 hover:-translate-y-1 hover:border-transparent hover:shadow-xl",
        className,
      )}
    >
      <Link href={href} className="relative flex h-[170px] items-center justify-center rounded-[10px] bg-white p-2">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            width={250}
            height={170}
            className="max-h-[148px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 45vw, (max-width: 1280px) 20vw, 220px"
            onError={() => setImage(undefined)}
          />
        ) : (
          <div className="flex h-28 w-full flex-col items-center justify-center rounded-[10px] bg-gradient-to-br from-slate-50 to-primary-50 text-slate-400 ring-1 ring-slate-100">
            <ImageIcon size={34} strokeWidth={1.4} />
            <span className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Chưa có ảnh</span>
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-slate-900">
          <Link href={href} className="hover:text-red-600">
            {product.title}
          </Link>
        </h3>

        {/* Đánh giá luôn hiển thị (kể cả 0 sao) + tình trạng kho gọn về một dòng meta.
            flex-wrap để badge kho rơi xuống dòng thay vì bị overflow-hidden của card
            cắt cụt thành "C…" trong lưới 2 cột mobile (audit 03/08). */}
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <ProductRating rating={product.rating} reviewCount={product.reviewCount} />
          <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium", stock.className)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", stock.dotClassName)} aria-hidden />
            {stock.label}
          </span>
        </div>

        <div className="mt-2 min-h-[64px]">
          {product.compareAtPrice ? (
            <p className="text-xs font-medium text-slate-400 line-through">{product.compareAtPrice}</p>
          ) : (
            <div className="h-4" />
          )}

          <div className="mt-0.5 flex items-end justify-between gap-2">
            <strong className="text-[19px] font-extrabold leading-6 text-red-600">{product.price || "Liên hệ"}</strong>
            {product.discountBadge ? (
              <span className="inline-flex h-6 items-center rounded-md bg-red-600 px-1.5 text-xs font-extrabold text-white">
                {product.discountBadge}
              </span>
            ) : null}
          </div>

          {promotionCount > 0 ? <p className="mt-1 text-xs text-slate-600">{promotionCount} khuyến mại</p> : null}
        </div>

        {/* Một CTA chính + nút so sánh dạng icon — thay cho cụm 3 hành động cũ.
            Card lưới 2 cột mobile chỉ rộng ~140-165px: chữ CTA hạ xuống text-xs,
            ẩn icon giỏ hàng dưới sm để nhãn không gãy thành 2 dòng. */}
        <div className="mt-auto flex items-center gap-2 pt-3">
          {product.price ? (
            <AddToCartButton
              product={product}
              label="Thêm vào giỏ"
              ariaLabel={`Thêm ${product.title} vào giỏ`}
              className="flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-red-600 text-xs font-semibold text-white transition hover:bg-red-700 sm:text-[13px] [&>svg]:hidden sm:[&>svg]:block"
            />
          ) : (
            <button
              type="button"
              onClick={() => openQuote(product)}
              className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl border border-slate-300 px-1 text-xs font-semibold leading-tight text-slate-800 transition hover:border-red-600 hover:text-red-600 sm:text-[13px]"
            >
              Nhận báo giá nhanh
            </button>
          )}

          <button
            type="button"
            onClick={toggleCompare}
            aria-pressed={selected}
            aria-label={selected ? `Bỏ ${product.title} khỏi so sánh` : `Thêm ${product.title} vào so sánh`}
            title={selected ? "Bỏ khỏi so sánh" : "So sánh"}
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition",
              selected
                ? "border-red-600 bg-red-600 text-white"
                : "border-slate-300 text-slate-500 hover:border-red-600 hover:text-red-600",
            )}
          >
            <Scale size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
