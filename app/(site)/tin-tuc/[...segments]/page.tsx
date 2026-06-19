import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, Eye, Newspaper, ShoppingBag } from "lucide-react";
import { getProductsFromPayload } from "@/lib/catalog-payload";
import {
  getMostViewedPostsFromPayload,
  getNewsRedirectFromPayload,
  getPostByPathFromPayload,
  getPostCategoriesFromPayload,
  getPostCategoryByPathFromPayload,
  getPostsFromPayload,
  getPostsByCategoryPathFromPayload,
} from "@/lib/content-payload";
import PostViewTracker from "@/components/news/PostViewTracker";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { SubpageBreadcrumb, SubpageHeader } from "@/components/layout/SubpageHeader";
import { PayloadRichText } from "@/components/rich-text/PayloadRichText";

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

  if (post) {
    const [latestPosts, popularPosts, topProducts] = await Promise.all([
      getPostsFromPayload(),
      getMostViewedPostsFromPayload(6),
      getProductsFromPayload(),
    ]);

    return (
      <NewsDetail
        post={post}
        latestPosts={latestPosts}
        popularPosts={popularPosts}
        topProducts={topProducts}
      />
    );
  }

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

function SidebarSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Newspaper;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
        <Icon size={16} className="text-red-600" />
        <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-slate-950">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function PostSidebarList({
  posts,
  showViewCount = false,
}: {
  posts: Array<NonNullable<Awaited<ReturnType<typeof getPostByPathFromPayload>>>>;
  showViewCount?: boolean;
}) {
  return (
    <div className="space-y-4">
      {posts.map((item, index) => (
        <article
          key={item.fullPath || item.slug}
          className={index === posts.length - 1 ? "" : "border-b border-slate-100 pb-4"}
        >
          <div className="flex gap-3">
            {item.image ? (
              <Link
                href={item.href || `/tin-tuc/${item.fullPath || item.slug}`}
                className="shrink-0 overflow-hidden rounded-md"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  width={92}
                  height={68}
                  className="h-[68px] w-[92px] object-cover"
                />
              </Link>
            ) : null}
            <div className="min-w-0">
              <h3 className="line-clamp-3 text-sm font-bold leading-6 text-slate-900">
                <Link
                  href={item.href || `/tin-tuc/${item.fullPath || item.slug}`}
                  className="transition hover:text-blue-700"
                >
                  {item.title}
                </Link>
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                {item.date ? (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} />
                    {item.date}
                  </span>
                ) : null}
                {showViewCount ? (
                  <span className="inline-flex items-center gap-1">
                    <Eye size={12} />
                    {(item.viewCount || 0).toLocaleString("vi-VN")}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProductSidebarList({
  products,
}: {
  products: Awaited<ReturnType<typeof getProductsFromPayload>>;
}) {
  return (
    <div className="space-y-4">
      {products.map((product, index) => (
        <article
          key={product.slug || product.title}
          className={index === products.length - 1 ? "" : "border-b border-slate-100 pb-4"}
        >
          <div className="flex gap-3">
            {product.image || product.images?.[0]?.url ? (
              <Link
                href={product.href || `/san-pham/${product.slug}`}
                className="flex h-[68px] w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-100 bg-white p-2"
              >
                <Image
                  src={product.images?.[0]?.url || product.image || ""}
                  alt={product.title}
                  width={92}
                  height={68}
                  className="max-h-[52px] w-auto object-contain"
                />
              </Link>
            ) : null}
            <div className="min-w-0">
              <h3 className="line-clamp-3 text-sm font-bold leading-6 text-slate-900">
                <Link
                  href={product.href || `/san-pham/${product.slug}`}
                  className="transition hover:text-blue-700"
                >
                  {product.title}
                </Link>
              </h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm font-extrabold text-red-600">{product.price || "Liên hệ"}</p>
                <p className="text-xs font-medium text-slate-500">
                  {(product.reviewCount || 0).toLocaleString("vi-VN")} đánh giá
                  {typeof product.viewCount === "number"
                    ? ` • ${product.viewCount.toLocaleString("vi-VN")} lượt xem`
                    : ""}
                </p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function NewsDetail({
  post,
  latestPosts,
  popularPosts,
  topProducts,
}: {
  post: NonNullable<Awaited<ReturnType<typeof getPostByPathFromPayload>>>;
  latestPosts: Awaited<ReturnType<typeof getPostsFromPayload>>;
  popularPosts: Awaited<ReturnType<typeof getMostViewedPostsFromPayload>>;
  topProducts: Awaited<ReturnType<typeof getProductsFromPayload>>;
}) {
  const recentPosts = latestPosts
    .filter((item) => item.slug !== post.slug)
    .sort(
      (a, b) =>
        (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) -
        (a.publishedAt ? new Date(a.publishedAt).getTime() : 0),
    )
    .slice(0, 5);
  const mostViewedPosts = popularPosts.filter((item) => item.slug !== post.slug).slice(0, 5);
  const bestSellingProducts = [...topProducts]
    .sort(
      (a, b) =>
        (b.reviewCount || 0) - (a.reviewCount || 0) ||
        (b.viewCount || 0) - (a.viewCount || 0),
    )
    .slice(0, 5);
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
      <PostViewTracker slug={post.slug} />
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
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} />
                {post.date}
              </span>
              {post.category?.fullTitle ? <span>{post.category.fullTitle}</span> : null}
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
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
            {post.summary ? (
              <div className="mt-6 max-w-3xl space-y-4 text-base leading-8 text-slate-700">
                <p>{post.summary}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <PayloadRichText data={post.content} className="max-w-3xl" />
            </div>
            <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
              {recentPosts.length ? (
                <SidebarSection title="Tin mới nhất" icon={Newspaper}>
                  <PostSidebarList posts={recentPosts} />
                </SidebarSection>
              ) : null}
              {mostViewedPosts.length ? (
                <SidebarSection title="Bài viết nhiều người xem" icon={Eye}>
                  <PostSidebarList posts={mostViewedPosts} showViewCount />
                </SidebarSection>
              ) : null}
              {bestSellingProducts.length ? (
                <SidebarSection title="Sản phẩm bán chạy nhất" icon={ShoppingBag}>
                  <ProductSidebarList products={bestSellingProducts} />
                </SidebarSection>
              ) : null}
            </aside>
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
            <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-red-600">Bài nổi bật</p>
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
