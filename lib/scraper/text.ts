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

export function productShortDescription(title: string, specs: ProductSpec[]) {
  const productTitle = cleanText(title).replace(/[.!?]+$/, "");
  if (!productTitle) return "";

  const allSpecsText = normalizedText(
    specs.map((spec) => `${spec.label}: ${spec.value}`).join(" "),
  );
  const isScanner =
    /\b(scan|scanner|may quet)\b/.test(normalizedText(productTitle)) ||
    /\b(toc do quet|toc do scan|adf|duplex)\b/.test(allSpecsText);

  if (!isScanner) {
    return `${productTitle} là sản phẩm chính hãng với thông tin và thông số kỹ thuật được cập nhật từ nhà cung cấp.`;
  }

  const paperSizeValue = matchingSpec(specs, [
    /kho giay toi da/,
    /kho giay ho tro/,
    /kho tai lieu/,
    /document size/,
    /paper size/,
  ]);
  const paperSize =
    cleanText(paperSizeValue).match(/\b(A[0-9]|Legal)\b/i)?.[1]?.toUpperCase() ||
    "";
  const scannerType = matchingSpec(specs, [/loai may scan/, /scanner type/]);
  const adfValue = matchingSpec(specs, [
    /khay giay vao/,
    /khay nap/,
    /cong suat adf/,
    /\badf\b/,
  ]);
  const duplexValue = matchingSpec(specs, [
    /quet 2 mat/,
    /quet hai mat/,
    /scan 2 mat/,
    /scan hai mat/,
    /duplex/,
  ]);
  const speed = matchingSpec(specs, [
    /^toc do quet$/,
    /^toc do scan$/,
    /scan speed/,
  ]);

  const capabilities: string[] = [];
  const normalizedType = normalizedText(scannerType || "");
  const hasFlatbed =
    normalizedType.includes("flatbed") ||
    /\b(flatbed|khay phang)\b/.test(allSpecsText);
  const hasAdf =
    normalizedType.includes("adf") ||
    (adfValue ? supportedFeature(adfValue) : /\badf\b/.test(allSpecsText));

  if (hasAdf && hasFlatbed) {
    capabilities.push("kết hợp khay phẳng và nạp giấy tự động ADF");
  } else if (hasAdf) {
    capabilities.push("trang bị khay nạp giấy tự động ADF");
  } else if (hasFlatbed) {
    capabilities.push("trang bị khay quét phẳng");
  }
  const hasDuplex = duplexValue
    ? supportedFeature(duplexValue)
    : /\b(quet (?:2|hai) mat|scan (?:2|hai) mat|duplex)\b/.test(allSpecsText);
  if (hasDuplex) {
    capabilities.push("hỗ trợ quét hai mặt");
  }
  if (speed) {
    const speedText = cleanText(speed);
    capabilities.push(
      `tốc độ ${/^\d+(?:[.,]\d+)?$/.test(speedText) ? `${speedText} trang/phút` : speedText}`,
    );
  }

  const category = `máy scan tài liệu${paperSize ? ` ${paperSize}` : ""}`;
  return `${productTitle} là ${category}${capabilities.length ? `, ${capabilities.join(", ")}` : ""}.`;
}

export function extractHighlightBulletPoints(value?: string) {
  const text = cleanText(value);
  const marker = text.match(/(?:điểm nổi bật|diem noi bat)\s*[:：]?/i);
  if (!marker || marker.index === undefined) return [];

  return text
    .slice(marker.index + marker[0].length)
    .trim()
    .split(/\s+-\s+/)
    .map((item) => item.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 7);
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
