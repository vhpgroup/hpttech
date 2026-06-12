"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { 
  Clock,
  FileText,
  Headset,
  Home,
  Mail,
  Menu, 
  Package,
  Scale,
  Search, 
  BadgeCheck, 
  PhoneCall, 
  X,
} from "lucide-react";
import HeaderCartButton from "@/components/cart/HeaderCartButton";
import type { PublicSiteSettings } from "@/lib/content-payload";
import { phoneHref, quoteMailHref } from "@/lib/site-settings";

const navLinks = [
  { href: "/ai-search", label: "AI Search" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/giai-phap", label: "Giải pháp" },
  { href: "/thuong-hieu", label: "Thương hiệu" },
  { href: "/du-an", label: "Dự án" },
  { href: "/dich-vu", label: "Dịch vụ" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/ve-hpt", label: "Về HPT" },
  { href: "/tuyen-dung", label: "Tuyển dụng" },
  { href: "/lien-he", label: "Liên hệ" },
];

export default function Header({ settings }: { settings: Required<PublicSiteSettings> }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const phone = settings.hotline || settings.phone;

  return (
    <>
      <div className="utility-topbar desktop-only">
        <p>{settings.companyName} - Công ty TNHH đầu tư xây dựng và thiết bị công nghệ HPT</p>
        <div>
          <a href={`mailto:${settings.email}`}>
            <Mail size={14} />
            {settings.email}
          </a>
          <span>
            <Clock size={14} />
            8:00 - 17:30
          </span>
          <a href={phoneHref(phone)}>
            <PhoneCall size={14} />
            {phone}
          </a>
          <Link href="/lien-he">
            <Headset size={14} />
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
            src="https://hpttech.vn/media/32/content/HPT-Logo.png" 
            alt={settings.companyName} 
            width={92}
            height={54}
            priority
          />
        </Link>

        <form className="search desktop-only" role="search" action="/san-pham" method="get">
          <input 
            id="searchInput" 
            name="search"
            type="search" 
            placeholder="Tìm sản phẩm, giải pháp, thương hiệu..." 
          />
          <select aria-label="Danh mục" name="category">
            <option value="">Danh mục</option>
            <option value="Máy in">Máy in</option>
            <option value="Máy scan">Máy scan</option>
          </select>
          <button type="submit" aria-label="Tìm kiếm">
            <Search size={20} />
          </button>
        </form>

        <div className="quick desktop-only">
          <a href={quoteMailHref(settings.email)}>
            <BadgeCheck size={20} />
            <div>
              <b>Báo giá nhanh</b>
              <small>Phản hồi trong 15p</small>
            </div>
          </a>
          <a href={phoneHref(phone)}>
            <PhoneCall size={20} />
            <div>
              <b>Hotline</b>
              <small>{phone}</small>
            </div>
          </a>
        </div>

        <Link className="cart" href="/compare" aria-label="So sánh sản phẩm">
          <Scale size={22} />
        </Link>
        <HeaderCartButton />
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
