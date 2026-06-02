import type { GlobalConfig } from "payload";
import { revalidateGlobal } from "../lib/payload/hooks/revalidate.ts";
import { defaultSiteSettings } from "../lib/site-settings.ts";

function applyDefaultSettings(doc: Record<string, unknown>) {
  return {
    ...doc,
    companyName: doc.companyName || defaultSiteSettings.companyName,
    phone: doc.phone || defaultSiteSettings.phone,
    hotline: doc.hotline || defaultSiteSettings.hotline,
    email: doc.email || defaultSiteSettings.email,
    address: doc.address || defaultSiteSettings.address,
    facebook: doc.facebook || defaultSiteSettings.facebook,
    zalo: doc.zalo || defaultSiteSettings.zalo,
    youtube: doc.youtube || defaultSiteSettings.youtube,
    googleAnalyticsId: doc.googleAnalyticsId || defaultSiteSettings.googleAnalyticsId,
    googleTagManagerId: doc.googleTagManagerId || defaultSiteSettings.googleTagManagerId,
    footerNote: doc.footerNote || defaultSiteSettings.footerNote,
  };
}

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Cấu hình website",
  access: {
    read: () => true,
  },
  admin: {
    group: "Cấu hình",
  },
  hooks: {
    afterRead: [({ doc }) => applyDefaultSettings(doc || {})],
    afterChange: [revalidateGlobal],
  },
  fields: [
    { name: "companyName", label: "Tên công ty", type: "text", defaultValue: "HPT Tech" },
    { name: "phone", label: "Số điện thoại", type: "text", defaultValue: "0876 645 432" },
    { name: "hotline", label: "Hotline", type: "text", defaultValue: "0876 645 432" },
    { name: "email", label: "Email", type: "text", defaultValue: "lienhe@hpttech.vn" },
    {
      name: "address",
      label: "Địa chỉ",
      type: "textarea",
      defaultValue: "Tư vấn và triển khai cho doanh nghiệp",
    },
    { name: "facebook", label: "Facebook", type: "text", defaultValue: "https://www.facebook.com/solarangelx9/" },
    { name: "zalo", label: "Zalo", type: "text", defaultValue: "https://zalo.me/0876645432" },
    { name: "youtube", label: "YouTube", type: "text" },
    { name: "googleAnalyticsId", label: "Google Analytics ID", type: "text" },
    { name: "googleTagManagerId", label: "Google Tag Manager ID", type: "text" },
    {
      name: "footerNote",
      label: "Ghi chú footer",
      type: "textarea",
      defaultValue: "Thiết bị văn phòng, máy scan, máy in và giải pháp số hóa tài liệu cho doanh nghiệp.",
    },
  ],
};
