"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  Newspaper,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicPost } from "@/lib/content-payload";
import { cn } from "@/lib/cn";

const NEWS_TYPES = [
  { value: "news", label: "Tin tức", icon: Newspaper },
  { value: "guide", label: "Hướng dẫn", icon: BookOpen },
  { value: "case-study", label: "Case study", icon: Building2 },
  { value: "announcement", label: "Thông báo", icon: Bell },
] as const;

type NewsType = (typeof NEWS_TYPES)[number]["value"];
type SortValue = "newest" | "oldest";

function isNewsType(value: string | null | undefined): value is NewsType {
  return NEWS_TYPES.some((item) => item.value === value);
}

function postHref(post: PublicPost) {
  return post.href || `/tin-tuc/${post.fullPath || post.slug}`;
}

function postTime(post: PublicPost) {
  const value = post.publishedAt ? new Date(post.publishedAt).getTime() : 0;
  return Number.isFinite(value) ? value : 0;
}

function newsURL(type?: NewsType, query?: string, sort?: SortValue, page = 1) {
  const params = new URLSearchParams();
  if (type) params.set("loai", type);
  if (query) params.set("q", query);
  if (sort && sort !== "newest") params.set("sap-xep", sort);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  return value ? `/tin-tuc?${value}` : "/tin-tuc";
}

function categoryLabel(post: PublicPost) {
  const category = post.category?.fullTitle || post.category?.name;
  if (category) return category;
  return NEWS_TYPES.find((item) => item.value === post.postType)?.label || "Tin tức";
}

function categorySlug(post: PublicPost) {
  if (post.category?.fullSlug) return `/tin-tuc/${post.category.fullSlug}`;
  if (post.category?.slug) return `/tin-tuc/${post.category.slug}`;
  return post.postType && isNewsType(post.postType) ? `/tin-tuc?loai=${post.postType}` : "/tin-tuc";
}

function orderPosts(posts: PublicPost[]) {
  return [...posts].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || postTime(b) - postTime(a));
}

