"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
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
import type { PublicSiteSettings } from "@/lib/content-payload";
import { phoneHref, quoteMailHref } from "@/lib/site-settings";

const HPT_LOGO_SRC = "/assets/logo/hptlogo.png";

// Icon 3D phong cách Fluent, tự host trên media R2 của site (cùng bộ với
// icon sidebar danh mục + dải cam kết).
const R2_ICON = "/api/r2-media/";

// Danh mục cho dropdown ô tìm kiếm header. `slug` PHẢI là slug danh mục thật —
// ô tìm kiếm submit ?category=<slug> và productSearchWhere khớp theo c/pc/ppc.slug.
type HeaderCategoryOption = { name: string; slug: string };

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
  categories = [],
}: {
  settings: Required<PublicSiteSettings>;
  categories?: HeaderCategoryOption[];
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const phone = settings.hotline || settings.phone;

  // Điều hướng khi submit ô tìm kiếm header:
  //  - CÓ chọn danh mục → landing rút gọn /<slug> (kiểu An Phát), kèm ?search=<kw> nếu có
  //    từ khóa (landing đã hỗ trợ free-text search — xem parseLandingSearchParams).
  //  - KHÔNG chọn danh mục + có từ khóa → /san-pham?search=<kw> (tìm toàn site).
  //  - Không có gì → /san-pham.
  // Vẫn giữ action/method GET làm fallback khi JS tắt.
  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const search = String(data.get("search") ?? "").trim();
    const category = String(data.get("category") ?? "").trim();
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    const qs = query.toString() ? `?${query.toString()}` : "";

    // Chọn danh mục → landing của danh mục đó (giữ từ khóa nếu có).
    if (category) {
      router.push(`/${encodeURIComponent(category)}${qs}`);
      return;
    }

    router.push(`/san-pham${qs}`);
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
          <Link href="/lien-he">
            <Image src={`${R2_ICON}icon-topbar-ho-tro-kt.png`} alt="" aria-hidden="true" width={16} height={16} />
            Hỗ trợ kỹ thuật
          </Link>
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
            width={115}
            height={40}
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
          <select aria-label="Danh mục" name="category" defaultValue="">
            <option value="">Danh mục</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
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
          <a className="header-hotline" href={phoneHref(phone)}>
            <Image src={`${R2_ICON}icon-header-hotline.png`} alt="" aria-hidden="true" width={32} height={32} />
            <span>
              <small>Hotline 24/7</small>
              <b>{phone}</b>
            </span>
          </a>
          <a className="quote-btn" href={quoteMailHref(settings.email)}>
            <BadgeCheck size={18} />
            Báo giá nhanh
          </a>
          <Link className="cart" href="/compare" aria-label="So sánh sản phẩm">
            <Image src={`${R2_ICON}icon-header-so-sanh.png`} alt="" aria-hidden="true" width={32} height={32} />
          </Link>
          <HeaderCartButton />
        </div>
      </header>

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
