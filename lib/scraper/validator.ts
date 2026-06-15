import type { ExtractedProductData } from "./types";

type ValidationContext = {
  hasImages?: boolean;
  sourceExact?: boolean;
};

function numericPrice(value?: string) {
  if (!value) return undefined;
  const decimal = value.trim().match(/^(\d{6,})(?:[.,]\d{1,2})?$/)?.[1];
  const digits = decimal || value.replace(/[^\d]/g, "");
  const amount = Number(digits);
  return Number.isFinite(amount) && amount >= 100_000 ? amount : undefined;
}

function normalizedText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function isSoftwareData(data: ExtractedProductData) {
  const text = normalizedText(
    [
      data.title,
      data.sku,
      data.specs.map((spec) => `${spec.label} ${spec.value}`).join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );

  return /\b(phan mem|software|license|ban quyen|office|microsoft|windows server|copilot|acrobat|kaspersky|bullguard|antivirus|chatgpt)\b/.test(
    text,
  );
}

export function validateExtractedProduct(
  data: ExtractedProductData,
  hasExactUrl: boolean,
  context: ValidationContext = {},
) {
  const warnings: string[] = [];
  const softwareProduct = isSoftwareData(data);

  if (!hasExactUrl) warnings.push("Chưa có URL sản phẩm chính xác.");
  if (context.sourceExact === false) warnings.push("Sản phẩm chưa khớp chính xác với nguồn.");
  if ((!data.sku || data.sku.trim() === "0") && context.sourceExact !== true) {
    warnings.push("Chưa tìm thấy SKU/model đáng tin cậy.");
  }
  if (!softwareProduct && !data.specs.length) {
    warnings.push("Chưa trích xuất được bảng thông số kỹ thuật.");
  }
  if (!data.price) warnings.push("Chưa tìm thấy giá bán.");
  if (context.hasImages === false) warnings.push("Chưa tìm thấy ảnh sản phẩm.");

  const price = numericPrice(data.price);
  const compareAtPrice = numericPrice(data.compareAtPrice);
  if (price && compareAtPrice && compareAtPrice < price) {
    warnings.push("Giá niêm yết nhỏ hơn giá bán.");
  }

  const score = Math.max(0.2, 1 - warnings.length * 0.15);

  return {
    confidence: Number(score.toFixed(2)),
    reviewStatus: warnings.length === 0 ? "ready_to_review" : "needs_human_input",
    warnings,
  } as const;
}
