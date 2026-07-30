import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SanPhamHubSolutionLink } from "@/lib/san-pham-hub";

type HubSolutionLinksProps = {
  solutionLinks: SanPhamHubSolutionLink[];
};

const FACET_META: Record<
  SanPhamHubSolutionLink["facetType"],
  { label: string; description: string }
> = {
  need: {
    label: "Chọn theo nhu cầu",
    description: "Scan duplex, scan khổ lớn, scan hồ sơ, lưu trữ số hóa...",
  },
  industry: {
    label: "Chọn theo ngành",
    description: "Hành chính công, tòa án, thuế, ngân hàng, bảo hiểm...",
  },
  brand: {
    label: "Chọn theo hãng",
    description: "Fujitsu, Canon, Kodak Alaris, Panasonic, Epson, Ricoh...",
  },
};

export function HubSolutionLinks({ solutionLinks }: HubSolutionLinksProps) {
  if (!solutionLinks || solutionLinks.length === 0) return null;

  // Nhóm theo facetType
  const grouped: Partial<Record<SanPhamHubSolutionLink["facetType"], SanPhamHubSolutionLink[]>> = {};
  for (const link of solutionLinks) {
    if (!grouped[link.facetType]) grouped[link.facetType] = [];
    grouped[link.facetType]!.push(link);
  }

  const facetOrder: SanPhamHubSolutionLink["facetType"][] = ["need", "industry", "brand"];
  const visibleFacets = facetOrder.filter((f) => (grouped[f]?.length ?? 0) > 0);

  if (visibleFacets.length === 0) return null;

  return (
    <section
      aria-label="Giải pháp theo nhu cầu và ngành"
      className="bg-surface px-4 py-14 font-sans sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-800">
            Tư vấn giải pháp
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">
            HPT Tech tư vấn giải pháp theo bài toán của bạn
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink/60">
            Lựa chọn thiết bị phù hợp theo nhu cầu thực tế, ngành nghề, và thương hiệu
            — tư vấn chuyên sâu từ đội ngũ kỹ thuật 20+ năm kinh nghiệm.
          </p>
        </div>

        {/* Grouped chips */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visibleFacets.map((facet) => {
            const meta = FACET_META[facet];
            const links = grouped[facet] ?? [];
            return (
              <div key={facet} className="rounded-xl border border-border bg-white p-5 shadow-sm">
                <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary-600">
                  {meta.label}
                </p>
                <p className="mb-4 text-xs text-ink/50">{meta.description}</p>
                <div className="flex flex-wrap gap-2">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800 transition hover:border-primary-400 hover:bg-primary-100 hover:text-primary-900"
                    >
                      {link.title}
                      <ArrowUpRight size={12} />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
