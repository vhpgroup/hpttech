import { GiaiPhapHub } from "@/components/solutions/GiaiPhapHub";
import { getSolutionsFromPayload } from "@/lib/content-payload";
import { getHubData } from "@/lib/landing-pages";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Giải pháp số hóa theo ngành | Máy scan & thiết bị văn phòng",
  description:
    "Trung tâm giải pháp HPT Tech: máy scan theo ngành, nhu cầu và thương hiệu; số hóa tài liệu, giải pháp CNTT cho cơ quan nhà nước, bệnh viện, trường học và doanh nghiệp.",
  path: "/giai-phap",
});

export default async function SolutionsPage() {
  const [hubData, solutions] = await Promise.all([
    getHubData(),
    getSolutionsFromPayload(),
  ]);

  return <GiaiPhapHub scan={hubData.scan} solutions={solutions} />;
}
