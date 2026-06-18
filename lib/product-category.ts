import { formatSlug } from "@/lib/payload/utils/slugify";

export const SOFTWARE_CATEGORY_NAME = "Phần mềm bản quyền";
export const SOFTWARE_CATEGORY_SLUG = "phan-mem-ban-quyen";

export function normalizeCategoryText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
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

export function canonicalizeCategoryName(value?: string) {
  if (isSoftwareCategoryValue(value)) return SOFTWARE_CATEGORY_NAME;
  return (value || "").trim();
}

export function canonicalizeCategorySlug(slug?: string, name?: string) {
  if (isSoftwareCategoryValue(slug) || isSoftwareCategoryValue(name)) {
    return SOFTWARE_CATEGORY_SLUG;
  }

  const cleanedSlug = (slug || "").trim();
  if (cleanedSlug) return cleanedSlug;

  const cleanedName = canonicalizeCategoryName(name);
  return cleanedName ? formatSlug(cleanedName) : "";
}
