import Link from "next/link";
import type { SanPhamHubBrand } from "@/lib/san-pham-hub";

type HubBrandStripProps = {
  brands: SanPhamHubBrand[];
};

export function HubBrandStrip({ brands }: HubBrandStripProps) {
  if (!brands || brands.length === 0) return null;

  return (
    <section
      aria-label="Thương hiệu chính hãng"
      className="bg-white px-4 py-12 font-sans sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-700">
            Phân phối chính hãng
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">
            Thương hiệu chính hãng tại HPT Tech
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink/60">
            Đại lý ủy quyền và phân phối chính hãng trên 20 năm — HP, Canon, Brother, Fujitsu,
            Kodak Alaris, Ricoh, Epson và nhiều thương hiệu thiết bị chuyên dụng B2B.
          </p>
        </div>

        {/* Brand chips */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {brands.map((brand) => (
            <Link
              key={brand.slug || brand.name}
              href={brand.href}
              className="group inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
            >
              <span>{brand.name}</span>
              {brand.productCount > 0 && (
                <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-xs font-bold text-primary-700 group-hover:bg-primary-200">
                  {brand.productCount.toLocaleString("vi-VN")}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
