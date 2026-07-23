import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Mail, PhoneCall } from "lucide-react";
import { AboutEnterprisePage } from "@/components/about/AboutEnterprisePage";
import { SubpageBreadcrumb, SubpageHeader } from "@/components/layout/SubpageHeader";
import CategoryLandingClient from "@/components/category/CategoryLandingClient";
import {
  getBrands,
  getCatalogProducts,
  getSitePage,
} from "@/lib/content";
import {
  getAboutPageFromPayload,
  getFAQsFromPayload,
  getPostsFromPayload,
  getProjectsFromPayload,
  getSiteSettingsFromPayload,
  getSolutionsFromPayload,
  getStaticPageFromPayload,
} from "@/lib/content-payload";
import {
  getCategoryBreadcrumbTrail,
  getProductSearchPageFromPayload,
  type ProductSearchParams,
} from "@/lib/catalog-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings, phoneHref } from "@/lib/site-settings";
import { ProductQuickInfoTrigger } from "@/components/home/HomeCategoryCarouselsClient";

// Route gộp: trang tĩnh CMS (ưu tiên) + LANDING DANH MỤC rút gọn /<slug> (kiểu An Phát).
// Landing đọc searchParams (bộ lọc) = dynamic API → PHẢI force-dynamic, KHÔNG
// revalidate/generateStaticParams (tránh DYNAMIC_SERVER_USAGE — sự cố 22/07).
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseLandingSearchParams(
  categorySlug: string,
  params: Record<string, string | string[] | undefined>,
): ProductSearchParams {
  const sort = firstParam(params.sort);
  return {
    page: Number(firstParam(params.page) || 1),
    search: "",
    category: categorySlug,
    facetScope: "category",
    brand: firstParam(params.brand) || "",
    sort:
      sort === "price-asc" ||
      sort === "price-desc" ||
      sort === "newest" ||
      sort === "popular" ||
      sort === "best"
        ? sort
        : "best",
    priceMin: firstParam(params.priceMin) || "",
    priceMax: firstParam(params.priceMax) || "",
    size: firstParam(params.size) || "",
    speed: firstParam(params.speed) || "",
    feature: firstParam(params.feature) || "",
    func: firstParam(params.func) || "",
    pspeed: firstParam(params.pspeed) || "",
    pfeat: firstParam(params.pfeat) || "",
    lic: firstParam(params.lic) || "",
    aud: firstParam(params.aud) || "",
    fb: firstParam(params.fb) || "",
    mau: firstParam(params.mau) || "",
    orig: firstParam(params.orig) || "",
    cpu: firstParam(params.cpu) || "",
    ram: firstParam(params.ram) || "",
    gpu: firstParam(params.gpu) || "",
    sc: firstParam(params.sc) || "",
    line: firstParam(params.line) || "",
  };
}

// Landing danh mục tại URL rút gọn /<slug> (giống An Phát). Trả null nếu slug
// không phải danh mục (để caller thử tiếp/notFound).
async function renderCategoryLanding(slug: string, searchParams: PageProps["searchParams"]) {
  const trail = await getCategoryBreadcrumbTrail(slug);
  const leaf = trail.length ? trail[trail.length - 1] : null;
  if (!leaf) return null;
  // Vào bằng tên/slug chưa chuẩn → về URL canonical rút gọn.
  if (leaf.slug !== slug) redirect(`/${encodeURIComponent(leaf.slug)}`);

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const parsed = parseLandingSearchParams(leaf.slug, resolvedSearchParams);
  const result = await getProductSearchPageFromPayload(parsed);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: absoluteURL("/") },
      { "@type": "ListItem", position: 2, name: "Sản phẩm", item: absoluteURL("/san-pham") },
      ...trail.map((item, index) => ({
        "@type": "ListItem",
        position: 3 + index,
        name: item.name,
        item: absoluteURL(`/${encodeURIComponent(item.slug)}`),
      })),
    ],
  };

  return (
    <main className="subpage-main bg-slate-50/70 pb-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <SubpageBreadcrumb
        items={[
          { label: "Trang chủ", href: "/" },
          { label: "Sản phẩm", href: "/san-pham" },
          ...trail.map((item) => ({
            label: item.name,
            href: `/${encodeURIComponent(item.slug)}`,
          })),
        ]}
      />

      {/* Khối tiêu đề hiển thị (tên + badge + mô tả) đã BỎ theo yêu cầu 23/07 —
          giữ H1 ẩn cho SEO; số SP vẫn hiện ở thanh phân trang cuối trang. */}
      <h1 className="sr-only">{leaf.name} chính hãng, giá tốt | HPT Tech</h1>

      {/* CategoryLandingClient dùng useSearchParams → PHẢI bọc Suspense. */}
      <Suspense fallback={null}>
        <CategoryLandingClient
          leaf={leaf}
          trail={trail}
          products={result.products}
          facets={result.facets}
          page={result.page}
          totalPages={result.totalPages}
          totalProducts={result.totalProducts}
        />
      </Suspense>
    </main>
  );
}

