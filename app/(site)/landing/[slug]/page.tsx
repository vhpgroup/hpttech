import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import {
  COMMERCIAL_LANDINGS,
  getCommercialLandingBySlug,
} from "@/lib/commercial-landings";

type LandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return COMMERCIAL_LANDINGS.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const landing = getCommercialLandingBySlug(slug);

  if (!landing) {
    return {
      title: "Landing page sản phẩm | HPT Tech",
      description: "Landing page giới thiệu sản phẩm và giải pháp của HPT Tech.",
    };
  }

  return {
    title: `${landing.title} | HPT Tech`,
    description: landing.description,
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { slug } = await params;
  const landing = getCommercialLandingBySlug(slug);

  if (!landing) {
    notFound();
  }

  if (slug === "microtek-s6570") {
    return <MicrotekS6570HtmlLanding />;
  }

  if (slug === "epson-ds-790wn") {
    return <EpsonDS790WNHtmlLanding />;
  }

  if (slug === "xerox-d35wn") {
    return <XeroxD35WNHtmlLanding />;
  }

  if (slug === "epson-ds-870") {
    return <EpsonDS870HtmlLanding />;
  }

  if (slug === "microtek-xt6060") {
    return <PremiumScannerLanding config={MICROTEK_XT6060_PREMIUM} />;
  }

  return <DefaultLanding landing={landing} />;
}

async function EpsonDS870HtmlLanding() {
  let css = "";
  let body = "";

  try {
    const source = await readFile(
      path.join(
        process.cwd(),
        "public",
        "assets",
        "landing",
        "epson-ds870-embed.html",
      ),
      "utf8",
    );
    ({ css, body } = extractStandaloneLanding(source));
  } catch {
    return <PremiumScannerLanding config={EPSON_DS870_PREMIUM} />;
  }

  return (
    <main className="bg-white pb-0">
      <div className="subpage-main !pb-0">
        <SubpageHeader
          title="Máy quét Epson WorkForce DS-870"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Sản phẩm" },
          ]}
        />
      </div>
      <div
        className="ds870-html"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `${scopeStandaloneCss(css, ".ds870-html")}
.ds870-html{font-family:var(--font-body),system-ui,sans-serif;background:#fff}
.ds870-html .wrap{width:var(--shell-width);max-width:var(--shell-width);margin-inline:auto;padding-inline:clamp(20px,3vw,46px)}
.ds870-html .hero .wrap{padding-top:60px;padding-bottom:66px}
@media(max-width:640px){.ds870-html .wrap{width:100%;padding-inline:18px}}`,
        }}
      />
    </main>
  );
}

async function EpsonDS790WNHtmlLanding() {
  const source = await readFile(
    path.join(
      process.cwd(),
      "public",
      "assets",
      "landing",
      "epson-ds790wn-embed.html",
    ),
    "utf8",
  );
  const { css, body } = extractStandaloneLanding(source);

  return (
    <main className="bg-white pb-0">
      <div className="subpage-main !pb-0">
        <SubpageHeader
          title="Máy quét Epson WorkForce DS-790WN"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Sản phẩm" },
          ]}
        />
      </div>
      <div
        className="ds790-html"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `${scopeStandaloneCss(css, ".ds790-html")}
.ds790-html{font-family:var(--font-body),system-ui,sans-serif;background:#fff}
.ds790-html .wrap{width:var(--shell-width);max-width:var(--shell-width);margin-inline:auto;padding-inline:clamp(20px,3vw,46px)}
.ds790-html .hero .wrap{padding-top:66px;padding-bottom:74px}
@media(max-width:640px){.ds790-html .wrap{width:100%;padding-inline:18px}}`,
        }}
      />
    </main>
  );
}

async function XeroxD35WNHtmlLanding() {
  const source = await readFile(
    path.join(
      process.cwd(),
      "public",
      "assets",
      "landing",
      "xerox-d35wn-embed.html",
    ),
    "utf8",
  );
  const { css, body } = extractStandaloneLanding(source, { keepScripts: true });

  return (
    <main className="bg-white pb-0">
      <div className="subpage-main !pb-0">
        <SubpageHeader
          title="Máy quét Xerox D35wn"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Sản phẩm" },
          ]}
        />
      </div>
      <div
        className="xerox-d35wn-html"
        dangerouslySetInnerHTML={{ __html: body }}
      />
      <style
        dangerouslySetInnerHTML={{
          __html: `${scopeStandaloneCss(css, ".xerox-d35wn-html")}
.xerox-d35wn-html{font-family:var(--font-body),system-ui,sans-serif;background:#fff}
.xerox-d35wn-html .wrap{width:var(--shell-width);max-width:var(--shell-width);margin-inline:auto;padding-inline:clamp(20px,3vw,46px)}
.xerox-d35wn-html .hero .wrap{padding-top:60px;padding-bottom:64px}
@media(max-width:640px){.xerox-d35wn-html .wrap{width:100%;padding-inline:18px}}`,
        }}
      />
    </main>
  );
}

function extractStandaloneLanding(
  source: string,
  options: { keepScripts?: boolean } = {},
) {
  const css = source.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? "";
  const rawBody = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
  let body = rawBody
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<header class="site">[\s\S]*?<\/header>/i, "")
    .replace(/<footer>[\s\S]*?<\/footer>/i, "")
    .trim();

  if (!options.keepScripts) {
    body = body.replace(/<script[\s\S]*?<\/script>/gi, "").trim();
  }

  return { css, body };
}

function scopeStandaloneCss(css: string, scope: string) {
  return css
    .split("\n")
    .map((line) => scopeCssLine(line, scope))
    .join("\n");
}

