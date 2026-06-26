import { BrandCertificationsPage } from "@/components/thuong-hieu/BrandCertificationsPage";
import { getCertificationsFromPayload, getSiteSettingsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export default async function ThuongHieuPage() {
  const [certifications, rawSettings] = await Promise.all([
    getCertificationsFromPayload(),
    getSiteSettingsFromPayload(),
  ]);

  return <BrandCertificationsPage certifications={certifications} settings={normalizeSiteSettings(rawSettings)} />;
}

export function generateMetadata() {
  return pageMetadata({
    title: "Thương hiệu & Chứng nhận ủy quyền chính hãng",
    description:
      "HPT Tech là nhà phân phối và đối tác ủy quyền chính hãng của nhiều thương hiệu thiết bị văn phòng, máy scan và giải pháp số hóa. Cam kết hàng chính hãng 100%, bảo hành chuẩn hãng, xuất hóa đơn VAT.",
    path: "/thuong-hieu",
  });
}
