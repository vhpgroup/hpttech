import { SOFTWARE_CATEGORY_NAME } from "./product-category.ts";

export const CATALOG_ADMIN_GROUP = "Catalog chuẩn";

export const PRODUCT_TYPE_OPTIONS = [
  { label: "Máy scan", value: "scanner" },
  { label: "Máy in", value: "printer" },
  { label: "Máy photocopy", value: "photocopier" },
  { label: "Laptop", value: "laptop" },
  { label: SOFTWARE_CATEGORY_NAME, value: "software" },
  { label: "Mực in & phụ kiện", value: "ink" },
  { label: "Thiết bị mạng", value: "networking" },
  { label: "Camera & Giám sát", value: "camera" },
  { label: "PC đồng bộ", value: "desktop-pc" },
  { label: "PC All-in-One", value: "all-in-one" },
  { label: "Mini PC - NUC", value: "mini-pc" },
  { label: "Máy trạm Workstation", value: "workstation" },
  { label: "Máy tính công nghiệp", value: "industrial-pc" },
  { label: "Máy chủ - Server", value: "server" },
  { label: "Linh kiện máy chủ", value: "server-component" },
  { label: "Khác", value: "other" },
] as const;

export const ATTRIBUTE_DATA_TYPE_OPTIONS = [
  { label: "Số", value: "number" },
  { label: "Văn bản", value: "text" },
  { label: "Có / Không", value: "boolean" },
  { label: "Một lựa chọn", value: "enum" },
  { label: "Nhiều lựa chọn", value: "enum_list" },
] as const;

export const ATTRIBUTE_UNIT_OPTIONS = [
  { label: "Không có đơn vị", value: "none" },
  { label: "Trang/phút (ppm)", value: "ppm" },
  { label: "Ảnh/phút (ipm)", value: "ipm" },
  { label: "Bản/phút (cpm)", value: "cpm" },
  { label: "Tờ", value: "sheets" },
  { label: "Trang/ngày", value: "pages_per_day" },
  { label: "Trang/tháng", value: "pages_per_month" },
  { label: "dpi", value: "dpi" },
  { label: "Milimét", value: "mm" },
  { label: "Inch", value: "inch" },
  { label: "Hertz", value: "hz" },
  { label: "Kilogram", value: "kg" },
  { label: "Megabyte", value: "mb" },
  { label: "Gigabyte", value: "gb" },
  { label: "Watt", value: "w" },
  { label: "Volt", value: "v" },
  { label: "Phần trăm", value: "percent" },
] as const;

export const CURRENCY_OPTIONS = [
  { label: "VND", value: "VND" },
  { label: "USD", value: "USD" },
] as const;

export const PRODUCT_STATUS_OPTIONS = [
  { label: "Bản nháp", value: "draft" },
  { label: "Đã xuất bản", value: "published" },
  { label: "Lưu trữ", value: "archived" },
] as const;

export type AttributeDataType =
  (typeof ATTRIBUTE_DATA_TYPE_OPTIONS)[number]["value"];

export function normalizeCatalogCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function validateCatalogCode(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "Mã không được để trống.";
  }
  if (!/^[a-z][a-z0-9_]*$/.test(value)) {
    return "Mã chỉ gồm chữ thường, số và dấu gạch dưới; phải bắt đầu bằng chữ.";
  }
  return true;
}

export function relationID(value: unknown): string | number | undefined {
  if (typeof value === "string" || typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" || typeof id === "number" ? id : undefined;
  }
  return undefined;
}

export function hasTypedAttributeValue(
  row: Record<string, unknown>,
  dataType: AttributeDataType,
) {
  if (dataType === "number") {
    return typeof row.numberValue === "number" && Number.isFinite(row.numberValue);
  }
  if (dataType === "boolean") return typeof row.booleanValue === "boolean";
  if (dataType === "enum_list") {
    return Array.isArray(row.enumListValue) && row.enumListValue.length > 0;
  }
  const key = dataType === "enum" ? "enumValue" : "textValue";
  return typeof row[key] === "string" && Boolean(row[key].trim());
}
