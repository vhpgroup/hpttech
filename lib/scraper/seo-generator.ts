import { productSlug, truncate } from "./text";
import type { ExtractedProductData, SeoPreview } from "./types";

function inferProductKind(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes("scanner") || lower.includes("scan")) return "Máy scan";
  if (lower.includes("mực") || lower.includes("cartridge")) return "Mực in";
  if (lower.includes("máy in") || lower.includes("printer")) return "Máy in";
  return "Thiết bị văn phòng";
}

export function generateSeo(data: ExtractedProductData, brandName: string): SeoPreview {
  const kind = inferProductKind(data.title);
  const skuText = data.sku && !data.title.toLowerCase().includes(data.sku.toLowerCase())
    ? ` ${data.sku}`
    : "";
  const title = truncate(`${kind} ${data.title}${skuText} chính hãng, giá tốt | HPT Tech`, 68);
  const description = truncate(
    `${data.title} ${brandName} chính hãng, đầy đủ thông số kỹ thuật, tư vấn cấu hình và báo giá nhanh tại HPT Tech.`,
    158,
  );

  return {
    canonical: `/san-pham/${productSlug(data.title)}`,
    description,
    imageAlt: `${kind} ${data.title} chính hãng`,
    title,
  };
}
