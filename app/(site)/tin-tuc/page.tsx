import { NewsPageClient } from "@/components/news/NewsPageClient";
import { getPostsPageFromPayload } from "@/lib/content-payload";
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

const NEWS_TYPES = new Set(["news", "guide", "case-study", "announcement"]);

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const params = await searchParams;
  const page = Number.parseInt(params.page || "1", 10);
  const safePage = Number.isFinite(page) ? page : 1;
  const sort = params["sap-xep"] === "oldest" ? "oldest" : "newest";
  const type = params.loai && NEWS_TYPES.has(params.loai) ? params.loai : undefined;
  const postsPage = await getPostsPageFromPayload({
    limit: 12,
    page: safePage,
    q: params.q,
    sort,
    type,
  });

  return (
    <NewsPageClient
      posts={postsPage.posts}
      initialType={type}
      initialQuery={params.q}
      initialSort={sort}
      initialPage={postsPage.page}
      totalDocs={postsPage.totalDocs}
      totalPages={postsPage.totalPages}
    />
  );
}
