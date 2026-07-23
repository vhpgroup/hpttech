"use client";

import type { CatalogProduct } from "@/lib/catalog";
import { useQuote } from "@/components/quote/QuoteProvider";

type QuoteButtonProps = {
  product: CatalogProduct;
  className?: string;
  label?: string;
};

export default function QuoteButton({ product, className, label = "Nhận báo giá" }: QuoteButtonProps) {
  const { openQuote } = useQuote();

  return (
    <button
      type="button"
      className={className || "inline-flex h-11 items-center justify-center rounded-lg bg-primary-600 px-4 text-sm font-bold text-white hover:bg-primary-700"}
      onClick={() => openQuote(product)}
    >
      {label}
    </button>
  );
}
