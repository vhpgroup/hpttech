"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { ZoomIn } from "lucide-react";

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
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
        style={{ aspectRatio: "1 / 1" }}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          className={cn(
            "object-contain p-6 transition-transform duration-500 ease-out",
            isZoomed && "scale-110"
          )}
          sizes="(max-width: 768px) 100vw, 480px"
          priority
        />
        {/* Zoom hint */}
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-500 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <ZoomIn size={15} />
        </div>
        {/* Image counter */}
        {hasMultiple && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Xem ảnh ${idx + 1}`}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-slate-50 transition-all duration-200",
                activeIndex === idx
                  ? "border-primary-600 shadow-sm"
                  : "border-transparent hover:border-slate-300"
              )}
            >
              <Image
                src={img.url}
                alt={img.alt || `${productName} ${idx + 1}`}
                fill
                className="object-contain p-1"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
