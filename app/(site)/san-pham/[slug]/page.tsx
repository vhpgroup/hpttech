import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, ShieldCheck, Truck } from "lucide-react";
import { getProductBySlugFromPayload } from "@/lib/catalog-payload";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return [];
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlugFromPayload(slug);

  if (!product) notFound();

  const specs = (product.specs && Object.fromEntries((product.specs as Array<{ label: string; value: string }>).map(({ label, value }) => [label, value]))) || {};

  return (
    <main className="subpage-main">
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700" href="/san-pham">
        <ArrowLeft size={16} />
        Quay lại catalog
      </Link>

      <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[430px_1fr]">
        <div className="grid min-h-[360px] place-items-center rounded-lg bg-slate-50 p-6">
          <img className="max-h-[320px] object-contain" src={(product.images && product.images[0]?.url) || (product.image as string) || ''} alt={product.title} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{product.brand}</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-950">{product.title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{product.detail}</p>
          <div className="mt-5 text-2xl font-bold text-orange-600">{product.price}</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800" href={`mailto:lienhe@hpttech.vn?subject=Yêu cầu báo giá ${product.title}`}>
              <Mail size={16} />
              Nhận báo giá
            </a>
            {product.href ? (
              <a className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-700" href={product.href} target="_blank" rel="noreferrer">
                Xem nguồn HPT
              </a>
            ) : null}
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
          <SpecRow label="Thương hiệu" value={product.brand || "Đang cập nhật"} />
          <SpecRow label="Danh mục" value={product.category || "Đang cập nhật"} />
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
