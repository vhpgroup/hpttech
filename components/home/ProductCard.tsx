"use client";

import Image from "next/image";
import clsx from "clsx";
import { Check, PlusCircle, ShoppingCart, Star } from "lucide-react";
import { formatPrice, type Product } from "@/lib/data";

type Props = {
  product: Product;
  onToggleCompare?: (product: Product) => void;
  isComparing?: boolean;
};

export function ProductCard({ product, onToggleCompare, isComparing }: Props) {
  return (
    <div className="group flex min-h-[430px] w-full flex-col border border-slate-200 bg-white p-4 transition hover:-translate-y-1 hover:z-10 hover:shadow-xl">
      <a
        href={product.href}
        className="relative block h-52 overflow-hidden bg-white"
        target="_blank"
        rel="noreferrer"
      >
        {product.tag ? (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
            {product.tag}
          </span>
        ) : null}
        <Image
          src={product.image}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, 220px"
          className="object-contain p-2 transition group-hover:scale-105"
        />
      </a>
      <a
        href={product.href}
        className="mt-3 line-clamp-2 min-h-[44px] text-sm font-bold leading-5 text-slate-900 hover:text-blue-600"
        target="_blank"
        rel="noreferrer"
      >
        {product.title}
      </a>
      <div className="mt-1 flex items-center gap-0.5 text-orange-400" aria-label="Đánh giá sản phẩm">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={15} className={index < 4 ? "fill-current" : "text-slate-300"} />
        ))}
        <span className="ml-1 text-xs text-slate-500">(0)</span>
      </div>
      <p className="mt-2 text-xs text-slate-600">Mã SP: {product.id.slice(0, 12).toUpperCase()}</p>
      <div className="mt-2 min-h-[48px]">
        {product.price ? (
          <span className="block text-sm text-slate-400 line-through">{formatPrice(Math.round(product.price * 1.15))}</span>
        ) : null}
        <span className="text-[22px] font-extrabold leading-none text-red-600">{formatPrice(product.price)}</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        {onToggleCompare ? (
          <button
            type="button"
            onClick={() => onToggleCompare(product)}
            className={clsx(
              "inline-flex items-center gap-1 text-xs font-semibold transition",
              isComparing
                ? "text-blue-700"
                : "text-blue-600 hover:text-blue-800",
            )}
          >
            <PlusCircle size={14} />
            {isComparing ? "Đang so" : "So sánh"}
          </button>
        ) : null}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
          <Check size={14} />
          Còn hàng
        </span>
        <a
          href={product.href}
          className="ml-auto text-blue-600 hover:text-blue-800"
          target="_blank"
          rel="noreferrer"
          aria-label={`Xem chi tiết ${product.title}`}
        >
          <ShoppingCart size={22} className="fill-current" />
        </a>
      </div>
    </div>
  );
}
