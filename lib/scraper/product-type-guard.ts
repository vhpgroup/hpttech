import { commonProductTypeCode } from "./db-lookup";
import {
  detectPcServerTypeCode,
  PC_FAMILY_TYPE_CODES,
  SERVER_FAMILY_TYPE_CODES,
} from "./pc-server-taxonomy";
import type { ScrapedProduct } from "./types";

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

export function inferScrapedProductType(product: ScrapedProduct) {
  const titleAndUrl = normalized([product.data.title, product.source.url].join(" "));
  const text = normalized(
    [
      product.data.title,
      product.data.description || "",
      product.source.url,
      ...product.data.specs.map((spec) => `${spec.label} ${spec.value}`),
    ].join(" "),
  );
  if (/\b(may scan|scanner|scanjet|scansnap|may-scan|scan)\b/.test(titleAndUrl)) {
    return "scanner";
  }
  // PC/Server: nhận diện theo title+URL (tín hiệu mạnh) TRƯỚC các rule full-text,
  // vì trang PC/máy chủ luôn chứa "intel core/ssd/ddr" và sẽ dính bẫy rule laptop.
  const pcServerType = detectPcServerTypeCode(titleAndUrl);
  if (pcServerType) return pcServerType;
  if (/\b(photocopy|copier|sao chup|copy speed)\b/.test(text)) {
    return "photocopier";
  }
  if (/\b(may scan|scanner|scan speed|adf|ocr)\b/.test(text)) return "scanner";
  if (/\b(muc in|muc may in|hop muc|toner|cartridge|drum|muc photo|vat tu may in|phu kien may in|linh kien may in)\b/.test(text)) {
    return "ink";
  }
  if (/\b(may in|printer|print speed)\b/.test(text)) {
    return "printer";
  }
  if (/\b(laptop|notebook|rtx|geforce|intel core|amd ryzen|ssd|ddr|wuxga)\b/.test(text)) {
    return "laptop";
  }
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
  const sameFamily =
    expected !== undefined &&
    actual !== undefined &&
    ((PC_FAMILY_TYPE_CODES.has(expected) && PC_FAMILY_TYPE_CODES.has(actual)) ||
      (SERVER_FAMILY_TYPE_CODES.has(expected) &&
        SERVER_FAMILY_TYPE_CODES.has(actual)));
  const compatible =
    expected === actual ||
    sameFamily ||
    (expected === "networking" && actual === "networking") ||
    (expected === "camera" && actual === "camera");
  if (expected && actual && !compatible) {
    throw new Error(
      `Sai loại sản phẩm: yêu cầu ${expected}, nguồn trả về ${actual} (${product.source.url}).`,
    );
  }
}
