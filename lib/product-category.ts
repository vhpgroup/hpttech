import { formatSlug } from "@/lib/payload/utils/slugify";

export const SOFTWARE_CATEGORY_NAME = "Phần mềm bản quyền";
export const SOFTWARE_CATEGORY_SLUG = "phan-mem-ban-quyen";
export const INK_CATEGORY_NAME = "Mực in & Phụ kiện";
export const INK_CATEGORY_SLUG = "muc-in-phu-kien";
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
export const PC_SERVER_ROOT_CATEGORY_NAME = "Máy tính đồng bộ - Máy chủ";
export const PC_SERVER_ROOT_CATEGORY_SLUG = "may-tinh-dong-bo-may-chu";
export const DESKTOP_PC_CATEGORY_NAME = "PC đồng bộ";
export const DESKTOP_PC_CATEGORY_SLUG = "pc-dong-bo";
export const ALL_IN_ONE_CATEGORY_NAME = "PC All-in-One";
export const ALL_IN_ONE_CATEGORY_SLUG = "pc-all-in-one";
export const MINI_PC_CATEGORY_NAME = "Mini PC - NUC";
export const MINI_PC_CATEGORY_SLUG = "mini-pc-nuc";
export const WORKSTATION_CATEGORY_NAME = "Máy trạm Workstation";
export const WORKSTATION_CATEGORY_SLUG = "may-tram-workstation";
export const INDUSTRIAL_PC_CATEGORY_NAME = "Máy tính công nghiệp";
export const INDUSTRIAL_PC_CATEGORY_SLUG = "may-tinh-cong-nghiep";
export const SERVER_CATEGORY_NAME = "Máy chủ - Server";
export const SERVER_CATEGORY_SLUG = "may-chu-server";
export const SERVER_COMPONENT_CATEGORY_NAME = "Linh kiện máy chủ";
export const SERVER_COMPONENT_CATEGORY_SLUG = "linh-kien-may-chu";

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

export function isInkCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "muc in" ||
    normalized === "muc in phu kien" ||
    normalized === "muc in vat tu" ||
    normalized === "hop muc" ||
    normalized === "toner" ||
    normalized === "cartridge" ||
    normalized === "phu kien" ||
    normalized === "linh kien phu kien"
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

export function isDesktopPcCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "pc dong bo" ||
    normalized === "may tinh dong bo" ||
    normalized === "may tinh de ban" ||
    normalized === "desktop" ||
    normalized === "desktop pc"
  );
}

export function isAllInOneCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "pc all in one" ||
    normalized === "all in one" ||
    normalized === "aio" ||
    normalized === "may tinh all in one"
  );
}

export function isMiniPcCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "mini pc nuc" ||
    normalized === "mini pc" ||
    normalized === "pc mini" ||
    normalized === "nuc" ||
    normalized === "asus nuc" ||
    normalized === "pc mini asus nuc"
  );
}

export function isWorkstationCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "may tram workstation" ||
    normalized === "may tram" ||
    normalized === "workstation" ||
    normalized === "may tinh tram"
  );
}

export function isIndustrialPcCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "may tinh cong nghiep" || normalized === "industrial pc"
  );
}

export function isServerComponentCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "linh kien may chu" ||
    normalized === "linh kien server" ||
    normalized === "server component"
  );
}

export function isServerCategoryValue(value?: string) {
  const normalized = normalizeCategoryText(value);
  return (
    normalized === "may chu server" ||
    normalized === "may chu" ||
    normalized === "server"
  );
}

export function canonicalizeCategoryName(value?: string) {
  if (isSoftwareCategoryValue(value)) return SOFTWARE_CATEGORY_NAME;
  if (isInkCategoryValue(value)) return INK_CATEGORY_NAME;
  if (isPrinterCategoryValue(value)) return PRINTER_CATEGORY_NAME;
  if (isScannerCategoryValue(value)) return SCANNER_CATEGORY_NAME;
  if (isPhotocopierCategoryValue(value)) return PHOTOCOPIER_CATEGORY_NAME;
  if (isLaptopGamingCategoryValue(value)) return LAPTOP_GAMING_CATEGORY_NAME;
  if (isLaptopCategoryValue(value)) return LAPTOP_CATEGORY_NAME;
  if (isDesktopPcCategoryValue(value)) return DESKTOP_PC_CATEGORY_NAME;
  if (isAllInOneCategoryValue(value)) return ALL_IN_ONE_CATEGORY_NAME;
  if (isMiniPcCategoryValue(value)) return MINI_PC_CATEGORY_NAME;
  if (isWorkstationCategoryValue(value)) return WORKSTATION_CATEGORY_NAME;
  if (isIndustrialPcCategoryValue(value)) return INDUSTRIAL_PC_CATEGORY_NAME;
  if (isServerComponentCategoryValue(value)) return SERVER_COMPONENT_CATEGORY_NAME;
  if (isServerCategoryValue(value)) return SERVER_CATEGORY_NAME;
  return (value || "").trim();
}

export function canonicalizeCategorySlug(slug?: string, name?: string) {
  if (isSoftwareCategoryValue(slug) || isSoftwareCategoryValue(name)) {
    return SOFTWARE_CATEGORY_SLUG;
  }
  if (isInkCategoryValue(slug) || isInkCategoryValue(name)) {
    return INK_CATEGORY_SLUG;
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
  if (isDesktopPcCategoryValue(slug) || isDesktopPcCategoryValue(name)) {
    return DESKTOP_PC_CATEGORY_SLUG;
  }
  if (isAllInOneCategoryValue(slug) || isAllInOneCategoryValue(name)) {
    return ALL_IN_ONE_CATEGORY_SLUG;
  }
  if (isMiniPcCategoryValue(slug) || isMiniPcCategoryValue(name)) {
    return MINI_PC_CATEGORY_SLUG;
  }
  if (isWorkstationCategoryValue(slug) || isWorkstationCategoryValue(name)) {
    return WORKSTATION_CATEGORY_SLUG;
  }
  if (isIndustrialPcCategoryValue(slug) || isIndustrialPcCategoryValue(name)) {
    return INDUSTRIAL_PC_CATEGORY_SLUG;
  }
  if (
    isServerComponentCategoryValue(slug) ||
    isServerComponentCategoryValue(name)
  ) {
    return SERVER_COMPONENT_CATEGORY_SLUG;
  }
  if (isServerCategoryValue(slug) || isServerCategoryValue(name)) {
    return SERVER_CATEGORY_SLUG;
  }

  const cleanedSlug = (slug || "").trim();
  if (cleanedSlug) return cleanedSlug;

  const cleanedName = canonicalizeCategoryName(name);
  return cleanedName ? formatSlug(cleanedName) : "";
}
