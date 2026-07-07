import {
  ALL_IN_ONE_CATEGORY_NAME,
  DESKTOP_PC_CATEGORY_NAME,
  INDUSTRIAL_PC_CATEGORY_NAME,
  MINI_PC_CATEGORY_NAME,
  SERVER_CATEGORY_NAME,
  SERVER_COMPONENT_CATEGORY_NAME,
  WORKSTATION_CATEGORY_NAME,
} from "../product-category.ts";

/**
 * Taxonomy dùng chung cho nhánh "Máy tính đồng bộ - Máy chủ" (nguồn anphatpc).
 * Module này PURE (không import Payload/DB) để verifier chạy được offline.
 *
 * Nguyên tắc: trên An Phát, CPU/RAM/Ổ cứng/Màn hình là facet `?filter=` —
 * KHÔNG phải danh mục. Chỉ các trang danh mục thật mới map vào các code dưới đây.
 */

export type PcServerTypeCode =
  | "desktop-pc"
  | "all-in-one"
  | "mini-pc"
  | "workstation"
  | "industrial-pc"
  | "server"
  | "server-component";

export const PC_FAMILY_TYPE_CODES: ReadonlySet<string> = new Set([
  "desktop-pc",
  "all-in-one",
  "mini-pc",
  "workstation",
  "industrial-pc",
]);

export const SERVER_FAMILY_TYPE_CODES: ReadonlySet<string> = new Set([
  "server",
  "server-component",
]);

export const PC_SERVER_TYPE_CODES: ReadonlySet<string> = new Set([
  ...PC_FAMILY_TYPE_CODES,
  ...SERVER_FAMILY_TYPE_CODES,
]);

const CATEGORY_NAME_BY_TYPE: Record<PcServerTypeCode, string> = {
  "all-in-one": ALL_IN_ONE_CATEGORY_NAME,
  "desktop-pc": DESKTOP_PC_CATEGORY_NAME,
  "industrial-pc": INDUSTRIAL_PC_CATEGORY_NAME,
  "mini-pc": MINI_PC_CATEGORY_NAME,
  server: SERVER_CATEGORY_NAME,
  "server-component": SERVER_COMPONENT_CATEGORY_NAME,
  workstation: WORKSTATION_CATEGORY_NAME,
};

export function pcServerCategoryNameForType(productTypeCode: string) {
  return PC_SERVER_TYPE_CODES.has(productTypeCode)
    ? CATEGORY_NAME_BY_TYPE[productTypeCode as PcServerTypeCode]
    : undefined;
}

function normalizeDetectionText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const SERVER_COMPONENT_HEAD_PATTERN =
  /^(cpu|ram|hdd|ssd|o cung|vga|card|raid|mainboard|bo mach|nguon|psu|linh kien)\b/;

/**
 * Nhận diện loại sản phẩm PC/Server từ tên danh mục, tên sản phẩm hoặc title+URL.
 *
 * Trả về undefined khi văn bản nhắc tới laptop hoặc phần mềm/bản quyền —
 * các rule sẵn có (laptop, software) phải được ưu tiên xử lý những trường hợp đó
 * (tránh bẫy "Windows Server 2022" → server, "Laptop ... Workstation" → workstation).
 */
export function detectPcServerTypeCode(
  value: string,
): PcServerTypeCode | undefined {
  const text = normalizeDetectionText(value);
  if (!text) return undefined;

  const mentionsLaptop =
    /\b(laptop|notebook)\b/.test(text) || text.includes("may tinh xach tay");
  const mentionsSoftwareLicense =
    text.includes("phan mem") ||
    text.includes("software") ||
    text.includes("ban quyen") ||
    text.includes("license") ||
    text.includes("windows server") ||
    text.includes("sql server");
  if (mentionsLaptop || mentionsSoftwareLicense) return undefined;

  if (text.includes("may tinh cong nghiep") || text.includes("industrial pc")) {
    return "industrial-pc";
  }
  if (
    /\bnuc\b/.test(text) ||
    text.includes("mini pc") ||
    text.includes("pc mini") ||
    text.includes("may tinh mini")
  ) {
    return "mini-pc";
  }
  if (
    !text.includes("may in") &&
    !text.includes("printer") &&
    (text.includes("all in one") || /\baio\b/.test(text))
  ) {
    return "all-in-one";
  }
  if (text.includes("may tram") || text.includes("workstation")) {
    return "workstation";
  }
  // "sever": typo cố hữu của An Phát trên các trang linh kiện máy chủ
  // (h1 "Ram for Sever", slug ram-sever/hdd-for-sever/... — xác nhận live 2026-07-07).
  const mentionsServer =
    text.includes("may chu") || /\b(server|sever|xeon)\b/.test(text);
  if (mentionsServer) {
    const isComponent =
      SERVER_COMPONENT_HEAD_PATTERN.test(text) ||
      text.includes("linh kien may chu") ||
      text.includes("linh kien server") ||
      text.includes("server component");
    return isComponent ? "server-component" : "server";
  }
  if (
    text.includes("may tinh dong bo") ||
    text.includes("pc dong bo") ||
    text.includes("may tinh de ban") ||
    /\bdesktop\b/.test(text) ||
    /\bpc (hp|dell|lenovo|asus|acer)\b/.test(text)
  ) {
    return "desktop-pc";
  }
  return undefined;
}
