"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { ProductCategoryNavItem } from "@/lib/catalog-payload";
import type { PublicBanner } from "@/lib/content-payload";
import CategoryPanel from "@/components/home/CategoryPanel";

const HERO_ROTATE_INTERVAL_MS = 2500;
const HERO_FADE_DURATION_MS = 600;
const HERO_IMAGE_SIZES = "(max-width: 980px) calc(100vw - 24px), 804px";
const PROMO_IMAGE_SIZES =
  "(max-width: 760px) calc(100vw - 24px), (max-width: 980px) calc((100vw - 34px) / 2), 386px";
const COMMERCIAL_ASSET_VERSION = "fb17d53";

function commercialAsset(path: string) {
  return `${path}?v=${COMMERCIAL_ASSET_VERSION}`;
}

type HomeHeroClientProps = {
  banners: PublicBanner[];
  categories: ProductCategoryNavItem[];
};

export default function HomeHeroClient({ banners, categories }: HomeHeroClientProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const [previousBanner, setPreviousBanner] = useState<number | null>(null);

  useEffect(() => {
    if (activeBanner < banners.length) return;
    setActiveBanner(0);
    setPreviousBanner(null);
  }, [activeBanner, banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBanner((prev) => {
        setPreviousBanner(prev);
        return (prev + 1) % banners.length;
      });
    }, HERO_ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (previousBanner === null || previousBanner === activeBanner) return;
    const timeout = setTimeout(() => {
      setPreviousBanner((current) => (current === previousBanner ? null : current));
    }, HERO_FADE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [activeBanner, previousBanner]);

  const nextBanner = banners.length > 1 ? (activeBanner + 1) % banners.length : activeBanner;
  const mountedIndexes = new Set<number>([activeBanner, nextBanner]);
  if (previousBanner !== null) {
    mountedIndexes.add(previousBanner);
  }

  return (
    <section className="hero-section">
      <CategoryPanel categories={categories} />

      <div className="hero-commerce-area">
        <section className="hero hero-banner" aria-label="Banner HPT Tech" style={{ position: "relative" }}>
          {banners.map((banner, index) => {
            if (!mountedIndexes.has(index)) return null;
            const isActive = index === activeBanner;

            return (
              <a
                key={index}
                className="hero-slide-link"
                href={banner?.link || "/"}
                target="_blank"
                rel="noreferrer"
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: isActive ? 1 : 0,
                  transition: `opacity ${HERO_FADE_DURATION_MS}ms ease-in-out`,
                  zIndex: isActive ? 1 : 0,
                  pointerEvents: isActive ? "auto" : "none",
                }}
              >
                {banner?.image ? (
                  <Image
                    src={banner.image}
                    alt={banner.title || "HPT Tech banner"}
                    width={804}
                    height={470}
                    sizes={HERO_IMAGE_SIZES}
                    quality={72}
                    priority={index === 0}
                  />
                ) : null}
              </a>
            );
          })}

          {banners.length > 1 ? (
            <div className="dots">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === activeBanner ? "active" : ""}`}
                  onClick={() => {
                    setPreviousBanner(activeBanner);
                    setActiveBanner(index);
                  }}
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
              src={commercialAsset("/assets/commercial-blocks/scanner.jpg")}
              alt="Commercial block máy scan"
              width={360}
              height={228}
              loading="lazy"
              sizes={PROMO_IMAGE_SIZES}
              quality={68}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).hidden = true;
              }}
            />
          </a>
          <a className="commercial-tile printer" href="/san-pham">
            <Image
              className="commercial-tile-image"
              src={commercialAsset("/assets/commercial-blocks/printer.jpg")}
              alt="Commercial block máy in"
              width={360}
              height={228}
              loading="lazy"
              sizes={PROMO_IMAGE_SIZES}
              quality={68}
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
              src={commercialAsset("/assets/commercial-blocks/office.jpg")}
              alt="Commercial block thiết bị văn phòng"
              width={386}
              height={190}
              loading="lazy"
              sizes={PROMO_IMAGE_SIZES}
              quality={68}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).hidden = true;
              }}
            />
          </a>
          <a className="commercial-tile solution" href="/giai-phap">
            <Image
              className="commercial-tile-image"
              src={commercialAsset("/assets/commercial-blocks/solution.jpg")}
              alt="Commercial block giải pháp"
              width={386}
              height={190}
              loading="lazy"
              sizes={PROMO_IMAGE_SIZES}
              quality={68}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).hidden = true;
              }}
            />
          </a>
          <a className="commercial-tile service" href="/dich-vu">
            <Image
              className="commercial-tile-image"
              src={commercialAsset("/assets/commercial-blocks/service.jpg")}
              alt="Commercial block dịch vụ"
              width={386}
              height={190}
              loading="lazy"
              sizes={PROMO_IMAGE_SIZES}
              quality={68}
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
