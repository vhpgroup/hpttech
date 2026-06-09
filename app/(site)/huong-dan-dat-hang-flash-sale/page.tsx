import HelpPlaceholderPage from "@/components/help/HelpPlaceholderPage";
import { pageMetadata } from "@/lib/seo";

const title = "Hướng dẫn đặt hàng Flash Sale";

export const metadata = pageMetadata({
  title,
  description: "Hướng dẫn đặt hàng Flash Sale tại HPT Tech.",
  path: "/huong-dan-dat-hang-flash-sale",
});

export default function FlashSaleGuidePage() {
  return <HelpPlaceholderPage title={title} activePath="/huong-dan-dat-hang-flash-sale" />;
}
