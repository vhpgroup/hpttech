import { SOFTWARE_CATEGORY_NAME } from "@/lib/product-category";

export const CATALOG_ADMIN_GROUP = "Catalog chuan";

export const PRODUCT_TYPE_OPTIONS = [
  { label: "May scan", value: "scanner" },
  { label: "May in", value: "printer" },
  { label: "May photocopy", value: "photocopier" },
  { label: "Laptop", value: "laptop" },
  { label: SOFTWARE_CATEGORY_NAME, value: "software" },
  { label: "Muc in & phu kien", value: "ink" },
  { label: "Khac", value: "other" },
] as const;

export const ATTRIBUTE_DATA_TYPE_OPTIONS = [
  { label: "So", value: "number" },
  { label: "Van ban", value: "text" },
  { label: "Co / Khong", value: "boolean" },
  { label: "Mot lua chon", value: "enum" },
  { label: "Nhieu lua chon", value: "enum_list" },
] as const;

export const ATTRIBUTE_UNIT_OPTIONS = [
  { label: "Khong co don vi", value: "none" },
  { label: "Trang/phut (ppm)", value: "ppm" },
  { label: "Anh/phut (ipm)", value: "ipm" },
  { label: "Ban/phut (cpm)", value: "cpm" },
  { label: "To", value: "sheets" },
  { label: "Trang/ngay", value: "pages_per_day" },
  { label: "Trang/thang", value: "pages_per_month" },
  { label: "dpi", value: "dpi" },
  { label: "Millimet", value: "mm" },
  { label: "Inch", value: "inch" },
  { label: "Hertz", value: "hz" },
  { label: "Kilogram", value: "kg" },
  { label: "Megabyte", value: "mb" },
  { label: "Gigabyte", value: "gb" },
  { label: "Watt", value: "w" },
  { label: "Volt", value: "v" },
  { label: "Phan tram", value: "percent" },
] as const;

export const CURRENCY_OPTIONS = [
  { label: "VND", value: "VND" },
  { label: "USD", value: "USD" },
] as const;

export const PRODUCT_STATUS_OPTIONS = [
  { label: "Ban nhap", value: "draft" },
  { label: "Da xuat ban", value: "published" },
  { label: "Luu tru", value: "archived" },
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
    return "Ma khong duoc de trong.";
  }
  if (!/^[a-z][a-z0-9_]*$/.test(value)) {
    return "Ma chi gom chu thuong, so va dau gach duoi; phai bat dau bang chu.";
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
