"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ExternalLink, X } from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { useQuote } from "@/components/quote/QuoteProvider";
import type { CartProductInput } from "@/lib/cart";
import type { CatalogProduct } from "@/lib/catalog";
import { cn } from "@/lib/cn";

export type CompareRow = {
  label: string;
  values: string[];
  /** Mọi sản phẩm đều có giá trị và giống hệt nhau — ứng viên để ẩn khi "chỉ hiện khác biệt". */
  same: boolean;
  /** Chỉ 0–1 sản phẩm có dữ liệu — ẩn mặc định để bảng không tràn ô trống. */
  sparse: boolean;
};

export type CompareGroup = {
  name: string;
  rows: CompareRow[];
};

export type CompareItem = {
  key: string;
  title: string;
  slug: string;
  href: string;
  image: string;
  price: string;
  compareAtPrice: string;
  cart: CartProductInput | null;
  /** Sản phẩm chưa có giá — payload mở Quote Builder (popup báo giá nhanh có sẵn của site). */
  quote: CatalogProduct | null;
};

type CompareTableClientProps = {
  items: CompareItem[];
  groups: CompareGroup[];
};

function ToggleSwitch({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2 text-xs font-semibold text-slate-600">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-slate-300 transition peer-checked:bg-red-600 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" />
      <span>{children}</span>
    </label>
  );
}

export default function CompareTableClient({ items, groups }: CompareTableClientProps) {
  const { openQuote } = useQuote();
  const [diffOnly, setDiffOnly] = useState(false);
  const [showSparse, setShowSparse] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const sparseCount = useMemo(
    () => groups.reduce((count, group) => count + group.rows.filter((row) => row.sparse).length, 0),
    [groups],
  );
  const totalRows = useMemo(
    () => groups.reduce((count, group) => count + group.rows.length, 0),
    [groups],
  );

  const isRowVisible = (row: CompareRow) => !(diffOnly && row.same) && (showSparse || !row.sparse);
  const visibleTotal = groups.reduce(
    (count, group) => count + group.rows.filter(isRowVisible).length,
    0,
  );

  const gridStyle: CSSProperties = {
    gridTemplateColumns: `minmax(150px, 190px) repeat(${items.length}, minmax(190px, 1fr))`,
  };

  const removeHref = (key: string) => {
    const rest = items.filter((item) => item.key !== key).map((item) => item.slug || item.key);
    return `/compare?products=${encodeURIComponent(rest.join(","))}`;
  };

  return (
    <div className="rounded-2xl border border-border bg-white max-lg:overflow-x-auto">
      <div className="min-w-[720px]">
        {/* Hàng sản phẩm + giá + CTA — ghim khi cuộn để so tới đâu mua được tới đó */}
        <div className="sticky top-0 z-20 grid border-b border-border bg-white" style={gridStyle}>
          <div className="flex flex-col justify-end gap-3 border-r border-border p-4">
            <ToggleSwitch checked={diffOnly} onChange={setDiffOnly}>
              Chỉ hiện khác biệt
            </ToggleSwitch>
            <ToggleSwitch checked={showSparse} onChange={setShowSparse}>
              Hiện hàng thiếu dữ liệu ({sparseCount})
            </ToggleSwitch>
            <p className="text-[11px] text-slate-400">
              {visibleTotal}/{totalRows} thuộc tính đang hiển thị
            </p>
          </div>

          {items.map((item) => (
            <div key={item.key} className="relative flex flex-col gap-2 border-r border-border p-4 last:border-r-0">
              {items.length > 2 ? (
                <Link
                  href={removeHref(item.key)}
                  aria-label={`Bỏ ${item.title} khỏi so sánh`}
                  title="Bỏ khỏi so sánh"
                  className="absolute right-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full border border-border bg-white text-slate-400 transition hover:border-red-600 hover:text-red-600"
                >
                  <X size={12} />
                </Link>
              ) : null}

              <Link href={item.href} className="flex h-20 items-center justify-center">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={120}
                    height={80}
                    sizes="120px"
                    className="max-h-20 w-auto object-contain"
                  />
                ) : null}
              </Link>

              <Link
                href={item.href}
                className="line-clamp-2 min-h-[36px] text-[13px] font-semibold leading-[18px] text-slate-900 hover:text-red-600"
              >
                {item.title}
              </Link>

              <div className="flex items-baseline gap-2">
                <strong className="text-base font-extrabold text-red-600">{item.price || "Liên hệ"}</strong>
                {item.compareAtPrice ? (
                  <s className="text-[11px] text-slate-400">{item.compareAtPrice}</s>
                ) : null}
              </div>

              {item.cart ? (
                <AddToCartButton
                  product={item.cart}
                  label="Thêm vào giỏ"
                  ariaLabel={`Thêm ${item.title} vào giỏ`}
                  className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 text-xs font-semibold text-white transition hover:bg-red-700"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => (item.quote ? openQuote(item.quote) : undefined)}
                  className="flex h-9 w-full items-center justify-center rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 transition hover:border-red-600 hover:text-red-600"
                >
                  Nhận báo giá nhanh
                </button>
              )}

              <Link
                href={item.href}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 hover:underline"
              >
                Xem chi tiết <ExternalLink size={11} />
              </Link>
            </div>
          ))}
        </div>

        {/* Thuộc tính nhóm theo chủ đề thay vì một danh sách phẳng xếp alphabet */}
        {groups.map((group) => {
          const rows = group.rows.filter(isRowVisible);
          const isCollapsed = Boolean(collapsed[group.name]);

          return (
            <section key={group.name}>
              <button
                type="button"
                onClick={() => setCollapsed((prev) => ({ ...prev, [group.name]: !prev[group.name] }))}
                className="flex w-full items-center gap-2 border-b border-border bg-surface px-4 py-2.5 text-left text-[13px] font-bold text-ink"
              >
                <ChevronDown size={15} className={cn("shrink-0 transition-transform", isCollapsed && "-rotate-90")} />
                {group.name}
                <span className="ml-auto text-[11px] font-medium text-slate-400">
                  {rows.length}/{group.rows.length} thuộc tính
                </span>
              </button>

              {!isCollapsed
                ? rows.map((row) => (
                    <div key={row.label} className="grid border-b border-border" style={gridStyle}>
                      <div className="border-r border-border bg-surface px-4 py-2.5 text-[13px] font-semibold text-slate-600">
                        {row.label}
                      </div>
                      {row.values.map((value, index) => (
                        <div
                          key={`${row.label}-${index}`}
                          className="border-r border-border px-4 py-2.5 text-[13px] text-slate-700 last:border-r-0"
                        >
                          {value.trim() ? value : <span className="text-slate-300">—</span>}
                        </div>
                      ))}
                    </div>
                  ))
                : null}
            </section>
          );
        })}

        {!showSparse && sparseCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-xs text-slate-500">
            <span>Đã ẩn {sparseCount} hàng chỉ có dữ liệu ở 1 sản phẩm để bảng gọn hơn.</span>
            <button
              type="button"
              onClick={() => setShowSparse(true)}
              className="font-semibold text-red-600 underline underline-offset-2 hover:text-red-700"
            >
              Hiện các hàng này
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
