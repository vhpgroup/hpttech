import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, PhoneCall } from "lucide-react";
import { PayloadRichText } from "@/components/rich-text/PayloadRichText";
import { SubpageBreadcrumb } from "@/components/layout/SubpageHeader";
import type { PublicCertification } from "@/lib/content-payload";
import { absoluteURL } from "@/lib/seo";
import type { normalizeSiteSettings } from "@/lib/site-settings";
import { phoneHref } from "@/lib/site-settings";

const kindBadgeClass: Record<string, string> = {
  "doc-quyen": "bg-warning",
  "doi-tac": "bg-primary-600",
  "uy-quyen": "bg-success",
};

type Props = {
  cert: PublicCertification;
  related: PublicCertification[];
  settings: ReturnType<typeof normalizeSiteSettings>;
};

export function CertificationDetail({ cert, related, settings }: Props) {
  const phone = settings.hotline || settings.phone;
  const facts: Array<{ k: string; v?: string }> = [
    { k: "Thương hiệu", v: cert.brand },
    { k: "Loại ủy quyền", v: cert.kindLabel },
    { k: "Phạm vi", v: cert.scope },
    { k: "Khu vực", v: cert.territory },
    { k: "Hiệu lực", v: cert.validity },
    { k: "Đơn vị cấp", v: cert.issuer },
    { k: "Số chứng nhận", v: cert.certNo },
  ];
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Chứng nhận ${cert.kindLabel} ${cert.brand}`,
    image: cert.image ? [absoluteURL(cert.image)] : undefined,
    description: cert.summary,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Trang chủ", item: absoluteURL("/") },
      { name: "Thương hiệu & Chứng nhận", item: absoluteURL("/thuong-hieu") },
      { name: cert.brand, item: absoluteURL(cert.href) },
    ].map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
  };

  return (
    <main className="subpage-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SubpageBreadcrumb
        className="mb-4"
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Thương hiệu & Chứng nhận", href: "/thuong-hieu" },
          { label: cert.brand },
        ]}
      />

      <div>
        <span className={`inline-block rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white ${kindBadgeClass[cert.kind] || "bg-primary-600"}`}>
          {cert.kindLabel}
        </span>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-primary-800 sm:text-4xl">
          Chứng nhận {cert.kindLabel} {cert.brand}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-ink/60">
          {cert.issuer ? (
            <span>
              Đơn vị cấp: <strong className="text-ink">{cert.issuer}</strong>
            </span>
          ) : null}
          {cert.validity ? (
            <span>
              Hiệu lực: <strong className="text-ink">{cert.validity}</strong>
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,420px)_1fr]">
        {cert.image ? (
          <a href={cert.image} target="_blank" rel="noopener noreferrer" className="relative block rounded-lg border border-border bg-white p-4 shadow-soft">
            <Image
              src={cert.image}
              alt={cert.imageAlt || `Giấy chứng nhận ${cert.brand}`}
              width={cert.orientation === "landscape" ? 900 : 560}
              height={cert.orientation === "landscape" ? 640 : 760}
              className="w-full rounded-lg shadow-soft"
              priority
            />
            <span className="absolute bottom-7 right-7 inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white">
              <ExternalLink size={14} />
              Xem bản gốc
            </span>
          </a>
        ) : null}
        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-soft">
          <div className="border-b border-border px-6 py-4 text-base font-extrabold text-primary-800">
            Thông tin chứng nhận
          </div>
          <dl className="px-6 py-2">
            {facts.filter((fact) => fact.v).map((fact) => (
              <div key={fact.k} className="grid grid-cols-[130px_1fr] gap-4 border-b border-dashed border-border py-3 text-sm last:border-b-0">
                <dt className="font-semibold text-ink/45">{fact.k}</dt>
                <dd className="font-semibold text-ink/75">{fact.v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2.5 border-t border-border bg-surface px-6 py-5">
            <Link href="/lien-he" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent-500 px-5 text-sm font-bold text-white transition hover:bg-accent-600">
              Nhận tư vấn & báo giá {cert.brand}
              <ArrowRight size={17} />
            </Link>
            {phone ? (
              <a href={phoneHref(phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-primary-600 px-5 text-sm font-bold text-primary-700 transition hover:bg-primary-50">
                <PhoneCall size={16} />
                Hotline: {phone}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0 rounded-lg border border-border bg-white p-6 shadow-soft sm:p-9">
          {cert.summary ? (
            <p className="mb-6 border-l-4 border-primary-200 bg-primary-50 px-5 py-3 text-base italic leading-7 text-primary-900">
              {cert.summary}
            </p>
          ) : null}
          {cert.content ? <PayloadRichText data={cert.content} /> : <MarkdownContent markdown={cert.contentMarkdown} />}
          {cert.gallery && cert.gallery.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {cert.gallery.map((image, index) =>
                image.url ? (
                  <Image
                    key={`${image.url}-${index}`}
                    src={image.url}
                    alt={image.alt || `Hình ảnh chứng nhận ${cert.brand} ${index + 1}`}
                    width={600}
                    height={420}
                    className="w-full rounded-lg border border-border"
                  />
                ) : null,
              )}
            </div>
          ) : null}
        </article>
        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <div className="rounded-lg border border-border bg-white p-6 shadow-soft">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-primary-700">Cam kết HPT</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-ink/70">
              <li>Hàng chính hãng 100%, đầy đủ CO/CQ & VAT</li>
              <li>Bảo hành theo tiêu chuẩn hãng</li>
              <li>Linh kiện, vật tư & hỗ trợ kỹ thuật</li>
              <li>Giá dự án ưu đãi, giao toàn quốc</li>
            </ul>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-primary-800">
            Chứng nhận ủy quyền khác
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={item.href} className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-soft transition hover:-translate-y-1">
                {item.image ? (
                  <div className="flex justify-center bg-surface p-4">
                    <Image src={item.image} alt={item.imageAlt || `Chứng nhận ${item.brand}`} width={300} height={210} className="max-h-[150px] w-auto rounded-md shadow-soft" />
                  </div>
                ) : null}
                <div className="p-5">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white ${kindBadgeClass[item.kind] || "bg-primary-600"}`}>
                    {item.kindLabel}
                  </span>
                  <h3 className="mt-2.5 text-base font-extrabold text-primary-800">{item.brand}</h3>
                  <span className="mt-1 inline-block text-sm font-bold text-primary-600 group-hover:text-primary-800">
                    Xem chi tiết
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="my-12">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-primary-700 px-8 py-10 text-white shadow-soft md:flex-row md:items-center md:px-14">
          <div>
            <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight md:text-3xl">
              Cần tư vấn thiết bị chính hãng cho doanh nghiệp?
            </h2>
            <p className="mt-2 text-primary-50">HPT Tech hỗ trợ chọn cấu hình, báo giá dự án và xuất hóa đơn VAT.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/lien-he" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-primary-700">
              Liên hệ tư vấn
              <ArrowRight size={16} />
            </Link>
            {phone ? (
              <a href={phoneHref(phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-900 px-6 text-sm font-bold text-white">
                <PhoneCall size={16} />
                {phone}
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function MarkdownContent({ markdown }: { markdown?: string }) {
  if (!markdown) return null;

  const blocks = markdown.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="max-w-none text-base leading-8 text-ink/75">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="mb-3 mt-8 text-2xl font-bold leading-9 text-ink">
              <InlineMarkdown text={block.replace(/^##\s+/, "")} />
            </h2>
          );
        }

        if (block.startsWith("### ")) {
          return (
            <h3 key={index} className="mb-3 mt-7 text-xl font-bold leading-8 text-ink">
              <InlineMarkdown text={block.replace(/^###\s+/, "")} />
            </h3>
          );
        }

        if (block.startsWith("> ")) {
          return (
            <blockquote key={index} className="my-6 border-l-4 border-primary-200 bg-primary-50 px-5 py-3 italic text-primary-900">
              <InlineMarkdown text={block.replace(/^>\s+/, "")} />
            </blockquote>
          );
        }

        if (block.startsWith("- ")) {
          return (
            <ul key={index} className="my-5 list-disc space-y-1.5 pl-6">
              {block.split("\n").map((item) => item.trim()).filter(Boolean).map((item, itemIndex) => (
                <li key={itemIndex}>
                  <InlineMarkdown text={item.replace(/^-\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="my-4">
            <InlineMarkdown text={block} />
          </p>
        );
      })}
    </div>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-bold text-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
