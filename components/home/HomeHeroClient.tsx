"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicBanner } from "@/lib/content-payload";
import CategoryPanel from "@/components/home/CategoryPanel";

type HomeHeroClientProps = {
  banners: PublicBanner[];
};

export default function HomeHeroClient({ banners }: HomeHeroClientProps) {
  const [activeBanner, setActiveBanner] = useState(0);
  const activeBannerData = banners[activeBanner] || banners[0];
  const prevBanner = () => setActiveBanner((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  const nextBanner = () => setActiveBanner((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

  return (
    <section className="hero-section">
      <CategoryPanel />

      <div className="hero-commerce-area">
        <section className="hero hero-banner" aria-label="Banner HPT Tech">
          <button className="slider-btn prev" onClick={prevBanner} aria-label="Slide trước">
            <ChevronLeft size={24} />
          </button>

          <a className="hero-slide-link" href={activeBannerData?.link || "/"} target="_blank" rel="noreferrer">
            {activeBannerData?.image ? (
              <Image
                id="heroBannerImage"
                src={activeBannerData.image}
                alt={activeBannerData.title || "HPT Tech banner"}
                width={804}
                height={470}
                priority
              />
            ) : null}
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
            <span className="commercial-products">Máy scan</span>
            <strong>Số hóa tài liệu</strong>
            <small>Ricoh, Fujitsu, Epson, Plustek cho văn phòng hiện đại</small>
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
            <span className="commercial-products">Máy in</span>
            <strong>In ấn doanh nghiệp</strong>
            <small>HP, Brother, Epson, Kyocera chính hãng, dễ triển khai</small>
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
            <span className="commercial-products">Thiết bị văn phòng</span>
            <strong>Combo tối ưu chi phí</strong>
            <small>Tư vấn cấu hình theo quy mô đội nhóm</small>
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
            <span className="commercial-products">Giải pháp</span>
            <strong>Triển khai trọn gói</strong>
            <small>Hạ tầng, mạng, bảo mật và thiết bị đồng bộ</small>
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
            <span className="commercial-products">Dịch vụ</span>
            <strong>Hỗ trợ tận nơi</strong>
            <small>Lắp đặt, bảo hành, bảo trì nhanh cho doanh nghiệp</small>
          </a>
        </section>
      </div>
    </section>
  );
}
