import type { CatalogProduct } from "@/lib/catalog";

export type HomeDeviceType = "scanner" | "printer" | "photocopier";

export const HOME_DEVICE_TYPES: HomeDeviceType[] = ["scanner", "printer", "photocopier"];

export function productTypeCode(product: Pick<CatalogProduct, "productType">): string {
  return (product.productType || "").trim().toLowerCase();
}

export function homeDeviceTypeOf(
  product: Pick<CatalogProduct, "productType">,
): HomeDeviceType | null {
  const code = productTypeCode(product);
  return (HOME_DEVICE_TYPES as string[]).includes(code) ? (code as HomeDeviceType) : null;
}

export function isHomeDeviceType(
  product: Pick<CatalogProduct, "productType">,
  target: HomeDeviceType,
): boolean {
  return homeDeviceTypeOf(product) === target;
}
