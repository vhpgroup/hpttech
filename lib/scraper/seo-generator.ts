import { productSlug, truncate } from "./text";
import type { ExtractedProductData, SeoPreview } from "./types";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function inferProductKind(title: string, specsText = "") {
  const lower = normalize(`${title} ${specsText}`);
  if (/\b(scan|scanner|may quet|adf|ocr)\b/.test(lower)) return "Máy scan";
  if (/\b(may in|printer|muc in|toner|cartridge)\b/.test(lower)) return "Máy in";
  if (/\b(camera|ip camera|cctv|dau ghi|nvr)\b/.test(lower)) return "Camera";
  if (/\b(router|switch|wifi|access point|poe|firewall|ethernet)\b/.test(lower)) return "Thiết bị mạng";
  if (/\b(laptop|pc|server|workstation|cpu|ram|ssd)\b/.test(lower)) return "Thiết bị máy tính";
  return "Sản phẩm";
}

function specValue(data: ExtractedProductData, patterns: RegExp[]) {
  return data.specs.find((spec) => {
    const label = normalize(spec.label);
    return patterns.some((pattern) => pattern.test(label));
  })?.value;
}

function titleBenefit(data: ExtractedProductData) {
  const speed = specValue(data, [/toc do/, /speed/, /ppm/, /ipm/]);
  const paper = specValue(data, [/kho giay/, /kho tai lieu/, /paper size/, /document size/]);
  const connect = specValue(data, [/ket noi/, /giao tiep/, /interface/, /connect/]);
  const parts = [
    speed ? `tốc độ ${speed}` : undefined,
    paper ? `hỗ trợ ${paper}` : undefined,
    connect ? `kết nối ${connect}` : undefined,
  ].filter((item): item is string => Boolean(item));
  return parts.length ? parts.slice(0, 2).join(", ") : "chính hãng";
}

function productDisplayName(title: string) {
  const cleaned = title.trim().replace(/[.!?]+$/, "");
  const [beforeDash] = cleaned.split(/\s+[–-]\s+/);
  if (beforeDash && beforeDash.length >= 8 && beforeDash.length <= 80) {
    return beforeDash.trim();
  }
  return cleaned;
}

function metaTitle(data: ExtractedProductData, kind: string) {
  const name = productDisplayName(data.title);
  const normalizedName = normalize(name);
  const prefix = normalizedName.includes(normalize(kind)) ? name : `${kind} ${name}`;
  const base = `${prefix} chính hãng | HPT Tech`;
  if (base.length >= 55 && base.length <= 65) return base;
  const withQuote = `${prefix} | Báo giá HPT Tech`;
  if (withQuote.length <= 65) return withQuote;
  const compact = `${prefix} chính hãng`;
  if (compact.length <= 65) return compact;
  return truncate(prefix, 65);
}

function metaDescription(data: ExtractedProductData, brandName: string) {
  const name = productDisplayName(data.title);
  const description = `${name} ${brandName} chính hãng, ${titleBenefit(data)}. Xem thông số, hình ảnh và nhận tư vấn báo giá tại HPT Tech.`;
  return truncate(description, 160);
}

export function generateSeo(data: ExtractedProductData, brandName: string): SeoPreview {
  const specsText = data.specs.map((spec) => `${spec.label} ${spec.value}`).join(" ");
  const kind = inferProductKind(data.title, specsText);

  return {
    canonical: `/san-pham/${productSlug(data.title)}`,
    description: metaDescription(data, brandName),
    imageAlt: `${data.title} chính hãng`,
    title: metaTitle(data, kind),
  };
}
