"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/cn";

interface ProductImageGalleryProps {
  images: Array<{ url: string; alt?: string }>;
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasMultiple = images.length > 1;
  const activeImage = images[activeIndex];

  const goTo = useCallback((index: number) => {
    const next = (index + images.length) % images.length;
    setActiveIndex(next);
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, goTo, lightboxOpen]);

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
      {images.length ? (
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
        className="group relative order-1 h-[360px] flex-1 overflow-hidden rounded-[20px] bg-slate-50 sm:h-[400px] xl:h-[460px]"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
      >
        <button type="button" className="absolute inset-0 z-10" aria-label="Mở ảnh lớn" onClick={() => setLightboxOpen(true)} />
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          className={cn("object-contain p-5 transition-transform duration-500 ease-out sm:p-6", isZoomed && "scale-105")}
          sizes="(max-width: 1024px) 100vw, 520px"
          priority
        />
        <button
          type="button"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-slate-500 shadow-sm backdrop-blur-sm transition-colors duration-200 hover:bg-white"
          aria-label="Phóng to ảnh"
          onClick={() => setLightboxOpen(true)}
        >
          <ZoomIn size={16} />
        </button>
        {hasMultiple ? (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </div>
        ) : null}
      </div>

      {lightboxOpen && typeof document !== "undefined" ? createPortal((
        <div className="fixed inset-0 z-[9999] h-screen w-screen bg-slate-950/92 p-3 text-white sm:p-4" role="dialog" aria-modal="true" aria-label={`Ảnh sản phẩm ${productName}`}>
          <button type="button" className="absolute inset-0" aria-label="Đóng ảnh lớn" onClick={() => setLightboxOpen(false)} />
          <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{productName}</p>
                <p className="text-xs text-white/60">{activeIndex + 1} / {images.length}</p>
              </div>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Đóng" onClick={() => setLightboxOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-white/5 p-3 sm:p-4">
              <Image
                src={activeImage.url}
                alt={activeImage.alt || productName}
                width={760}
                height={520}
                className="h-auto max-h-[calc(100vh-150px)] w-[min(82vw,760px)] object-contain"
                sizes="(max-width: 768px) 82vw, 760px"
              />
              {hasMultiple ? (
                <>
                  <button type="button" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white hover:bg-white/24" aria-label="Ảnh trước" onClick={() => goTo(activeIndex - 1)}>
                    <ChevronLeft size={24} />
                  </button>
                  <button type="button" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white hover:bg-white/24" aria-label="Ảnh sau" onClick={() => goTo(activeIndex + 1)}>
                    <ChevronRight size={24} />
                  </button>
                </>
              ) : null}
            </div>

            {hasMultiple ? (
              <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Xem ảnh ${idx + 1}`}
                    onClick={() => setActiveIndex(idx)}
                    className={cn(
                      "relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-white/10",
                      activeIndex === idx ? "ring-2 ring-white" : "opacity-70 hover:opacity-100",
                    )}
                  >
                    <Image src={img.url} alt={img.alt || `${productName} ${idx + 1}`} fill className="object-contain p-1" sizes="56px" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ), document.body) : null}
    </div>
  );
}
