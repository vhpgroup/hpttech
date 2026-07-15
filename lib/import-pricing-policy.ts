/**
 * Chính sách ghi giá khi import sản phẩm (thuần logic, không dependency —
 * để verifier chạy offline được).
 *
 * Bối cảnh: sau lần import đầu tiên, giá bán do bảng giá Google Sheet
 * (prices:import-gsheet) và admin quản lý. Scraper re-crawl một sản phẩm đã
 * có trong Payload KHÔNG được đè giá — trước đây importCanonicalProductsRows
 * upsert product-offers với giá crawl từ trang nguồn khiến giá sửa tay bị
 * ghi đè (đường crawl theo tên không có guard chống trùng như đường
 * crawl theo category URL).
 */

export type CanonicalImportPricingOptions = {
  /**
   * Khi bật (scraper): sản phẩm đã tồn tại hoặc variant đã có offer thì giữ
   * nguyên price/promotionPrice/saleStatus, bỏ qua bước ghi offer. Offer chỉ
   * được tạo cho sản phẩm hoàn toàn mới — lần import đầu có giá khởi tạo
   * từ nguồn.
   */
  preserveExistingOfferPricing?: boolean;
};

export type OfferPricingContext = {
  /**
   * Sản phẩm đã tồn tại theo kết quả resolve của importer (internalId /
   * sourceUrl / SKU-variant / slug). Dùng tín hiệu này thay vì chỉ tra
   * variant theo SKU: SKU sinh từ crawl có thể TRÔI giữa 2 lần chạy (tên
   * nguồn đổi nhẹ) — tra theo SKU sẽ né guard và tạo offer giá crawl mới
   * đè lên giá hiển thị.
   */
  productAlreadyExisted: boolean;
  /**
   * Offer đã có trên variant (bắt cả cạnh SKU va chạm: variant SKU trùng
   * thuộc sản phẩm khác bị re-parent nhưng vẫn mang offer cũ).
   */
  existingOffer: { id?: unknown } | undefined;
};

export function shouldPreserveExistingOfferPricing(
  options: CanonicalImportPricingOptions | undefined,
  context: OfferPricingContext,
): boolean {
  if (!options?.preserveExistingOfferPricing) return false;
  if (context.productAlreadyExisted) return true;
  return (
    context.existingOffer?.id !== undefined && context.existingOffer.id !== null
  );
}

/**
 * Scraper chỉ được ghi các field giá hiển thị trên product (compareAtPrice)
 * ở lần import đầu tiên; sản phẩm đã tồn tại thì giá thuộc quyền bảng giá.
 */
export function scraperMayWritePricing(hadExistingProduct: boolean): boolean {
  return !hadExistingProduct;
}

/**
 * Giá khuyến mãi ghi vào product-offers từ file import.
 *
 * Payload/drizzle BỎ QUA field có giá trị undefined khi update
 * (@payloadcms/drizzle transform/write/traverseFields) — nên ô promotionPrice
 * để trống mà truyền undefined sẽ GIỮ NGUYÊN khuyến mãi cũ trong DB thay vì
 * xóa. Muốn xóa phải ghi null tường minh. Giá không dương cũng chuẩn hóa về
 * null (khuyến mãi 0đ là vô nghĩa; hiển thị vốn chỉ nhận promotionPrice > 0).
 */
export function promotionPriceForOfferWrite(
  value: number | null | undefined,
): number | null {
  if (value === undefined || value === null) return null;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}
