import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, ExternalLink, MessageCircle, Scale, Star } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import type { AISearchProduct } from "@/lib/ai-search/mock-data";
import { cn } from "@/lib/cn";

type ProductComparisonTableProps = {
  products: AISearchProduct[];
  zaloHref: string;
  onCompare: (product: AISearchProduct) => void;
};

const matchToneClasses: Record<AISearchProduct["matchTone"], string> = {
  best: "bg-emerald-50 text-emerald-700",
  stretch: "bg-amber-50 text-amber-700",
  stable: "bg-primary-50 text-primary-700",
};

export default function ProductComparisonTable({ products, zaloHref, onCompare }: ProductComparisonTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Sản phẩm phù hợp nhất ({products.length})</h2>
          <p className="text-sm text-slate-500">Bảng so sánh theo tiêu chí mua sắm B2B.</p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          Sắp xếp theo
          <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700">
            <option>Phù hợp nhất</option>
            <option>Giá thấp trước</option>
            <option>Tốc độ scan</option>
          </select>
        </label>
      </div>

      {products.length ? (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[1180px] table-fixed border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.06em] text-slate-500">
                  {[
                    "Sản phẩm",
                    "Hình ảnh",
                    "Tốc độ scan",
                    "ADF",
                    "Kết nối",
                    "Độ phân giải",
                    "Chu kỳ/ngày",
                    "Bảo hành",
                    "Giá bán",
                    "Tồn kho",
                    "Đánh giá",
                    "Phù hợp",
                    "Hành động",
                  ].map((heading) => (
                    <th key={heading} className="border-r border-slate-200 px-3 py-3 last:border-r-0">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.slug} className="border-b border-slate-100 align-middle hover:bg-primary-50/30">
                    <td className="border-r border-slate-100 px-3 py-4">
                      <Link href={product.href || `/san-pham/${product.slug}`} className="font-bold text-primary-700 hover:text-primary-800">
                        {product.title}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{product.summary}</p>
                    </td>
                    <td className="border-r border-slate-100 px-3 py-4">
                      <ProductImage product={product} />
                    </td>
                    <SpecCell>{product.speedLabel}</SpecCell>
                    <SpecCell>{product.adfLabel}</SpecCell>
                    <SpecCell>{product.connectivityLabel}</SpecCell>
                    <SpecCell>{product.resolutionLabel}</SpecCell>
                    <SpecCell>{product.dailyDutyLabel}</SpecCell>
                    <SpecCell>{product.warranty}</SpecCell>
                    <td className="border-r border-slate-100 px-3 py-4 text-base font-extrabold text-red-600">
                      {product.price}
                    </td>
                    <td className="border-r border-slate-100 px-3 py-4">
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700">
                        <CheckCircle2 size={16} />
                        {product.stockLabel}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">{product.stockPlaces}</p>
                    </td>
                    <td className="border-r border-slate-100 px-3 py-4">
                      <Rating rating={product.rating || 0} reviewCount={product.reviewCount || 0} />
                    </td>
                    <td className="border-r border-slate-100 px-3 py-4">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", matchToneClasses[product.matchTone])}>
                        {product.matchLabel}
                      </span>
                      <p className="mt-2 text-xs font-semibold text-slate-500">{product.matchScore}% match</p>
                    </td>
                    <td className="px-3 py-4">
                      <ProductActions product={product} zaloHref={zaloHref} onCompare={onCompare} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {products.map((product) => (
              <article key={product.slug} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex gap-3">
                  <ProductImage product={product} />
                  <div className="min-w-0 flex-1">
                    <Link href={product.href || `/san-pham/${product.slug}`} className="font-bold text-primary-700">
                      {product.title}
                    </Link>
                    <p className="mt-1 text-sm font-extrabold text-red-600">{product.price}</p>
                    <Rating rating={product.rating || 0} reviewCount={product.reviewCount || 0} />
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <MobileSpec label="Tốc độ" value={product.speedLabel} />
                  <MobileSpec label="ADF" value={product.adfLabel} />
                  <MobileSpec label="Kết nối" value={product.connectivityLabel} />
                  <MobileSpec label="Chu kỳ/ngày" value={product.dailyDutyLabel} />
                  <MobileSpec label="Bảo hành" value={product.warranty} />
                  <MobileSpec label="Phù hợp" value={`${product.matchLabel} (${product.matchScore}%)`} />
                </dl>
                <div className="mt-4">
                  <ProductActions product={product} zaloHref={zaloHref} onCompare={onCompare} />
                </div>
              </article>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Giá trên đã bao gồm VAT. Giá và tồn kho có thể thay đổi theo thời điểm, đội ngũ HPT Tech sẽ xác nhận khi lập báo giá.
          </p>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="font-bold text-slate-900">Chưa có sản phẩm phù hợp bộ lọc hiện tại.</p>
          <p className="mt-2 text-sm text-slate-500">Hãy tăng khoảng giá hoặc chọn “Tất cả” ở kết nối/ADF/thương hiệu.</p>
        </div>
      )}
    </section>
  );
}

function ProductImage({ product }: { product: AISearchProduct }) {
  return (
    <div className="grid h-20 w-24 shrink-0 place-items-center rounded-md bg-slate-50 p-2">
      {product.image ? (
        <Image src={product.image} alt={product.title} width={120} height={90} sizes="120px" className="max-h-16 w-auto object-contain" />
      ) : (
        <div className="h-14 w-16 rounded bg-slate-200" />
      )}
    </div>
  );
}

function SpecCell({ children }: { children: ReactNode }) {
  return <td className="border-r border-slate-100 px-3 py-4 font-semibold text-slate-700">{children}</td>;
}

function Rating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <Star size={15} className="fill-amber-400 text-amber-400" />
      <span className="font-bold text-primary-700">{rating.toFixed(1)}</span>
      <span className="text-xs text-slate-500">({reviewCount} đánh giá)</span>
    </div>
  );
}

function ProductActions({
  product,
  zaloHref,
  onCompare,
  compact = false,
}: {
  product: AISearchProduct;
  zaloHref: string;
  onCompare: (product: AISearchProduct) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("grid gap-2", compact ? "min-w-[150px]" : "sm:grid-cols-2")}>
      <Link
        href={product.href || `/san-pham/${product.slug}`}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-primary-200 bg-white px-2 text-xs font-bold text-primary-700 transition hover:bg-primary-50"
      >
        <ExternalLink size={14} />
        Xem chi tiết
      </Link>
      <button
        type="button"
        onClick={() => onCompare(product)}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-primary-200 bg-white px-2 text-xs font-bold text-primary-700 transition hover:bg-primary-50"
      >
        <Scale size={14} />
        So sánh
      </button>
      <AddToCartButton
        product={product}
        label="Thêm vào báo giá"
        ariaLabel={`Thêm ${product.title} vào báo giá`}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-primary-700 bg-primary-700 px-2 text-xs font-bold text-white transition hover:bg-primary-800"
      />
      <a
        href={`${zaloHref}?text=${encodeURIComponent(`Tôi cần tư vấn ${product.title}`)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-primary-200 bg-white px-2 text-xs font-bold text-primary-700 transition hover:bg-primary-50"
      >
        <MessageCircle size={14} />
        Tư vấn Zalo
      </a>
    </div>
  );
}

function MobileSpec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold text-slate-900">{value}</dd>
    </div>
  );
}
