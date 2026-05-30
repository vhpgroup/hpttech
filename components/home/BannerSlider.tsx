"use client";

import { useEffect, useState } from "react";

type BannerSliderProps = {
  banners: string[];
};

export default function BannerSlider({ banners }: BannerSliderProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;

    const timer = window.setInterval(() => {
      setActiveBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [banners.length, paused]);

  if (!banners.length) return null;

  return (
    <section
      className="hero hero-banner"
      aria-label="Banner HPT Tech"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-slider-track">
        {banners.map((banner, index) => (
          <a
            key={banner}
            className={`hero-slide-link ${index === activeBanner ? "active" : ""}`}
            href="https://hpttech.vn/"
            target="_blank"
            rel="noreferrer"
            aria-hidden={index === activeBanner ? undefined : true}
            tabIndex={index === activeBanner ? 0 : -1}
          >
            <img
              id={index === activeBanner ? "heroBannerImage" : undefined}
              src={banner}
              alt={index === activeBanner ? "HPT Tech banner" : ""}
            />
          </a>
        ))}
      </div>

      <div className="dots">
        {banners.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`dot ${index === activeBanner ? "active" : ""}`}
            onClick={() => setActiveBanner(index)}
            aria-label={`Đi tới slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
