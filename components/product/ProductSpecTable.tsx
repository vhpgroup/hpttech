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
}

const INITIAL_VISIBLE = 8;

export function ProductSpecTable({ specs }: ProductSpecTableProps) {
  const [expanded, setExpanded] = useState(false);

  if (specs.length === 0) return null;

  const visibleRows = expanded ? specs : specs.slice(0, INITIAL_VISIBLE);
  const hasMore = specs.length > INITIAL_VISIBLE;

  return (
    <div>
      <div className="overflow-hidden rounded-[18px] bg-slate-50/80 ring-1 ring-slate-200/70">
        <table className="w-full text-sm">
          <tbody>
            {visibleRows.map((row, idx) => (
              <tr
                key={`${row.label}-${idx}`}
                className={cn(
                  "grid grid-cols-[160px_1fr] transition-colors sm:grid-cols-[200px_1fr]",
                  idx % 2 === 0 ? "bg-white/90" : "bg-slate-50/50",
                  "hover:bg-[#0057FF]/[0.04]",
                )}
              >
                <td className="border-r border-slate-200/60 px-4 py-3 font-medium text-slate-500">
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

      {hasMore ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          {expanded ? (
            <>
              <ChevronUp size={15} /> Thu gọn thông số
            </>
          ) : (
            <>
              <ChevronDown size={15} /> Xem thêm {specs.length - INITIAL_VISIBLE} thông số
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
