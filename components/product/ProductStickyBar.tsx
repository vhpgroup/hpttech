"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Headset } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

interface ProductStickyBarProps {
  productName: string;
  price?: string;
  phone: string;
  quoteHref: string;
  phoneHref: string;
}

export function ProductStickyBar({
  productName,
  price,
  phone,
  quoteHref,
  phoneHref,
}: ProductStickyBarProps) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="h-px" />

      <div
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300",
          visible ? "translate-y-0 shadow-md opacity-100" : "-translate-y-full opacity-0",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{productName}</p>
            {price ? <p className="text-sm font-bold text-accent-600">{price}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={phoneHref}
              className="group hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-600/45 hover:bg-primary-600/5 hover:text-primary-600 sm:flex"
            >
              <Headset size={15} className="text-primary-600 transition-transform group-hover:scale-110" />
              {phone}
            </a>
            <Button
              asChild
              size="sm"
              variant="accent"
              leftIcon={<FileText size={16} className="text-white" />}
            >
              <a href={quoteHref}>
                Nhận báo giá
              </a>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
