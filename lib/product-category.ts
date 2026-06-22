import { formatSlug } from "@/lib/payload/utils/slugify";

export const SOFTWARE_CATEGORY_NAME = "Phần mềm bản quyền";
export const SOFTWARE_CATEGORY_SLUG = "phan-mem-ban-quyen";
export const PRINTER_CATEGORY_NAME = "Máy in";
export const PRINTER_CATEGORY_SLUG = "may-in";
export const SCANNER_CATEGORY_NAME = "Máy scan";
export const SCANNER_CATEGORY_SLUG = "may-scan";
export const PHOTOCOPIER_CATEGORY_NAME = "Máy photocopy";
export const PHOTOCOPIER_CATEGORY_SLUG = "may-photocopy";

export function normalizeCategoryText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[-_]+/g, " ")
    .trim()
    .toLowerCase();
}

export function isSoftwareCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "phan mem" ||
    normalized === "phan mem ban quyen" ||
    normalized === "software"
  );
}

function isPrinterCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "may in" ||
    normalized === "printer" ||
    normalized === "may in theo chuc nang" ||
    normalized === "may in cac hang"
  );
}

function isScannerCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return normalized === "may scan" || normalized === "scanner";
}

function isPhotocopierCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "may photocopy" ||
    normalized === "photocopier" ||
    normalized === "copier"
  );
}

export function canonicalizeCategoryName(value?: string) {
  if (isSoftwareCategoryValue(value)) return SOFTWARE_CATEGORY_NAME;
  if (isPrinterCategoryValue(value)) return PRINTER_CATEGORY_NAME;
  if (isScannerCategoryValue(value)) return SCANNER_CATEGORY_NAME;
  if (isPhotocopierCategoryValue(value)) return PHOTOCOPIER_CATEGORY_NAME;
  return (value || "").trim();
}

export function canonicalizeCategorySlug(slug?: string, name?: string) {
  if (isSoftwareCategoryValue(slug) || isSoftwareCategoryValue(name)) {
    return SOFTWARE_CATEGORY_SLUG;
  }
  if (isPrinterCategoryValue(slug) || isPrinterCategoryValue(name)) {
    return PRINTER_CATEGORY_SLUG;
  }
  if (isScannerCategoryValue(slug) || isScannerCategoryValue(name)) {
    return SCANNER_CATEGORY_SLUG;
  }
  if (isPhotocopierCategoryValue(slug) || isPhotocopierCategoryValue(name)) {
    return PHOTOCOPIER_CATEGORY_SLUG;
  }

  const cleanedSlug = (slug || "").trim();
  if (cleanedSlug) return cleanedSlug;

  const cleanedName = canonicalizeCategoryName(name);
  return cleanedName ? formatSlug(cleanedName) : "";
}
