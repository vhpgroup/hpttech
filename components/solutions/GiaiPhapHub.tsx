"use client";

import Link from "next/link";
import {
  Archive,
  Building2,
  Camera,
  CheckCircle2,
  Database,
  FileSearch,
  FolderKanban,
  GraduationCap,
  Landmark,
  Network,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { PublicSolution } from "@/lib/content-payload";
import type { LandingHubData, LandingHubItem } from "@/lib/landing-pages";

type FilterKey = "all" | "may-scan" | "so-hoa" | "cntt" | "doi-tuong" | "du-an";

type GiaiPhapHubProps = {
  scan: LandingHubData["scan"];
  solutions: PublicSolution[];
};

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "may-scan", label: "Máy scan" },
  { key: "so-hoa", label: "Số hóa" },
  { key: "cntt", label: "CNTT" },
  { key: "doi-tuong", label: "Đối tượng" },
  { key: "du-an", label: "Dự án" },
];

const ROADMAP = [
  {
    key: "so-hoa",
    icon: Database,
    title: "Số hóa tài liệu",
    items: ["Dịch vụ số hóa", "OCR tiếng Việt", "DMS/ECM", "Lưu trữ điện tử"],
  },
  {
    key: "cntt",
    icon: Network,
    title: "Giải pháp CNTT",
    items: ["Smart Classroom", "Paperless Meeting", "Camera AI", "Hạ tầng mạng"],
  },
  {
    key: "doi-tuong",
    icon: Building2,
    title: "Theo đối tượng",
    items: ["Cơ quan nhà nước", "Bệnh viện", "Trường học", "Doanh nghiệp"],
  },
  {
    key: "du-an",
    icon: FolderKanban,
    title: "Dự án & năng lực",
    items: ["Hồ sơ năng lực", "Dự án tiêu biểu", "Bảo hành", "Triển khai toàn quốc"],
  },
] as const;

const ICONS = {
  archive: Archive,
  "building-2": Building2,
  "graduation-cap": GraduationCap,
  hospital: Building2,
  landmark: Landmark,
  scan: ScanLine,
  shield: ShieldCheck,
} as const;

function itemIcon(item: LandingHubItem) {
  return ICONS[item.icon as keyof typeof ICONS] || FileSearch;
}

function show(filter: FilterKey, group: FilterKey) {
  return filter === "all" || filter === group;
}

function shortPath(pathname: string) {
  return pathname.replace("/giai-phap/may-scan", "");
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-extrabold text-primary-700">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-600">{label}</div>
    </div>
  );
}

function SectionHeading({ count, href, title }: { count?: number; href?: string; title: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-primary-50 text-primary-700">
        <ScanLine size={22} />
      </span>
      <h2 className="text-2xl font-extrabold tracking-normal text-ink">{title}</h2>
      {typeof count === "number" ? (
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">{count} trang</span>
      ) : null}
      {href ? (
        <Link href={href} className="ml-auto text-sm font-bold text-primary-700 hover:underline">
          Hub máy scan
        </Link>
      ) : null}
    </div>
  );
}

function IndustryCard({ item }: { item: LandingHubItem }) {
  const Icon = itemIcon(item);
  return (
    <Link
      href={item.pathname}
      data-industry={item.accentKey}
      className="group flex min-h-[156px] flex-col gap-2 rounded-md border border-border bg-white p-4 transition [border-top:3px_solid_var(--ind-600,var(--color-primary-700))] hover:-translate-y-0.5 hover:shadow-soft"
    >
      <span className="grid h-10 w-10 place-items-center rounded-md bg-[color:var(--ind-50,var(--color-primary-50))] text-[color:var(--ind-700,var(--color-primary-800))]">
        <Icon size={20} />
      </span>
      <h3 className="text-sm font-bold leading-tight text-ink">{item.title}</h3>
      <p className="line-clamp-2 flex-1 text-xs leading-5 text-slate-600">{item.desc}</p>
      <span className="truncate font-mono text-[11px] text-slate-400">{shortPath(item.pathname)}</span>
    </Link>
  );
}

function CompactLink({ item }: { item: LandingHubItem }) {
  const Icon = itemIcon(item);
  return (
    <Link
      href={item.pathname}
      className="flex min-h-16 items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
    >
      <Icon size={18} className="shrink-0 text-primary-700" />
      <span className="min-w-0">
        <span className="line-clamp-1">{item.title}</span>
        <span className="block truncate font-mono text-[11px] font-normal text-slate-400">{shortPath(item.pathname)}</span>
      </span>
    </Link>
  );
}

