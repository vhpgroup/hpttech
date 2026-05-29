import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Mail, PhoneCall } from "lucide-react";
import { getProductBySlug, getPostBySlug } from "@/lib/catalog";
import {
  getBrands,
  getCatalogProducts,
  getPosts,
  getSitePage,
  getSolutions,
} from "@/lib/content";
import { formatPrice } from "@/lib/data";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
          {page.eyebrow}
        </p>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">{page.title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">{page.description}</p>
          </div>
          {page.ctaHref ? (
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800"
              href={page.ctaHref}
            >
              {page.ctaLabel}
              <ArrowRight size={16} />
            </Link>
          ) : null}
        </div>
      </section>

      {slug === "san-pham" ? <ProductCatalog /> : null}
      {slug === "giai-phap" || slug === "dich-vu" ? <SolutionList /> : null}
      {slug === "thuong-hieu" ? <BrandList /> : null}
      {slug === "tin-tuc" ? <PostList /> : null}
      {slug === "lien-he" || slug === "chat" ? <ContactPanel /> : null}
      {slug === "du-an" || slug === "ve-hpt" ? <PlaceholderPanel slug={slug} /> : null}
    </main>
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