function TypeNavigation({ activeType }: { activeType?: NewsType }) {
  return (
    <nav aria-label="Chuyển nhanh loại bài viết" className="mt-4 flex gap-2 overflow-x-auto border-y border-slate-200 bg-white py-2">
      <Link href="/tin-tuc" className={cn("inline-flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-bold transition", !activeType ? "text-[#0A4BFF]" : "text-slate-600 hover:text-[#0A4BFF]")}>
        <Home size={16} />
        Tổng quan
      </Link>
      {NEWS_TYPES.map(({ value, label, icon: Icon }) => (
        <Link key={value} href={`/tin-tuc?loai=${value}`} className={cn("inline-flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-bold transition", activeType === value ? "text-[#0A4BFF]" : "text-slate-600 hover:text-[#0A4BFF]")}>
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function ImageBox({ post, sizes, priority = false, className }: { post: PublicPost; sizes: string; priority?: boolean; className?: string }) {
  return (
    <span className={cn("relative block overflow-hidden bg-slate-100", className)}>
      {post.image ? (
        <Image src={post.image} alt={post.title} fill priority={priority} sizes={sizes} className="object-cover transition duration-300 group-hover:scale-[1.04]" />
      ) : (
        <span className="grid size-full place-items-center bg-blue-50 text-[#0A4BFF]">
          <Newspaper size={34} />
        </span>
      )}
    </span>
  );
}

function MetaLine({ post, compact = false }: { post: PublicPost; compact?: boolean }) {
  return (
    <p className={cn("mt-2 flex flex-wrap items-center gap-2 text-slate-400", compact ? "text-[11px]" : "text-xs")}>
      {post.date ? (
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={12} />
          {post.date}
        </span>
      ) : null}
      <span>{categoryLabel(post)}</span>
    </p>
  );
}

function SectionTitle({ title, href }: { title: string; href?: string }) {
  const content = (
    <>
      <span className="text-sm font-extrabold uppercase text-[#d60000]">{title}</span>
      <span className="h-px flex-1 bg-slate-200" />
      {href ? <span className="text-xs font-bold text-slate-400 transition group-hover:text-[#0A4BFF]">Xem thêm</span> : null}
    </>
  );

  return href ? (
    <Link href={href} className="group mb-3 flex items-center gap-3">
      {content}
    </Link>
  ) : (
    <div className="mb-3 flex items-center gap-3">{content}</div>
  );
}

function HeroLead({ post }: { post: PublicPost }) {
  return (
    <article className="group">
      <Link href={postHref(post)} className="block">
        <ImageBox post={post} priority sizes="(max-width: 1023px) 100vw, 58vw" className="aspect-[16/9] rounded-md" />
        <h1 className="mt-3 text-xl font-extrabold leading-tight text-slate-900 transition group-hover:text-[#0A4BFF] md:text-2xl">
          {post.title}
        </h1>
      </Link>
      {post.summary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.summary}</p> : null}
      <MetaLine post={post} />
    </article>
  );
}

function LatestList({ posts }: { posts: PublicPost[] }) {
  return (
    <aside>
      <SectionTitle title="Bài viết mới nhất" />
      <div className="space-y-3">
        {posts.map((post) => (
          <article key={post.fullPath || post.slug} className="group grid grid-cols-[1fr_112px] gap-3 border-b border-slate-100 pb-3">
            <Link href={postHref(post)} className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 transition group-hover:text-[#0A4BFF]">{post.title}</h3>
              <MetaLine post={post} compact />
            </Link>
            <Link href={postHref(post)} aria-label={post.title}>
              <ImageBox post={post} sizes="112px" className="aspect-[4/3] rounded" />
            </Link>
          </article>
        ))}
      </div>
    </aside>
  );
}

function SmallStory({ post }: { post: PublicPost }) {
  return (
    <article className="group">
      <Link href={postHref(post)}>
        <ImageBox post={post} sizes="(max-width: 767px) 100vw, 20vw" className="aspect-[16/9] rounded" />
        <h3 className="mt-2 line-clamp-2 min-h-10 text-sm font-bold leading-5 text-slate-900 transition group-hover:text-[#0A4BFF]">{post.title}</h3>
      </Link>
      <MetaLine post={post} compact />
    </article>
  );
}

function NewsListItem({ post }: { post: PublicPost }) {
  return (
    <article className="group grid gap-3 border-b border-slate-100 pb-4 sm:grid-cols-[180px_1fr]">
      <Link href={postHref(post)}>
        <ImageBox post={post} sizes="(max-width: 639px) 100vw, 180px" className="aspect-[16/10] rounded" />
      </Link>
      <div className="min-w-0">
        <Link href={postHref(post)}>
          <h3 className="line-clamp-2 text-base font-extrabold leading-6 text-slate-900 transition group-hover:text-[#0A4BFF]">{post.title}</h3>
        </Link>
        <MetaLine post={post} compact />
        {post.summary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{post.summary}</p> : null}
      </div>
    </article>
  );
}

function CategorySection({ title, href, posts }: { title: string; href?: string; posts: PublicPost[] }) {
  const [lead, ...rest] = posts;
  if (!lead) return null;

  return (
    <section>
      <SectionTitle title={title} href={href} />
      <div className="space-y-4">
        <NewsListItem post={lead} />
        {rest.slice(0, 3).map((post) => (
          <NewsListItem key={post.fullPath || post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}

function RankedPosts({ posts }: { posts: PublicPost[] }) {
  if (!posts.length) return null;

  return (
    <aside>
      <SectionTitle title="Bài viết nổi bật" />
      <div className="space-y-4">
        {posts[0] ? (
          <article className="group">
            <Link href={postHref(posts[0])}>
              <ImageBox post={posts[0]} sizes="(max-width: 1023px) 100vw, 360px" className="aspect-[16/9] rounded" />
              <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-5 text-slate-900 transition group-hover:text-[#0A4BFF]">{posts[0].title}</h3>
            </Link>
          </article>
        ) : null}
        <ol className="space-y-3">
          {posts.slice(0, 5).map((post, index) => (
            <li key={post.fullPath || post.slug} className="group grid grid-cols-[44px_1fr] gap-3 border-b border-slate-100 pb-3">
              <span className="text-3xl font-black italic leading-none text-slate-200">{String(index + 1).padStart(2, "0")}</span>
              <Link href={postHref(post)} className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-900 transition group-hover:text-[#0A4BFF]">{post.title}</h3>
                <MetaLine post={post} compact />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}

function buildSections(posts: PublicPost[]) {
  const map = new Map<string, { title: string; href: string; posts: PublicPost[] }>();

  for (const post of posts) {
    const title = categoryLabel(post);
    const href = categorySlug(post);
    const key = `${title}:${href}`;
    const current = map.get(key);
    if (current) current.posts.push(post);
    else map.set(key, { title, href, posts: [post] });
  }

  return Array.from(map.values())
    .filter((section) => section.posts.length > 0)
    .sort((a, b) => b.posts.length - a.posts.length || a.title.localeCompare(b.title, "vi"))
    .slice(0, 6);
}

function Overview({ posts }: { posts: PublicPost[] }) {
  const orderedPosts = useMemo(() => orderPosts(posts), [posts]);
  const hero = orderedPosts[0];
  const latest = [...posts].sort((a, b) => postTime(b) - postTime(a)).filter((post) => post !== hero).slice(0, 5);
  const smallStories = orderedPosts.filter((post) => post !== hero).slice(0, 3);
  const ranked = orderedPosts.slice(0, 5);
  const sections = buildSections(orderedPosts);

  if (!hero) {
    return (
      <section className="mt-8 border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Newspaper className="mx-auto text-slate-300" size={42} />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Tin tức đang được cập nhật</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">Các bài viết mới sẽ hiển thị tại đây ngay khi được xuất bản.</p>
      </section>
    );
  }

  return (
    <>
      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <HeroLead post={hero} />
          {smallStories.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {smallStories.map((post) => (
                <SmallStory key={post.fullPath || post.slug} post={post} />
              ))}
            </div>
          ) : null}
        </div>
        <LatestList posts={latest} />
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          {sections.slice(0, 4).map((section) => (
            <CategorySection key={`${section.title}:${section.href}`} title={section.title} href={section.href} posts={section.posts} />
          ))}
        </div>
        <div className="space-y-8">
          <RankedPosts posts={ranked} />
          {sections.slice(4, 6).map((section) => (
            <CategorySection key={`${section.title}:${section.href}`} title={section.title} href={section.href} posts={section.posts} />
          ))}
        </div>
      </section>
    </>
  );
}

function FilteredNews({
  posts,
  type,
  initialQuery,
  initialSort,
  initialPage,
  totalDocs,
  totalPages,
}: {
  posts: PublicPost[];
  type?: NewsType;
  initialQuery: string;
  initialSort: SortValue;
  initialPage: number;
  totalDocs: number;
  totalPages: number;
}) {
  const router = useRouter();
  const typeInfo = type ? NEWS_TYPES.find((item) => item.value === type) : undefined;
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortValue>(initialSort);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    setInput(initialQuery);
    setQuery(initialQuery);
    setSort(initialSort);
    setPage(initialPage);
  }, [initialPage, initialQuery, initialSort]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    router.replace(newsURL(type, query, sort, page), { scroll: false });
  }, [page, query, router, sort, type]);

  const safePage = Math.min(page, totalPages);
  const visiblePosts = posts;

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#12366d]">{typeInfo?.label || "Tin tức"}</h1>
          <p className="mt-1 text-sm text-slate-500">{totalDocs} bài viết được tìm thấy</p>
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:max-w-3xl">
          <label className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Tìm trong ${(typeInfo?.label || "tin tức").toLowerCase()}...`} className="h-12 w-full border border-slate-200 bg-white pl-11 pr-11 text-sm outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100" />
            {input ? <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setInput("")} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} /></button> : null}
          </label>
          <label className="relative">
            <select value={sort} onChange={(event) => { setSort(event.target.value as SortValue); setPage(1); }} className="h-12 min-w-40 appearance-none border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100">
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </label>
        </div>
      </div>

      {visiblePosts.length ? (
        <section className="mt-5 space-y-4">
          {visiblePosts.map((post) => <NewsListItem key={post.fullPath || post.slug} post={post} />)}
        </section>
      ) : (
        <section className="mt-8 border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Search className="mx-auto text-slate-300" size={38} />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy bài viết phù hợp</h2>
          <p className="mt-2 text-sm text-slate-500">Hãy thử từ khóa khác hoặc xóa tìm kiếm hiện tại.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setInput("")} className="bg-[#0A4BFF] px-4 py-2 text-sm font-bold text-white">Xóa tìm kiếm</button>
            <Link href="/tin-tuc" className="border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-[#0A4BFF]">Về tổng quan</Link>
          </div>
        </section>
      )}

      {totalPages > 1 ? (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang">
          <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /></button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => value === 1 || value === totalPages || Math.abs(value - safePage) <= 2).map((value, index, values) => (
            <span key={value} className="contents">
              {index > 0 && value - values[index - 1] > 1 ? <span className="px-1 text-slate-400">...</span> : null}
              <button type="button" onClick={() => setPage(value)} className={cn("size-9 border text-sm font-bold", safePage === value ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300")}>{value}</button>
            </span>
          ))}
          <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-9 place-items-center border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={17} /></button>
        </nav>
      ) : null}
    </>
  );
}

export function NewsPageClient({
  posts,
  initialType,
  initialQuery,
  initialSort,
  initialPage,
  totalDocs,
  totalPages,
}: {
  posts: PublicPost[];
  initialType?: string;
  initialQuery?: string;
  initialSort?: string;
  initialPage?: number;
  totalDocs: number;
  totalPages: number;
}) {
  const activeType = isNewsType(initialType) ? initialType : undefined;
  const sort: SortValue = initialSort === "oldest" ? "oldest" : "newest";
  const usablePosts = useMemo(() => posts.filter((post) => post.postType !== "recruitment"), [posts]);
  const page = Math.max(1, initialPage || 1);
  const hasServerFilters = Boolean(activeType || initialQuery || sort !== "newest" || page > 1);

  return (
    <main className="subpage-main bg-white pb-20">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-[#0A4BFF]">Trang chủ</Link>
        <ChevronRight size={13} className="text-slate-300" />
        {activeType ? (
          <>
            <Link href="/tin-tuc" className="transition hover:text-[#0A4BFF]">Tin tức</Link>
            <ChevronRight size={13} className="text-slate-300" />
            <span>{NEWS_TYPES.find((item) => item.value === activeType)?.label}</span>
          </>
        ) : <span>Tin tức</span>}
      </nav>
      <TypeNavigation activeType={activeType} />
      {hasServerFilters ? (
        <FilteredNews
          posts={usablePosts}
          type={activeType}
          initialQuery={initialQuery || ""}
          initialSort={sort}
          initialPage={page}
          totalDocs={totalDocs}
          totalPages={Math.max(1, totalPages)}
        />
      ) : (
        <Overview posts={usablePosts} />
      )}
    </main>
  );
}
