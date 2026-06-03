import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { getPostBySlugFromPayload } from "@/lib/content-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlugFromPayload(slug);

  if (!post) {
    return pageMetadata({
      title: "Tin tức",
      description: "Tin tức và bài viết từ HPT Tech.",
      path: `/tin-tuc/${slug}`,
      type: "article",
    });
  }

  return pageMetadata({
    title: post.title,
    description: post.summary || "Tin tức và bài viết từ HPT Tech.",
    path: `/tin-tuc/${post.slug}`,
    image: post.image,
    type: "article",
  });
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlugFromPayload(slug);

  if (!post) notFound();
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.image ? [absoluteURL(post.image)] : undefined,
    datePublished: post.publishedAt,
    description: post.summary,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: absoluteURL("/") },
      { "@type": "ListItem", position: 2, name: "Tin tức", item: absoluteURL("/tin-tuc") },
      { "@type": "ListItem", position: 3, name: post.title, item: absoluteURL(`/tin-tuc/${post.slug}`) },
    ],
  };

  return (
    <main className="subpage-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700" href="/tin-tuc">
        <ArrowLeft size={16} />
        Quay lại tin tức
      </Link>

      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {post.image ? (
          <Image className="h-[360px] w-full object-cover" src={post.image} alt={post.title} width={1200} height={360} priority />
        ) : null}
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CalendarDays size={16} />
            {post.date}
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-6 max-w-3xl space-y-4 text-base leading-8 text-slate-700">
            {post.summary ? <p>{post.summary}</p> : <p>Nội dung chi tiết đang được cập nhật trong Payload CMS.</p>}
          </div>
        </div>
      </article>
    </main>
  );
}
