"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

export type ProductDetailTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type ProductDetailTabsProps = {
  sections: ProductDetailTab[];
};

export function ProductDetailTabs({ sections }: ProductDetailTabsProps) {
  const availableSections = useMemo(
    () => sections.filter((section) => section.content !== null && section.content !== undefined),
    [sections],
  );
  const [activeTab, setActiveTab] = useState(availableSections[0]?.id ?? "");

  if (!availableSections.length) return null;

  return (
    <section className="rounded-[20px] bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:p-5 lg:p-6">
      <div className="scrollbar-none -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {availableSections.map((section) => {
          const isActive = section.id === activeTab;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveTab(section.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary-600 text-white shadow-[0_10px_24px_-16px_rgba(37,99,235,0.65)]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
              )}
              aria-selected={isActive}
              aria-controls={`product-tab-panel-${section.id}`}
              role="tab"
            >
              {section.label}
            </button>
          );
        })}
      </div>

      {availableSections.map((section) => {
        const isActive = section.id === activeTab;

        return (
          <div
            key={section.id}
            id={`product-tab-panel-${section.id}`}
            role="tabpanel"
            hidden={!isActive}
            className={cn(!isActive && "hidden")}
          >
            {section.content}
          </div>
        );
      })}
    </section>
  );
}
