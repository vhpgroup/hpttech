"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type BannerSliderProps = {
  banners: string[];
};

export default function BannerSlider({ banners }: BannerSliderProps) {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  const prevBanner = () => setActiveBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const nextBanner = () => setActiveBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  if (!banners.length) return null;

  return (
    <section className="hero hero-banner" aria-label="Banner HPT Tech">
      <button className="slider-btn prev" onClick={prevBanner} aria-label="Slide trước">
        <ChevronLeft size={24} />
      </button>

      <a className="hero-slide-link" href="https://hpttech.vn/" target="_blank" rel="noreferrer">
        <img id="heroBannerImage" src={banners[activeBanner]} alt="HPT Tech banner" />
      </a>

      <button className="slider-btn next" onClick={nextBanner} aria-label="Slide sau">
        <ChevronRight size={24} />
      </button>

      <div className="dots">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === activeBanner ? "active" : ""}`}
            onClick={() => setActiveBanner(index)}
            aria-label={`Đi tới slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
