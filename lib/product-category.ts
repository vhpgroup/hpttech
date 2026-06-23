import { formatSlug } from "@/lib/payload/utils/slugify";

export const SOFTWARE_CATEGORY_NAME = "Phần mềm bản quyền";
export const SOFTWARE_CATEGORY_SLUG = "phan-mem-ban-quyen";
export const PRINTER_CATEGORY_NAME = "Máy in";
export const PRINTER_CATEGORY_SLUG = "may-in";
export const SCANNER_CATEGORY_NAME = "Máy scan";
export const SCANNER_CATEGORY_SLUG = "may-scan";
export const PHOTOCOPIER_CATEGORY_NAME = "Máy photocopy";
export const PHOTOCOPIER_CATEGORY_SLUG = "may-photocopy";
export const LAPTOP_CATEGORY_NAME = "Laptop";
export const LAPTOP_CATEGORY_SLUG = "laptop";
export const LAPTOP_GAMING_CATEGORY_NAME = "Laptop Gaming - Đồ Họa";
export const LAPTOP_GAMING_CATEGORY_SLUG = "laptop-gaming-do-hoa";

export function normalizeCategoryText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\?+/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
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

export function isLaptopGamingCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "laptop gaming do hoa" ||
    normalized === "laptop gaming h a" ||
    normalized === "laptop gaming ha" ||
    (normalized.startsWith("laptop gaming") && /\bdo\s*hoa\b/.test(normalized))
  );
}

export function isLaptopCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "laptop" ||
    normalized === "notebook" ||
    normalized === "may tinh xach tay" ||
    normalized === "laptop gaming" ||
    isLaptopGamingCategoryValue(value)
  );
}

export function canonicalizeCategoryName(value?: string) {
  if (isSoftwareCategoryValue(value)) return SOFTWARE_CATEGORY_NAME;
  if (isPrinterCategoryValue(value)) return PRINTER_CATEGORY_NAME;
  if (isScannerCategoryValue(value)) return SCANNER_CATEGORY_NAME;
  if (isPhotocopierCategoryValue(value)) return PHOTOCOPIER_CATEGORY_NAME;
  if (isLaptopGamingCategoryValue(value)) return LAPTOP_GAMING_CATEGORY_NAME;
  if (isLaptopCategoryValue(value)) return LAPTOP_CATEGORY_NAME;
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
  if (isLaptopGamingCategoryValue(slug) || isLaptopGamingCategoryValue(name)) {
    return LAPTOP_GAMING_CATEGORY_SLUG;
  }
  if (isLaptopCategoryValue(slug) || isLaptopCategoryValue(name)) {
    return LAPTOP_CATEGORY_SLUG;
  }

  const cleanedSlug = (slug || "").trim();
  if (cleanedSlug) return cleanedSlug;

  const cleanedName = canonicalizeCategoryName(name);
  return cleanedName ? formatSlug(cleanedName) : "";
}
