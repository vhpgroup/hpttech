"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus, Star } from "lucide-react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import type { CatalogProduct } from "@/lib/catalog";
import { cn } from "@/lib/cn";

type ProductCardProps = {
  product: CatalogProduct;
  className?: string;
  isComparing?: boolean;
  onCompare?: (product: CatalogProduct) => void;
};

const SPEC_PRESETS: Record<string, string[]> = {
  printer: ["toc do", "duplex", "2 mat", "adf", "ket noi", "wifi", "lan", "usb"],
  scanner: ["toc do", "adf", "phan giai", "ket noi", "wifi", "lan", "usb"],
  copier: ["toc do", "kho giay", "duplex", "2 mat", "adf", "ket noi"],
  general: ["toc do", "hieu suat", "ket noi", "bao hanh"],
};

function normalizeText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function productType(product: CatalogProduct) {
  const text = normalizeText(`${product.category || ""} ${product.title}`);
  if (text.includes("scan")) return "scanner";
  if (text.includes("photo") || text.includes("copier")) return "copier";
  if (text.includes("may in") || text.includes("printer") || text.includes("laserjet")) return "printer";
  return "general";
}

function compactSpecLabel(label: string) {
  const normalized = normalizeText(label);
  if (normalized.includes("toc do") && normalized.includes("scan")) return "Tốc độ scan";
  if (normalized.includes("toc do") && normalized.includes("in")) return "Tốc độ in";
  if (normalized.includes("phan giai")) return "Độ phân giải";
  if (normalized.includes("ket noi")) return "Kết nối";
  if (normalized.includes("duplex") || normalized.includes("2 mat")) return "2 mặt";
  if (normalized.includes("kho giay")) return "Khổ giấy";
  if (normalized.includes("bao hanh")) return "Bảo hành";
  return label;
}

function pickFeaturedSpecs(product: CatalogProduct) {
  const specs = (product.specs || []).filter((spec) => spec.label?.trim() && spec.value?.trim());
  const priority = SPEC_PRESETS[productType(product)];
  const picked: CatalogProduct["specs"] = [];
  const used = new Set<string>();

  for (const pattern of priority) {
    const match = specs.find((spec) => {
      const key = `${normalizeText(spec.label)}:${normalizeText(spec.value)}`;
      return !used.has(key) && normalizeText(spec.label).includes(pattern);
    });
    if (!match) continue;

    used.add(`${normalizeText(match.label)}:${normalizeText(match.value)}`);
    picked.push(match);
    if (picked.length === 4) break;
  }

  for (const spec of specs) {
    if (picked.length === 4) break;
    const key = `${normalizeText(spec.label)}:${normalizeText(spec.value)}`;
    if (used.has(key)) continue;
    used.add(key);
    picked.push(spec);
  }

  return picked.slice(0, 4).map((spec) => ({
    label: compactSpecLabel(spec.label),
    value: spec.value,
  }));
}

function stockLabel(stockStatus?: string) {
  if (stockStatus === "out_of_stock") return { label: "Hết hàng", className: "text-red-600" };
  if (stockStatus === "preorder") return { label: "Đặt trước", className: "text-amber-600" };
  return { label: "Còn hàng", className: "text-green-600" };
}

function productHref(product: CatalogProduct) {
  return product.slug ? `/san-pham/${product.slug}` : product.href || "/san-pham";
}

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

function ProductRating({ rating = 0, reviewCount = 0 }: { rating?: number; reviewCount?: number }) {
  const score = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;

  return (
    <div className="mt-1.5 flex items-center gap-1">
      <div className="flex items-center gap-0.5" aria-label={`${score} trên 5 sao`}>
        {Array.from({ length: 5 }, (_, index) => {
          const active = index + 1 <= Math.round(score);
          return (
            <Star
              key={index}
              size={16}
              className={active ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
      <span className="text-sm text-slate-600">({reviewCount || 0})</span>
    </div>
  );
}

export function ProductCard({ product, className, isComparing = false, onCompare }: ProductCardProps) {
  const href = productHref(product);
  const image = product.images?.[0]?.url || product.image;
  const specs = pickFeaturedSpecs(product);
  const stock = stockLabel(product.stockStatus);
  const compareHref = `/compare?products=${encodeURIComponent(productKey(product))}`;

  return (
    <article
      className={cn(
        "group relative flex min-h-[452px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <Link href={href} className="relative grid h-[198px] place-items-center rounded-md bg-white p-2">
        {image ? (
          <Image
            src={image}
            alt={product.title}
            width={260}
            height={190}
            className="max-h-[150px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 45vw, (max-width: 1280px) 25vw, 240px"
          />
        ) : (
          <div className="h-28 w-full rounded-md bg-slate-100" />
        )}
      </Link>

      {specs.length ? (
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          {specs.map((spec) => (
            <div key={`${spec.label}-${spec.value}`} className="rounded-md border border-blue-100 bg-blue-50/70 px-1.5 py-1">
              <p className="truncate text-[9px] font-semibold leading-3 text-blue-600">{spec.label}</p>
              <p className="truncate text-[10px] font-bold leading-3 text-slate-700">{spec.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-1 flex-col">
        <h3 className="line-clamp-2 min-h-[42px] text-[15px] font-bold leading-[21px] text-slate-950">
          <Link href={href} className="hover:text-blue-700">
            {product.title}
          </Link>
        </h3>

        <ProductRating rating={product.rating} reviewCount={product.reviewCount} />

        {product.sku ? <p className="mt-1.5 text-sm text-slate-700">Mã SP: {product.sku}</p> : null}

        <div className="mt-2 min-h-[58px]">
          {product.compareAtPrice ? (
            <p className="text-sm font-medium text-slate-400 line-through">{product.compareAtPrice}</p>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <strong className="text-[22px] font-extrabold leading-7 text-red-600">{product.price || "Liên hệ"}</strong>
            {product.discountBadge ? (
              <span className="shrink-0 rounded-md bg-red-600 px-2 py-1 text-xs font-extrabold text-white">
                {product.discountBadge}
              </span>
            ) : null}
          </div>
          {product.promoText ? <p className="mt-1 text-sm text-slate-700">1 khuyến mại</p> : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm font-medium">
            {onCompare ? (
              <button
                type="button"
                className={cn("inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700", isComparing && "font-bold")}
                onClick={() => onCompare(product)}
              >
                <Plus size={14} />
                {isComparing ? "Đã chọn" : "So sánh"}
              </button>
            ) : (
              <Link href={compareHref} className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700">
                <Plus size={14} />
                So sánh
              </Link>
            )}
            <span className={cn("inline-flex items-center gap-0.5", stock.className)}>
              <Check size={14} strokeWidth={3} />
              {stock.label}
            </span>
          </div>
          <AddToCartButton
            product={product}
            label=""
            ariaLabel={`Thêm ${product.title} vào giỏ`}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700"
          />
        </div>
      </div>
    </article>
  );
}