export default async function ContentPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const [payloadPage, rawSettings, aboutPage] = await Promise.all([
    getStaticPageFromPayload(slug),
    getSiteSettingsFromPayload(),
    slug === "ve-hpt" ? getAboutPageFromPayload() : Promise.resolve(null),
  ]);
  const settings = normalizeSiteSettings(rawSettings);

  if (slug === "ve-hpt" && aboutPage) {
    return <AboutEnterprisePage content={aboutPage} settings={settings} />;
  }

  const fallbackPage = getSitePage(slug);
  const page = payloadPage
    ? {
        slug: payloadPage.slug,
        title: payloadPage.title,
        eyebrow: payloadPage.eyebrow || fallbackPage?.eyebrow || "HPT Tech",
        description: payloadPage.summary || fallbackPage?.description || "",
        ctaHref: fallbackPage?.ctaHref,
        ctaLabel: fallbackPage?.ctaLabel,
      }
    : fallbackPage;

  if (!page) {
    // Không phải trang tĩnh → thử LANDING DANH MỤC rút gọn /<slug> (kiểu An Phát).
    const landing = await renderCategoryLanding(slug, searchParams);
    if (landing) return landing;
    notFound();
  }

  return (
    <main className="subpage-main">
      <SubpageHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: page.title },
        ]}
        cta={page.ctaHref ? (
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#0A4BFF] px-5 text-sm font-bold text-white transition hover:bg-blue-700"
            href={page.ctaHref}
          >
            {page.ctaLabel}
            <ArrowRight size={16} />
          </Link>
        ) : null}
      />

      {slug === "san-pham" ? <ProductCatalog /> : null}
      {slug === "giai-phap" || slug === "dich-vu" ? <SolutionList /> : null}
      {slug === "thuong-hieu" ? <BrandList /> : null}
      {slug === "tin-tuc" ? <PostList /> : null}
      {slug === "lien-he" || slug === "chat" ? <ContactPanel settings={settings} /> : null}
      {slug === "du-an" ? <ProjectList /> : null}
      {slug === "dich-vu" ? <FAQList /> : null}
    </main>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (slug === "ve-hpt") {
    const aboutPage = await getAboutPageFromPayload();
    return pageMetadata({
      title: aboutPage.hero.title,
      description: aboutPage.hero.description,
      path: "/ve-hpt",
    });
  }

  const [payloadPage, fallbackPage] = await Promise.all([
    getStaticPageFromPayload(slug),
    Promise.resolve(getSitePage(slug)),
  ]);

  // Không phải trang tĩnh → thử metadata LANDING DANH MỤC (self-canonical /<slug>).
  if (!payloadPage && !fallbackPage) {
    const trail = await getCategoryBreadcrumbTrail(slug);
    const leaf = trail.length ? trail[trail.length - 1] : null;
    if (leaf) {
      return pageMetadata({
        title: `${leaf.name} chính hãng, giá tốt`,
        description: `${leaf.name} chính hãng tại HPT Tech — báo giá nhanh, xuất hóa đơn VAT, giao hàng toàn quốc. Tư vấn kỹ thuật tận nơi cho doanh nghiệp.`,
        path: `/${encodeURIComponent(leaf.slug)}`,
      });
    }
  }

  const title = payloadPage?.title || fallbackPage?.title || "HPT Tech";
  const description = payloadPage?.summary || fallbackPage?.description || "Thông tin từ HPT Tech.";

  return pageMetadata({
    title,
    description,
    path: `/${slug}`,
  });
}

