import { BadgeCheck, Headset, Phone, ReceiptText, ShieldCheck, Truck } from "lucide-react";

type HubHeroProps = {
  totalProducts: number;
  groupIds: string[];
  groupTitles: Record<string, string>;
};

const TRUST_CHIPS = [
  "Chính hãng 100%",
  "Xuất hóa đơn VAT",
  "Giao toàn quốc",
  "Tư vấn kỹ thuật",
];

const TRUST_BAND_ITEMS = [
  { Icon: ShieldCheck, label: "Chính hãng 100%" },
  { Icon: ReceiptText, label: "Xuất hóa đơn VAT" },
  { Icon: Truck, label: "Giao hàng toàn quốc" },
  { Icon: Headset, label: "Tư vấn kỹ thuật tận nơi" },
  { Icon: BadgeCheck, label: "Bảo hành chính hãng" },
];

function formatTotalProducts(n: number): string {
  if (n <= 0) return "hơn 6.000";
  if (n >= 1000) {
    const k = Math.floor(n / 1000);
    return `hơn ${k}.000`;
  }
  return n.toLocaleString("vi-VN");
}

export function HubHero({ totalProducts, groupIds, groupTitles }: HubHeroProps) {
  const formatted = formatTotalProducts(totalProducts);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-primary-900 px-4 py-16 font-sans text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        {/* Subtle radial glow backdrop */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, var(--color-primary-700) 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-5xl text-center">
          {/* Eyebrow */}
          <span className="inline-flex rounded-full bg-primary-700 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-100">
            Thiết bị &amp; giải pháp cho doanh nghiệp
          </span>

          {/* H1 — visible (dùng cho SEO, không sr-only) */}
          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Sản phẩm chính hãng cho doanh nghiệp
          </h1>

          {/* Lead */}
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-primary-100 sm:text-lg">
            {formatted} sản phẩm chính hãng: máy scan, máy in, photocopy, mực in, laptop,
            PC – máy chủ, thiết bị mạng và phần mềm bản quyền. Tư vấn cấu hình, báo giá, xuất VAT,
            giao toàn quốc.
          </p>

          {/* Trust chips */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {TRUST_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-primary-600 bg-primary-800 px-3 py-1 text-xs font-semibold text-primary-100"
              >
                {chip}
              </span>
            ))}
          </div>

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#hub-cta"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-accent-500 px-6 text-sm font-bold text-white shadow-soft transition hover:bg-accent-600"
            >
              Nhận tư vấn báo giá
            </a>
            <a
              href="tel:0967286889"
              className="inline-flex h-12 items-center gap-2 rounded-lg border border-primary-500 bg-primary-800 px-6 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <Phone size={17} />
              0967 286 889
            </a>
          </div>

          {/* Quick-jump anchors */}
          {groupIds.length > 0 && (
            <nav aria-label="Danh mục sản phẩm" className="mt-10">
              <div className="flex flex-wrap justify-center gap-2">
                {groupIds.map((id) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="rounded-full border border-primary-600 bg-primary-800/70 px-3 py-1.5 text-xs font-medium text-primary-100 transition hover:border-primary-400 hover:text-white"
                  >
                    {groupTitles[id] ?? id}
                  </a>
                ))}
              </div>
            </nav>
          )}
        </div>
      </section>

      {/* ===== TRUST BAND ===== */}
      <div className="bg-primary-800 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {TRUST_BAND_ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-primary-50">
              <Icon size={18} className="shrink-0 text-accent-400" />
              <span className="text-xs font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
