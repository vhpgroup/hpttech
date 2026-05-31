import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Building2, Mail, MapPin, PhoneCall, Target } from "lucide-react";
import { getProductBySlug, getPostBySlug } from "@/lib/catalog";
import { HPT_ABOUT } from "@/lib/about";
import {
  getBrands,
  getCatalogProducts,
  getPosts,
  getSitePage,
  getSolutions,
  SITE_PAGES,
} from "@/lib/content";
import { formatPrice } from "@/lib/data";
import Breadcrumb from "@/components/layout/Breadcrumb";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return Object.keys(SITE_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getSitePage(slug);
  const product = getProductBySlug(slug);
  const post = getPostBySlug(slug);

  if (page) {
    return {
      title: page.title,
      description: page.description,
      openGraph: { title: page.title, description: page.description },
    };
  }

  if (product) {
    return {
      title: product.title,
      description: product.detail,
      openGraph: { title: product.title, description: product.detail, images: product.image ? [product.image] : [] },
    };
  }

  if (post) {
    return {
      title: post.title,
      openGraph: { title: post.title, images: post.image ? [post.image] : [] },
    };
  }

  return { title: "Không tìm thấy" };
}

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getSitePage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="subpage-main">
      <Breadcrumb items={[{ label: page.title }]} />

      {slug === "san-pham" ? <ProductCatalog /> : null}
      {slug === "giai-phap" || slug === "dich-vu" ? <SolutionList /> : null}
      {slug === "thuong-hieu" ? <BrandList /> : null}
      {slug === "tin-tuc" ? <PostList /> : null}
      {slug === "lien-he" || slug === "chat" ? <ContactPanel /> : null}
      {slug === "ve-hpt" ? <AboutPanel /> : null}
      {slug === "du-an" ? <PlaceholderPanel slug={slug} /> : null}
    </main>
  );
}

function AboutPanel() {
  return (
    <div className="mt-8 grid gap-6">
      <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Hồ sơ doanh nghiệp</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-slate-950">{HPT_ABOUT.companyName}</h2>
          <p className="mt-4 text-base leading-8 text-slate-600">{HPT_ABOUT.intro}</p>
        </div>
        <div className="grid content-start gap-3 rounded-lg bg-slate-50 p-5">
          <InfoLine icon={<MapPin size={18} />} label="Trụ sở" value={HPT_ABOUT.address} />
          <InfoLine icon={<PhoneCall size={18} />} label="Hotline" value={HPT_ABOUT.hotline} href="tel:0967286889" />
          <InfoLine icon={<Building2 size={18} />} label="Website" value={HPT_ABOUT.website} href={HPT_ABOUT.website} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {HPT_ABOUT.pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Target className="text-blue-700" size={22} />
            <h2 className="mt-3 text-lg font-bold text-slate-950">{pillar.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Lĩnh vực hoạt động</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">Thiết bị, dịch vụ và hạ tầng công nghệ</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {HPT_ABOUT.fields.map((field) => (
            <article key={field.title} className="rounded-lg border border-slate-100 bg-slate-50 p-5">
              <h3 className="font-bold text-slate-950">{field.title}</h3>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                {field.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <BadgeCheck className="mt-1 shrink-0 text-blue-700" size={15} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Năng lực và lợi thế</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
            {HPT_ABOUT.strengths.map((strength) => (
              <li key={strength} className="flex gap-2">
                <BadgeCheck className="mt-1 shrink-0 text-green-600" size={15} />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Khách hàng tiêu biểu</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {HPT_ABOUT.customers.map((customer) => (
              <span key={customer} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                {customer}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-lg border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Định hướng phát triển</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {HPT_ABOUT.directions.map((direction) => (
            <div key={direction} className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
              {direction}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-blue-700">{icon}</span>
      <span>
        <strong className="block text-xs uppercase tracking-wide text-slate-500">{label}</strong>
        <span className="text-sm font-semibold text-slate-800">{value}</span>
      </span>
    </>
  );

  return href ? (
    <a className="flex gap-3 rounded-md p-2 transition hover:bg-white" href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>
      {content}
    </a>
  ) : (
    <div className="flex gap-3 rounded-md p-2">{content}</div>
  );
}

function ProductCatalog() {
  const products = getCatalogProducts();

  return (
    <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.slice(0, 24).map((product) => (
        <article key={product.title} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <a href={product.href} target="_blank" rel="noreferrer">
            <img className="h-40 w-full object-contain" src={product.image} alt={product.title} />
          </a>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{product.brand}</p>
            <h2 className="mt-2 line-clamp-2 min-h-12 text-base font-semibold text-slate-950">
              {product.title}
            </h2>
            <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-600">{product.detail}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <strong className="text-sm text-orange-600">{formatPrice(product.price)}</strong>
              <a className="text-sm font-semibold text-blue-700 hover:text-blue-900" href={product.href} target="_blank" rel="noreferrer">
                Chi tiết
              </a>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function SolutionList() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      {getSolutions().map((solution) => (
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
          <img className="max-h-10 max-w-28 object-contain" src={`/${brand.logo}`} alt={brand.name} />
          <h2 className="mt-3 text-sm font-semibold text-slate-800">{brand.name}</h2>
        </article>
      ))}
    </section>
  );
}

function PostList() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {getPosts().map((post) => (
        <article key={post.title} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <a href={post.href} target="_blank" rel="noreferrer">
            <img className="h-40 w-full object-cover" src={post.image} alt={post.title} />
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

function ContactPanel() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2">
      <a className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300" href="tel:0876645432">
        <PhoneCall className="text-blue-700" size={24} />
        <div>
          <h2 className="font-semibold text-slate-950">Hotline</h2>
          <p className="text-sm text-slate-600">0876 645 432</p>
        </div>
      </a>
      <a className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300" href="mailto:lienhe@hpttech.vn">
        <Mail className="text-blue-700" size={24} />
        <div>
          <h2 className="font-semibold text-slate-950">Email báo giá</h2>
          <p className="text-sm text-slate-600">lienhe@hpttech.vn</p>
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
