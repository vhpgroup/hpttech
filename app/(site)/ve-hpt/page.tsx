import AboutRedesign from "@/components/about/AboutRedesign";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata({
    title: "Giới thiệu HPT Technology — Đối tác tích hợp hệ thống & chuyển đổi số",
    description:
      "HPT TECH — tư vấn, cung cấp thiết bị, tích hợp hệ thống, phát triển phần mềm và triển khai chuyển đổi số cho cơ quan nhà nước và doanh nghiệp tại Việt Nam.",
    path: "/ve-hpt",
  });
}

export default function AboutPage() {
  return <AboutRedesign />;
}
