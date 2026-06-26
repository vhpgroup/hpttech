"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Factory,
  GraduationCap,
  Headphones,
  Landmark,
  LockKeyhole,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicProject } from "@/lib/content-payload";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 8;
const CATEGORY_LIMIT = 8;

type SortValue = "newest" | "oldest";

type ProjectsPageClientProps = {
  projects: PublicProject[];
  initialCategory?: string;
  initialIndustry?: string;
  initialQuery?: string;
  initialSort?: string;
  initialPage?: number;
};

function parseSort(value?: string): SortValue {
  return value === "oldest" || value === "cu-nhat" ? "oldest" : "newest";
}

function normalizeText(value: string) {
  return value
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

function projectCategoryLabel(project: PublicProject) {
  return project.category?.name?.trim() || project.industry?.trim() || "";
}

function projectCategorySlug(project: PublicProject) {
  return project.category?.slug || slugify(projectCategoryLabel(project));
}

function updateURL(category?: string, query?: string, sort?: SortValue, page = 1) {
  const params = new URLSearchParams();
  if (category) params.set("danh-muc", category);
  if (query) params.set("q", query);
  if (sort === "oldest") params.set("sap-xep", "cu-nhat");
  if (page > 1) params.set("page", String(page));
  const value = params.toString();
  window.history.replaceState(null, "", value ? `/du-an?${value}` : "/du-an");
}

function categoryIcon(label: string): LucideIcon {
  const normalized = normalizeText(label);
  if (normalized.includes("cong an") || normalized.includes("an ninh")) return ShieldCheck;
  if (normalized.includes("tai chinh") || normalized.includes("ngan hang")) return Banknote;
  if (normalized.includes("giao duc") || normalized.includes("hoc")) return GraduationCap;
  if (normalized.includes("y te") || normalized.includes("benh")) return Building2;
  if (normalized.includes("doanh nghiep") || normalized.includes("dien")) return Factory;
  return Landmark;
}

function categoryLogo(slug: string, label: string) {
  const normalized = `${slug} ${normalizeText(label)}`;
  if (normalized.includes("bo-cong-an") || normalized.includes("cong an")) {
    return "/assets/logo/bocongan.png";
  }
  if (normalized.includes("bo-tai-chinh") || normalized.includes("tai chinh")) {
    return "/assets/logo/botaichinh.png";
  }
  return undefined;
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

function ProjectMeta({ project, className }: { project: PublicProject; className?: string }) {
  const year = projectYear(project);

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600", className)}>
      {project.client ? (
        <span className="inline-flex items-center gap-1.5">
          <Building2 size={14} className="text-[#0A4BFF]" />
          {project.client}
        </span>
      ) : null}
      {year ? (
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} className="text-[#0A4BFF]" />
          {year}
        </span>
      ) : null}
    </div>
  );
}

function StatCard({ iconSrc, value, label }: { iconSrc: string; value: string; label: string }) {
  return (
    <div className="flex items-center gap-4 border-slate-200 px-6 py-5 md:border-r last:md:border-r-0">
      <div className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-50">
        <Image src={iconSrc} alt="" width={24} height={24} className="size-6 object-contain" />
      </div>
      <div>
        <div className="text-2xl font-black leading-none text-[#0A4BFF]">{value}</div>
        <div className="mt-1 text-xs font-semibold leading-5 text-slate-600">{label}</div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: PublicProject }) {
  const categoryLabel = projectCategoryLabel(project);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(10,75,255,0.13)]">
      <Link href={`/du-an/${project.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <ProjectImage
            project={project}
            sizes="(min-width: 1280px) 280px, (min-width: 640px) 50vw, 100vw"
            className="transition duration-500 group-hover:scale-105"
          />
          {categoryLabel ? (
            <span className="absolute left-4 top-4 rounded-md bg-[#0A4BFF] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white shadow-lg">
              {categoryLabel}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="p-5">
        <Link href={`/du-an/${project.slug}`} className="line-clamp-2 text-base font-black leading-6 text-slate-950 transition group-hover:text-[#0A4BFF]">
          {project.title}
        </Link>
        <ProjectMeta project={project} className="mt-4" />
        {project.summary ? (
          <p className="mt-4 line-clamp-3 border-l-2 border-blue-100 pl-3 text-sm leading-6 text-slate-600">
            {project.summary}
          </p>
        ) : null}
        <Link href={`/du-an/${project.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#0A4BFF]">
          Xem chi tiết dự án
          <ArrowRight size={16} className="transition group-hover:translate-x-1" />
        </Link>
      </div>
    </article>
  );
}

