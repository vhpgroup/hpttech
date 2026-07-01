import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Gauge,
  Headset,
  Layers,
  PhoneCall,
  Plus,
  ReceiptText,
  Ruler,
  Share2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { PayloadRichText } from "@/components/rich-text/PayloadRichText";
import { CtaQuote } from "@/components/landing/CtaQuote";
import type { CatalogProduct } from "@/lib/catalog";
import { landingAccentKey, type LandingPageDoc } from "@/lib/landing-pages";
import { breadcrumbLd, faqLd, itemListLd } from "@/lib/seo-jsonld";

type LandingTemplateAProps = {
  doc: LandingPageDoc;
  products: CatalogProduct[];
};

// Accent tokens (đổi theo data-industry, fallback về primary). Dùng inline style để
// tránh Tailwind arbitrary-value phải escape dấu phẩy trong var(--x, --y).
const ACCENT = "var(--ind-600,var(--color-primary-700))";
const ACCENT_DARK = "var(--ind-700,var(--color-primary-800))";
const ACCENT_TINT = "var(--ind-50,var(--color-primary-50))";

const TRUST_ITEMS = [
  { Icon: ShieldCheck, label: "Chính hãng 100%" },
  { Icon: ReceiptText, label: "Xuất hóa đơn VAT" },
  { Icon: Truck, label: "Giao hàng toàn quốc" },
  { Icon: Headset, label: "Hỗ trợ kỹ thuật tận nơi" },
  { Icon: BadgeCheck, label: "Bảo hành chính hãng" },
];

const HERO_CHIPS = ["Chính hãng 100%", "Xuất hóa đơn VAT", "Giao & lắp toàn quốc", "Tư vấn theo nhu cầu"];

const PAIN_ICONS = [Layers, Share2, ShieldCheck, Gauge, FileText, Ruler];

function JsonLd({ value }: { value: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(value).replace(/</g, "\\u003c") }}
    />
  );
}

function pageTitle(doc: LandingPageDoc) {
  return doc.h1 || doc.title || "Giải pháp máy scan cho doanh nghiệp";
}

