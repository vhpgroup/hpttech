import { formatSlug } from "@/lib/payload/utils/slugify";
import { decodeHTML } from "entities";
import type { ProductSpec } from "./types";

export function cleanText(value?: string | null) {
  return decodeHTML(String(value || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function productSlug(title: string) {
  return formatSlug(title);
}

export function firstSentence(value?: string) {
  const text = cleanText(value);
  if (!text) return "";
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  return (match?.[1] || text).trim();
}

function normalizedText(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function matchingSpec(specs: ProductSpec[], patterns: RegExp[]) {
  return specs.find((spec) => {
    const label = normalizedText(spec.label);
    return patterns.some((pattern) => pattern.test(label));
  })?.value;
}

function supportedFeature(value?: string) {
  if (!value) return false;
  const normalized = normalizedText(value);
  return !/\b(khong|no|false|none)\b/.test(normalized);
}

function inferProductKind(title: string, specs: ProductSpec[]) {
  const text = normalizedText(`${title} ${specs.map((spec) => `${spec.label} ${spec.value}`).join(" ")}`);
  if (/\b(scan|scanner|may quet|adf|ocr)\b/.test(text)) return "máy scan";
  if (/\b(may in|printer|muc in|cartridge|toner)\b/.test(text)) return "máy in";
  if (/\b(camera|ip camera|cctv|dau ghi|nvr)\b/.test(text)) return "camera";
  if (/\b(router|switch|wifi|access point|poe|firewall|ethernet)\b/.test(text)) return "thiết bị mạng";
  if (/\b(laptop|pc|server|workstation|cpu|ram|ssd)\b/.test(text)) return "thiết bị máy tính";
  return "sản phẩm";
}

function productDisplayName(title: string) {
  const cleaned = cleanText(title).replace(/[.!?]+$/, "");
  const [beforeDash] = cleaned.split(/\s+[–-]\s+/);
  if (beforeDash && beforeDash.length >= 8 && beforeDash.length <= 80) {
    return beforeDash.trim();
  }
  return cleaned;
}

export function productShortDescription(title: string, specs: ProductSpec[]) {
  const productTitle = productDisplayName(title);
  if (!productTitle) return "";

  const kind = inferProductKind(productTitle, specs);
  const allSpecsText = normalizedText(
    specs.map((spec) => `${spec.label}: ${spec.value}`).join(" "),
  );
  const parts: string[] = [];
  const paperSize = matchingSpec(specs, [
    /kho giay/,
    /kho tai lieu/,
    /paper size/,
    /document size/,
  ]);
  const scannerType = matchingSpec(specs, [/loai may scan/, /scanner type/]);
  const adfValue = matchingSpec(specs, [/khay giay/, /khay nap/, /adf/]);
  const duplexValue = matchingSpec(specs, [
    /2 mat/,
    /hai mat/,
    /duplex/,
  ]);
  const speed = matchingSpec(specs, [
    /^toc do/,
    /scan speed/,
    /print speed/,
    /ppm/,
    /ipm/,
  ]);
  const connect = matchingSpec(specs, [/ket noi/, /giao tiep/, /interface/, /connect/]);

  if (paperSize) parts.push(`hỗ trợ ${cleanText(paperSize)}`);

  if (kind === "máy scan") {
    const normalizedType = normalizedText(scannerType || "");
    const hasFlatbed =
      normalizedType.includes("flatbed") ||
      /\b(flatbed|khay phang)\b/.test(allSpecsText);
    const hasAdf =
      normalizedType.includes("adf") ||
      (adfValue ? supportedFeature(adfValue) : /\badf\b/.test(allSpecsText));

    if (hasAdf && hasFlatbed) parts.push("kết hợp khay phẳng và ADF");
    else if (hasAdf) parts.push("trang bị ADF");
    else if (hasFlatbed) parts.push("trang bị khay quét phẳng");

    if (duplexValue && supportedFeature(duplexValue)) parts.push("quét hai mặt");
  } else if (duplexValue && supportedFeature(duplexValue)) {
    parts.push("xử lý hai mặt");
  }

  if (speed) parts.push(`tốc độ ${cleanText(speed)}`);
  if (connect) parts.push(`kết nối ${cleanText(connect)}`);

  return `${productTitle} là ${kind} chính hãng${parts.length ? `, ${parts.slice(0, 4).join(", ")}` : ""}, phù hợp cho nhu cầu sử dụng tại văn phòng, doanh nghiệp hoặc đơn vị cần thiết bị ổn định.`;
}

export function extractHighlightBulletPoints(value?: string) {
  const text = cleanText(value);
  const marker = text.match(/(?:điểm nổi bật|đặc điểm nổi bật|diem noi bat|dac diem noi bat)\s*[:：]?/i);
  if (!marker || marker.index === undefined) return [];

  return text
    .slice(marker.index + marker[0].length)
    .trim()
    .split(/\s+(?:[-•]|[0-9]+\.)\s+/)
    .map((item) => item.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function lexicalParagraphs(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => cleanText(paragraph))
    .filter(Boolean);

  return {
    root: {
      children: paragraphs.map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: paragraph,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      })),
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}
