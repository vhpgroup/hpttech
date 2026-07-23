import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { RelatedAIProduct } from "@/lib/ai-search/mock-data";
import { ProductQuickInfoTrigger } from "@/components/home/HomeCategoryCarouselsClient";

type RelatedProductsProps = {
  products: RelatedAIProduct[];
};

export default function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Sản phẩm liên quan khác ({products.length})</h2>
          <p className="text-sm text-slate-500">Các lựa chọn scan tài liệu gần cùng phân khúc.</p>
        </div>
        <Link href="/san-pham?category=Máy%20scan" className="inline-flex items-center gap-1 text-sm font-bold text-primary-700">
          Xem tất cả
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {products.map((product) => (
          <ProductQuickInfoTrigger key={product.slug} product={product}>
            <article className="h-full rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-primary-200 hover:bg-primary-50/60">
              <Link href={product.href || `/san-pham/${product.slug}`} className="grid h-28 place-items-center rounded-md bg-white p-2">
                {product.image ? (
                  <Image src={product.image} alt={product.title} width={150} height={110} sizes="150px" className="max-h-24 w-auto object-contain" />
                ) : (
                  <div className="h-20 w-24 rounded-md bg-slate-200" />
                )}
              </Link>
              <h3 className="mt-3 line-clamp-2 min-h-[40px] text-sm font-bold leading-5 text-primary-700">
                <Link href={product.href || `/san-pham/${product.slug}`}>{product.title}</Link>
              </h3>
              <p className="mt-2 text-base font-extrabold text-red-600">{product.price}</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={14} />
                {product.stockLabel}
              </span>
            </article>
          </ProductQuickInfoTrigger>
        ))}
      </div>
    </section>
  );
}
