"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

type SellingLine = {
  label?: string;
  value: string;
};

type ProductSellingPointsProps = {
  items: SellingLine[];
};

const INITIAL_VISIBLE_COUNT = 5;

export function ProductSellingPoints({ items }: ProductSellingPointsProps) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = items.length > INITIAL_VISIBLE_COUNT;
  const visibleItems = expanded
    ? items
    : items.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <div>
      <div className="space-y-2">
        {visibleItems.map((spec) => (
          <div
            key={`${spec.label || ""}-${spec.value}`}
            className="flex gap-2 text-sm leading-6 text-slate-700"
          >
            <CheckCircle2
              size={17}
              className="mt-1 shrink-0 fill-accent-500 text-white"
            />
            <span>
              {spec.label ? (
                <>
                  <strong className="font-semibold text-slate-950">
                    {spec.label}:
                  </strong>{" "}
                  {spec.value}
                </>
              ) : (
                spec.value
              )}
            </span>
          </div>
        ))}
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
              Xem thêm ({items.length - INITIAL_VISIBLE_COUNT})
              <ChevronDown size={16} />
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}
