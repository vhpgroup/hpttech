import Link from "next/link";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { getPostsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Tin tức",
  description: "Tin tức sản phẩm, hướng dẫn chọn thiết bị văn phòng và nội dung số hóa tài liệu từ HPT Tech.",
  path: "/tin-tuc",
});

export default async function NewsPage() {
  const posts = await getPostsFromPayload();

  return (
    <main className="subpage-main">
      <SubpageHeader
        eyebrow="Bài viết và tiêu điểm"
        title="Tin tức"
        description="Nội dung hướng dẫn chọn thiết bị, số hóa tài liệu và tin tức công nghệ được quản lý trong Payload CMS."
        badge={`${posts.length} bài viết`}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Tin tức" },
        ]}
      />

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {posts.map((post) => (
          <article key={post.slug} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Link href={post.href || `/tin-tuc/${post.slug}`}>
              {post.image ? (
                <Image className="h-44 w-full object-cover" src={post.image} alt={post.title} width={360} height={176} />
              ) : null}
            </Link>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CalendarDays size={14} />
                {post.date}
              </div>
              <h2 className="mt-3 line-clamp-3 min-h-20 text-base font-bold leading-7 text-slate-950">
                <Link href={post.href || `/tin-tuc/${post.slug}`}>{post.title}</Link>
              </h2>
              <Link className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900" href={post.href || `/tin-tuc/${post.slug}`}>
                Đọc tiếp
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
