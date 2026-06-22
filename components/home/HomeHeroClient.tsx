"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { ProductCategoryNavItem } from "@/lib/catalog-payload";
import type { PublicBanner } from "@/lib/content-payload";
import CategoryPanel from "@/components/home/CategoryPanel";

type HomeHeroClientProps = {
  banners: PublicBanner[];
  categories: ProductCategoryNavItem[];
};

export default function HomeHeroClient({ banners, categories }: HomeHeroClientProps) {
  const [activeBanner, setActiveBanner] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <section className="hero-section">
      <CategoryPanel categories={categories} />

      <div className="hero-commerce-area">
        <section className="hero hero-banner" aria-label="Banner HPT Tech" style={{ position: "relative" }}>
          {banners.map((banner, index) => (
            <a
              key={index}
              className="hero-slide-link"
              href={banner?.link || "/"}
              target="_blank"
              rel="noreferrer"
              style={{
                position: "absolute",
                inset: 0,
                opacity: index === activeBanner ? 1 : 0,
                transition: "opacity 0.6s ease-in-out",
                zIndex: index === activeBanner ? 1 : 0,
                pointerEvents: index === activeBanner ? "auto" : "none",
              }}
            >
              {banner?.image ? (
                <Image
                  src={banner.image}
                  alt={banner.title || "HPT Tech banner"}
                  width={804}
                  height={470}
                  priority={index === 0}
                />
              ) : null}
            </a>
          ))}

          {banners.length > 1 ? (
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
          ) : null}
        </section>

        <aside className="commercial-stack" aria-label="Ưu đãi nhanh">
          <a className="commercial-tile scanner" href="/san-pham">
            <Image
              className="commercial-tile-image"
              src="/assets/commercial-blocks/scanner.jpg"
              alt="Commercial block máy scan"
              width={360}
              height={228}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).hidden = true;
              }}
            />
          </a>
          <a className="commercial-tile printer" href="/san-pham">
            <Image
              className="commercial-tile-image"
              src="/assets/commercial-blocks/printer.jpg"
              alt="Commercial block máy in"
              width={360}
              height={228}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).hidden = true;
              }}
            />
          </a>
        </aside>

        <section className="commercial-row" aria-label="Khuyến mãi thương mại HPT Tech">
          <a className="commercial-tile office" href="/san-pham">
            <Image
              className="commercial-tile-image"
              src="/assets/commercial-blocks/office.jpg"
              alt="Commercial block thiết bị văn phòng"
              width={386}
              height={190}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).hidden = true;
              }}
            />
          </a>
          <a className="commercial-tile solution" href="/giai-phap">
            <Image
              className="commercial-tile-image"
              src="/assets/commercial-blocks/solution.jpg"
              alt="Commercial block giải pháp"
              width={386}
              height={190}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).hidden = true;
              }}
            />
          </a>
          <a className="commercial-tile service" href="/dich-vu">
            <Image
              className="commercial-tile-image"
              src="/assets/commercial-blocks/service.jpg"
              alt="Commercial block dịch vụ"
              width={386}
              height={190}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).hidden = true;
              }}
            />
          </a>
        </section>
      </div>
    </section>
  );
}