function scopeCssLine(line: string, scope: string) {
  return line
    .replace(/(^|})(\s*)([^@{};]+?)\{/g, (match, boundary, space, selector) => {
      return `${boundary}${space}${scopeSelectorList(selector, scope)}{`;
    })
    .replace(/(\{)(\s*)(\.[^{}]+?)\{/g, (match, boundary, space, selector) => {
      return `${boundary}${space}${scopeSelectorList(selector, scope)}{`;
    });
}

function scopeSelectorList(selectorList: string, scope: string) {
  return selectorList
    .split(",")
    .map((selector) => scopeSelector(selector, scope))
    .join(",");
}

function scopeSelector(selector: string, scope: string) {
  const leadingSpace = selector.match(/^\s*/)?.[0] ?? "";
  const trimmed = selector.trim();

  if (
    !trimmed ||
    trimmed.startsWith(scope) ||
    trimmed.startsWith("@") ||
    trimmed === "from" ||
    trimmed === "to" ||
    trimmed.endsWith("%")
  ) {
    return selector;
  }

  if (trimmed === ":root" || trimmed === "html" || trimmed === "body") {
    return `${leadingSpace}${scope}`;
  }

  return `${leadingSpace}${scope} ${trimmed}`;
}

async function MicrotekS6570HtmlLanding() {
  try {
    const source = await readFile(
      path.join(
        process.cwd(),
        "public",
        "assets",
        "landing",
        "microtek-s6570-embed.html",
      ),
      "utf8",
    );
    const { css, body } = extractStandaloneLanding(source, { keepScripts: true });

    return (
      <main className="bg-white pb-0">
        <div className="subpage-main !pb-0">
          <SubpageHeader
            title="Máy quét Microtek S6570"
            breadcrumbs={[
              { label: "Trang chủ", href: "/" },
              { label: "Sản phẩm" },
            ]}
          />
        </div>
        <div
          className="s6570-html"
          dangerouslySetInnerHTML={{ __html: body }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `${scopeStandaloneCss(css, ".s6570-html")}
.s6570-html{font-family:var(--font-body),system-ui,sans-serif;background:#fff}
.s6570-html .wrap{width:var(--shell-width);max-width:var(--shell-width);margin-inline:auto;padding-inline:clamp(20px,3vw,44px)}
.s6570-html .hero .wrap{padding-top:60px;padding-bottom:64px}
@media(max-width:640px){.s6570-html .wrap{width:100%;padding-inline:18px}}`,
          }}
        />
      </main>
    );
  } catch {
    // Keep the route alive if the standalone HTML asset is missing.
  }

  return (
    <main className="bg-white pb-0">
      <div className="subpage-main !pb-0">
        <SubpageHeader
          title="Máy quét Microtek S6570"
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Sản phẩm" },
          ]}
        />
      </div>
      <div
        className="s6570-html"
        dangerouslySetInnerHTML={{ __html: MICROTEK_S6570_HTML }}
      />
      <style dangerouslySetInnerHTML={{ __html: MICROTEK_S6570_CSS }} />
    </main>
  );
}

type PremiumScannerLandingConfig = {
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  price: string;
  priceNote: string;
  heroImageSrc: string;
  heroImageAlt: string;
  secondaryImageSrc: string;
  secondaryImageAlt: string;
  accentLabel: string;
  accentValue: string;
  stats: Array<{ label: string; value: string }>;
  chips: string[];
  sections: Array<{
    eyebrow: string;
    title: string;
    description: string;
    bullets: string[];
  }>;
  useCases: Array<{
    title: string;
    description: string;
  }>;
  specRows: Array<{ label: string; value: string }>;
  deliverables: Array<{
    title: string;
    description: string;
  }>;
};

