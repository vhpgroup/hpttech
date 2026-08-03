"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  FileText,
  Home,
  Menu,
  Package,
  PhoneCall,
  Search,
  X,
} from "lucide-react";
import HeaderCartButton from "@/components/cart/HeaderCartButton";
import { useCategoryMenu } from "@/components/layout/CategoryMenu";
import TechSupportPopover from "@/components/layout/TechSupportPopover";
import type { PublicSiteSettings } from "@/lib/content-payload";
import { phoneHref, quoteMailHref } from "@/lib/site-settings";

const HPT_LOGO_SRC = "/assets/logo/hptlogo.png";

// Icon 3D phong cách Fluent, tự host trên media R2 của site (cùng bộ với
// icon sidebar danh mục + dải cam kết).
const R2_ICON = "/api/r2-media/";

const navLinks = [
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/giai-phap", label: "Giải pháp" },
  { href: "/du-an", label: "Dự án" },
  { href: "/thuong-hieu", label: "Đối tác" },
  { href: "/dich-vu", label: "Dịch vụ" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/ve-hpt", label: "Về HPT" },
  { href: "/tuyen-dung", label: "Tuyển dụng" },
  { href: "/lien-he", label: "Liên hệ" },
];

export default function Header({
  settings,
  categoryMenu,
}: {
  settings: Required<PublicSiteSettings>;
  /** Panel danh mục (CategoryPanel render phía server) thả xuống khi bấm nút "Danh mục". */
  categoryMenu?: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Panel danh mục kiểu GearVN: bấm nút "Danh mục sản phẩm" ở nav navy →
  // panel hiện đúng vị trí sidebar chuẩn (cột trái shell, ngay dưới nav),
  // phần còn lại của trang phủ xám. State mở/đóng nằm trong CategoryMenuProvider
  // (dùng chung với nút kích hoạt trong Navbar); đóng bằng Esc / đổi route /
  // khóa scroll đều do provider lo.
  const { open: catMenuOpen, setOpen: setCatMenuOpen } = useCategoryMenu();
  const router = useRouter();
  const phone = settings.hotline || settings.phone;

  // Ô tìm kiếm header: tìm toàn site → /san-pham?search=<kw>.
  // (Điều hướng theo danh mục nằm ở nút "Danh mục sản phẩm" trên nav navy.)
  // Vẫn giữ action/method GET làm fallback khi JS tắt.
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const search = String(data.get("search") ?? "").trim();
    router.push(search ? `/san-pham?search=${encodeURIComponent(search)}` : "/san-pham");
  }

  return (
    <>
      <div className="utility-topbar desktop-only">
        <p>{settings.companyName} - Công ty TNHH đầu tư xây dựng và thiết bị công nghệ HPT</p>
        <div>
          <a href={`mailto:${settings.email}`}>
            <Image src={`${R2_ICON}icon-topbar-mail.png`} alt="" aria-hidden="true" width={16} height={16} />
            {settings.email}
          </a>
          <span>
            <Image src={`${R2_ICON}icon-topbar-gio-lam-viec.png`} alt="" aria-hidden="true" width={16} height={16} />
            8:00 - 17:30
          </span>
          <TechSupportPopover />
        </div>
      </div>

      <header className="main-header">
        <button
          className="icon-btn mobile-only"
          type="button"
          aria-label="Mở menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

        <Link href="/" className="brand" aria-label={settings.companyName}>
          <Image
            src={HPT_LOGO_SRC}
            alt={settings.companyName}
            width={144}
            height={50}
            priority
          />
        </Link>

        <form
          className="search desktop-only"
          role="search"
          action="/san-pham"
          method="get"
          onSubmit={handleSearchSubmit}
        >
          <input
            id="searchInput"
            name="search"
            type="search"
            placeholder="Tìm sản phẩm, thương hiệu, mã SP..."
          />
          <button type="submit" aria-label="Tìm kiếm">
            <Search size={20} />
          </button>
        </form>

        <div className="header-actions">
          <a className="header-hotline header-hotline--ring" href={phoneHref(phone)}>
            <Image src={`${R2_ICON}icon-header-hotline.png`} alt="" aria-hidden="true" width={32} height={32} />
            <span>
              <small>Hotline 24/7</small>
              <b>{phone}</b>
            </span>
          </a>
          <Link className="header-hotline" href="/he-thong-showroom">
            <Image src={`${R2_ICON}icon-header-showroom.png`} alt="" aria-hidden="true" width={32} height={32} />
            <span>
              <small>Hệ thống</small>
              <b>Showroom</b>
            </span>
          </Link>
          <Link className="cart" href="/compare" aria-label="So sánh sản phẩm">
            <Image src={`${R2_ICON}icon-header-so-sanh.png`} alt="" aria-hidden="true" width={32} height={32} />
          </Link>
          <HeaderCartButton />
        </div>
      </header>

      {/* Thanh tìm kiếm mobile/tablet: sticky ngay dưới header. Site thương mại
          điện tử hàng nghìn SKU nhưng header mobile trước đây không có ô tìm
          kiếm nào — muốn tìm phải biết mở hamburger (audit 03/08). */}
      <form
        className="mobile-search-bar mobile-only"
        role="search"
        action="/san-pham"
        method="get"
        onSubmit={handleSearchSubmit}
      >
        <input
          name="search"
          type="search"
          placeholder="Tìm sản phẩm, thương hiệu, mã SP..."
          aria-label="Tìm sản phẩm"
        />
        <button type="submit" aria-label="Tìm kiếm">
          <Search size={18} />
        </button>
      </form>

      {/* Panel danh mục kiểu GearVN: overlay xám + panel ở vị trí sidebar chuẩn,
          thả xuống ngay dưới nút "Danh mục sản phẩm" của nav navy (CatalogMenuButton).
          Đặt ngoài .main-header để absolute không neo vào header (mobile sticky). */}
      {catMenuOpen ? (
        <>
          <button
            type="button"
            className="header-cat-overlay"
            aria-label="Đóng danh mục"
            onClick={() => setCatMenuOpen(false)}
          />
          <div className="header-cat-panel" id="headerCategoryPanel">
            {categoryMenu}
          </div>
        </>
      ) : null}

      <button
        className={`mobile-menu-overlay ${mobileMenuOpen ? "open" : ""}`}
        type="button"
        aria-label="Đóng menu"
        onClick={() => setMobileMenuOpen(false)}
      />
      <aside className={`mobile-menu-drawer ${mobileMenuOpen ? "open" : ""}`} aria-hidden={mobileMenuOpen ? "false" : "true"}>
        <div className="mobile-menu-head">
          <strong>Menu HPT Tech</strong>
          <button type="button" aria-label="Đóng menu" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>
        <form className="mobile-menu-search" action="/san-pham" method="get" role="search">
          <input name="search" type="search" placeholder="Tìm sản phẩm..." />
          <button type="submit" aria-label="Tìm kiếm">
            <Search size={18} />
          </button>
        </form>
        <nav className="mobile-menu-links">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu-actions">
          <a href={quoteMailHref(settings.email)}>Báo giá nhanh</a>
          <a href={phoneHref(phone)}>{phone}</a>
        </div>
      </aside>

      <nav className="mobile-nav" aria-label="Điều hướng nhanh mobile">
        <Link href="/">
          <Home size={18} />
          Trang chủ
        </Link>
        <Link href="/san-pham">
          <Package size={18} />
          Sản phẩm
        </Link>
        <Link className="quote" href={quoteMailHref(settings.email)}>
          <BadgeCheck size={18} />
          Báo giá
        </Link>
        <Link href="/tin-tuc">
          <FileText size={18} />
          Tin tức
        </Link>
        <Link href="/lien-he">
          <PhoneCall size={18} />
          Liên hệ
        </Link>
      </nav>
    </>
  );
}
