"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicProject } from "@/lib/content-payload";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;
const INDUSTRY_LIMIT = 6;

type SortValue = "newest" | "oldest";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function slugify(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function projectTime(project: PublicProject) {
  if (!project.completedAt) return 0;
  const value = new Date(project.completedAt).getTime();
  return Number.isFinite(value) ? value : 0;
}

function projectYear(project: PublicProject) {
  if (!project.completedAt) return undefined;
  const year = new Date(project.completedAt).getFullYear();
  return Number.isFinite(year) ? String(year) : undefined;
}

function updateURL(industry?: string, query?: string, sort?: SortValue, page = 1) {
  const params = new URLSearchParams();
  if (industry) params.set("linh-vuc", slugify(industry));
  if (query) params.set("q", query);
  if (sort === "oldest") params.set("sap-xep", "cu-nhat");
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  window.history.replaceState(null, "", value ? `/du-an?${value}` : "/du-an");
}

function ProjectImage({
  project,
  priority = false,
  sizes,
  className,
}: {
  project: PublicProject;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  if (!project.image) {
    return (
      <div className={cn("grid h-full w-full place-items-center bg-gradient-to-br from-blue-50 to-slate-200 text-blue-300", className)}>
        <BriefcaseBusiness size={44} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image
      src={project.image}
      alt={project.title}
      fill
      priority={priority}
      sizes={sizes}
      className={cn("object-cover", className)}
    />
  );
}

function ProjectMeta({ project, light = false }: { project: PublicProject; light?: boolean }) {
  const year = projectYear(project);
  if (!project.client && !year) return null;

  return (
    <div className={cn("mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium", light ? "text-slate-200" : "text-slate-500")}>
      {project.client ? <span>{project.client}</span> : null}
      {year ? (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} />
          {year}
        </span>
      ) : null}
    </div>
  );
}

function FeaturedProjects({ projects }: { projects: PublicProject[] }) {
  const primary = projects[0];
  const secondary = projects.slice(1, 4);
  if (!primary) return null;

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Link
        href={`/du-an/${primary.slug}`}
        className="group relative min-h-[430px] overflow-hidden rounded-2xl bg-slate-900 text-white"
      >
        <ProjectImage
          project={primary}
          priority
          sizes="(max-width: 1023px) 100vw, 67vw"
          className="transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          {primary.industry ? (
            <span className="inline-flex rounded bg-[#0A4BFF] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide">
              {primary.industry}
            </span>
          ) : null}
          <h2 className="mt-3 max-w-3xl text-2xl font-black leading-tight sm:text-3xl">{primary.title}</h2>
          {primary.summary ? <p className="mt-3 max-w-2xl line-clamp-2 text-sm leading-6 text-slate-200">{primary.summary}</p> : null}
          <ProjectMeta project={primary} light />
          <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[#0A4BFF]">
            Xem chi tiết dự án
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>

      {secondary.length ? (
        <div className="grid gap-3">
          {secondary.map((project) => (
            <Link
              key={project.slug}
              href={`/du-an/${project.slug}`}
              className="group grid min-h-[130px] grid-cols-[120px_1fr] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:grid-cols-[160px_1fr]"
            >
              <div className="relative overflow-hidden bg-slate-100">
                <ProjectImage
                  project={project}
                  sizes="160px"
                  className="transition duration-300 group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center p-4">
                {project.industry ? <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#0A4BFF]">{project.industry}</p> : null}
                <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 text-slate-900 group-hover:text-[#0A4BFF]">{project.title}</h3>
                <ProjectMeta project={project} />
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ProjectCard({ project }: { project: PublicProject }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition motion-reduce:transition-none hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
      <Link href={`/du-an/${project.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-slate-100">
        <ProjectImage
          project={project}
          sizes="(max-width: 639px) 100vw, (max-width: 1199px) 50vw, 25vw"
          className="transition duration-300 motion-reduce:transition-none group-hover:scale-[1.04]"
        />
        {project.industry ? (
          <span className="absolute bottom-3 left-3 rounded bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#0A4BFF] shadow-sm">
            {project.industry}
          </span>
        ) : null}
      </Link>
      <div className="p-4">
        <h2 className="line-clamp-2 min-h-[48px] text-base font-bold leading-6 text-slate-900">
          <Link href={`/du-an/${project.slug}`} className="transition hover:text-[#0A4BFF]">{project.title}</Link>
        </h2>
        <ProjectMeta project={project} />
        {project.summary ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{project.summary}</p> : null}
        <Link href={`/du-an/${project.slug}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#0A4BFF]">
          Xem dự án
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

export function ProjectsPageClient({
  projects,
  initialIndustry,
  initialQuery = "",
  initialSort,
  initialPage = 1,
}: {
  projects: PublicProject[];
  initialIndustry?: string;
  initialQuery?: string;
  initialSort?: string;
  initialPage?: number;
}) {
  const industries = useMemo(
    () => Array.from(new Set(projects.map((project) => project.industry?.trim()).filter((value): value is string => Boolean(value)))),
    [projects],
  );
  const matchedInitialIndustry = industries.find((industry) => slugify(industry) === initialIndustry);
  const [industry, setIndustry] = useState(matchedInitialIndustry || "");
  const [showAllIndustries, setShowAllIndustries] = useState(Boolean(matchedInitialIndustry && industries.indexOf(matchedInitialIndustry) >= INDUSTRY_LIMIT));
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SortValue>(initialSort === "cu-nhat" ? "oldest" : "newest");
  const [page, setPage] = useState(Math.max(1, initialPage));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    updateURL(industry || undefined, query, sort, page);
  }, [industry, page, query, sort]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return projects
      .filter((project) => !industry || project.industry === industry)
      .filter((project) => {
        if (!normalizedQuery) return true;
        return normalizeText(`${project.title} ${project.client || ""} ${project.industry || ""} ${project.summary || ""}`).includes(normalizedQuery);
      })
      .sort((a, b) => sort === "newest" ? projectTime(b) - projectTime(a) : projectTime(a) - projectTime(b));
  }, [industry, projects, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleProjects = filteredProjects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const visibleIndustries = showAllIndustries ? industries : industries.slice(0, INDUSTRY_LIMIT);

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [page, safePage]);

  const clearFilters = () => {
    setIndustry("");
    setInput("");
    setQuery("");
    setSort("newest");
    setPage(1);
  };

  return (
    <main className="subpage-main bg-slate-50/70 pb-20">
      <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-[#0A4BFF]">Trang chủ</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <span>Dự án</span>
      </nav>

      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0A4BFF]">Năng lực triển khai thực tế</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-[#102b62]">Dự án tiêu biểu</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Khám phá các dự án công nghệ, thiết bị văn phòng và giải pháp số hóa HPT Tech đã triển khai cho khách hàng.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tìm kiếm dự án, khách hàng, giải pháp..."
              className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-11 text-sm outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100"
            />
            {input ? (
              <button type="button" aria-label="Xóa tìm kiếm" onClick={() => setInput("")} className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={16} />
              </button>
            ) : null}
          </label>
          <label className="relative">
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortValue);
                setPage(1);
              }}
              className="h-12 min-w-40 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
        </div>

        {industries.length ? (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setIndustry("");
                setPage(1);
              }}
              className={cn("shrink-0 rounded-lg border px-4 py-2 text-sm font-bold transition", !industry ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-[#0A4BFF]")}
            >
              Tất cả dự án
            </button>
            {visibleIndustries.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setIndustry(value);
                  setPage(1);
                }}
                className={cn("shrink-0 rounded-lg border px-4 py-2 text-sm font-bold transition", industry === value ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-[#0A4BFF]")}
              >
                {value}
              </button>
            ))}
            {industries.length > INDUSTRY_LIMIT ? (
              <button type="button" onClick={() => setShowAllIndustries((value) => !value)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-[#0A4BFF] hover:border-blue-300">
                {showAllIndustries ? "Thu gọn" : "Xem thêm"}
                <ChevronDown size={15} className={cn("transition-transform", showAllIndustries && "rotate-180")} />
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {filteredProjects.length ? (
        <>
          {safePage === 1 ? <FeaturedProjects projects={filteredProjects.slice(0, 4)} /> : null}
          <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}
          </section>
        </>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <BriefcaseBusiness className="mx-auto text-slate-300" size={42} />
          <h2 className="mt-4 text-xl font-bold text-slate-900">{projects.length ? "Không tìm thấy dự án phù hợp" : "Dự án đang được cập nhật"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {projects.length ? "Hãy thử từ khóa hoặc lĩnh vực khác." : "Các dự án mới sẽ được hiển thị ngay khi dữ liệu được cập nhật."}
          </p>
          {projects.length ? <button type="button" onClick={clearFilters} className="mt-5 rounded-lg bg-[#0A4BFF] px-5 py-2.5 text-sm font-bold text-white">Xóa bộ lọc</button> : null}
        </section>
      )}

      {totalPages > 1 ? (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang dự án">
          <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronLeft size={17} /></button>
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((value) => value === 1 || value === totalPages || Math.abs(value - safePage) <= 2)
            .map((value, index, values) => (
              <span key={value} className="contents">
                {index > 0 && value - values[index - 1] > 1 ? <span className="px-1 text-slate-400">…</span> : null}
                <button type="button" onClick={() => setPage(value)} className={cn("size-9 rounded-lg border text-sm font-bold", safePage === value ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300")}>{value}</button>
              </span>
            ))}
          <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40"><ChevronRight size={17} /></button>
        </nav>
      ) : null}
    </main>
  );
}
