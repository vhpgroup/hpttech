import HelpPlaceholderPage from "@/components/help/HelpPlaceholderPage";
import { pageMetadata } from "@/lib/seo";

const title = "Hỗ trợ khách hàng dự án, doanh nghiệp";

export const metadata = pageMetadata({
  title,
  description: "Thông tin hỗ trợ khách hàng dự án và doanh nghiệp tại HPT Tech.",
  path: "/ho-tro-khach-hang-du-an-doanh-nghiep",
});

export default function EnterpriseSupportPage() {
  return <HelpPlaceholderPage title={title} activePath="/ho-tro-khach-hang-du-an-doanh-nghiep" />;
}
