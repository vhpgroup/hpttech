import { NewsPageClient } from "@/components/news/NewsPageClient";
import { getPostsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Tin tức",
  description: "Tin tức sản phẩm, hướng dẫn chọn thiết bị văn phòng và nội dung số hóa tài liệu từ HPT Tech.",
  path: "/tin-tuc",
});

type NewsPageProps = {
  searchParams: Promise<{
    loai?: string;
    q?: string;
    "sap-xep"?: string;
    page?: string;
  }>;
};

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const posts = await getPostsFromPayload();
  const page = Number.parseInt(params.page || "1", 10);

  return (
    <NewsPageClient
      posts={posts}
      initialType={params.loai}
      initialQuery={params.q}
      initialSort={params["sap-xep"]}
      initialPage={Number.isFinite(page) ? page : 1}
    />
  );
}
