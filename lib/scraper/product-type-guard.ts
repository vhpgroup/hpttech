import { commonProductTypeCode } from "./db-lookup";
import type { ScrapedProduct } from "./types";

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function inferScrapedProductType(product: ScrapedProduct) {
  const text = normalized(
    [
      product.data.title,
      product.data.description || "",
      ...product.data.specs.map((spec) => `${spec.label} ${spec.value}`),
    ].join(" "),
  );
  if (/\b(photocopy|copier|sao chup|copy speed)\b/.test(text)) {
    return "photocopier";
  }
  if (/\b(may in|printer|print speed|muc in|toner|cartridge)\b/.test(text)) {
    return "printer";
  }
  if (/\b(may scan|scanner|scan speed|adf|ocr)\b/.test(text)) return "scanner";
  if (/\b(camera|ptz|cmos|nvr|dau ghi|hong ngoai)\b/.test(text)) return "camera";
  if (/\b(router|switch|wifi|access point|poe|firewall|ethernet|card mang|thiet bi mang|bo phat|chia mang|can bang tai|load balancer)\b/.test(text)) {
    return "networking";
  }
  if (
    /\b(phan mem|software|license|ban quyen|office|windows|antivirus|kaspersky|autodesk|autocad|adobe|microsoft 365|m365)\b/.test(
      text,
    )
  ) {
    return "software";
  }
  return undefined;
}

export function validateExpectedProductType(
  expectedProductType: string,
  product: ScrapedProduct,
) {
  const expected = commonProductTypeCode(expectedProductType);
  const actual = inferScrapedProductType(product);
  const compatible =
    expected === actual ||
    (expected === "networking" && actual === "networking") ||
    (expected === "camera" && actual === "camera");
  if (expected && actual && !compatible) {
    throw new Error(
      `Sai loại sản phẩm: yêu cầu ${expected}, nguồn trả về ${actual} (${product.source.url}).`,
    );
  }
}
