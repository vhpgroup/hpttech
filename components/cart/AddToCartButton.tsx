"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { CartProductInput } from "@/lib/cart";

type AddToCartButtonProps = {
  product: CartProductInput;
  className?: string;
  label?: string;
  ariaLabel?: string;
};

export default function AddToCartButton({ product, className, label = "Thêm vào giỏ", ariaLabel }: AddToCartButtonProps) {
  const { addProduct } = useCart();

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className || "inline-flex items-center justify-center gap-2 rounded-md bg-accent-600 px-3 py-2 text-sm font-semibold text-white hover:bg-accent-700"}
      onClick={() => addProduct(product)}
    >
      <ShoppingCart size={18} />
      {label ? <span>{label}</span> : null}
    </button>
  );
}
