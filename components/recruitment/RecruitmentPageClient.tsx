"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicPost } from "@/lib/content-payload";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 10;

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function updateURL(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  window.history.replaceState(null, "", value ? `/tuyen-dung?${value}` : "/tuyen-dung");
}

function JobCard({ job }: { job: PublicPost }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition motion-reduce:transition-none hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <Link href={`/tuyen-dung/${job.slug}`} className="grid gap-4 p-5 sm:grid-cols-[64px_1fr_auto] sm:items-center">
        <span className="grid size-14 place-items-center rounded-full bg-blue-50 text-[#0A4BFF]">
          <BriefcaseBusiness size={24} />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-extrabold uppercase tracking-wide text-[#0A4BFF]">Vị trí tuyển dụng</span>
          <strong className="mt-1.5 block text-base text-slate-900 transition group-hover:text-[#0A4BFF]">{job.title}</strong>
          {job.summary ? <span className="mt-2 line-clamp-2 block text-sm leading-6 text-slate-500">{job.summary}</span> : null}
          {job.date ? <span className="mt-2 block text-xs text-slate-400">Đăng ngày {job.date}</span> : null}
        </span>
        <span className="hidden size-9 place-items-center rounded-lg border border-slate-200 text-[#0A4BFF] transition group-hover:border-blue-300 group-hover:bg-blue-50 sm:grid">
          <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </article>
  );
}

export function RecruitmentPageClient({
  jobs,
  culturePosts = [],
  initialQuery = "",
  initialPage = 1,
}: {
  jobs: PublicPost[];
  culturePosts?: PublicPost[];
  initialQuery?: string;
  initialPage?: number;
}) {
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(Math.max(1, initialPage));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    updateURL(query, page);
  }, [page, query]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return jobs.filter((job) => !normalizedQuery || normalizeText(`${job.title} ${job.summary || ""}`).includes(normalizedQuery));
  }, [jobs, query]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleJobs = filteredJobs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [page, safePage]);

  return (
    <main className="subpage-main bg-slate-50/70 pb-20">
      <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-[#0A4BFF]">Trang chủ</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <span>Tuyển dụng</span>
      </nav>

      <section className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-[#071b3e] via-[#0b3a78] to-[#0A4BFF] px-6 py-12 text-white sm:px-10 sm:py-16">
        <div className="absolute -right-24 -top-28 size-80 rounded-full bg-cyan-300/15 blur-3xl" />
        <div className="absolute -bottom-36 right-32 size-72 rounded-full bg-blue-200/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-200">Gia nhập đội ngũ HPT Tech</p>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
            Cùng chúng tôi kiến tạo
            <span className="block text-cyan-300">giá trị công nghệ</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100">
            HPT Tech chào đón những ứng viên mong muốn phát triển chuyên môn và tạo ra giá trị thiết thực cho khách hàng.
          </p>
          <a href="#vi-tri-tuyen-dung" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#0A4BFF] transition hover:bg-blue-50">
            Xem vị trí đang tuyển
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <section id="vi-tri-tuyen-dung" className="mt-8 scroll-mt-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0A4BFF]">Cơ hội nghề nghiệp</p>
            <h2 className="mt-2 text-2xl font-black uppercase text-[#102b62]">Vị trí đang tuyển</h2>
          </div>
          {jobs.length ? (
            <label className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Tìm kiếm vị trí tuyển dụng..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100"
              />
              {input ? (
                <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setInput("")} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
                  <X size={16} />
                </button>
              ) : null}
            </label>
          ) : null}
        </div>

        {visibleJobs.length ? (
          <div className="mt-5 grid gap-3">
            {visibleJobs.map((job) => <JobCard key={job.slug} job={job} />)}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Users className="mx-auto text-slate-300" size={42} />
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              {jobs.length ? "Không tìm thấy vị trí phù hợp" : "Hiện chưa có vị trí tuyển dụng"}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {jobs.length ? "Hãy thử một từ khóa khác." : "Các cơ hội nghề nghiệp mới sẽ được cập nhật tại đây."}
            </p>
            {jobs.length && input ? (
              <button type="button" onClick={() => setInput("")} className="mt-5 rounded-lg bg-[#0A4BFF] px-5 py-2.5 text-sm font-bold text-white">
                Xóa tìm kiếm
              </button>
            ) : null}
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="mt-7 flex items-center justify-center gap-2" aria-label="Phân trang tuyển dụng">
            <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronLeft size={17} /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
              <button key={value} type="button" onClick={() => setPage(value)} className={cn("size-9 rounded-lg border text-sm font-bold", safePage === value ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 bg-white text-slate-600")}>{value}</button>
            ))}
            <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronRight size={17} /></button>
          </nav>
        ) : null}
      </section>

      {culturePosts.length ? (
        <section className="mt-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#0A4BFF]">Con người HPT</p>
          <h2 className="mt-2 text-2xl font-black uppercase text-[#102b62]">Văn hóa HPT Tech</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {culturePosts.slice(0, 4).map((post) => (
              <Link key={post.slug} href={post.href || `/tin-tuc/${post.fullPath || post.slug}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                  {post.image ? <Image src={post.image} alt={post.title} fill sizes="25vw" className="object-cover transition duration-300 group-hover:scale-[1.04]" /> : null}
                </div>
                <h3 className="p-4 text-sm font-bold leading-6 text-slate-900 group-hover:text-[#0A4BFF]">{post.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