function PremiumScannerLanding({
  config,
}: {
  config: PremiumScannerLandingConfig;
}) {
  return (
    <main className="bg-white pb-0">
      <div className="subpage-main !pb-0">
        <SubpageHeader
          title={config.title}
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: "Sản phẩm" },
          ]}
        />
      </div>

      <section className="overflow-hidden bg-[radial-gradient(circle_at_82%_12%,var(--color-primary-100),transparent_34%),linear-gradient(180deg,var(--color-surface)_0%,white_78%)]">
        <div className="mx-auto grid w-[var(--shell-width)] max-w-[var(--shell-width)] gap-10 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:py-20">
          <div className="space-y-7">
            <div className="inline-flex rounded-full border border-primary-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-primary-700 shadow-sm">
              {config.eyebrow}
            </div>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-ink md:text-6xl">
                {config.shortTitle}
              </h1>
              <p className="max-w-2xl text-lg leading-9 text-ink/70">
                {config.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {config.chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-2xl border border-border bg-white px-4 py-3 text-sm font-extrabold text-ink shadow-sm"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="/lien-he"
                className="rounded-full bg-primary-600 px-7 py-4 text-sm font-black text-white shadow-lg shadow-primary-600/20 transition hover:-translate-y-0.5 hover:bg-primary-700"
              >
                Yêu cầu tư vấn và báo giá
              </a>
              <a
                href="#thong-so-ky-thuat"
                className="rounded-full border border-primary-200 bg-white px-7 py-4 text-sm font-black text-primary-700 transition hover:bg-primary-50"
              >
                Xem thông số kỹ thuật
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent-200/50 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-primary-100 bg-white p-6 shadow-2xl shadow-primary-900/10">
              <div className="absolute right-5 top-5 z-10 rounded-2xl bg-primary-600 px-4 py-3 text-right text-white shadow-lg">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-100">
                  {config.accentLabel}
                </p>
                <p className="text-2xl font-black">{config.accentValue}</p>
              </div>
              <Image
                src={config.heroImageSrc}
                alt={config.heroImageAlt}
                width={980}
                height={760}
                priority
                className="mx-auto aspect-[1.08/1] w-full rounded-[24px] bg-surface object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary-900 text-white">
        <div className="mx-auto grid w-[var(--shell-width)] max-w-[var(--shell-width)] gap-px px-5 lg:grid-cols-4 lg:px-10">
          {config.stats.map((stat) => (
            <article key={stat.label} className="py-7 text-center lg:text-left">
              <p className="text-3xl font-black tracking-tight">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold text-primary-100">
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-[var(--shell-width)] max-w-[var(--shell-width)] gap-8 px-5 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:py-20">
        <div className="overflow-hidden rounded-[30px] border border-border bg-surface p-4 shadow-sm">
          <Image
            src={config.secondaryImageSrc}
            alt={config.secondaryImageAlt}
            width={860}
            height={620}
            className="h-full min-h-[360px] w-full rounded-[22px] object-cover"
          />
        </div>
        <div className="grid gap-5">
          {config.sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[28px] border border-border bg-white p-6 shadow-sm"
            >
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary-700">
                {section.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-ink">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-ink/70">
                {section.description}
              </p>
              <div className="mt-5 grid gap-3">
                {section.bullets.map((bullet) => (
                  <div key={bullet} className="flex gap-3 text-sm leading-7 text-ink/75">
                    <span className="mt-2 h-2.5 w-2.5 flex-none rounded-full bg-accent-500" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-[linear-gradient(180deg,white_0%,var(--color-surface)_100%)] py-16 lg:py-20">
        <div className="mx-auto w-[var(--shell-width)] max-w-[var(--shell-width)] px-5 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-700">
              Kịch bản sử dụng
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">
              Không chỉ là thông số, đây là các bài toán thực tế máy xử lý tốt
            </h2>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {config.useCases.map((item) => (
              <article
                key={item.title}
                className="rounded-[28px] border border-border bg-white p-6 shadow-sm"
              >
                <div className="mb-5 h-1.5 w-14 rounded-full bg-accent-500" />
                <h3 className="text-xl font-black tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-ink/70">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="thong-so-ky-thuat" className="bg-surface py-16 lg:py-20">
        <div className="mx-auto w-[var(--shell-width)] max-w-[var(--shell-width)] px-5 lg:px-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-700">
                Thông số kỹ thuật
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">
                Cấu hình nổi bật cho quyết định mua nhanh
              </h2>
            </div>
            <div className="rounded-2xl border border-primary-100 bg-white px-5 py-4 text-right shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink/50">
                Giá tham khảo
              </p>
              <p className="text-2xl font-black text-primary-900">{config.price}</p>
              <p className="text-xs text-ink/50">{config.priceNote}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
            {config.specRows.map((row, index) => (
              <div
                key={row.label}
                className={`grid gap-2 px-6 py-5 lg:grid-cols-[280px_minmax(0,1fr)] ${
                  index % 2 === 1 ? "bg-surface" : "bg-white"
                }`}
              >
                <div className="font-black text-primary-900">{row.label}</div>
                <div className="leading-7 text-ink/70">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[var(--shell-width)] max-w-[var(--shell-width)] px-5 py-16 lg:px-10 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-700">
              Khi mua tại HPT Tech
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">
              Trang landing phải chốt được niềm tin, không chỉ khoe máy
            </h2>
            <p className="mt-5 text-base leading-8 text-ink/70">
              HPT Tech tập trung vào tư vấn đúng nhu cầu, báo giá rõ ràng, hàng chính hãng và hỗ trợ triển khai cho khách doanh nghiệp.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {config.deliverables.map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-border bg-surface p-5"
              >
                <h3 className="font-black text-primary-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink/70">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[var(--shell-width)] max-w-[var(--shell-width)] px-5 py-16 lg:px-10">
        <div className="grid gap-6 overflow-hidden rounded-[32px] bg-primary-900 p-7 text-white shadow-2xl shadow-primary-900/20 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-primary-100">
              HPT Tech tư vấn triển khai
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Cần chọn máy phù hợp cho phòng ban hoặc dự án số hóa?
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-primary-100">
              Gửi nhu cầu tài liệu, khối lượng quét và môi trường sử dụng. HPT Tech sẽ tư vấn cấu hình, báo giá và phương án giao hàng phù hợp.
            </p>
          </div>
          <a
            href="/lien-he"
            className="rounded-full bg-white px-7 py-4 text-center text-sm font-black text-primary-800 transition hover:-translate-y-0.5 hover:bg-primary-50"
          >
            Nhận báo giá ngay
          </a>
        </div>
      </section>
    </main>
  );
}

const EPSON_DS870_PREMIUM: PremiumScannerLandingConfig = {
  title: "Máy quét Epson WorkForce DS-870",
  shortTitle: "Epson WorkForce DS-870",
  eyebrow: "Scan siêu nhanh cho phòng ban",
  description:
    "Máy quét tài liệu tốc độ cao cho doanh nghiệp cần số hóa hồ sơ khối lượng lớn mỗi ngày, ưu tiên độ bền, tốc độ và thao tác ổn định.",
  price: "15.120.000 đ",
  priceNote: "Có thể thay đổi theo thời điểm",
  heroImageSrc: "/assets/landing/epson-ds-870/ds870-hero.jpg",
  heroImageAlt: "Máy quét Epson WorkForce DS-870",
  secondaryImageSrc: "/assets/landing/epson-ds-870/ds870-scanning.jpg",
  secondaryImageAlt: "Epson WorkForce DS-870 đang quét tài liệu",
  accentLabel: "Sẵn hàng",
  accentValue: "65 ppm",
  stats: [
    { label: "Tốc độ quét", value: "65 ppm" },
    { label: "Quét 2 mặt", value: "130 ipm" },
    { label: "Khay nạp ADF", value: "100 tờ" },
    { label: "Công suất ngày", value: "10.000 tờ" },
  ],
  chips: ["65 ppm / 130 ipm", "ADF 100 tờ", "USB 3.0", "OCR - PDF tìm kiếm"],
  sections: [
    {
      eyebrow: "Hiệu suất văn phòng",
      title: "Tối ưu cho lô hồ sơ dày, chạy đều trong cả ngày",
      description:
        "DS-870 phù hợp cho kế toán, hành chính nhân sự, ngân hàng, bệnh viện và bộ phận lưu trữ cần quét nhiều bộ chứng từ liên tục.",
      bullets: [
        "Quét 2 mặt trong một lần đưa giấy, giảm thao tác đảo mặt thủ công.",
        "Khay ADF 100 tờ giúp xử lý nhiều bộ tài liệu mà không phải nạp lại liên tục.",
        "Công suất khuyến nghị cao, phù hợp môi trường làm việc cường độ lớn.",
      ],
    },
    {
      eyebrow: "An toàn tài liệu",
      title: "Kéo giấy thông minh, hạn chế kẹt và sót trang",
      description:
        "Các cơ chế xử lý giấy giúp bảo vệ hồ sơ gốc, đặc biệt khi quét chứng từ mỏng, hóa đơn dài hoặc bộ tài liệu trộn nhiều định dạng.",
      bullets: [
        "Phát hiện nạp chồng để hạn chế bỏ sót trang khi quét hàng loạt.",
        "Chế độ quét chậm hỗ trợ tài liệu mỏng hoặc dễ rách.",
        "Hỗ trợ OCR, xuất PDF tìm kiếm được để đẩy nhanh quy trình số hóa.",
      ],
    },
  ],
  useCases: [
    {
      title: "Phòng kế toán xử lý chứng từ",
      description:
        "Quét hóa đơn, phiếu thu chi, hợp đồng và bộ hồ sơ nhiều trang thành PDF tìm kiếm được để lưu trữ và tra cứu nhanh.",
    },
    {
      title: "Văn thư - hành chính",
      description:
        "Số hóa hồ sơ nhân sự, công văn, biểu mẫu và tài liệu nội bộ với tốc độ ổn định, giảm thời gian nhập liệu thủ công.",
    },
    {
      title: "Dự án scan tập trung",
      description:
        "Phù hợp đặt tại phòng scan dùng chung cho nhiều bộ phận, nơi cần ADF lớn, tốc độ cao và khả năng chạy bền mỗi ngày.",
    },
  ],
  specRows: [
    { label: "Loại máy", value: "Máy quét tài liệu nạp tờ rời, quét 2 mặt một lần đưa giấy" },
    { label: "Độ phân giải", value: "600 dpi" },
    { label: "Tốc độ", value: "65 trang/phút, 130 ảnh/phút" },
    { label: "Khay nạp", value: "ADF 100 tờ" },
    { label: "Công suất", value: "Tối đa 10.000 tờ/ngày" },
    { label: "Kết nối", value: "SuperSpeed USB 3.0" },
    { label: "Ứng dụng", value: "Kế toán, văn thư, nhân sự, ngân hàng, lưu trữ hồ sơ" },
  ],
  deliverables: [
    {
      title: "Máy chính hãng",
      description: "Tư vấn model đúng nhu cầu, có hóa đơn VAT và chứng từ bán hàng rõ ràng.",
    },
    {
      title: "Báo giá theo doanh nghiệp",
      description: "Có thể báo giá theo số lượng, dự án hoặc gói triển khai cho nhiều phòng ban.",
    },
    {
      title: "Hỗ trợ cài đặt",
      description: "Hướng dẫn driver, phần mềm scan, cấu hình file đầu ra và quy trình lưu trữ.",
    },
    {
      title: "Giao hàng toàn quốc",
      description: "Đóng gói, giao hàng và hỗ trợ sau bán phù hợp khách hàng doanh nghiệp.",
    },
  ],
};

const MICROTEK_XT6060_PREMIUM: PremiumScannerLandingConfig = {
  title: "Máy quét phẳng A3 Microtek XT6060",
  shortTitle: "Microtek XT6060",
  eyebrow: "Máy quét phẳng khổ A3",
  description:
    "Giải pháp scan mặt phẳng A3 cho bản vẽ, hồ sơ khổ lớn, tranh ảnh và tài liệu cần giữ chi tiết hình ảnh ổn định.",
  price: "25.000.000 đ",
  priceNote: "Giá tham khảo theo cấu hình",
  heroImageSrc: "/assets/landing/microtek-xt6060/xt6060-hero.jpg",
  heroImageAlt: "Máy quét phẳng A3 Microtek XT6060",
  secondaryImageSrc: "/assets/landing/microtek-xt6060/xt6060-angle.jpg",
  secondaryImageAlt: "Microtek XT6060 góc nghiêng",
  accentLabel: "Khổ quét",
  accentValue: "A3",
  stats: [
    { label: "Khổ quét", value: "A3" },
    { label: "Cảm biến", value: "CCD" },
    { label: "Độ phân giải", value: "600 dpi" },
    { label: "Quét A3 màu", value: "< 3 giây" },
  ],
  chips: ["A3 flatbed", "CCD 600 dpi", "Auto-Scan", "USB 2.0"],
  sections: [
    {
      eyebrow: "Tài liệu khổ lớn",
      title: "Sinh ra cho bản vẽ, ảnh và hồ sơ không thể đưa qua ADF",
      description:
        "XT6060 phù hợp với tài liệu cần đặt phẳng: bản vẽ kỹ thuật, giấy mỏng, ảnh, tài liệu đóng gáy hoặc hồ sơ cần giữ nguyên trạng.",
      bullets: [
        "Mặt kính A3 xử lý tài liệu khổ lớn mà không cần gấp hoặc cắt nhỏ.",
        "Thiết kế flatbed giúp quét tài liệu dễ hư hỏng an toàn hơn ADF.",
        "Phù hợp văn phòng kiến trúc, xây dựng, lưu trữ và thiết kế.",
      ],
    },
    {
      eyebrow: "Chất lượng ảnh",
      title: "Cảm biến CCD cho chiều sâu và độ chi tiết tốt hơn",
      description:
        "Cảm biến CCD 600 dpi giúp tái hiện màu sắc và chi tiết ổn định, đặc biệt với tài liệu đồ họa, bản vẽ và bề mặt không hoàn toàn phẳng.",
      bullets: [
        "Nguồn sáng LED giúp sẵn sàng quét nhanh, không mất thời gian làm nóng lâu.",
        "Tốc độ quét A3 màu dưới 3 giây ở 200 dpi cho lô tài liệu lớn.",
        "Auto-Scan hỗ trợ thao tác nhanh trong dây chuyền số hóa chuyên dụng.",
      ],
    },
  ],
  useCases: [
    {
      title: "Bản vẽ kỹ thuật khổ A3",
      description:
        "Quét bản vẽ xây dựng, cơ khí, sơ đồ kỹ thuật và tài liệu trình bày lớn mà không cần gấp mép tài liệu.",
    },
    {
      title: "Hồ sơ đóng gáy hoặc dễ hư",
      description:
        "Mặt kính phẳng giúp đặt tài liệu nhẹ nhàng, phù hợp giấy cũ, ảnh, tài liệu lưu trữ hoặc hồ sơ không thể đưa qua ADF.",
    },
    {
      title: "Số hóa ảnh và tài liệu màu",
      description:
        "Cảm biến CCD phù hợp các tác vụ cần giữ chi tiết, sắc độ và chiều sâu ảnh tốt hơn máy scan văn phòng phổ thông.",
    },
  ],
  specRows: [
    { label: "Loại máy", value: "Máy quét phẳng khổ A3" },
    { label: "Cảm biến", value: "CCD" },
    { label: "Độ phân giải", value: "600 x 600 dpi" },
    { label: "Tốc độ", value: "Quét A3 màu dưới 3 giây ở 200 dpi" },
    { label: "Kết nối", value: "USB 2.0" },
    { label: "Tính năng", value: "Auto-Scan, quét ảnh, bản vẽ, hồ sơ khổ lớn" },
    { label: "Ứng dụng", value: "Kiến trúc, xây dựng, thiết kế, lưu trữ, thư viện" },
  ],
  deliverables: [
    {
      title: "Tư vấn đúng loại tài liệu",
      description: "Phân biệt rõ khi nào cần flatbed A3 thay vì scanner ADF để tránh mua sai nhu cầu.",
    },
    {
      title: "Giá dự án rõ ràng",
      description: "Báo giá theo số lượng, VAT và yêu cầu giao hàng cho phòng ban hoặc đơn vị triển khai.",
    },
    {
      title: "Hướng dẫn vận hành",
      description: "Hỗ trợ thiết lập độ phân giải, định dạng file và quy trình quét tài liệu khổ lớn.",
    },
    {
      title: "Hỗ trợ sau bán",
      description: "Đồng hành với khách doanh nghiệp trong quá trình sử dụng, bảo trì và mở rộng quy trình số hóa.",
    },
  ],
};

function DefaultLanding({
  landing,
}: {
  landing: NonNullable<ReturnType<typeof getCommercialLandingBySlug>>;
}) {
  const detail = landing.detail;

  return (
    <main className="subpage-main bg-slate-50/70 pb-24">
      <SubpageHeader
        title={landing.title}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: landing.title },
        ]}
      />

      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-sm">
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:p-8">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.24em] text-primary-700">
              {landing.eyebrow}
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                {landing.title}
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                {landing.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {landing.specs.map((spec) => (
                <article
                  key={spec.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-slate-400">
                    {spec.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
                    {spec.value}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_100%)] p-4">
            <Image
              src={detail?.heroImageSrc ?? landing.imageSrc}
              alt={detail?.heroImageAlt ?? landing.imageAlt}
              width={960}
              height={760}
              className="mx-auto aspect-[1/1] w-full rounded-[18px] bg-white object-contain object-center"
              priority
            />
          </div>
        </div>
        {detail?.stats?.length ? (
          <div className="grid gap-px bg-primary-900 sm:grid-cols-2 lg:grid-cols-4">
            {detail.stats.map((stat) => (
              <article key={stat.label} className="bg-primary-900 px-5 py-5 text-white">
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-primary-100">
                  {stat.label}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {detail ? (
        <div className="mt-6 space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
            <div className="max-w-4xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-primary-700">
                Tổng quan
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {detail.introTitle}
              </h2>
              <div className="mt-5 space-y-4 text-base leading-8 text-slate-600">
                {detail.introParagraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            {detail.features.map((feature, index) => (
              <article
                key={feature.title}
                className="grid gap-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_1fr] lg:p-8"
              >
                <div className={`space-y-4 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                  <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-primary-700">
                    {feature.eyebrow}
                  </p>
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">
                    {feature.title}
                  </h2>
                  <p className="text-base leading-8 text-slate-600">
                    {feature.description}
                  </p>
                  <div className="space-y-3">
                    {feature.bullets.map((bullet) => (
                      <div
                        key={bullet}
                        className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"
                      >
                        <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-primary-600" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eff6ff_100%)] p-4 sm:p-6 ${
                    index % 2 === 1 ? "lg:order-1" : ""
                  }`}
                >
                  <Image
                    src={feature.imageSrc}
                    alt={feature.imageAlt}
                    width={840}
                    height={620}
                    className="mx-auto h-full w-full rounded-[18px] object-cover"
                  />
                </div>
              </article>
            ))}
          </section>

          <section
            id="thong-so-ky-thuat"
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-8"
          >
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-primary-700">
                Thông số kỹ thuật
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Chi tiết kỹ thuật nổi bật
              </h2>
            </div>

            <div className="mt-8 space-y-6">
              {detail.specGroups.map((group) => (
                <div
                  key={group.title}
                  className="overflow-hidden rounded-[24px] border border-slate-200"
                >
                  <div className="bg-primary-900 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.24em] text-white">
                    {group.title}
                  </div>
                  <div className="divide-y divide-slate-200">
                    {group.rows.map((row, rowIndex) => (
                      <div
                        key={row.label}
                        className={`grid gap-2 px-5 py-4 lg:grid-cols-[260px_minmax(0,1fr)] ${
                          rowIndex % 2 === 1 ? "bg-slate-50" : "bg-white"
                        }`}
                      >
                        <div className="text-sm font-bold text-slate-900">
                          {row.label}
                        </div>
                        <div className="text-sm leading-7 text-slate-600">
                          {row.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-extrabold uppercase tracking-[0.24em] text-primary-700">
                Bộ sản phẩm
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Trong hộp tiêu chuẩn có gì
              </h2>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {detail.boxItems.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-5"
                >
                  <p className="text-lg font-black text-slate-900">{item.title}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

const MICROTEK_S6570_CSS = `
.s6570-html{--blue-900:#0a3a78;--blue:#0b57c2;--blue-600:#1a6ad8;--blue-050:#eef4fd;--ink:#111826;--muted:#5c6672;--line:#e6eaf0;--soft:#f5f8fc;--white:#fff;--ok:#0f8a4f;--red:#c8102e;--shadow:0 18px 50px -20px rgba(11,64,140,.28);--shadow-sm:0 8px 26px -14px rgba(17,24,38,.22);font-family:var(--font-body),system-ui,sans-serif;color:var(--ink);background:var(--white);line-height:1.65;font-size:17px;-webkit-font-smoothing:antialiased}
.s6570-html *{box-sizing:border-box}
.s6570-html a{color:inherit;text-decoration:none}
.s6570-html img{display:block;max-width:100%;height:auto}
.s6570-html .wrap{width:var(--shell-width);max-width:var(--shell-width);margin:0 auto;padding:0 clamp(20px,3vw,44px)}
.s6570-html .site{position:sticky;top:0;z-index:2;background:rgba(255,255,255,.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.s6570-html .site{display:none}
.s6570-html .site-in{display:flex;align-items:center;justify-content:space-between;height:66px}
.s6570-html .brand{display:flex;align-items:center;gap:11px;font-weight:800;letter-spacing:.3px}
.s6570-html .brand-logo{width:54px;height:auto;object-fit:contain}
.s6570-html .brand small{display:block;font-weight:500;font-size:11px;color:var(--muted);letter-spacing:2px}
.s6570-html .hbuy{display:flex;align-items:center;gap:16px}
.s6570-html .hprice{font-weight:800;color:var(--blue-900);font-size:17px;white-space:nowrap}
.s6570-html .hprice span{display:block;font-weight:500;font-size:11px;color:var(--muted);letter-spacing:.5px}
.s6570-html .btn{display:inline-flex;align-items:center;gap:9px;font-family:inherit;font-weight:700;font-size:15px;border:none;cursor:pointer;border-radius:999px;padding:12px 22px;transition:.2s;line-height:1}
.s6570-html .btn-primary{position:relative;overflow:hidden;background:linear-gradient(135deg,var(--blue-600),var(--blue));color:#fff;box-shadow:0 10px 24px -10px rgba(11,87,194,.7)}
.s6570-html .btn-primary:hover{transform:translateY(-2px);box-shadow:0 16px 30px -12px rgba(11,87,194,.8)}
.s6570-html .btn-primary::after{content:"";position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.42),transparent);transform:skewX(-20deg);z-index:2}
.s6570-html .btn-primary:hover::after{animation:s6570-shine .85s ease}
.s6570-html .btn-primary svg,.s6570-html .btn-primary span{position:relative;z-index:3}
.s6570-html .btn-ghost{background:var(--white);color:var(--blue);border:1.5px solid #cddffb}
.s6570-html .btn-ghost:hover{background:var(--blue-050)}
.s6570-html .hbuy .btn{padding:11px 20px}
.s6570-html .hero{position:relative;overflow:hidden;background:radial-gradient(1200px 500px at 82% -12%,#dcebff 0%,rgba(220,235,255,0) 60%),linear-gradient(180deg,#fbfdff 0%,#f2f7fe 100%)}
.s6570-html .hero .wrap{display:grid;grid-template-columns:1.02fr .98fr;gap:52px;align-items:center;padding-top:60px;padding-bottom:64px}
.s6570-html .eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--blue);background:var(--white);border:1px solid #d5e4fb;padding:7px 14px;border-radius:999px;box-shadow:var(--shadow-sm)}
.s6570-html h1{font-size:clamp(34px,5vw,54px);line-height:1.05;font-weight:800;letter-spacing:-1px;margin:20px 0 0}
.s6570-html h1 .sub{display:block;color:var(--blue-900)}
.s6570-html .lead{font-size:clamp(17px,2vw,19px);color:#3c4655;margin-top:18px;max-width:33ch}
.s6570-html .hero-badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.s6570-html .chip{display:inline-flex;align-items:center;gap:8px;background:var(--white);border:1px solid var(--line);border-radius:12px;padding:9px 14px;font-weight:600;font-size:14px;box-shadow:var(--shadow-sm)}
.s6570-html .chip b{color:var(--blue)}
.s6570-html .price-row{display:flex;align-items:center;gap:22px;margin-top:30px;flex-wrap:wrap}
.s6570-html .price-tag .lab{font-size:12.5px;color:var(--muted);letter-spacing:.6px;text-transform:uppercase;font-weight:600}
.s6570-html .price-tag .val{font-size:34px;font-weight:800;color:var(--blue-900);line-height:1}
.s6570-html .cta-row{display:flex;gap:13px;margin-top:26px;flex-wrap:wrap}
.s6570-html .hero-art{position:relative}
.s6570-html .hero-art .panel{background:linear-gradient(160deg,#fff,#eef4fd);border:1px solid #e2ebf7;border-radius:26px;padding:30px;box-shadow:var(--shadow);position:relative}
.s6570-html .hero-art img{margin:0 auto;border-radius:10px}
.s6570-html .float-badge{position:absolute;left:-14px;bottom:26px;background:var(--white);border:1px solid var(--line);border-radius:16px;padding:13px 17px;box-shadow:var(--shadow);display:flex;align-items:center;gap:12px}
.s6570-html .float-badge .n{font-size:26px;font-weight:800;color:var(--blue);line-height:1}
.s6570-html .float-badge .t{font-size:12px;color:var(--muted);font-weight:600;line-height:1.25}
.s6570-html .stats{background:var(--blue-900);color:#fff;position:relative;overflow:hidden}
.s6570-html .stats .wrap{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:26px 44px;position:relative;z-index:1}
.s6570-html .stat{text-align:center;padding:8px 6px}
.s6570-html .stat .n{font-size:clamp(22px,2.4vw,30px);font-weight:800;line-height:1;letter-spacing:-.5px}
.s6570-html .stat .l{font-size:12.5px;color:#b9cdec;margin-top:7px;font-weight:500}
.s6570-html .stat+.stat{border-left:1px solid rgba(255,255,255,.14)}
.s6570-html section{padding:72px 0}
.s6570-html .sec-head{max-width:760px;margin-bottom:12px}
.s6570-html .kicker{color:var(--blue);font-weight:700;letter-spacing:1.6px;text-transform:uppercase;font-size:12.5px}
.s6570-html h2{font-size:clamp(27px,3.4vw,38px);font-weight:800;letter-spacing:-.7px;line-height:1.12;margin:12px 0 0}
.s6570-html .prose p{color:#39424f;margin-top:18px;font-size:17.5px}
.s6570-html .prose p b{color:var(--ink)}
.s6570-html .divider{height:1px;background:var(--line);border:0}
.s6570-html .feature{display:grid;grid-template-columns:1fr 1fr;gap:54px;align-items:center;padding:26px 0}
.s6570-html .feature .art{background:linear-gradient(160deg,#f7fafe,#eaf1fb);border:1px solid #e6eef8;border-radius:20px;padding:26px;box-shadow:var(--shadow-sm)}
.s6570-html .feature .art img{margin:0 auto;border-radius:10px;transition:transform .5s ease}
.s6570-html .feature .art:hover img{transform:scale(1.03)}
.s6570-html .feature h3{font-size:24px;font-weight:800;letter-spacing:-.4px;margin-bottom:6px}
.s6570-html .feature .tag{color:var(--blue);font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase}
.s6570-html .ticks{list-style:none;margin-top:18px;display:grid;gap:12px;padding:0}
.s6570-html .ticks li{display:flex;gap:12px;align-items:flex-start;color:#39424f}
.s6570-html .ticks svg{flex:none;margin-top:3px}
.s6570-html .ticks b{color:var(--ink)}
.s6570-html .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:36px}
.s6570-html .card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px;box-shadow:var(--shadow-sm);transition:.2s}
.s6570-html .card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.s6570-html .card .ic{width:46px;height:46px;border-radius:13px;background:var(--blue-050);color:var(--blue);display:grid;place-items:center;margin-bottom:16px}
.s6570-html .card h4{font-size:18px;font-weight:700;margin-bottom:7px}
.s6570-html .card p{color:var(--muted);font-size:15px}
.s6570-html .spec-wrap{border:1px solid var(--line);border-radius:20px;overflow:hidden;margin-top:32px;box-shadow:var(--shadow-sm)}
.s6570-html table.spec{width:100%;border-collapse:collapse;font-size:15.5px}
.s6570-html table.spec tr{border-bottom:1px solid var(--line)}
.s6570-html table.spec tr:last-child{border-bottom:none}
.s6570-html table.spec th{background:var(--soft);text-align:left;font-weight:700;color:var(--blue-900);padding:15px 22px;width:38%;vertical-align:top}
.s6570-html table.spec td{padding:15px 22px;color:#39424f;vertical-align:top}
.s6570-html table.spec tr:nth-child(even) td,.s6570-html table.spec tr:nth-child(even) th{background:#fbfcfe}
.s6570-html .grouprow th{background:linear-gradient(100deg,#60438a,#225baa)!important;color:#fff!important;font-size:13px;letter-spacing:1.2px;text-transform:uppercase;padding:11px 22px}
.s6570-html .grouprow td{background:#225baa!important}
.s6570-html .box-list{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:30px}
.s6570-html .box-item{background:var(--soft);border:1px solid var(--line);border-radius:16px;padding:22px;text-align:center}
.s6570-html .box-item .ic{color:var(--blue);margin:0 auto 12px}
.s6570-html .box-item span{font-weight:600;font-size:15px}
.s6570-html .cta{background:var(--soft);border-top:1px solid var(--line)}
.s6570-html .cta .box{background:linear-gradient(135deg,#fff,#eef4fd);border:1px solid #dbe7f8;border-radius:26px;padding:48px;display:grid;grid-template-columns:1.3fr .7fr;gap:30px;align-items:center;box-shadow:var(--shadow)}
.s6570-html .cta h2{margin:0}
.s6570-html .cta .p{color:#39424f;margin-top:12px}
.s6570-html .cta .buy{text-align:right}
.s6570-html .cta .buy .lab{font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;font-weight:600}
.s6570-html .cta .buy .val{font-size:40px;font-weight:800;color:var(--blue-900);line-height:1;margin:6px 0 18px}
.s6570-html .cta .buy .note{font-size:12.5px;color:var(--muted);margin-top:12px}
@media (prefers-reduced-motion:no-preference){.s6570-html .hero .btn-primary,.s6570-html .cta .btn-primary{animation:s6570-breathe 6.6s ease-in-out infinite}.s6570-html .hero-art .panel{animation:s6570-floaty 6s ease-in-out infinite}}
@keyframes s6570-shine{to{left:140%}}
@keyframes s6570-floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes s6570-breathe{0%{box-shadow:0 10px 24px -10px rgba(34,197,94,.75),0 0 0 0 rgba(34,197,94,.5)}16%{box-shadow:0 12px 28px -10px rgba(34,197,94,.45),0 0 0 13px rgba(34,197,94,0)}33%{box-shadow:0 10px 24px -10px rgba(239,68,68,.75),0 0 0 0 rgba(239,68,68,.5)}50%{box-shadow:0 12px 28px -10px rgba(239,68,68,.45),0 0 0 13px rgba(239,68,68,0)}66%{box-shadow:0 10px 24px -10px rgba(37,99,235,.85),0 0 0 0 rgba(37,99,235,.55)}83%{box-shadow:0 12px 28px -10px rgba(37,99,235,.45),0 0 0 13px rgba(37,99,235,0)}100%{box-shadow:0 10px 24px -10px rgba(34,197,94,.75),0 0 0 0 rgba(34,197,94,.5)}}
@media(max-width:900px){.s6570-html .hero .wrap{grid-template-columns:1fr;gap:36px;padding-top:40px;padding-bottom:46px}.s6570-html .hero-art{order:-1}.s6570-html .lead{max-width:none}}
@media(max-width:820px){.s6570-html .stats .wrap{grid-template-columns:repeat(2,1fr);gap:14px}.s6570-html .stat+.stat{border-left:none}.s6570-html .stat{border-top:1px solid rgba(255,255,255,.12);padding-top:16px}.s6570-html .feature{grid-template-columns:1fr;gap:26px}.s6570-html .feature .art{order:-1}.s6570-html .cards{grid-template-columns:1fr}.s6570-html .box-list{grid-template-columns:1fr 1fr}}
@media(max-width:760px){.s6570-html .cta .box{grid-template-columns:1fr;padding:32px}.s6570-html .cta .buy{text-align:left}}
@media(max-width:640px){.s6570-html .wrap{width:100%;padding:0 18px}.s6570-html .hprice{display:none}.s6570-html .site-in{height:auto;gap:12px;padding-top:12px;padding-bottom:12px;align-items:flex-start}.s6570-html .hbuy{flex-direction:column;align-items:flex-end}}
`;

const MICROTEK_S6570_HTML = `
<header class="site">
  <div class="wrap site-in">
    <div class="brand">
      <img class="brand-logo" src="/assets/logo/hptlogo.png" alt="HPT Technology">
      <div>HPT TECH<small>THIẾT BỊ VĂN PHÒNG</small></div>
    </div>
    <div class="hbuy">
      <div class="hprice">80.000.000 đ<span>Giá tham khảo</span></div>
      <a class="btn btn-primary" href="/lien-he">Tư vấn &amp; báo giá</a>
    </div>
  </div>
</header>

<div class="hero">
  <div class="wrap">
    <div class="htext">
      <span class="eyebrow">● Máy quét A3 hai mặt · Dòng S tốc độ cao</span>
      <h1>Microtek <span class="sub">S6570</span></h1>
      <p class="lead">Máy quét tài liệu 2 mặt khổ A3 với khay nạp tự động, tốc độ 75 trang/phút (150 mặt/phút), công suất tới 32.000 trang/ngày cho nhu cầu số hóa khối lượng lớn.</p>
      <div class="hero-badges">
        <span class="chip"><b>A3</b> 2 mặt tự động</span>
        <span class="chip"><b>75 ppm</b> / 150 ipm</span>
        <span class="chip"><b>32.000</b> trang/ngày</span>
        <span class="chip"><b>USB 3.0</b> SuperSpeed</span>
      </div>
      <div class="price-row">
        <div class="price-tag"><div class="lab">Giá tham khảo</div><div class="val">80.000.000 đ</div></div>
      </div>
      <div class="cta-row">
        <a class="btn btn-primary" href="/lien-he"><span>Yêu cầu tư vấn và báo giá</span></a>
        <a class="btn btn-ghost" href="#thong-so">Xem thông số kỹ thuật</a>
      </div>
    </div>
    <div class="hero-art">
      <div class="panel">
        <img src="/assets/landing/microtek-s6570/s6570-hero.jpg" alt="Máy quét tài liệu A3 2 mặt Microtek S6570" width="560">
      </div>
      <div class="float-badge"><div class="n">32K<span style="font-size:15px"> /ngày</span></div><div class="t">Công suất quét<br>tối đa mỗi ngày</div></div>
    </div>
  </div>
</div>

<div class="stats">
  <div class="wrap">
    <div class="stat"><div class="n">A3</div><div class="l">Quét 2 mặt tự động</div></div>
    <div class="stat"><div class="n">75 ppm</div><div class="l">1 mặt @300 dpi</div></div>
    <div class="stat"><div class="n">150 ipm</div><div class="l">2 mặt @300 dpi</div></div>
    <div class="stat"><div class="n">32.000</div><div class="l">Trang/ngày (đỉnh)</div></div>
    <div class="stat"><div class="n">USB 3.0</div><div class="l">SuperSpeed</div></div>
  </div>
</div>

<section>
  <div class="wrap">
    <div class="sec-head">
      <span class="kicker">Tổng quan</span>
      <h2>Cỗ máy số hóa A3 hai mặt cho khối lượng lớn</h2>
    </div>
    <div class="prose" style="max-width:820px">
      <p><b>Microtek S6570</b> là máy quét tài liệu <b>khổ A3, quét 2 mặt tự động</b> qua khay nạp ADF, được thiết kế cho môi trường số hóa cường độ cao như giáo dục, ngân hàng, cơ quan nhà nước và các kho lưu trữ hồ sơ.</p>
      <p>Với tốc độ <b>75 trang/phút (150 mặt ảnh/phút)</b> ở 300 dpi và công suất khuyến nghị tới <b>32.000 trang/ngày</b>, S6570 xử lý gọn những chồng tài liệu lớn. Thiết kế <b>đường giấy thẳng</b> giúp nạp giấy mượt, ít kẹt và quét được cả tài liệu dày, thẻ nhựa cứng.</p>
      <p>Cảm biến CIS 600 dpi cùng bộ nhớ đệm <b>4 GB</b> cho luồng quét ổn định, kèm loạt tính năng thông minh: phát hiện nạp chồng siêu âm, tự nhận hướng trang, tự nhận màu, bỏ trang trắng và <b>gấp đôi để quét khổ A3</b> rồi tự ghép ảnh hai mặt.</p>
    </div>
  </div>
</section>

<hr class="divider">

<section style="padding-top:36px;padding-bottom:36px">
  <div class="wrap">
    <div class="feature">
      <div class="txt">
        <span class="tag">Năng suất &amp; độ bền</span>
        <h3>Được thiết kế để chạy hết công suất</h3>
        <div class="prose"><p>Đường giấy thẳng, khay nạp 100 tờ và cơ cấu tốc độ cao giúp S6570 giữ nhịp quét ổn định suốt ngày dài, đúng chất một cỗ máy số hóa chuyên nghiệp, vận hành êm và xếp giấy gọn gàng.</p></div>
        <ul class="ticks">
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#e7f4ee"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#0f8a4f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span><b>75 ppm / 150 ipm</b> ở 300 dpi, quét cả hai mặt cùng lúc.</span></li>
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#e7f4ee"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#0f8a4f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Công suất đỉnh <b>32.000 trang/ngày</b>; tuổi thọ con lăn <b>150.000 trang</b>.</span></li>
          <li><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#e7f4ee"/><path d="M7 12.5l3.2 3.2L17 9" stroke="#0f8a4f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Khay nạp <b>từ 100 tờ</b>, đường giấy thẳng nạp mượt, hạn chế kẹt giấy.</span></li>
        </ul>
      </div>
      <div class="art"><img src="/assets/landing/microtek-s6570/s6570-highvolume.jpg" alt="Microtek S6570 xử lý khối lượng tài liệu lớn" width="520"></div>
    </div>
  </div>
</section>

<hr class="divider">

<section>
  <div class="wrap">
    <div class="sec-head">
      <span class="kicker">Tính năng thông minh</span>
      <h2>Thông minh trong từng lần quét</h2>
    </div>
    <div class="cards">
      <div class="card"><div class="ic"></div><h4>Quét 2 mặt &amp; xử lý ảnh mạnh</h4><p>Duplex một lần đưa giấy; tự cắt, chỉnh nghiêng, bỏ trang trắng, khử nền và xuất đa luồng.</p></div>
      <div class="card"><div class="ic"></div><h4>Tự nhận hướng &amp; màu</h4><p>Tự xoay trang đúng chiều đọc và tự nhận tài liệu màu / đen trắng khi quét lô trộn.</p></div>
      <div class="card"><div class="ic"></div><h4>Chống nạp chồng siêu âm</h4><p>Cảm biến siêu âm phát hiện 2 tờ dính nhau và dừng ngay, tránh kẹt giấy và sót trang.</p></div>
      <div class="card"><div class="ic"></div><h4>Gấp đôi quét A3 &amp; giấy dài</h4><p>Gấp bản A3 để quét rồi tự ghép ảnh 2 mặt; hỗ trợ trang dài tới 1.039 mm.</p></div>
      <div class="card"><div class="ic"></div><h4>Đa định dạng, kể cả PDF 2 lớp</h4><p>Xuất JPEG, PDF, TIFF, BMP, PNG, PDF/TIFF nhiều trang. Kèm DocWizard EX.</p></div>
      <div class="card"><div class="ic"></div><h4>USB 3.0 &amp; chuẩn TWAIN/SANE</h4><p>Kết nối SuperSpeed USB 3.0; driver TWAIN/SANE tích hợp mượt với hệ thống hiện có.</p></div>
    </div>
  </div>
</section>

<section id="thong-so">
  <div class="wrap">
    <div class="sec-head">
      <span class="kicker">Thông số kỹ thuật</span>
      <h2>Chi tiết kỹ thuật đầy đủ</h2>
      <p class="prose" style="margin-top:14px;color:var(--muted);font-size:15.5px">Tổng hợp từ trang sản phẩm chính hãng Microtek.</p>
    </div>
    <div class="spec-wrap">
      <table class="spec">
        <tr class="grouprow"><th colspan="2"><span class="gr-in">Quét &amp; hình ảnh</span></th></tr>
        <tr><th>Tên / Loại</th><td>S6570 · Máy quét tờ rời để bàn, quét 2 mặt màu, khổ A3</td></tr>
        <tr><th>Cảm biến / nguồn sáng</th><td>CIS · đèn LED</td></tr>
        <tr><th>Độ phân giải</th><td>600 dpi</td></tr>
        <tr><th>Chế độ màu</th><td>Màu / Thang xám / Đen trắng (đầu ra 24-bit)</td></tr>
        <tr><th>Tốc độ quét</th><td>A4 ngang: 75 ppm / 150 ipm @300 dpi · A3: ~46,7 ppm @200 dpi</td></tr>
        <tr><th>Bộ nhớ đệm</th><td>4 GB SDRAM</td></tr>
        <tr class="grouprow"><th colspan="2"><span class="gr-in">Khổ giấy &amp; độ bền</span></th></tr>
        <tr><th>Vùng quét</th><td>Tối thiểu 50,8 × 54 mm · Tối đa 305 × 1.039 mm</td></tr>
        <tr><th>Khay nạp tự động (ADF)</th><td>Từ 100 tờ (A4, 70 g/m²)</td></tr>
        <tr><th>Định lượng giấy</th><td>40-157 g/m² · quét thẻ nhựa cứng ≤ 1,4 mm</td></tr>
        <tr><th>Công suất đỉnh / ngày</th><td>32.000 trang</td></tr>
        <tr><th>Tuổi thọ con lăn</th><td>150.000 trang</td></tr>
        <tr class="grouprow"><th colspan="2"><span class="gr-in">Tính năng &amp; phần mềm</span></th></tr>
        <tr><th>Tính năng thông minh</th><td>Chống nạp chồng siêu âm, tự nhận hướng trang, tự nhận màu, bỏ trang trắng, tự cắt &amp; chỉnh nghiêng, gấp đôi quét A3</td></tr>
        <tr><th>Định dạng file</th><td>JPEG, PDF, TIFF, BMP, PNG, PDF/TIFF nhiều trang, PDF &amp; OFD 2 lớp</td></tr>
        <tr><th>Driver</th><td>TWAIN, SANE</td></tr>
        <tr><th>Phần mềm đi kèm</th><td>DocWizard EX</td></tr>
        <tr class="grouprow"><th colspan="2"><span class="gr-in">Kết nối, vật lý &amp; điện</span></th></tr>
        <tr><th>Chuẩn kết nối</th><td>SuperSpeed USB 3.0</td></tr>
        <tr><th>Hệ điều hành</th><td>Windows 10 / 11</td></tr>
        <tr><th>Kích thước (D × R × C)</th><td>340 × 400 × 276 mm (thu gọn) · 714 × 400 × 378 mm (mở rộng)</td></tr>
        <tr><th>Trọng lượng</th><td>5,3 kg</td></tr>
        <tr><th>Tương thích EMC</th><td>Class A</td></tr>
      </table>
    </div>

    <div class="sec-head" style="margin-top:56px">
      <span class="kicker">Trong hộp có gì</span>
      <h2 style="font-size:26px">Bộ sản phẩm tiêu chuẩn</h2>
    </div>
    <div class="box-list">
      <div class="box-item"><div class="ic"></div><span>Máy quét S6570</span></div>
      <div class="box-item"><div class="ic"></div><span>Cáp USB 3.0</span></div>
      <div class="box-item"><div class="ic"></div><span>Adapter nguồn</span></div>
      <div class="box-item"><div class="ic"></div><span>Phần mềm &amp; hướng dẫn (DocWizard EX)</span></div>
    </div>
  </div>
</section>

<div class="cta">
  <div class="wrap" style="padding:64px 0">
    <div class="box">
      <div>
        <h2>Cần tư vấn cấu hình số hóa A3 khối lượng lớn?</h2>
        <p class="p">Microtek S6570 chính hãng, máy quét A3 hai mặt 75 trang/phút, có sẵn tại HPT Tech. Để lại yêu cầu để nhận tư vấn và báo giá tốt nhất.</p>
        <div class="cta-row">
          <a class="btn btn-primary" href="/lien-he"><span>Yêu cầu tư vấn và báo giá</span></a>
        </div>
      </div>
      <div class="buy">
        <div class="lab">Giá tham khảo</div>
        <div class="val">80.000.000 đ</div>
        <a class="btn btn-primary" href="/lien-he" style="width:100%;justify-content:center"><span>Mua ngay</span></a>
        <div class="note">Giá tham khảo · Giá có thể thay đổi theo thời điểm</div>
      </div>
    </div>
  </div>
</div>
`;
