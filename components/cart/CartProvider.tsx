"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import {
  CART_STORAGE_KEY,
  cartItemFromProduct,
  formatVND,
  getCartSummary,
  normalizeCartItem,
  type CartItem,
  type CartProductInput,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  totalLabel: string;
  requiresPriceConfirmation: boolean;
  isOpen: boolean;
  addProduct: (product: CartProductInput) => void;
  clearCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
      if (Array.isArray(parsed)) {
        setItems(parsed.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item)));
      }
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      try {
        const parsed = JSON.parse(event.newValue || "[]");
        setItems(Array.isArray(parsed) ? parsed.map(normalizeCartItem).filter((item): item is CartItem => Boolean(item)) : []);
      } catch {
        setItems([]);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const summary = useMemo(() => getCartSummary(items), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: summary.count,
      subtotal: summary.subtotal,
      totalLabel: summary.totalLabel,
      requiresPriceConfirmation: summary.requiresPriceConfirmation,
      isOpen,
      addProduct: (product) => {
        const nextItem = cartItemFromProduct(product);
        setItems((current) => {
          const existing = current.find((item) => item.key === nextItem.key);
          if (!existing) return [...current, nextItem];
          return current.map((item) => (item.key === nextItem.key ? { ...item, quantity: item.quantity + 1 } : item));
        });
        setIsOpen(true);
      },
      clearCart: () => setItems([]),
      closeCart: () => setIsOpen(false),
      openCart: () => setIsOpen(true),
      removeItem: (key) => setItems((current) => current.filter((item) => item.key !== key)),
      updateQuantity: (key, quantity) =>
        setItems((current) =>
          current
            .map((item) => (item.key === key ? { ...item, quantity: Math.max(0, quantity) } : item))
            .filter((item) => item.quantity > 0),
        ),
    }),
    [isOpen, items, summary.count, summary.requiresPriceConfirmation, summary.subtotal, summary.totalLabel],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}

function CartDrawer() {
  const {
    clearCart,
    closeCart,
    isOpen,
    items,
    removeItem,
    totalLabel,
    updateQuantity,
    requiresPriceConfirmation,
  } = useCart();

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-label="Đóng giỏ hàng"
        onClick={closeCart}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Giỏ hàng</h2>
            <p className="text-sm text-slate-500">{items.length ? `${items.length} dòng sản phẩm` : "Chưa có sản phẩm"}</p>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 text-slate-600" type="button" onClick={closeCart} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length ? (
            <div className="space-y-4">
              {items.map((item) => (
                <article key={item.key} className="grid grid-cols-[76px_1fr] gap-3 rounded-lg border border-slate-200 p-3">
                  <Link href={item.href || "#"} className="grid h-20 w-20 place-items-center rounded-md bg-slate-50" onClick={closeCart}>
                    {item.image ? <Image src={item.image} alt={item.title} width={72} height={72} className="max-h-16 object-contain" /> : <ShoppingCart size={24} className="text-slate-300" />}
                  </Link>
                  <div className="min-w-0">
                    <Link href={item.href || "#"} className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950" onClick={closeCart}>
                      {item.title}
                    </Link>
                    <p className="mt-1 truncate text-xs text-slate-500">{[item.brand, item.category].filter(Boolean).join(" - ")}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-orange-600">{item.priceLabel || "Liên hệ"}</p>
                        <p className="text-xs text-slate-400">
                          {item.unitPrice ? formatVND(item.unitPrice * item.quantity) : "Cần xác nhận"}
                        </p>
                      </div>
                      <div className="flex items-center rounded-md border border-slate-200">
                        <button type="button" className="grid h-8 w-8 place-items-center" aria-label="Giảm số lượng" onClick={() => updateQuantity(item.key, item.quantity - 1)}>
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button type="button" className="grid h-8 w-8 place-items-center" aria-label="Tăng số lượng" onClick={() => updateQuantity(item.key, item.quantity + 1)}>
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600" onClick={() => removeItem(item.key)}>
                      <Trash2 size={13} />
                      Xóa
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid h-full place-items-center rounded-lg border border-dashed border-slate-300 p-8 text-center">
              <div>
                <ShoppingCart className="mx-auto text-slate-300" size={42} />
                <p className="mt-4 font-semibold text-slate-900">Giỏ hàng đang trống</p>
                <p className="mt-2 text-sm text-slate-500">Thêm sản phẩm để đặt hàng hoặc yêu cầu xác nhận giá.</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-5">
          <div className="mb-4 rounded-lg bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Tạm tính</span>
              <strong className="text-lg text-slate-950">{totalLabel}</strong>
            </div>
            {requiresPriceConfirmation ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">Có sản phẩm cần xác nhận giá. Nhân viên HPT Tech sẽ liên hệ trước khi xử lý đơn.</p>
            ) : null}
            <p className="mt-2 text-xs leading-5 text-slate-500">Phí vận chuyển/lắp đặt sẽ được xác nhận sau.</p>
          </div>
          <div className="grid grid-cols-[1fr_1.8fr] gap-3">
            <button type="button" className="rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40" disabled={!items.length} onClick={clearCart}>
              Xóa hết
            </button>
            <Link
              href="/checkout"
              className={`rounded-md px-3 py-3 text-center text-sm font-semibold text-white ${items.length ? "bg-blue-700 hover:bg-blue-800" : "pointer-events-none bg-slate-300"}`}
              onClick={closeCart}
            >
              Thanh toán
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
