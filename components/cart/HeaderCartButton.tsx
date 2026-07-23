"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";

export default function HeaderCartButton() {
  const { count, openCart } = useCart();

  return (
    <button className="cart relative" type="button" aria-label={`Giỏ hàng (${count})`} onClick={openCart}>
      <ShoppingCart size={22} />
      <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-accent-600 px-1 text-[11px] font-bold leading-none text-white">
        {count}
      </span>
    </button>
  );
}
