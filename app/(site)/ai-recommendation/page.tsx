import HybridProductSearch from "@/components/ai-tools/HybridProductSearch";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AI Recommendation sản phẩm",
  description:
    "AI Recommendation giúp khách hàng mô tả nhu cầu, nhận gợi ý sản phẩm phù hợp và kiểm tra sản phẩm nào có tại HPT Tech.",
  path: "/ai-recommendation",
});

export default function Page() {
  return <HybridProductSearch />;
}
