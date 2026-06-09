import HelpPlaceholderPage from "@/components/help/HelpPlaceholderPage";
import { pageMetadata } from "@/lib/seo";

const title = "Chính sách bảo hành tận nhà";

export const metadata = pageMetadata({
  title,
  description: "Chính sách bảo hành tận nhà của HPT Tech.",
  path: "/chinh-sach-bao-hanh-tan-nha",
});

export default function OnsiteWarrantyPolicyPage() {
  return <HelpPlaceholderPage title={title} activePath="/chinh-sach-bao-hanh-tan-nha" />;
}