function ProductCatalog() {
  const products = getCatalogProducts();

  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.slice(0, 24).map((product) => (
        <ProductQuickInfoTrigger key={product.title} product={product}>
          <article className="h-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <a href={product.href} target="_blank" rel="noreferrer">
              {product.image ? (
                <Image className="h-40 w-full object-contain" src={product.image} alt={product.title} width={260} height={160} />
              ) : null}
            </a>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{product.brand}</p>
              <h2 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold text-slate-950">
                {product.title}
              </h2>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-600">{product.detail}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <strong className="text-sm text-orange-600">{product.price}</strong>
                <a className="text-sm font-semibold text-blue-700 hover:text-blue-900" href={product.href} target="_blank" rel="noreferrer">
                  Chi tiết
                </a>
              </div>
            </div>
          </article>
        </ProductQuickInfoTrigger>
      ))}
    </section>
  );
}

async function SolutionList() {
  const solutions = await getSolutionsFromPayload();

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      {solutions.map((solution) => (
        <article key={solution.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">{solution.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{solution.description}</p>
        </article>
      ))}
    </section>
  );
}

function BrandList() {
  return (
    <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {getBrands().map((brand) => (
        <article key={brand.name} className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm">
          <Image className="max-h-10 max-w-28 object-contain" src={`/${brand.logo}`} alt={brand.name} width={112} height={40} />
          <h2 className="mt-3 text-sm font-semibold text-slate-800">{brand.name}</h2>
        </article>
      ))}
    </section>
  );
}

async function PostList() {
  const posts = await getPostsFromPayload();

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {posts.map((post) => (
        <article key={post.title} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <a href={post.href}>
            {post.image ? (
              <Image className="h-40 w-full object-cover" src={post.image} alt={post.title} width={360} height={160} />
            ) : null}
          </a>
          <div className="p-4">
            <p className="text-xs font-semibold text-slate-500">{post.date}</p>
            <h2 className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-950">
              {post.title}
            </h2>
          </div>
        </article>
      ))}
    </section>
  );
}

async function ProjectList() {
  const projects = await getProjectsFromPayload();
  if (!projects.length) return <PlaceholderPanel slug="du-an" />;

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      {projects.map((project) => (
        <article key={project.slug} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{project.industry}</p>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">{project.title}</h2>
          {project.client ? <p className="mt-1 text-sm font-medium text-slate-500">{project.client}</p> : null}
          {project.summary ? <p className="mt-3 text-sm leading-6 text-slate-600">{project.summary}</p> : null}
        </article>
      ))}
    </section>
  );
}

async function FAQList() {
  const faqs = await getFAQsFromPayload();
  if (!faqs.length) return null;

  return (
    <section className="mt-8 grid gap-3">
      {faqs.map((faq) => (
        <article key={faq.question} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          {faq.category ? <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{faq.category}</p> : null}
          <h2 className="mt-1 text-base font-semibold text-slate-950">{faq.question}</h2>
        </article>
      ))}
    </section>
  );
}

function ContactPanel({ settings }: { settings: ReturnType<typeof normalizeSiteSettings> }) {
  const phone = settings.hotline || settings.phone;

  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      <a className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300" href={phoneHref(phone)}>
        <PhoneCall className="text-blue-700" size={24} />
        <div>
          <h2 className="font-semibold text-slate-950">Hotline</h2>
          <p className="text-sm text-slate-600">{phone}</p>
        </div>
      </a>
      <a className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300" href={`mailto:${settings.email}`}>
        <Mail className="text-blue-700" size={24} />
        <div>
          <h2 className="font-semibold text-slate-950">Email báo giá</h2>
          <p className="text-sm text-slate-600">{settings.email}</p>
        </div>
      </a>
    </section>
  );
}

function PlaceholderPanel({ slug }: { slug: string }) {
  return (
    <section className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600">
      Trang <strong className="text-slate-950">/{slug}</strong> đã có route Next.js. Nội dung chi tiết có thể nối WordPress ở bước sau.
    </section>
  );
}
