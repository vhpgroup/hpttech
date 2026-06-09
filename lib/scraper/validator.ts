import type { ExtractedProductData } from "./types";

export function validateExtractedProduct(data: ExtractedProductData, hasExactUrl: boolean) {
  const warnings: string[] = [];

  if (!hasExactUrl) warnings.push("Chua co URL san pham chinh xac, can nhan vien kiem tra nguon.");
  if (!data.sku) warnings.push("Chua tim thay SKU/model ro rang.");
  if (!data.specs.length) warnings.push("Chua trich xuat duoc bang thong so ky thuat.");
  if (!data.imageUrls.length) warnings.push("Chua tim thay anh san pham.");
  if (!data.price) warnings.push("Chua tim thay gia ban, can nhan vien nhap/kiem tra.");

  const score = Math.max(0.35, 1 - warnings.length * 0.12);

  return {
    confidence: Number(score.toFixed(2)),
    reviewStatus: warnings.length <= 2 ? "ready_to_review" : "needs_human_input",
    warnings,
  } as const;
}
