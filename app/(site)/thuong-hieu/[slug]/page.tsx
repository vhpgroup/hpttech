import { notFound } from "next/navigation";
import { CertificationDetail } from "@/components/thuong-hieu/CertificationDetail";
import {
  getCertificationBySlugFromPayload,
  getCertificationsFromPayload,
  getSiteSettingsFromPayload,
} from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const cert = await getCertificationBySlugFromPayload(slug);

  if (!cert) {
    return pageMetadata({
      title: "Không tìm thấy chứng nhận",
      description: "Nội dung chứng nhận không tồn tại.",
      path: `/thuong-hieu/${slug}`,
    });
  }

  return pageMetadata({
    title: `Chứng nhận ${cert.kindLabel} ${cert.brand}`,
    description: cert.summary || `HPT Tech là ${cert.kindLabel} ${cert.brand} tại ${cert.territory || "Việt Nam"}.`,
    path: cert.href,
    image: cert.image,
    type: "article",
  });
}

export default async function CertificationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [cert, all, rawSettings] = await Promise.all([
    getCertificationBySlugFromPayload(slug),
    getCertificationsFromPayload(),
    getSiteSettingsFromPayload(),
  ]);

  if (!cert) notFound();

  const related = all.filter((item) => item.slug !== cert.slug).slice(0, 3);
  return <CertificationDetail cert={cert} related={related} settings={normalizeSiteSettings(rawSettings)} />;
}
