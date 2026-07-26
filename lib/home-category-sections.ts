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

/**
 * Khu danh mục carousel bổ sung trên trang chủ (ngoài scanner/printer/photocopier
 * vốn lọc theo productType). Các khu này lấy sản phẩm THEO NHÁNH DANH MỤC
 * (category slug — gồm cả danh mục con 2–3 tầng), rồi gắn cờ homeSection để client
 * lọc đúng khu. Dùng chung 1 nguồn cho cả server (fetch) và client (config) để
 * tránh lệch id/slug/tiêu đề.
 */
export type HomeCategorySectionDef = {
  /** Khớp CatalogProduct.homeSection do server gắn khi fetch theo danh mục. */
  id: string;
  /** Tiêu đề hiển thị của khu. */
  title: string;
  /** Slug danh mục cấp 1 để truy vấn sản phẩm (khớp categories.slug trong CMS). */
  categorySlug: string;
};

export const HOME_CATEGORY_SECTION_DEFS: HomeCategorySectionDef[] = [
  { id: "laptop-gaming", title: "Laptop Gaming - Đồ Họa", categorySlug: "laptop-gaming-do-hoa" },
  { id: "laptop-office", title: "Laptop văn phòng", categorySlug: "laptop" },
  { id: "pc-server", title: "Máy tính đồng bộ - Máy chủ", categorySlug: "may-tinh-dong-bo-may-chu" },
  { id: "network", title: "Thiết bị mạng", categorySlug: "thiet-bi-mang" },
];