export function GiaiPhapHub({ scan, solutions }: GiaiPhapHubProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const scanCount = scan.industry.length + scan.need.length + scan.brand.length;

  return (
    <main className="text-ink">
      <div className="mx-auto max-w-[1200px] px-5">
        <nav className="py-4 text-sm text-slate-600" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary-700">Trang chủ</Link>
          <span className="px-2">/</span>
          <span className="font-semibold text-primary-700">Giải pháp</span>
        </nav>
      </div>

      <section className="border-y border-border bg-gradient-to-br from-primary-50 via-white to-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-12">
          <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-primary-700 ring-1 ring-primary-100">
            Trung tâm giải pháp
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-ink md:text-5xl">
            Giải pháp số hóa theo ngành
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            HPT Tech gom giải pháp máy scan, số hóa tài liệu và hạ tầng công nghệ theo đúng ngành, nhu cầu và thương hiệu để doanh nghiệp chọn nhanh cấu hình phù hợp.
          </p>
          <div className="mt-7 flex flex-wrap gap-8">
            <Stat value={String(scanCount)} label="Trang máy scan" />
            <Stat value="5" label="Nhóm giải pháp" />
            <Stat value="100+" label="Trang lộ trình" />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#lien-he" className="inline-flex h-12 items-center rounded-md bg-accent-500 px-5 text-sm font-bold text-white transition hover:bg-accent-600">
              Tư vấn & báo giá
            </a>
            <a href="#scan" className="inline-flex h-12 items-center rounded-md border border-border bg-white px-5 text-sm font-bold text-primary-700 transition hover:border-primary-300">
              Xem giải pháp máy scan
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={
                filter === item.key
                  ? "rounded-full border border-primary-700 bg-primary-700 px-4 py-2 text-sm font-semibold text-white"
                  : "rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        {show(filter, "may-scan") ? (
          <section id="scan" className="mt-10">
            <SectionHeading title="Máy scan" count={scanCount} href="/giai-phap/may-scan" />
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Theo ngành</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {scan.industry.map((item) => <IndustryCard key={item.pathname} item={item} />)}
            </div>

            <p className="mb-4 mt-8 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Theo nhu cầu</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {scan.need.map((item) => <CompactLink key={item.pathname} item={item} />)}
            </div>

            <p className="mb-4 mt-8 text-xs font-extrabold uppercase tracking-[0.08em] text-slate-500">Theo thương hiệu</p>
            <div className="flex flex-wrap gap-2">
              {scan.brand.map((item) => (
                <Link
                  key={item.pathname}
                  href={item.pathname}
                  className="rounded-md border border-border bg-white px-4 py-2 text-sm font-extrabold text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                >
                  {item.title.replace(/^Máy scan\s+/i, "")}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {ROADMAP.filter((item) => show(filter, item.key)).map((item) => {
          const Icon = item.icon;
          return (
            <section key={item.key} className="mt-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-md bg-primary-50 text-primary-700">
                  <Icon size={22} />
                </span>
                <h2 className="text-2xl font-extrabold tracking-normal text-ink">{item.title}</h2>
                <span className="ml-auto rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
                  Lộ trình phase sau
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.items.map((label) => (
                  <span key={label} className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                    {label}
                  </span>
                ))}
              </div>
            </section>
          );
        })}

        {solutions.length ? (
          <section className="mt-12">
            <SectionHeading title="Giải pháp doanh nghiệp" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {solutions.slice(0, 4).map((solution) => (
                <article key={solution.slug || solution.title} className="rounded-md border border-border bg-white p-5 shadow-sm">
                  <Camera className="text-primary-700" size={22} />
                  <h3 className="mt-4 text-base font-bold text-ink">{solution.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{solution.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <section id="lien-he" className="mx-auto max-w-[1200px] px-5 pb-14">
        <div className="rounded-md bg-primary-800 p-8 text-white md:p-10">
          <CheckCircle2 size={24} className="text-primary-100" />
          <h2 className="mt-4 text-2xl font-extrabold">Chưa thấy ngành hoặc nhu cầu của bạn?</h2>
          <p className="mt-3 max-w-2xl text-primary-50">
            HPT Tech tư vấn cấu hình thiết bị, hồ sơ dự án, VAT và phương án triển khai theo khối lượng tài liệu thực tế.
          </p>
          <a href="tel:0967286889" className="mt-5 inline-flex h-12 items-center rounded-md bg-accent-500 px-5 text-sm font-bold text-white transition hover:bg-accent-600">
            Gọi hotline 0967286889
          </a>
        </div>
      </section>
    </main>
  );
}
