import CheckoutClient from "@/components/cart/CheckoutClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Thanh toán",
  description: "Hoàn tất đơn hàng HPT Tech bằng COD hoặc liên hệ xác nhận.",
  path: "/checkout",
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}
