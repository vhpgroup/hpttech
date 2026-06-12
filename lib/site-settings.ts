import type { PublicSiteSettings } from "@/lib/content-payload";

export const defaultSiteSettings: Required<PublicSiteSettings> = {
  companyName: "HPT Tech",
  phone: "0918 87 14 14",
  hotline: "0918 87 14 14",
  email: "lienhe@hpttech.vn",
  address: "Tư vấn và triển khai cho doanh nghiệp",
  facebook: "https://www.facebook.com/solarangelx9/",
  zalo: "https://zalo.me/0918871414",
  youtube: "",
  googleMapsTitle: "Vị trí HPT Tech",
  googleMapsEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d8869.68045157909!2d106.68996330454054!3d20.821962434073413!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a7155698f3c69%3A0x95aed3909eec7d29!2sHPT%20Tech!5e0!3m2!1svi!2s!4v1780717662780!5m2!1svi!2s",
  googleMapsDirectionsUrl: "https://www.google.com/maps/search/?api=1&query=HPT%20Tech",
  googleAnalyticsId: "",
  googleTagManagerId: "",
  footerNote: "Thiết bị văn phòng, máy scan, máy in và giải pháp số hóa tài liệu cho doanh nghiệp.",
};

const publicPhone = "0918 87 14 14";

export function normalizeSiteSettings(settings?: PublicSiteSettings | null): Required<PublicSiteSettings> {
  const normalized = {
    ...defaultSiteSettings,
    ...Object.fromEntries(
      Object.entries(settings || {}).filter(([, value]) => value !== null && value !== undefined && value !== ""),
    ),
  };

  return {
    ...normalized,
    phone: publicPhone,
    hotline: publicPhone,
  };
}

export function formatPhoneDisplay(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  return value.trim();
}

export function phoneHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

export function quoteMailHref(email: string, subject = "Yêu cầu báo giá HPT Tech") {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}
