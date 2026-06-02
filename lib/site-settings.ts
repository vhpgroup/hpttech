import type { PublicSiteSettings } from "@/lib/content-payload";

export const defaultSiteSettings: Required<PublicSiteSettings> = {
  companyName: "HPT Tech",
  phone: "0876 645 432",
  hotline: "0876 645 432",
  email: "lienhe@hpttech.vn",
  address: "Tư vấn và triển khai cho doanh nghiệp",
  facebook: "https://www.facebook.com/solarangelx9/",
  zalo: "https://zalo.me/0876645432",
  youtube: "",
  googleAnalyticsId: "",
  googleTagManagerId: "",
  footerNote: "Thiết bị văn phòng, máy scan, máy in và giải pháp số hóa tài liệu cho doanh nghiệp.",
};

export function normalizeSiteSettings(settings?: PublicSiteSettings | null): Required<PublicSiteSettings> {
  return {
    ...defaultSiteSettings,
    ...Object.fromEntries(
      Object.entries(settings || {}).filter(([, value]) => value !== null && value !== undefined && value !== ""),
    ),
  };
}

export function phoneHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

export function quoteMailHref(email: string, subject = "Yêu cầu báo giá HPT Tech") {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