function heroLead(doc: LandingPageDoc) {
  return (
    doc.seo?.description ||
    "HPT Tech tư vấn và cung cấp máy scan chính hãng, giải pháp số hóa phù hợp theo khối lượng và đặc thù đơn vị."
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <span
        className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]"
        style={{ backgroundColor: ACCENT_TINT, color: ACCENT_DARK }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-3 text-2xl font-extrabold leading-tight text-ink md:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-3 leading-7 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

function relatedPageHref(page: LandingPageDoc) {
  if (page.pathname) return page.pathname;
  if (page.productGroup && page.facetType && page.facetSlug) {
    const segment = page.facetType === "industry" ? "nganh" : page.facetType === "need" ? "nhu-cau" : "hang";
    return `/giai-phap/${page.productGroup}/${segment}/${page.facetSlug}`;
  }
  return "/giai-phap/may-scan";
}

export function LandingTemplateA({ doc, products }: LandingTemplateAProps) {
  const accentKey = landingAccentKey(doc);
  const title = pageTitle(doc);
  const lead = heroLead(doc);
  const heroProduct = products[0];
  const painPoints = doc.painPoints?.filter((item) => item.text) || [];
  const criteria = doc.criteria?.filter((item) => item.need || item.spec) || [];
  const workflow = doc.workflow?.filter((item) => item.step || item.detail) || [];
  const faqs = doc.faqs?.filter((faq) => faq.question && faq.answer) || [];
  const relatedPages =
    doc.relatedPages?.filter((page): page is LandingPageDoc => Boolean(page) && typeof page === "object") || [];

  const breadcrumbs = [
    { href: "/", name: "Trang chủ" },
    { href: "/giai-phap", name: "Giải pháp" },
    { href: "/giai-phap/may-scan", name: "Máy scan" },
    { href: doc.pathname || "/giai-phap/may-scan", name: title },
  ];

  return (
    <main data-industry={accentKey} className="bg-white">
      <JsonLd value={breadcrumbLd(breadcrumbs)} />
      {faqs.length >= 3 ? <JsonLd value={faqLd(faqs)} /> : null}
      {products.length ? (
        <JsonLd value={itemListLd(products.map((product) => ({ href: product.href, name: product.title })))} />
      ) : null}

      {/* ===== HERO (2 cột: nội dung + thiết bị) ===== */}
      <section
        className="px-4 sm:px-6 lg:px-8"
        style={{ background: `linear-gradient(135deg, ${ACCENT_TINT} 0%, #ffffff 60%)` }}
      >
        <div className="mx-auto max-w-6xl">
          <nav className="flex flex-wrap items-center gap-2 py-4 text-sm text-slate-600" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={item.href} className="flex items-center gap-2">
                {index < breadcrumbs.length - 1 ? (
                  <Link className="font-medium hover:text-primary-700" href={item.href}>
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-slate-500">{item.name}</span>
                )}
                {index < breadcrumbs.length - 1 ? <span className="text-slate-400">/</span> : null}
              </span>
            ))}
          </nav>

          <div className="grid items-center gap-10 pb-14 pt-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span
                className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]"
                style={{ color: ACCENT_DARK }}
              >
                Giải pháp máy scan chính hãng
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-ink md:text-5xl">{title}</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">{lead}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#bao-gia"
                  className="inline-flex h-12 items-center gap-2 rounded-md px-5 text-sm font-bold text-white transition hover:brightness-95"
                  style={{ backgroundColor: ACCENT }}
                >
                  Nhận tư vấn báo giá
                  <ArrowRight size={17} />
                </a>
                <a
                  href="tel:0967286889"
                  className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-white px-5 text-sm font-bold text-ink transition hover:border-primary-300 hover:text-primary-700"
                >
                  <PhoneCall size={17} />
                  0967 286 889
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
                {HERO_CHIPS.map((chip) => (
                  <span key={chip} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <CheckCircle2 size={16} style={{ color: ACCENT }} />
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* hero visual: ảnh máy đề xuất + badge nổi; fallback = hộp cam kết */}
            {heroProduct?.image ? (
              <div className="relative mx-auto w-full max-w-md">
                <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroProduct.image}
                    alt={heroProduct.title || "Máy scan"}
                    className="mx-auto max-h-[300px] w-auto object-contain"
                  />
                </div>
                <div className="absolute -bottom-4 left-3 max-w-[220px] rounded-xl border border-border bg-white px-4 py-3 shadow-soft">
                  <p className="text-xs font-semibold" style={{ color: ACCENT_DARK }}>
                    {heroProduct.brand || "Máy scan đề xuất"}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-bold text-ink">{heroProduct.title}</p>
                </div>
                <div
                  className="absolute -right-2 top-4 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-soft"
                  style={{ backgroundColor: ACCENT }}
                >
                  Chính hãng · Bảo hành
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                <h2 className="text-lg font-bold text-ink">Cam kết HPT Tech</h2>
                <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                  {TRUST_ITEMS.map(({ Icon, label }) => (
                    <div key={label} className="flex gap-2">
                      <Icon className="mt-0.5 shrink-0" size={18} style={{ color: ACCENT }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== TRUST BAND ===== */}
      <section className="bg-primary-800 text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 md:grid-cols-5 lg:px-8">
          {TRUST_ITEMS.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-sm font-semibold">
              <Icon size={20} className="shrink-0 text-white/90" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TỔNG QUAN (intro dài, tách khỏi hero) ===== */}
      {doc.intro ? (
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <span
              className="inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]"
              style={{ backgroundColor: ACCENT_TINT, color: ACCENT_DARK }}
            >
              Tổng quan
            </span>
            <div className="mt-4">
              <PayloadRichText data={doc.intro} className="text-base leading-8 text-slate-700" />
            </div>
          </div>
        </section>
      ) : null}

      {/* ===== PAIN POINTS (card có accent + icon) ===== */}
      {painPoints.length ? (
        <section className="bg-surface px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionTitle eyebrow="Nhu cầu thực tế" title="Các vấn đề HPT Tech thường xử lý" />
            <div className="grid gap-5 md:grid-cols-3">
              {painPoints.map((item, index) => {
                const Icon = PAIN_ICONS[index % PAIN_ICONS.length];
                return (
                  <article
                    key={`${item.text}-${index}`}
                    className="rounded-2xl border border-t-4 border-border bg-white p-6 shadow-soft"
                    style={{ borderTopColor: ACCENT }}
                  >
                    <div
                      className="grid h-11 w-11 place-items-center rounded-xl"
                      style={{ backgroundColor: ACCENT_TINT, color: ACCENT_DARK }}
                    >
                      <Icon size={22} />
                    </div>
                    <p className="mt-4 text-base font-semibold leading-7 text-ink">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ===== PRODUCTS ===== */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Model đề xuất"
            title="Máy scan phù hợp để tham khảo"
            subtitle="Gợi ý theo tiêu chí thực tế của đơn vị — ưu tiên máy đã kiểm chứng, còn hàng, xuất VAT."
          />
          {products.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.slug || product.title} product={product} />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link
                  href="/san-pham?category=may-scan"
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-primary-700 px-6 text-sm font-bold text-white transition hover:bg-primary-800"
                >
                  Xem tất cả máy scan
                  <ArrowRight size={17} />
                </Link>
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 text-center">
              <p className="text-base leading-7 text-slate-700">
                Chưa có model đủ khớp bộ lọc. HPT Tech sẽ tư vấn model thay thế hoặc cấu hình dự án theo nhu cầu thực tế.
              </p>
              <Link className="mt-4 inline-flex font-bold text-primary-700" href="/san-pham?category=may-scan">
                Xem danh mục máy scan
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ===== CRITERIA (bảng header đậm) ===== */}
      {criteria.length ? (
        <section className="bg-surface px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionTitle eyebrow="Tiêu chí" title="Thông số nên ưu tiên khi chọn máy" />
            <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
              <table className="w-full border-collapse bg-white text-left text-sm">
                <thead>
                  <tr className="bg-primary-800 text-white">
                    <th className="px-5 py-4 font-bold">Nhu cầu</th>
                    <th className="px-5 py-4 font-bold">Thông số / tính năng cần có</th>
                  </tr>
                </thead>
                <tbody>
                  {criteria.map((item, index) => (
                    <tr key={`${item.need}-${index}`} className="border-t border-border odd:bg-white even:bg-surface">
                      <td className="w-2/5 px-5 py-4 align-top font-bold text-ink">{item.need}</td>
                      <td className="px-5 py-4 align-top font-medium leading-6" style={{ color: ACCENT_DARK }}>
                        {item.spec}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {/* ===== WORKFLOW ===== */}
      {workflow.length ? (
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionTitle eyebrow="Triển khai" title="Quy trình tư vấn và bàn giao" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map((item, index) => (
                <article key={`${item.step}-${index}`} className="rounded-2xl border border-border bg-white p-6 shadow-soft">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-xl text-sm font-extrabold text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {index + 1}
                  </div>
                  <h3 className="mt-4 font-bold text-ink">{item.step}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ===== FAQ ===== */}
      {faqs.length ? (
        <section className="bg-surface px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionTitle eyebrow="FAQ" title="Câu hỏi thường gặp" />
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <details
                  key={`${faq.question}-${index}`}
                  className="group rounded-2xl border border-border bg-white p-5 shadow-soft"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink">
                    <span>{faq.question}</span>
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white transition-transform duration-200 group-open:rotate-45"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <Plus size={16} />
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ===== RELATED ===== */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="Liên kết nội bộ" title="Giải pháp máy scan liên quan" />
          <div className="flex flex-wrap justify-center gap-3">
            {relatedPages.map((page) => (
              <Link
                key={page.pathname || page.id || page.title}
                href={relatedPageHref(page)}
                className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
              >
                {page.title || page.facetSlug || "Giải pháp máy scan"}
              </Link>
            ))}
            <Link
              href="/giai-phap/may-scan"
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
            >
              Tất cả giải pháp máy scan
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA (giữ component sẵn có) ===== */}
      <section id="bao-gia">
        <CtaQuote industry={doc.facetSlug} landingPath={doc.pathname} products={products} title={title} />
      </section>
    </main>
  );
}