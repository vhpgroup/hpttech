/**
 * Chính sách ghi giá khi import sản phẩm (thuần logic, không dependency —
 * để verifier chạy offline được).
 *
 * Bối cảnh: sau lần import đầu tiên, giá bán do bảng giá Google Sheet
 * (prices:import-gsheet) và admin quản lý. Scraper re-crawl một SKU đã có
 * trong Payload KHÔNG được đè giá — trước đây importCanonicalProductsRows
 * upsert product-offers với giá crawl từ trang nguồn khiến giá sửa tay bị
 * ghi đè (đường crawl theo tên không có guard chống trùng như đường
 * crawl theo category URL).
 */

export type CanonicalImportPricingOptions = {
  /**
   * Khi variant đã có offer: giữ nguyên price/promotionPrice/saleStatus,
   * bỏ qua bước upsert offer. Offer mới (chưa tồn tại) vẫn được tạo để
   * lần import đầu có giá khởi tạo từ nguồn.
   */
  preserveExistingOfferPricing?: boolean;
};

export function shouldPreserveExistingOfferPricing(
  options: CanonicalImportPricingOptions | undefined,
  existingOffer: { id?: unknown } | undefined,
): boolean {
  if (!options?.preserveExistingOfferPricing) return false;
  return existingOffer?.id !== undefined && existingOffer.id !== null;
}

/**
 * Scraper chỉ được ghi các field giá hiển thị trên product (compareAtPrice)
 * ở lần import đầu tiên; sản phẩm đã tồn tại thì giá thuộc quyền bảng giá.
 */
export function scraperMayWritePricing(hadExistingProduct: boolean): boolean {
  return !hadExistingProduct;
}
