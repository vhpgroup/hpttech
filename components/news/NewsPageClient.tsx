"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
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
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicPost } from "@/lib/content-payload";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

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

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function chunkPosts(posts: PublicPost[], size: number) {
  const chunks: PublicPost[][] = [];
  for (let index = 0; index < posts.length; index += size) chunks.push(posts.slice(index, index + size));
  return chunks;
}

function updateNewsURL(type?: NewsType, query?: string, sort?: SortValue, page = 1) {
  const params = new URLSearchParams();
  if (type) params.set("loai", type);
  if (query) params.set("q", query);
  if (sort && sort !== "newest") params.set("sap-xep", sort);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  window.history.replaceState(null, "", value ? `/tin-tuc?${value}` : "/tin-tuc");
}

function TypeNavigation({ activeType }: { activeType?: NewsType }) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      setVisible(current < 120 || current < lastScrollY.current);
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={cn("sticky top-0 z-30 -mx-2 mt-4 transition-transform duration-200 motion-reduce:transition-none", visible ? "translate-y-0" : "-translate-y-[calc(100%+8px)]")}>
      <nav aria-label="Chuyển nhanh loại bài viết" className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
        <Link href="/tin-tuc" className={cn("inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition", !activeType ? "bg-[#0A4BFF] text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-[#0A4BFF]")}>
          <Home size={16} />
          Tổng quan
        </Link>
        {NEWS_TYPES.map(({ value, label, icon: Icon }) => (
          <Link key={value} href={`/tin-tuc?loai=${value}`} className={cn("inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition", activeType === value ? "bg-[#0A4BFF] text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-[#0A4BFF]")}>
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function FeaturedSlider({ posts }: { posts: PublicPost[] }) {
  const orderedPosts = useMemo(
    () => [...posts].filter((post) => post.postType !== "recruitment").sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || postTime(b) - postTime(a)).slice(0, 15),
    [posts],
  );
  const slides = useMemo(() => chunkPosts(orderedPosts, 3), [orderedPosts]);
  const [active, setActive] = useState(0);
  const paused = useRef(false);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (!paused.current) setActive((value) => (value + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;
  const goTo = (index: number) => setActive((index + slides.length) % slides.length);
  const slide = slides[active];

  return (
    <section
      className="relative mt-6"
      aria-label="Bài viết nổi bật"
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onFocusCapture={() => { paused.current = true; }}
      onBlurCapture={() => { paused.current = false; }}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(distance) > 45) goTo(active + (distance < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <div className="grid min-h-[350px] gap-2 md:grid-cols-[1.7fr_1fr]">
        <HeroSlideCard post={slide[0]} priority={active === 0} large />
        {slide.length > 1 ? (
          <div className="hidden gap-2 md:grid">
            {slide.slice(1).map((post) => <HeroSlideCard key={post.fullPath || post.slug} post={post} />)}
          </div>
        ) : null}
      </div>
      {slides.length > 1 ? (
        <>
          <button type="button" aria-label="Slide trước" onClick={() => goTo(active - 1)} className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 shadow-lg transition hover:scale-105 hover:text-[#0A4BFF]">
            <ChevronLeft size={22} />
          </button>
          <button type="button" aria-label="Slide tiếp theo" onClick={() => goTo(active + 1)} className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-900 shadow-lg transition hover:scale-105 hover:text-[#0A4BFF]">
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, index) => (
              <button key={index} type="button" aria-label={`Mở slide ${index + 1}`} onClick={() => goTo(index)} className={cn("h-2 rounded-full border border-white transition-all", active === index ? "w-7 bg-white" : "w-2 bg-white/50 hover:bg-white/80")} />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function HeroSlideCard({ post, large = false, priority = false }: { post: PublicPost; large?: boolean; priority?: boolean }) {
  const type = NEWS_TYPES.find((item) => item.value === post.postType);
  return (
    <Link href={postHref(post)} className="group relative min-h-[170px] overflow-hidden rounded-xl bg-slate-900 text-white">
      {post.image ? <Image src={post.image} alt={post.title} fill priority={priority} sizes={large ? "(max-width: 767px) 100vw, 67vw" : "33vw"} className="object-cover transition duration-500 group-hover:scale-[1.03]" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-900/10" />
      <div className={cn("absolute inset-x-0 bottom-0", large ? "p-7 sm:p-9" : "p-5")}>
        <span className="inline-flex rounded bg-[#0A4BFF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide">{type?.label || "Bài viết"}</span>
        <h2 className={cn("mt-3 font-bold leading-tight", large ? "max-w-3xl text-2xl sm:text-3xl" : "line-clamp-2 text-lg")}>{post.title}</h2>
        {large && post.summary ? <p className="mt-3 hidden max-w-2xl line-clamp-2 text-sm leading-6 text-slate-200 sm:block">{post.summary}</p> : null}
        <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-200">
          {post.date ? <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />{post.date}</span> : null}
          <span className="inline-flex items-center gap-1.5">Đọc tiếp <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
        </div>
      </div>
    </Link>
  );
}

function SectionHeading({ type }: { type: (typeof NEWS_TYPES)[number] }) {
  const Icon = type.icon;
  return (
    <Link href={`/tin-tuc?loai=${type.value}`} className="group relative mb-3 inline-flex items-center gap-2.5 pb-2 text-[#12366d]">
      <Icon size={21} className="text-[#0A4BFF] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      <h2 className="text-base font-extrabold uppercase tracking-wide">{type.label}</h2>
      <ArrowRight size={16} className="-translate-x-2 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
      <span className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-[#0A4BFF] transition-all duration-300 group-hover:w-20" />
    </Link>
  );
}

function PostCard({ post }: { post: PublicPost }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
      <Link href={postHref(post)} className="relative block aspect-[16/9] overflow-hidden bg-slate-100">
        {post.image ? <Image src={post.image} alt={post.title} fill sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 25vw" className="object-cover transition duration-300 group-hover:scale-[1.04]" /> : null}
      </Link>
      <div className="p-4">
        <h3 className="line-clamp-3 min-h-[66px] text-sm font-bold leading-[22px] text-slate-900">
          <Link href={postHref(post)} className="transition hover:text-[#0A4BFF]">{post.title}</Link>
        </h3>
        {post.date ? <p className="mt-3 text-xs font-medium text-slate-400">{post.date}</p> : null}
      </div>
    </article>
  );
}

function AnnouncementList({ posts }: { posts: PublicPost[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {posts.map((post, index) => (
        <Link key={post.fullPath || post.slug} href={postHref(post)} className={cn("group flex items-start gap-4 p-4 transition hover:bg-blue-50/70", index > 0 && "border-t border-slate-100")}>
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-50 text-[#0A4BFF] transition group-hover:bg-[#0A4BFF] group-hover:text-white"><Bell size={18} /></span>
          <span className="min-w-0">
            <strong className="line-clamp-1 block text-sm text-slate-900 transition group-hover:text-[#0A4BFF]">{post.title}</strong>
            {post.summary ? <span className="mt-1 line-clamp-1 block text-xs text-slate-500">{post.summary}</span> : null}
            {post.date ? <span className="mt-1.5 block text-xs text-slate-400">{post.date}</span> : null}
          </span>
        </Link>
      ))}
    </div>
  );
}

function Overview({ posts }: { posts: PublicPost[] }) {
  const groups = NEWS_TYPES.map((type) => ({ type, posts: posts.filter((post) => post.postType === type.value).slice(0, 4) })).filter((group) => group.posts.length);

  if (!posts.length) {
    return (
      <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Newspaper className="mx-auto text-slate-300" size={42} />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Tin tức đang được cập nhật</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Các bài viết mới sẽ được hiển thị tại đây ngay khi được xuất bản.
        </p>
      </section>
    );
  }

  return (
    <>
      <FeaturedSlider posts={posts} />
      <div className="mt-8 grid gap-x-8 gap-y-9 lg:grid-cols-2">
        {groups.map(({ type, posts: groupPosts }) => (
          <section key={type.value} className={type.value === "case-study" ? "lg:col-span-2" : undefined}>
            <SectionHeading type={type} />
            {type.value === "announcement" ? <AnnouncementList posts={groupPosts} /> : (
              <div className={cn("grid gap-3", type.value === "case-study" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2")}>
                {groupPosts.map((post) => <PostCard key={post.fullPath || post.slug} post={post} />)}
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}

function FilteredNews({ posts, type, initialQuery, initialSort, initialPage }: { posts: PublicPost[]; type: NewsType; initialQuery: string; initialSort: SortValue; initialPage: number }) {
  const typeInfo = NEWS_TYPES.find((item) => item.value === type)!;
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortValue>(initialSort);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  useEffect(() => { updateNewsURL(type, query, sort, page); }, [page, query, sort, type]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return posts
      .filter((post) => post.postType === type)
      .filter((post) => !normalizedQuery || normalizeText(`${post.title} ${post.summary || ""}`).includes(normalizedQuery))
      .sort((a, b) => sort === "newest" ? postTime(b) - postTime(a) : postTime(a) - postTime(b));
  }, [posts, query, sort, type]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visiblePosts = filteredPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  return (
    <>
      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#12366d]">{typeInfo.label}</h1>
          <p className="mt-1 text-sm text-slate-500">{filteredPosts.length} bài viết được tìm thấy</p>
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:max-w-3xl">
          <label className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Tìm trong ${typeInfo.label.toLowerCase()}...`} className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100" />
            {input ? <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setInput("")} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} /></button> : null}
          </label>
          <label className="relative">
            <select value={sort} onChange={(event) => { setSort(event.target.value as SortValue); setPage(1); }} className="h-12 min-w-40 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100">
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          </label>
        </div>
      </div>

      {visiblePosts.length ? (
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiblePosts.map((post) => <PostCard key={post.fullPath || post.slug} post={post} />)}
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Search className="mx-auto text-slate-300" size={38} />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy bài viết phù hợp</h2>
          <p className="mt-2 text-sm text-slate-500">Hãy thử từ khóa khác hoặc xóa tìm kiếm hiện tại.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setInput("")} className="rounded-lg bg-[#0A4BFF] px-4 py-2 text-sm font-bold text-white">Xóa tìm kiếm</button>
            <Link href="/tin-tuc" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:border-blue-300 hover:text-[#0A4BFF]">Về tổng quan</Link>
          </div>
        </section>
      )}

      {totalPages > 1 ? (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang">
          <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /></button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).filter((value) => value === 1 || value === totalPages || Math.abs(value - safePage) <= 2).map((value, index, values) => (
            <span key={value} className="contents">
              {index > 0 && value - values[index - 1] > 1 ? <span className="px-1 text-slate-400">…</span> : null}
              <button type="button" onClick={() => setPage(value)} className={cn("size-9 rounded-lg border text-sm font-bold", safePage === value ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300")}>{value}</button>
            </span>
          ))}
          <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={17} /></button>
        </nav>
      ) : null}
    </>
  );
}

export function NewsPageClient({ posts, initialType, initialQuery, initialSort, initialPage }: { posts: PublicPost[]; initialType?: string; initialQuery?: string; initialSort?: string; initialPage?: number }) {
  const activeType = isNewsType(initialType) ? initialType : undefined;
  const sort: SortValue = initialSort === "oldest" ? "oldest" : "newest";
  const usablePosts = useMemo(() => posts.filter((post) => post.postType !== "recruitment"), [posts]);

  return (
    <main className="subpage-main bg-slate-50/70 pb-20">
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
      {activeType ? <FilteredNews posts={usablePosts} type={activeType} initialQuery={initialQuery || ""} initialSort={sort} initialPage={Math.max(1, initialPage || 1)} /> : <Overview posts={usablePosts} />}
    </main>
  );
}
