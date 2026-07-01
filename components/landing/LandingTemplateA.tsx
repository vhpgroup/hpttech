import Link from "next/link";
import { ArrowRight, CheckCircle2, FileQuestion, PhoneCall } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { PayloadRichText } from "@/components/rich-text/PayloadRichText";
import { CtaQuote } from "@/components/landing/CtaQuote";
import type { CatalogProduct } from "@/lib/catalog";
import {
  landingAccentKey,
  type LandingPageDoc,
} from "@/lib/landing-pages";
import { breadcrumbLd, faqLd, itemListLd } from "@/lib/seo-jsonld";

type LandingTemplateAProps = {
  doc: LandingPageDoc;
  products: CatalogProduct[];
};

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

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[color:var(--ind-600,var(--color-primary-700))]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-bold leading-tight text-ink md:text-3xl">{title}</h2>
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
  const faqs = doc.faqs?.filter((faq) => faq.question && faq.answer) || [];
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

      <section className="bg-[color:var(--ind-50,var(--color-primary-50))] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-600" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => (
              <span key={item.href} className="flex items-center gap-2">
                {index < breadcrumbs.length - 1 ? (
                  <Link className="font-medium hover:text-primary-700" href={item.href}>
                    {item.name}
                  </Link>
                ) : (
                  <span>{item.name}</span>
                )}
                {index < breadcrumbs.length - 1 ? <span>/</span> : null}
              </span>
            ))}
          </nav>

          <div className="grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-bold text-[color:var(--ind-700,var(--color-primary-800))] ring-1 ring-[color:var(--ind-100,var(--color-primary-100))]">
                Máy scan chính hãng cho doanh nghiệp
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight text-ink md:text-5xl">{title}</h1>
              <div className="mt-5 max-w-3xl">
                <PayloadRichText data={doc.intro} className="text-lg leading-8" />
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#bao-gia"
                  className="inline-flex h-12 items-center gap-2 rounded-md bg-[color:var(--ind-600,var(--color-primary-700))] px-5 text-sm font-bold text-white transition hover:brightness-95"
                >
                  Nhận tư vấn báo giá
                  <ArrowRight size={17} />
                </a>
                <a
                  href="tel:0967286889"
                  className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-white px-5 text-sm font-bold text-ink transition hover:border-primary-300 hover:text-primary-700"
                >
                  <PhoneCall size={17} />
                  0967286889
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-white/80 bg-white p-5 shadow-soft">
              <h2 className="text-lg font-bold text-ink">Cam kết HPT Tech</h2>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
                {["Hàng chính hãng 100%", "Xuất hóa đơn VAT đầy đủ", "Tư vấn theo khối lượng hồ sơ", "Giao hàng và hỗ trợ toàn quốc"].map(
                  (item) => (
                    <div key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-[color:var(--ind-600,var(--color-primary-700))]" size={18} />
                      <span>{item}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {doc.painPoints?.length ? (
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionTitle eyebrow="Nhu cầu thực tế" title="Các vấn đề HPT Tech thường xử lý" />
            <div className="grid gap-4 md:grid-cols-3">
              {doc.painPoints.map((item, index) => (
                <article key={`${item.text}-${index}`} className="rounded-lg border border-border bg-surface p-5">
                  <p className="text-base font-semibold leading-7 text-ink">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionTitle eyebrow="Model đề xuất" title="Máy scan phù hợp để tham khảo" />
          {products.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug || product.title} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-white p-6">
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

      {doc.criteria?.length ? (
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionTitle eyebrow="Tiêu chí" title="Thông số nên ưu tiên khi chọn máy" />
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full border-collapse bg-white text-sm">
                <tbody>
                  {doc.criteria.map((item, index) => (
                    <tr key={`${item.need}-${index}`} className="border-b border-border last:border-b-0">
                      <th className="w-1/3 bg-surface px-4 py-3 text-left font-bold text-ink">{item.need}</th>
                      <td className="px-4 py-3 leading-6 text-slate-700">{item.spec}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {doc.workflow?.length ? (
        <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionTitle eyebrow="Triển khai" title="Quy trình tư vấn và bàn giao" />
            <div className="grid gap-4 md:grid-cols-4">
              {doc.workflow.map((item, index) => (
                <article key={`${item.step}-${index}`} className="rounded-lg border border-border bg-white p-5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--ind-600,var(--color-primary-700))] text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <h3 className="mt-4 font-bold text-ink">{item.step}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {faqs.length ? (
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <SectionTitle eyebrow="FAQ" title="Câu hỏi thường gặp" />
            <div className="divide-y divide-border rounded-lg border border-border">
              {faqs.map((faq, index) => (
                <details key={`${faq.question}-${index}`} className="group p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-ink">
                    <span>{faq.question}</span>
                    <FileQuestion size={18} className="shrink-0 text-primary-700" />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-700">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {doc.relatedPages?.length ? (
        <section className="bg-surface px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionTitle eyebrow="Liên kết nội bộ" title="Giải pháp liên quan" />
            <div className="flex flex-wrap gap-3">
              {doc.relatedPages
                .filter((page): page is LandingPageDoc => Boolean(page) && typeof page === "object")
                .map((page) => (
                  <Link
                    key={page.pathname || page.id || page.title}
                    href={relatedPageHref(page)}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-700"
                  >
                    {page.title || page.facetSlug || "Giải pháp máy scan"}
                  </Link>
                ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="bao-gia">
        <CtaQuote industry={doc.facetSlug} landingPath={doc.pathname} products={products} title={title} />
      </section>
    </main>
  );
}
