import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getPostBySlug, getPosts } from "@/lib/catalog";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  return (
    <main className="subpage-main">
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700" href="/tin-tuc">
        <ArrowLeft size={16} />
        Quay lại tin tức
      </Link>

      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <img className="h-[360px] w-full object-cover" src={post.image} alt={post.title} />
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CalendarDays size={16} />
            {post.date}
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-6 max-w-3xl border-l-4 border-blue-100 pl-5 text-base leading-8 text-slate-700">
            <p>
              Đây là bản xem trước nội dung từ dữ liệu seed. Khi nối WordPress, phần thân bài sẽ lấy từ REST API hoặc GraphQL và render tại route này.
            </p>
            <p>
              Cấu trúc trang đã sẵn sàng cho SEO, ảnh đại diện, tiêu đề, ngày đăng và nội dung chi tiết. Bước sau chỉ cần thay nguồn dữ liệu.
            </p>
          </div>
          <a className="mt-6 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-700" href={post.href} target="_blank" rel="noreferrer">
            Xem bài gốc
          </a>
        </div>
      </article>
    </main>
  );
}
