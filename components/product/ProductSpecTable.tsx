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

const INITIAL_VISIBLE_COUNT = 10;

export function ProductSpecTable({ specs }: ProductSpecTableProps) {
  const [expanded, setExpanded] = useState(false);
  if (specs.length === 0) return null;

  const canExpand = specs.length > INITIAL_VISIBLE_COUNT;
  const visibleSpecs = expanded
    ? specs
    : specs.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <div>
      <div className="overflow-hidden rounded-[18px] bg-slate-50/80 ring-1 ring-slate-200/70">
        <table className="w-full text-sm">
          <tbody>
            {visibleSpecs.map((row, idx) => (
              <tr
                key={`${row.label}-${idx}`}
                className={cn(
                  "grid grid-cols-[160px_1fr] transition-colors sm:grid-cols-[200px_1fr]",
                  idx % 2 === 0 ? "bg-white/90" : "bg-slate-50/50",
                  "hover:bg-primary-600/[0.04]",
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

      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800"
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              Thu gọn
              <ChevronUp size={16} />
            </>
          ) : (
            <>
              Xem thêm ({specs.length - INITIAL_VISIBLE_COUNT})
              <ChevronDown size={16} />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
