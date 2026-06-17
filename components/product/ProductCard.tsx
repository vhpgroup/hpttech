"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Plus, Star } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import type { CatalogProduct } from "@/lib/catalog";
import { cn } from "@/lib/cn";

type ProductCardProps = {
  product: CatalogProduct;
  className?: string;
  isComparing?: boolean;
  onCompare?: (product: CatalogProduct) => void;
};

function stockLabel(stockStatus?: string) {
  if (stockStatus === "out_of_stock") return { label: "Hết hàng", className: "text-red-600" };
  if (stockStatus === "preorder") return { label: "Đặt trước", className: "text-amber-600" };
  return { label: "Còn hàng", className: "text-green-600" };
}

function productHref(product: CatalogProduct) {
  return product.slug ? `/san-pham/${product.slug}` : product.href || "/san-pham";
}

function ProductRating({ rating = 0, reviewCount = 0 }: { rating?: number; reviewCount?: number }) {
  const score = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;

  return (
    <div className="mt-1 flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`${score} trên 5 sao`}>
        {Array.from({ length: 5 }, (_, index) => {
          const active = index + 1 <= Math.round(score);
          return (
            <Star
              key={index}
              size={16}
              className={active ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      <span className="text-sm text-slate-500">({reviewCount || 0})</span>
    </div>
  );
}

export function ProductCard({ product, className, isComparing = false, onCompare }: ProductCardProps) {
  const router = useRouter();
  const [globalComparing, setGlobalComparing] = useState(isComparing);
  const href = productHref(product);
  const image = product.images?.[0]?.url || product.image;
  const promotionCount = product.promotionCount ?? product.promotions?.length ?? (product.promoText ? 1 : 0);
  const stock = stockLabel(product.stockStatus);
  const selected = onCompare ? isComparing : globalComparing;

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
        "group relative flex min-h-[355px] min-w-0 cursor-pointer flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
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
            className="max-h-[148px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 45vw, (max-width: 1280px) 20vw, 220px"
          />
        ) : (
          <div className="h-28 w-full rounded-[10px] bg-slate-100" />
        )}
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 min-h-[46px] text-[15px] font-bold leading-[22px] text-slate-950">
          <Link href={href} className="hover:text-blue-700">
            {product.title}
          </Link>
        </h3>

        <ProductRating rating={product.rating} reviewCount={product.reviewCount} />

        {product.sku ? <p className="mt-1 text-sm text-slate-700">Mã SP: {product.sku}</p> : null}

        <div className="mt-2 min-h-[72px]">
          {product.compareAtPrice ? (
            <p className="text-sm font-medium text-slate-400 line-through">{product.compareAtPrice}</p>
          ) : (
            <div className="h-5" />
          )}

          <div className="mt-0.5 flex items-end justify-between gap-2">
            <strong className="text-[22px] font-extrabold leading-7 text-red-600">{product.price || "Liên hệ"}</strong>
            {product.discountBadge ? (
              <span className="inline-flex h-7 items-center rounded-md bg-red-600 px-2 text-sm font-extrabold text-white">
                {product.discountBadge}
              </span>
            ) : null}
          </div>

          {promotionCount > 0 ? <p className="mt-1 text-sm text-slate-700">{promotionCount} khuyến mại</p> : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-sm">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={toggleCompare}
              className={cn(
                "inline-flex items-center gap-1 font-medium transition",
                selected ? "text-blue-700" : "text-blue-600 hover:text-blue-700",
              )}
            >
              <Plus size={14} />
              So sánh
            </button>
            <span className={cn("inline-flex items-center gap-1 font-medium", stock.className)}>
              <Check size={14} strokeWidth={3} />
              {stock.label}
            </span>
          </div>

          <AddToCartButton
            product={product}
            label=""
            ariaLabel={`Thêm ${product.title} vào giỏ`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0A4BFF] text-white transition hover:bg-blue-700"
          />
        </div>
      </div>
    </article>
  );
}