export function ProjectsPageClient({
  projects,
  initialCategory,
  initialIndustry,
  initialQuery,
  initialSort,
  initialPage = 1,
}: ProjectsPageClientProps) {
  const startingCategory = initialCategory || initialIndustry || "";
  const startingQuery = initialQuery || "";
  const [input, setInput] = useState(startingQuery);
  const [query, setQuery] = useState(startingQuery);
  const [category, setCategory] = useState(startingCategory);
  const [sort, setSort] = useState<SortValue>(parseSort(initialSort));
  const [page, setPage] = useState(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get("danh-muc") || "";
    const initialQuery = params.get("q") || "";
    const initialSort: SortValue = params.get("sap-xep") === "cu-nhat" ? "oldest" : "newest";
    const initialPage = Number.parseInt(params.get("page") || "1", 10);

    setCategory(initialCategory);
    setInput(initialQuery);
    setQuery(initialQuery);
    setSort(initialSort);
    setPage(Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [input]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    projects.forEach((project) => {
      const label = projectCategoryLabel(project);
      if (!label) return;
      map.set(projectCategorySlug(project), label);
    });
    return Array.from(map, ([slug, label]) => ({ slug, label }));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return projects
      .filter((project) => {
        const categoryMatches = !category || projectCategorySlug(project) === category || projectCategoryLabel(project) === category;
        if (!categoryMatches) return false;

        if (!normalizedQuery) return true;
        const haystack = normalizeText(
          [
            project.title,
            project.summary,
            project.client,
            project.industry,
            projectCategoryLabel(project),
          ]
            .filter(Boolean)
            .join(" "),
        );
        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => (sort === "newest" ? projectTime(b) - projectTime(a) : projectTime(a) - projectTime(b)));
  }, [category, projects, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleProjects = filteredProjects.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, CATEGORY_LIMIT);
  const clientCount = Math.max(new Set(projects.map((project) => project.client).filter(Boolean)).size, projects.length, 1);
  const fieldCount = Math.max(categories.length, 1);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  useEffect(() => {
    updateURL(category, query, sort, safePage);
  }, [category, query, safePage, sort]);

  const clearFilters = () => {
    setCategory("");
    setInput("");
    setQuery("");
    setSort("newest");
    setPage(1);
  };

  return (
    <main className="projects-page px-4 pb-14 pt-5 sm:px-6">
      <nav className="mb-5 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-[#0A4BFF]">Trang chủ</Link>
        <ChevronRight size={14} />
        <span>Dự án</span>
      </nav>

      <section className="relative overflow-hidden rounded-t-[28px] bg-[#062b5f] text-white shadow-[0_24px_80px_rgba(4,27,61,0.22)]">
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
          <Image
            src="/assets/anhcongty/mattruoc.jpg"
            alt="Mặt trước showroom HPT Tech"
            fill
            priority
            sizes="680px"
            className="object-cover object-[50%_28%] opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062b5f] via-[#062b5f]/75 to-[#062b5f]/20" />
        </div>
        <div className="relative max-w-3xl px-6 py-12 sm:px-10 lg:py-16">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">Dự án tiêu biểu</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Dự án tiêu biểu đã triển khai cho khối Nhà nước, Tài chính, Ngân hàng và Doanh nghiệp lớn
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
            HPT Tech cung cấp thiết bị CNTT, máy scan, giải pháp số hóa tài liệu và hạ tầng công nghệ cho các đơn vị yêu cầu cao về tiến độ, bảo mật và năng lực triển khai.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#project-list" className="inline-flex items-center gap-2 rounded-md bg-yellow-400 px-5 py-3 text-sm font-extrabold text-[#062b5f] transition hover:bg-yellow-300">
              Xem dự án tiêu biểu
              <ArrowRight size={16} />
            </a>
            <Link href="/lien-he" className="inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/5 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/10">
              Liên hệ tư vấn hồ sơ thầu
              <ClipboardCheck size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid overflow-hidden rounded-b-[26px] border border-t-0 border-slate-200 bg-white shadow-sm md:grid-cols-4">
        <StatCard iconSrc="/assets/logo/adward.png" value="10+" label="Năm kinh nghiệm triển khai" />
        <StatCard iconSrc="/assets/logo/folderopen.png" value={`${clientCount}+`} label="Hồ sơ dự án, tổ chức, doanh nghiệp" />
        <StatCard iconSrc="/assets/logo/lanmark.png" value={`${fieldCount}+`} label="Nhóm khách hàng và lĩnh vực" />
        <StatCard iconSrc="/assets/logo/headset.png" value="24/7" label="Hỗ trợ kỹ thuật sau triển khai" />
      </section>

      <section className="mt-8 rounded-[18px] border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 xl:pb-0">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition", !category ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-[#0A4BFF]")}
            >
              <span className="grid size-5 place-items-center overflow-hidden rounded-full bg-white/90">
                <Image src="/assets/logo/grid.webp" alt="" width={18} height={18} className="size-[18px] object-contain" />
              </span>
              Tất cả dự án
            </button>
            {visibleCategories.map(({ slug, label }) => {
              const Icon = categoryIcon(label);
              const logo = categoryLogo(slug, label);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    setCategory(slug);
                    setPage(1);
                  }}
                  className={cn("inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-bold transition", category === slug ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-[#0A4BFF]")}
                >
                  {logo ? (
                    <span className="grid size-5 place-items-center overflow-hidden rounded-full bg-white/90">
                      <Image src={logo} alt="" width={18} height={18} className="size-[18px] object-contain" />
                    </span>
                  ) : (
                    <Icon size={15} />
                  )}
                  {label}
                </button>
              );
            })}
            {categories.length > CATEGORY_LIMIT ? (
              <button
                type="button"
                onClick={() => setShowAllCategories((value) => !value)}
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-4 text-sm font-bold text-[#0A4BFF] hover:border-blue-300"
              >
                {showAllCategories ? "Thu gọn" : "Xem thêm"}
                <ChevronDown size={15} className={cn("transition-transform", showAllCategories && "rotate-180")} />
              </button>
            ) : null}
          </div>

          <label className="relative w-full shrink-0 xl:ml-auto xl:w-[340px] 2xl:w-[380px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tìm dự án, khách hàng..."
              className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-11 text-sm outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100"
            />
            {input ? (
              <button
                type="button"
                aria-label="Xóa tìm kiếm"
                onClick={() => setInput("")}
                className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            ) : null}
          </label>

          <label className="relative shrink-0">
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as SortValue);
                setPage(1);
              }}
              className="h-11 w-full min-w-36 appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#0A4BFF] focus:ring-4 focus:ring-blue-100 xl:w-auto"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </label>
        </div>
      </section>

      {filteredProjects.length ? (
        <section id="project-list" className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {visibleProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}
        </section>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <BriefcaseBusiness className="mx-auto text-slate-300" size={42} />
          <h2 className="mt-4 text-xl font-bold text-slate-900">{projects.length ? "Không tìm thấy dự án phù hợp" : "Dự án đang được cập nhật"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {projects.length ? "Hãy thử từ khóa hoặc danh mục khác." : "Các dự án mới sẽ được hiển thị ngay khi dữ liệu được cập nhật."}
          </p>
          {projects.length ? (
            <button type="button" onClick={clearFilters} className="mt-5 rounded-lg bg-[#0A4BFF] px-5 py-2.5 text-sm font-bold text-white">
              Xóa bộ lọc
            </button>
          ) : null}
        </section>
      )}

      {totalPages > 1 ? (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang dự án">
          <button type="button" disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40">
            <ChevronLeft size={17} />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter((value) => value === 1 || value === totalPages || Math.abs(value - safePage) <= 2)
            .map((value, index, values) => (
              <span key={value} className="contents">
                {index > 0 && value - values[index - 1] > 1 ? <span className="px-1 text-slate-400">...</span> : null}
                <button type="button" onClick={() => setPage(value)} className={cn("size-9 rounded-lg border text-sm font-bold", safePage === value ? "border-[#0A4BFF] bg-[#0A4BFF] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300")}>
                  {value}
                </button>
              </span>
            ))}
          <button type="button" disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-40">
            <ChevronRight size={17} />
          </button>
        </nav>
      ) : null}

      <section className="mt-10 overflow-hidden rounded-[28px] bg-[#062b5f] text-white shadow-[0_24px_70px_rgba(4,27,61,0.18)]">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_360px] lg:p-10">
          <div>
            <p className="text-sm font-black">Cam kết từ HPT Tech</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-4">
              {[
                { label: "Sản phẩm chính hãng, đầy đủ CQ, CO", icon: ShieldCheck },
                { label: "Giải pháp an toàn, bảo mật, đáp ứng tiêu chuẩn", icon: LockKeyhole },
                { label: "Triển khai đúng tiến độ, đảm bảo chất lượng", icon: ClipboardCheck },
                { label: "Hỗ trợ kỹ thuật tận nơi, bảo hành nhanh chóng", icon: Headphones },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="border-white/10 sm:border-r sm:pr-5 last:sm:border-r-0">
                  <Icon className="text-yellow-300" size={26} strokeWidth={1.8} />
                  <p className="mt-3 text-xs font-semibold leading-6 text-blue-50/90">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
            <h2 className="text-xl font-black leading-7">Bạn cần tư vấn giải pháp cho dự án của mình?</h2>
            <p className="mt-3 text-sm leading-6 text-blue-50/80">
              Đội ngũ kỹ thuật của HPT Tech phối hợp khảo sát, tư vấn và cung cấp hồ sơ năng lực theo yêu cầu.
            </p>
            <Link href="/lien-he" className="mt-5 inline-flex items-center gap-2 rounded-md bg-yellow-400 px-5 py-3 text-sm font-extrabold text-[#062b5f] transition hover:bg-yellow-300">
              Liên hệ ngay
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
