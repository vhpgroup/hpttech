import { CheckCircle2, Star } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import QuoteButton from "@/components/quote/QuoteButton";
import { Button } from "@/components/ui/Button";
import type { CatalogProduct } from "@/lib/catalog";
import ProductPromotionsPanel from "@/components/product/ProductPromotionsPanel";
import ProductCompareButton from "@/components/product/ProductCompareButton";

type ProductPricingSectionProps = {
  product: CatalogProduct;
  quoteHref: string;
  phoneHref: string;
  schemaPrice?: number;
};

function pickSellingSpecs(product: CatalogProduct) {
  const specs = product.specs ?? [];
  const preferred = ["chức năng", "độ phân giải", "tốc độ", "kết nối"];
  const selected = preferred
    .map((keyword) => specs.find((spec) => spec.label.toLowerCase().includes(keyword)))
    .filter((item): item is { label: string; value: string } => Boolean(item));

  if (selected.length) return selected.slice(0, 4);

  return [
    { label: "Danh mục", value: product.category || "Thiết bị văn phòng" },
    { label: "Thương hiệu", value: product.brand || "Đang cập nhật" },
    { label: "Bảo hành", value: product.warranty || "Liên hệ xác nhận" },
    {
      label: "Tình trạng",
      value:
        product.stockStatus === "out_of_stock"
          ? "Hết hàng"
          : product.stockStatus === "preorder"
            ? "Đặt trước"
            : "Còn hàng",
    },
  ];
}

export default function ProductPricingSection({
  product,
  quoteHref,
  phoneHref,
  schemaPrice,
}: ProductPricingSectionProps) {
  const sellingSpecs = pickSellingSpecs(product);
  const sku = product.sku || product.slug;
  const rating = Math.max(0, Math.min(5, product.rating ?? 0));
  const reviewCount = product.reviewCount ?? 0;
  const viewCount = product.viewCount;
  const promotions = product.promotions ?? [];

  return (
    <section className="product-detail-enter product-detail-enter-info overflow-hidden rounded-[20px] bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60">
      <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
        <h1 className="text-3xl font-semibold leading-tight text-slate-950">{product.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
          <span>
            Mã SP: <strong className="font-semibold text-slate-900">{sku}</strong>
          </span>
          <span className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={15}
                className={index < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
              />
            ))}
            <strong className="ml-1 font-medium text-slate-600">{reviewCount} đánh giá</strong>
          </span>
          <span>Lượt xem: {typeof viewCount === "number" ? viewCount.toLocaleString("vi-VN") : "đang cập nhật"}</span>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <div className="space-y-2">
          {sellingSpecs.map((spec) => (
            <div key={`${spec.label}-${spec.value}`} className="flex gap-2 text-sm leading-6 text-slate-700">
              <CheckCircle2 size={17} className="mt-1 shrink-0 fill-orange-500 text-white" />
              <span>
                {spec.label}: <strong className="font-semibold text-slate-950">{spec.value}</strong>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-100 px-5 py-5 sm:px-6">
        <div className="grid gap-3 text-sm sm:grid-cols-[150px_1fr]">
          <span className="font-semibold text-slate-700">Giá niêm yết:</span>
          <span className={product.compareAtPrice ? "font-semibold text-slate-400 line-through" : "text-slate-500"}>
            {product.compareAtPrice || "Chưa có giá niêm yết"}
          </span>

          <span className="font-semibold text-slate-700">Giá khuyến mại:</span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <strong className="product-price-emphasis text-2xl font-bold text-red-600">
              {product.price || "Liên hệ"}
            </strong>
            {product.discountBadge ? (
              <span className="rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-2.5 py-1 text-xs font-black uppercase tracking-wide text-white shadow-sm">
                {product.discountBadge}
              </span>
            ) : null}
            <span className="ml-2 text-sm text-slate-500">
              {product.vatIncluded === true
                ? "[Giá đã có VAT]"
                : product.vatIncluded === false
                  ? "[Chưa gồm VAT]"
                  : schemaPrice
                    ? "[Giá đã có VAT]"
                    : "[Cần xác nhận VAT]"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <ProductPromotionsPanel promotions={promotions} />

        <div className="grid gap-3 sm:grid-cols-3">
          <AddToCartButton
            product={product}
            label="Thêm vào giỏ"
            className="product-action-button inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-orange-700 hover:shadow-lg"
          />
          <div className="hidden">
            <a href={quoteHref}>Nhận báo giá</a>
          </div>
          <QuoteButton
            product={product}
            className="product-action-button inline-flex h-12 items-center justify-center rounded-xl bg-[#0057FF] px-4 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#0049d8] hover:shadow-lg"
          />
          <Button
            asChild
            size="lg"
            variant="outline"
            className="product-action-button rounded-xl border-slate-200 bg-white text-slate-800 transition-all hover:-translate-y-0.5 hover:border-[#2563EB]/45 hover:bg-[#2563EB]/5 hover:text-[#2563EB] hover:shadow-md"
          >
            <a href={phoneHref}>Tư vấn ngay</a>
          </Button>
        </div>

        <ProductCompareButton product={product} />
      </div>
    </section>
  );
}
