import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import {
  getNewsRedirectFromPayload,
  getPostByPathFromPayload,
  getPostCategoriesFromPayload,
  getPostCategoryByPathFromPayload,
  getPostsByCategoryPathFromPayload,
} from "@/lib/content-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { SubpageBreadcrumb, SubpageHeader } from "@/components/layout/SubpageHeader";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{
    segments: string[];
  }>;
};

function newsPath(segments: string[]) {
  return segments.join("/");
}

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { segments } = await params;
  const path = newsPath(segments);
  const post = await getPostByPathFromPayload(path);

  if (post) {
    return pageMetadata({
      title: post.title,
      description: post.summary || "Tin tuc va bai viet tu HPT Tech.",
      path: post.href || `/tin-tuc/${path}`,
      image: post.image,
      type: "article",
    });
  }

  const category = await getPostCategoryByPathFromPayload(path);
  if (category) {
    return pageMetadata({
      title: category.fullTitle || category.name,
      description: category.description || "Tin tuc, huong dan va kien thuc tu HPT Tech.",
      path: `/tin-tuc/${category.fullSlug || path}`,
      image: category.image,
    });
  }

  return pageMetadata({
    title: "Tin tuc",
    description: "Tin tuc va bai viet tu HPT Tech.",
    path: `/tin-tuc/${path}`,
    type: "article",
  });
}

export default async function NewsNestedPage({ params }: PageProps) {
  const { segments } = await params;
  const path = newsPath(segments);
  const post = await getPostByPathFromPayload(path);

  if (post) return <NewsDetail post={post} />;

  const redirectRule = await getNewsRedirectFromPayload(path);
  if (redirectRule) redirect(redirectRule.destination);

  const category = await getPostCategoryByPathFromPayload(path);
  if (!category) notFound();

  const [allCategories, posts] = await Promise.all([
    getPostCategoriesFromPayload(),
    getPostsByCategoryPathFromPayload(path),
  ]);
  const subcategories = allCategories.filter((item) => item.parent === category.id);

  return <NewsCategory category={category} subcategories={subcategories} posts={posts} />;
}

function NewsDetail({ post }: { post: NonNullable<Awaited<ReturnType<typeof getPostByPathFromPayload>>> }) {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    image: post.image ? [absoluteURL(post.image)] : undefined,
    datePublished: post.publishedAt,
    description: post.summary,
  };
  const breadcrumbItems = [
    { name: "Trang chu", item: absoluteURL("/") },
    { name: "Tin tuc", item: absoluteURL("/tin-tuc") },
    ...(post.category?.fullTitle
      ? [{ name: post.category.fullTitle, item: absoluteURL(`/tin-tuc/${post.category.fullSlug || ""}`) }]
      : []),
    { name: post.title, item: absoluteURL(post.href || `/tin-tuc/${post.fullPath || post.slug}`) },
  ];
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      ...item,
    })),
  };

  return (
    <main className="subpage-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SubpageBreadcrumb
        className="mb-4"
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Tin tức", href: "/tin-tuc" },
          { label: post.category?.fullTitle || post.title },
        ]}
      />
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700" href="/tin-tuc">
        <ArrowLeft size={16} />
        Quay lai tin tuc
      </Link>

      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {post.image ? (
          <Image className="h-[360px] w-full object-cover" src={post.image} alt={post.title} width={1200} height={360} priority />
        ) : null}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} />
              {post.date}
            </span>
            {post.category?.fullTitle ? <span>{post.category.fullTitle}</span> : null}
          </div>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
            {post.title}
          </h1>
          {post.tags?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag.slug} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {tag.name}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-6 max-w-3xl space-y-4 text-base leading-8 text-slate-700">
            {post.summary ? <p>{post.summary}</p> : <p>Noi dung chi tiet dang duoc cap nhat trong Payload CMS.</p>}
          </div>
        </div>
      </article>
    </main>
  );
}

function NewsCategory({
  category,
  subcategories,
  posts,
}: {
  category: NonNullable<Awaited<ReturnType<typeof getPostCategoryByPathFromPayload>>>;
  subcategories: Awaited<ReturnType<typeof getPostCategoriesFromPayload>>;
  posts: Awaited<ReturnType<typeof getPostsByCategoryPathFromPayload>>;
}) {
  const featured = posts.find((post) => post.featured) || posts[0];

  return (
    <main className="subpage-main">
      <SubpageHeader
        eyebrow="Danh mục tin tức"
        title={category.name}
        description={category.description}
        badge={`${posts.length} bài viết`}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Tin tức", href: "/tin-tuc" },
          { label: category.name },
        ]}
      />

      {category.image ? (
        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <Image className="h-56 w-full object-cover" src={category.image} alt={category.name} width={1200} height={224} priority />
        </section>
      ) : null}

      {subcategories.length ? (
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {subcategories.map((child) => (
            <Link
              key={child.fullSlug || child.slug}
              className="rounded-lg border border-slate-200 bg-white p-4 font-semibold text-slate-900 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
              href={`/tin-tuc/${child.fullSlug || child.slug}`}
            >
              {child.name}
            </Link>
          ))}
        </section>
      ) : null}

      {featured ? (
        <section className="mt-6 grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-[1.15fr_1fr]">
          {featured.image ? (
            <Image className="h-full min-h-72 w-full object-cover" src={featured.image} alt={featured.title} width={640} height={360} />
          ) : null}
          <div className="p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Bai noi bat</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-950">
              <Link href={featured.href || `/tin-tuc/${featured.fullPath || featured.slug}`}>{featured.title}</Link>
            </h2>
            {featured.summary ? <p className="mt-4 text-base leading-7 text-slate-600">{featured.summary}</p> : null}
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <article key={post.fullPath || post.slug} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Link href={post.href || `/tin-tuc/${post.fullPath || post.slug}`}>
              {post.image ? <Image className="h-44 w-full object-cover" src={post.image} alt={post.title} width={420} height={176} /> : null}
            </Link>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CalendarDays size={14} />
                {post.date}
              </div>
              <h2 className="mt-3 line-clamp-3 min-h-20 text-base font-bold leading-7 text-slate-950">
                <Link href={post.href || `/tin-tuc/${post.fullPath || post.slug}`}>{post.title}</Link>
              </h2>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
