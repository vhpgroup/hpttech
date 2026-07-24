"use client";

import Image from "next/image";
import { useCart } from "@/components/cart/CartProvider";

export default function HeaderCartButton() {
  const { count, openCart } = useCart();

  return (
    <button className="cart relative" type="button" aria-label={`Giỏ hàng (${count})`} onClick={openCart}>
      <Image
        src="/api/r2-media/icon-header-gio-hang.png"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
      />
      <span>{count}</span>
    </button>
  );
}
