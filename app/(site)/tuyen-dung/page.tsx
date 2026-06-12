import { RecruitmentPageClient } from "@/components/recruitment/RecruitmentPageClient";
import { getPostsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Tuyển dụng",
  description: "Cơ hội nghề nghiệp và môi trường làm việc tại HPT Tech.",
  path: "/tuyen-dung",
});

type RecruitmentPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
};

export default async function RecruitmentPage({ searchParams }: RecruitmentPageProps) {
  const [posts, params] = await Promise.all([getPostsFromPayload(), searchParams]);
  const page = Number.parseInt(params.page || "1", 10);
  const jobs = posts.filter((post) => post.postType === "recruitment");

  return (
    <RecruitmentPageClient
      jobs={jobs}
      culturePosts={[]}
      initialQuery={params.q}
      initialPage={Number.isFinite(page) ? page : 1}
    />
  );
}
