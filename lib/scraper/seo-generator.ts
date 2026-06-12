import { productSlug, truncate } from "./text";
import type { ExtractedProductData, SeoPreview } from "./types";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function inferProductKind(title: string) {
  const lower = normalize(title);
  if (lower.includes("scanner") || lower.includes("scan")) return "Máy scan";
  if (lower.includes("muc") || lower.includes("cartridge")) return "Mực in";
  if (lower.includes("may in") || lower.includes("printer")) return "Máy in";
  return "Thiết bị văn phòng";
}

function specValue(data: ExtractedProductData, patterns: RegExp[]) {
  return data.specs.find((spec) => {
    const label = normalize(spec.label);
    return patterns.some((pattern) => pattern.test(label));
  })?.value;
}

function titleBenefit(data: ExtractedProductData) {
  const speed = specValue(data, [/toc do/, /scan speed/, /print speed/]);
  const paper = specValue(data, [/kho giay/, /kho tai lieu/, /paper size/, /document size/]);
  const duplex = specValue(data, [
    /quet (?:2|hai) mat/,
    /scan (?:2|hai) mat/,
    /duplex/,
    /in (?:2|hai) mat/,
  ]);
  const parts = [
    paper ? `hỗ trợ ${paper}` : undefined,
    duplex ? "xử lý hai mặt" : undefined,
    speed ? `tốc độ ${speed}` : undefined,
  ].filter((item): item is string => Boolean(item));
  return parts.length ? parts.slice(0, 2).join(", ") : "phù hợp nhiều nhu cầu sử dụng";
}

export function generateSeo(data: ExtractedProductData, brandName: string): SeoPreview {
  const kind = inferProductKind(data.title);
  const skuText = data.sku && !data.title.toLowerCase().includes(data.sku.toLowerCase())
    ? ` ${data.sku}`
    : "";
  const title = truncate(`${kind} ${data.title}${skuText} - ${titleBenefit(data)}`, 68);
  const description = truncate(
    `${data.title} ${brandName} chính hãng, có thông số kỹ thuật rõ ràng, hình ảnh sản phẩm, tư vấn chọn cấu hình và báo giá tại HPT Tech.`,
    158,
  );

  return {
    canonical: `/san-pham/${productSlug(data.title)}`,
    description,
    imageAlt: `${kind} ${data.title} chính hãng`,
    title,
  };
}
