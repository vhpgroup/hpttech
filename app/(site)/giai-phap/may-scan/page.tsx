import Link from "next/link";
import { Archive, BadgeCheck, Building2, FileSearch, ScanLine, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { LandingHubItem } from "@/lib/landing-pages";
import { getHubData } from "@/lib/landing-pages";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Giải pháp máy scan theo ngành, nhu cầu & thương hiệu",
  description:
    "Tổng hợp máy scan HPT Tech theo ngành, theo nhu cầu như CCCD, A3, tốc độ cao và theo thương hiệu Fujitsu, Ricoh, Kodak Alaris, Canon, Epson. Tư vấn & báo giá.",
  path: "/giai-phap/may-scan",
});

const ICONS = {
  archive: Archive,
  "building-2": Building2,
  hospital: Building2,
  scan: ScanLine,
  shield: ShieldCheck,
} as const;

function iconFor(item: LandingHubItem) {
  return ICONS[item.icon as keyof typeof ICONS] || FileSearch;
}

function Breadcrumb() {
  return (
    <div className="mx-auto max-w-[1200px] px-5">
      <nav className="py-4 text-sm text-slate-600" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary-700">Trang chủ</Link>
        <span className="px-2">/</span>
        <Link href="/giai-phap" className="hover:text-primary-700">Giải pháp</Link>
        <span className="px-2">/</span>
        <span className="font-semibold text-primary-700">Máy scan</span>
      </nav>
    </div>
  );
}

function IndustryCard({ item }: { item: LandingHubItem }) {
  const Icon = iconFor(item);
  return (
    <Link
      href={item.pathname}
      data-industry={item.accentKey}
      className="flex min-h-[150px] flex-col gap-2 rounded-md border border-border bg-white p-4 transition [border-top:3px_solid_var(--ind-600,var(--color-primary-700))] hover:-translate-y-0.5 hover:shadow-soft"
    >
      <span className="grid h-10 w-10 place-items-center rounded-md bg-[color:var(--ind-50,var(--color-primary-50))] text-[color:var(--ind-700,var(--color-primary-800))]">
        <Icon size={20} />
      </span>
      <h3 className="text-sm font-bold leading-tight text-ink">{item.title}</h3>
      <p className="line-clamp-2 flex-1 text-xs leading-5 text-slate-600">{item.desc}</p>
    </Link>
  );
}

function CompactCard({ item }: { item: LandingHubItem }) {
  const Icon = iconFor(item);
  return (
    <Link
      href={item.pathname}
      className="flex min-h-16 items-center gap-3 rounded-md border border-border bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
    >
      <Icon size={18} className="shrink-0 text-primary-700" />
      <span>{item.title}</span>
    </Link>
  );
}

function Section({
  children,
  count,
  title,
}: {
  children: ReactNode;
  count: number;
  title: string;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700">{count} trang</span>
      </div>
      {children}
    </section>
  );
}

export default async function ScannerSolutionsPage() {
  const { scan } = await getHubData();
  const total = scan.industry.length + scan.need.length + scan.brand.length;

  return (
    <main className="text-ink">
      <Breadcrumb />

      <section className="border-y border-border bg-gradient-to-br from-primary-50 via-white to-surface">
        <div className="mx-auto max-w-[1200px] px-5 py-12">
          <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-primary-700 ring-1 ring-primary-100">
            Máy scan
          </span>
          <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight tracking-normal text-ink md:text-5xl">
            Giải pháp máy scan theo ngành, nhu cầu & thương hiệu
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            Chọn nhanh máy scan chính hãng theo bối cảnh sử dụng. HPT Tech tư vấn cấu hình, báo giá dự án, xuất VAT, giao hàng và hỗ trợ toàn quốc.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="tel:0967286889" className="inline-flex h-12 items-center rounded-md bg-accent-500 px-5 text-sm font-bold text-white transition hover:bg-accent-600">
              Gọi tư vấn 0967286889
            </a>
            <Link href="/san-pham?category=may-scan" className="inline-flex h-12 items-center rounded-md border border-border bg-white px-5 text-sm font-bold text-primary-700 transition hover:border-primary-300">
              Xem danh mục máy scan
            </Link>
          </div>
          <div className="mt-8 inline-flex items-center gap-2 rounded-md border border-primary-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
            <BadgeCheck size={18} className="text-primary-700" />
            {total} landing đang publish trong hub máy scan
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <Section title="Theo ngành" count={scan.industry.length}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {scan.industry.map((item) => <IndustryCard key={item.pathname} item={item} />)}
          </div>
        </Section>

        <Section title="Theo nhu cầu" count={scan.need.length}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {scan.need.map((item) => <CompactCard key={item.pathname} item={item} />)}
          </div>
        </Section>

        <Section title="Theo thương hiệu" count={scan.brand.length}>
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
        </Section>
      </div>
    </main>
  );
}
