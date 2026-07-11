"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductCategoryNavItem } from "@/lib/catalog-payload";
import type { PublicBanner } from "@/lib/content-payload";
import CategoryPanel from "@/components/home/CategoryPanel";

const HERO_ROTATE_INTERVAL_MS = 2500;
const HERO_FADE_DURATION_MS = 600;
const HERO_IMAGE_SIZES = "(max-width: 980px) calc(100vw - 24px), 804px";
const PROMO_IMAGE_SIZES =
  "(max-width: 760px) calc(100vw - 24px), (max-width: 980px) calc((100vw - 34px) / 2), 386px";
const COMMERCIAL_ASSET_VERSION = "fb17d53";
const HERO_BANNER_LANDING_HREFS = [
  "/landing/herobanner1",
  "/landing/herobanner2",
  "/landing/herobanner3",
  "/landing/herobanner4",
  "/landing/epson-ds-870",
  "/landing/microtek-xt6060",
  "/landing/microtek-s6570",
  "/landing/xerox-d35wn",
  "/landing/epson-ds-790wn",
];

type CommercialTile = {
  className: string;
  href: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

type HomeHeroClientProps = {
  banners: PublicBanner[];
  categories: ProductCategoryNavItem[];
};

function commercialAsset(path: string) {
  return `${path}?v=${COMMERCIAL_ASSET_VERSION}`;
}

const COMMERCIAL_STACK_TILES: CommercialTile[] = [
  {
    className: "commercial-tile scanner",
    href: "/landing/epson-ds-870",
    src: commercialAsset("/assets/commercial-blocks/scanner.jpg"),
    alt: "Landing page máy quét Epson DS-870",
    width: 360,
    height: 228,
  },
  {
    className: "commercial-tile printer",
    href: "/landing/microtek-xt6060",
    src: commercialAsset("/assets/commercial-blocks/printer.jpg"),
    alt: "Landing page máy quét Microtek XT6060",
    width: 360,
    height: 228,
  },
];

const COMMERCIAL_ROW_TILES: CommercialTile[] = [
  {
    className: "commercial-tile office",
    href: "/landing/microtek-s6570",
    src: commercialAsset("/assets/commercial-blocks/office.jpg"),
    alt: "Landing page máy quét Microtek S6570",
    width: 386,
    height: 190,
  },
  {
    className: "commercial-tile solution",
    href: "/landing/xerox-d35wn",
    src: commercialAsset("/assets/commercial-blocks/solution.jpg"),
    alt: "Landing page máy quét Xerox D35wn",
    width: 386,
    height: 190,
  },
  {
    className: "commercial-tile service",
    href: "/landing/epson-ds-790wn",
    src: commercialAsset("/assets/commercial-blocks/service.jpg"),
    alt: "Landing page máy quét Epson DS-790WN",
    width: 386,
    height: 190,
  },
];

function CommercialTileImage({ tile }: { tile: CommercialTile }) {
  return (
    <Link className={tile.className} href={tile.href}>
      <Image
        className="commercial-tile-image"
        src={tile.src}
        alt={tile.alt}
        width={tile.width}
        height={tile.height}
        loading="lazy"
        sizes={PROMO_IMAGE_SIZES}
        quality={68}
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
    </Link>
  );
}

function getHeroBannerLandingHref(banner: PublicBanner | undefined, index: number) {
  const configuredLink = banner?.link?.trim();
  const haystack = [
    banner?.image,
    banner?.title,
    banner?.subtitle,
    configuredLink,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (haystack.includes("herobanner1")) return "/landing/herobanner1";
  if (
    haystack.includes("mua-may-in") ||
    haystack.includes("may-in") ||
    haystack.includes("printer")
  ) {
    return "/landing/herobanner1";
  }
  if (haystack.includes("herobanner2")) return "/landing/herobanner2";
  if (
    haystack.includes("tenveo") ||
    haystack.includes("conference") ||
    haystack.includes("hoi-nghi") ||
    haystack.includes("hoi nghi")
  ) {
    return "/landing/herobanner2";
  }
  if (haystack.includes("herobanner3")) return "/landing/herobanner3";
  if (haystack.includes("herobanner4")) return "/landing/herobanner4";
  if (
    haystack.includes("hpt-solutions") ||
    haystack.includes("ha-tang") ||
    haystack.includes("solutions")
  ) {
    return "/landing/herobanner4";
  }
  if (
    haystack.includes("hpt-technology") ||
    haystack.includes("technology") ||
    haystack.includes("cong-nghe")
  ) {
    return "/landing/herobanner3";
  }

  if (configuredLink?.startsWith("/landing/")) {
    return configuredLink;
  }

  if (haystack.includes("ds-870") || haystack.includes("ds870")) {
    return "/landing/epson-ds-870";
  }
  if (haystack.includes("xt6060") || haystack.includes("xt-6060")) {
    return "/landing/microtek-xt6060";
  }
  if (haystack.includes("s6570")) return "/landing/microtek-s6570";
  if (haystack.includes("d35wn") || haystack.includes("d35")) {
    return "/landing/xerox-d35wn";
  }
  if (
    haystack.includes("790wn") ||
    haystack.includes("ds-790") ||
    haystack.includes("ds790")
  ) {
    return "/landing/epson-ds-790wn";
  }

  return HERO_BANNER_LANDING_HREFS[index % HERO_BANNER_LANDING_HREFS.length];
}

export default function HomeHeroClient({
  banners,
  categories,
}: HomeHeroClientProps) {
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
      setActiveBanner((previous) => {
        setPreviousBanner(previous);
        return (previous + 1) % banners.length;
      });
    }, HERO_ROTATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    if (previousBanner === null || previousBanner === activeBanner) return;
    const timeout = setTimeout(() => {
      setPreviousBanner((current) =>
        current === previousBanner ? null : current,
      );
    }, HERO_FADE_DURATION_MS);
    return () => clearTimeout(timeout);
  }, [activeBanner, previousBanner]);

  const nextBanner =
    banners.length > 1 ? (activeBanner + 1) % banners.length : activeBanner;
  const mountedIndexes = new Set<number>([activeBanner, nextBanner]);
  if (previousBanner !== null) {
    mountedIndexes.add(previousBanner);
  }

  return (
    <section className="hero-section">
      <CategoryPanel categories={categories} />

      <div className="hero-commerce-area">
        <section
          className="hero hero-banner"
          aria-label="Banner HPT Tech"
          style={{ position: "relative" }}
        >
          {banners.map((banner, index) => {
            if (!mountedIndexes.has(index)) return null;
            const isActive = index === activeBanner;
            const landingHref = getHeroBannerLandingHref(banner, index);

            return (
              <Link
                key={index}
                className="hero-slide-link"
                href={landingHref}
                aria-label={`Xem landing page ${banner?.title || `banner ${index + 1}`}`}
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
              </Link>
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
          {COMMERCIAL_STACK_TILES.map((tile) => (
            <CommercialTileImage key={tile.src} tile={tile} />
          ))}
        </aside>

        <section
          className="commercial-row"
          aria-label="Khuyến mãi thương mại HPT Tech"
        >
          {COMMERCIAL_ROW_TILES.map((tile) => (
            <CommercialTileImage key={tile.src} tile={tile} />
          ))}
        </section>
      </div>
    </section>
  );
}
