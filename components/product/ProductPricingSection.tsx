import Link from "next/link";
import { Gift, Scale, Star } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { ProductSellingPoints } from "@/components/product/ProductSellingPoints";
import QuoteButton from "@/components/quote/QuoteButton";
import { Button } from "@/components/ui/Button";
import type { CatalogProduct } from "@/lib/catalog";

type ProductPricingSectionProps = {
  product: CatalogProduct;
  quoteHref: string;
  phoneHref: string;
  schemaPrice?: number;
};

type SellingLine = {
  label?: string;
  value: string;
};

function splitSellingPoint(value: string): SellingLine {
  const [label, ...rest] = value.split(":");
  if (!rest.length) return { value };
  return {
    label: label.trim(),
    value: rest.join(":").trim(),
  };
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function isConciseSellingLine(item: SellingLine, allowLong = false) {
  const text = `${item.label ? `${item.label}: ` : ""}${item.value}`.trim();
  if (text.length < 5 || text.length > (allowLong ? 700 : 180)) return false;
  if (/\b(hpt tech|mua hang|mua tai|lien he|giao hang|tra gop)\b/.test(normalizeText(text))) {
    return false;
  }
  return allowLong || (text.match(/[.!?]/g) || []).length <= 1;
}

function pickSellingSpecs(product: CatalogProduct): SellingLine[] {
  const allowLong = product.productType === "software";
  const sellingPoints = product.sellingPoints
    ?.map(splitSellingPoint)
    .filter((item) => item.value)
    .filter((item) => isConciseSellingLine(item, allowLong)) ?? [];

  const specs = product.specs ?? [];
  const preferred = [
    "cấu hình",
    "chức năng",
    "khổ giấy",
    "đảo mặt",
    "hai mặt",
    "adf",
    "giao tiếp",
    "kết nối",
    "thu phóng",
    "dùng mực",
    "tốc độ",
    "độ phân giải",
  ];
  const selected = preferred
    .map((keyword) =>
      specs.find((spec) => normalizeText(spec.label).includes(normalizeText(keyword))),
    )
    .filter((item): item is { label: string; value: string } => Boolean(item));

  const selectedSpecs: SellingLine[] = [];
  if (selected.length) {
    const seen = new Set<string>();
    selectedSpecs.push(
      ...selected
        .filter((item) => {
          const key = normalizeText(item.label);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((item) => ({ label: item.label, value: item.value }))
        .filter((item) => isConciseSellingLine(item, allowLong)),
    );
  }

  const merged = [...selectedSpecs, ...sellingPoints];
  if (merged.length) {
    const seen = new Set<string>();
    return merged
      .filter((item) => {
        const labelKey = normalizeText(item.label || "");
        const valueKey = normalizeText(item.value);
        const key = labelKey || valueKey;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 8);
  }

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

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function promoPrefix(product: CatalogProduct) {
  const start = formatDate(product.promoStart);
  const end = formatDate(product.promoEnd);
  if (start && end) return `Từ ${start} đến ${end}`;
  if (start) return `Từ ${start}`;
  if (end) return `Đến ${end}`;
  return "";
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
  const promo = product.promoText || "Ưu đãi sẽ được HPT Tech xác nhận khi liên hệ báo giá.";
  const promoRange = promoPrefix(product);

  return (
    <section className="overflow-hidden rounded-[20px] bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60">
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
          <Link href="/compare" className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-800">
            <Scale size={15} />
            So sánh
          </Link>
          {product.discountBadge ? (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-red-600">
              {product.discountBadge}
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-5 py-4 sm:px-6">
        <ProductSellingPoints items={sellingSpecs} />
      </div>

      <div className="bg-slate-100 px-5 py-5 sm:px-6">
        <div className="grid gap-3 text-sm sm:grid-cols-[150px_1fr]">
          <span className="font-semibold text-slate-700">Giá niêm yết:</span>
          <span className={product.compareAtPrice ? "font-semibold text-slate-400 line-through" : "text-slate-500"}>
            {product.compareAtPrice || "Chưa có giá niêm yết"}
          </span>

          <span className="font-semibold text-slate-700">Giá khuyến mại:</span>
          <div>
            <strong className="text-2xl font-bold text-red-600">{product.price || "Liên hệ"}</strong>
            <span className="ml-2 text-sm text-slate-500">
              {product.vatIncluded === true
                ? "[Giá đã có VAT]"
                : product.vatIncluded === false
                  ? "[Chưa gồm VAT]"
                  : schemaPrice
                    ? "[Giá đã có VAT]"
                    : "[Cần xác nhận VAT]"}
            </span>
            <div className="mt-2 flex gap-2 text-sm font-semibold leading-6 text-blue-700">
              <Gift size={17} className="mt-1 shrink-0 fill-orange-500 text-orange-500" />
              <span className="whitespace-pre-line">
                {promoRange ? `${promoRange} ${promo}` : promo}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <p className="text-sm">
          <strong>Bảo hành:</strong> {product.warranty || "Liên hệ xác nhận"}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <AddToCartButton
            product={product}
            label="Thêm vào giỏ"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-base font-semibold text-white transition-colors hover:bg-orange-700"
          />
          <div className="hidden">
            <a href={quoteHref}>Nhận báo giá</a>
          </div>
          <QuoteButton
            product={product}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0057FF] px-4 text-base font-semibold text-white transition-colors hover:bg-[#0049d8]"
          />
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-xl border-slate-200 bg-white text-slate-800 hover:border-[#2563EB]/45 hover:bg-[#2563EB]/5 hover:text-[#2563EB]"
          >
            <a href={phoneHref}>Tư vấn ngay</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
