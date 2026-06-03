"use client";

import { useState } from "react";
import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";

interface ProductImageGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const hasMultiple = images.length > 1;
  const activeImage = images[activeIndex];

  if (!activeImage) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-[20px] bg-slate-50 text-slate-300">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      {hasMultiple ? (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:max-h-[560px] lg:w-[84px] lg:flex-col lg:overflow-y-auto lg:pb-0">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Xem ảnh ${idx + 1}`}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-50 transition-all duration-200 lg:h-[84px] lg:w-[84px]",
                activeIndex === idx
                  ? "ring-2 ring-[#0057FF] shadow-[0_12px_28px_-18px_rgba(0,87,255,0.55)]"
                  : "ring-1 ring-slate-200/70 hover:ring-slate-300",
              )}
            >
              <Image
                src={img.url}
                alt={img.alt || `${productName} ${idx + 1}`}
                fill
                className="object-contain p-2"
                sizes="84px"
              />
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="group relative order-1 flex-1 overflow-hidden rounded-[20px] bg-slate-50"
        style={{ aspectRatio: "1 / 1" }}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          className={cn("object-contain p-8 transition-transform duration-500 ease-out", isZoomed && "scale-110")}
          sizes="(max-width: 1024px) 100vw, 640px"
          priority
        />
        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-500 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <ZoomIn size={16} />
        </div>
        {hasMultiple ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </div>
        ) : null}
      </div>
    </div>
  );
}
