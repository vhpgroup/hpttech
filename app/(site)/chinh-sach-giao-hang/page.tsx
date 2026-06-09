import HelpPlaceholderPage from "@/components/help/HelpPlaceholderPage";
import { pageMetadata } from "@/lib/seo";

const title = "Chính sách giao hàng";

export const metadata = pageMetadata({
  title,
  description: "Chính sách giao hàng của HPT Tech.",
  path: "/chinh-sach-giao-hang",
});

export default function DeliveryPolicyPage() {
  return <HelpPlaceholderPage title={title} activePath="/chinh-sach-giao-hang" />;
}
