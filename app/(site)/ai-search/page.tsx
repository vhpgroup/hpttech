import AISearchPage from "@/components/ai-search/AISearchPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AI Search sản phẩm",
  description:
    "AI Search giúp khách hàng B2B mô tả nhu cầu và nhận đề xuất máy scan, máy in, thiết bị văn phòng phù hợp từ HPT Tech.",
  path: "/ai-search",
});
 
export default function Page() {
  return <AISearchPage />;
}
