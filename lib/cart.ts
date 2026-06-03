import type { CatalogProduct } from "@/lib/catalog";

export type CartItem = {
  key: string;
  productId?: string | number;
  slug?: string;
  href?: string;
  title: string;
  brand?: string;
  category?: string;
  image?: string;
  priceLabel?: string;
  unitPrice?: number;
  quantity: number;
  requiresPriceConfirmation: boolean;
};

export type CartProductInput = Pick<
  CatalogProduct,
  "id" | "slug" | "href" | "title" | "brand" | "category" | "image" | "images" | "price"
>;

export const CART_STORAGE_KEY = "hpttech-cart-items";

export function parseVNDPrice(value?: string) {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (normalized.includes("lien he") || normalized.includes("liên hệ")) return undefined;
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const price = Number(digits);
  return Number.isFinite(price) && price > 0 ? price : undefined;
}

export function formatVND(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function cartProductKey(product: CartProductInput) {
  return String(product.id || product.slug || product.href || product.title);
}

export function cartItemFromProduct(product: CartProductInput): CartItem {
  const unitPrice = parseVNDPrice(product.price);
  return {
    key: cartProductKey(product),
    productId: product.id,
    slug: product.slug,
    href: product.href || (product.slug ? `/san-pham/${product.slug}` : undefined),
    title: product.title,
    brand: product.brand,
    category: product.category,
    image: product.image || product.images?.[0]?.url,
    priceLabel: product.price || "Liên hệ",
    unitPrice,
    quantity: 1,
    requiresPriceConfirmation: !unitPrice,
  };
}

export function normalizeCartItem(item: Partial<CartItem>): CartItem | null {
  if (!item.title) return null;
  const unitPrice = typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) ? item.unitPrice : parseVNDPrice(item.priceLabel);
  return {
    key: String(item.key || item.productId || item.slug || item.href || item.title),
    productId: item.productId,
    slug: item.slug,
    href: item.href || (item.slug ? `/san-pham/${item.slug}` : undefined),
    title: item.title,
    brand: item.brand,
    category: item.category,
    image: item.image,
    priceLabel: item.priceLabel || (unitPrice ? formatVND(unitPrice) : "Liên hệ"),
    unitPrice,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    requiresPriceConfirmation: item.requiresPriceConfirmation ?? !unitPrice,
  };
}

export function getCartSummary(items: CartItem[]) {
  const subtotal = items.reduce((total, item) => total + (item.unitPrice || 0) * item.quantity, 0);
  const count = items.reduce((total, item) => total + item.quantity, 0);
  const requiresPriceConfirmation = items.some((item) => item.requiresPriceConfirmation || !item.unitPrice);

  return {
    count,
    subtotal,
    totalLabel: requiresPriceConfirmation ? "Cần xác nhận" : formatVND(subtotal),
    requiresPriceConfirmation,
  };
}
