import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/data";
import { HPT_PRODUCT_SPECS } from "@/lib/specs";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) return { title: "Không tìm thấy" };

  return {
    title: product.title,
    description: product.detail,
    openGraph: {
      title: product.title,
      description: product.detail,
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const specs = HPT_PRODUCT_SPECS[product.href] || {};
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.image ? [product.image] : [],
    description: product.detail,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    offers: {
      "@type": "Offer",
      url: `https://hpttech.vercel.app/san-pham/${slug}`,
      priceCurrency: "VND",
      ...(product.price !== null ? { price: product.price } : {}),
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="subpage-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700" href="/san-pham">
        <ArrowLeft size={16} />
        Quay lại catalog
      </Link>

      <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[430px_1fr]">
        <div className="grid min-h-[360px] place-items-center rounded-lg bg-gradient-to-br from-slate-50 to-blue-50/60 p-6">
          <img className="max-h-[320px] object-contain" src={product.image} alt={product.title} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{product.brand}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950">{product.title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{product.detail}</p>
          <div className="mt-5 text-3xl font-extrabold text-red-600">{formatPrice(product.price)}</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800" href={`mailto:lienhe@hpttech.vn?subject=Yêu cầu báo giá ${product.title}`}>
              <Mail size={16} />
              Nhận báo giá
            </a>
            <a className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-700" href={product.href} target="_blank" rel="noreferrer">
              Xem nguồn HPT
            </a>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700">
              <ShieldCheck size={18} className="text-blue-700" />
              Hàng chính hãng
            </div>
            <div className="flex items-center gap-3 rounded-md bg-slate-50 p-3 text-sm font-medium text-slate-700">
              <Truck size={18} className="text-blue-700" />
              Tư vấn triển khai
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Thông số chính</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <SpecRow label="Thương hiệu" value={product.brand} />
          <SpecRow label="Danh mục" value={product.category} />
          {Object.entries(specs).map(([label, value]) => (
            <SpecRow key={label} label={label} value={value} />
          ))}
        </div>
      </section>
    </main>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-3 rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
