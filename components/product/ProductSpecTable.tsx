"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";

interface Spec {
  label: string;
  value: string;
}

interface ProductSpecTableProps {
  specs: Spec[];
  brand?: string;
  category?: string;
  warranty?: string;
  origin?: string;
  sku?: string;
}

const INITIAL_VISIBLE = 8;

export function ProductSpecTable({
  specs,
  brand,
  category,
  warranty,
  origin,
  sku,
}: ProductSpecTableProps) {
  const [expanded, setExpanded] = useState(false);

  const allRows: Spec[] = [
    ...(brand ? [{ label: "Thương hiệu", value: brand }] : []),
    ...(category ? [{ label: "Danh mục", value: category }] : []),
    ...(sku ? [{ label: "Mã SKU", value: sku }] : []),
    ...(warranty ? [{ label: "Bảo hành", value: warranty }] : []),
    ...(origin ? [{ label: "Xuất xứ", value: origin }] : []),
    ...specs,
  ];

  if (allRows.length === 0) return null;

  const visibleRows = expanded ? allRows : allRows.slice(0, INITIAL_VISIBLE);
  const hasMore = allRows.length > INITIAL_VISIBLE;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <tbody>
            {visibleRows.map((row, idx) => (
              <tr
                key={idx}
                className={cn(
                  "grid grid-cols-[180px_1fr] transition-colors",
                  idx % 2 === 0 ? "bg-white" : "bg-slate-50/60",
                  "hover:bg-primary-50/40"
                )}
              >
                <td className="border-r border-slate-100 px-4 py-3 font-medium text-slate-500">
                  {row.label}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-primary-400 hover:text-primary-600"
        >
          {expanded ? (
            <>
              <ChevronUp size={15} /> Thu gọn thông số
            </>
          ) : (
            <>
              <ChevronDown size={15} /> Xem thêm {allRows.length - INITIAL_VISIBLE} thông số
            </>
          )}
        </button>
      )}
    </div>
  );
}
