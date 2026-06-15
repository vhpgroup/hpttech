"use client";

import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import type { ProductPromotion } from "@/lib/catalog";

function isExternalLink(href: string) {
  return /^https?:\/\//i.test(href);
}

export default function ProductPromotionsPanel({
  promotions,
}: {
  promotions: ProductPromotion[];
}) {
  if (!promotions.length) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
      <header className="flex items-center gap-2 bg-gradient-to-r from-[#E32929] to-[#FF6A00] px-4 py-3 text-white">
        <Gift size={20} strokeWidth={2.4} />
        <h2 className="text-lg font-black uppercase tracking-wide">Khuyến mại</h2>
        <span className="ml-auto rounded-full bg-white/20 px-2.5 py-1 text-sm font-bold">
          {promotions.length} ưu đãi
        </span>
      </header>

      <div className="space-y-2 bg-gradient-to-b from-red-50/70 to-white p-3 sm:p-4">
        {promotions.map((promotion) => (
          <article
            key={promotion.id}
            className={[
              "group rounded-r-lg border-y border-r bg-white/85 px-3 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-md",
              promotion.kind === "monthly"
                ? "border-l-[3px] border-blue-100 border-l-blue-200"
                : "border-l-[3px] border-orange-100 border-l-orange-200",
            ].join(" ")}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <h3 className="min-w-0 flex-1 text-[15px] font-black leading-6 text-[#D71920] sm:text-base">
                {promotion.title}
                {promotion.benefits?.length ? (
                  <span className="ml-1.5 font-semibold text-slate-700">
                    - {promotion.benefits.join(" • ")}
                  </span>
                ) : null}
              </h3>

              {promotion.ctaHref && promotion.ctaLabel ? (
                isExternalLink(promotion.ctaHref) ? (
                  <a
                    href={promotion.ctaHref}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="promotion-cta-gradient inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-black !text-white shadow-sm"
                  >
                    Xem ngay
                    <ArrowRight size={13} />
                  </a>
                ) : (
                  <Link
                    href={promotion.ctaHref}
                    className="promotion-cta-gradient inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-xs font-black !text-white shadow-sm"
                  >
                    Xem ngay
                    <ArrowRight size={13} />
                  </Link>
                )
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
