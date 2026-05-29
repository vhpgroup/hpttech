"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Clock,
  Mail,
  Menu, 
  Search, 
  BadgeCheck, 
  PhoneCall, 
  ShoppingCart 
} from "lucide-react";

export default function Header() {
  const [cartCount, setCartCount] = useState(0);

  return (
    <>
      <div className="utility-topbar desktop-only">
        <p>HPT Tech - Thiết bị văn phòng & giải pháp số hóa</p>
        <div>
          <a href="mailto:lienhe@hpttech.vn">
            <Mail size={14} />
            lienhe@hpttech.vn
          </a>
          <span>
            <Clock size={14} />
            8:30 - 21:00
          </span>
          <a href="tel:0876645432">
            <PhoneCall size={14} />
            0876 645 432
          </a>
        </div>
      </div>

      <header className="main-header">
        <button 
          className="icon-btn mobile-only" 
          type="button" 
          aria-label="Mở menu"
        >
          <Menu size={24} />
        </button>

        <Link href="/" className="brand" aria-label="HPT Tech">
          <img 
            src="https://hpttech.vn/media/32/content/HPT-Logo.png" 
            alt="HPT Tech" 
          />
        </Link>

        <form className="search desktop-only" role="search">
          <input 
            id="searchInput" 
            type="search" 
            placeholder="Tìm sản phẩm, giải pháp, thương hiệu..." 
          />
          <select aria-label="Danh mục">
            <option>Danh mục</option>
            <option>Laptop doanh nghiệp</option>
            <option>Máy scan</option>
            <option>Thiết bị mạng</option>
          </select>
          <button type="submit" aria-label="Tìm kiếm">
            <Search size={20} />
          </button>
        </form>

        <div className="quick desktop-only">
          <a href="mailto:lienhe@hpttech.vn?subject=Yêu cầu báo giá HPT Tech">
            <BadgeCheck size={20} />
            <div>
              <b>Báo giá nhanh</b>
              <small>Phản hồi trong 15p</small>
            </div>
          </a>
          <a href="tel:0876645432">
            <PhoneCall size={20} />
            <div>
              <b>Hotline</b>
              <small>0876 645 432</small>
            </div>
          </a>
        </div>

        <button className="cart" type="button" aria-label="Giỏ hàng">
          <ShoppingCart size={22} />
          <span>{cartCount}</span>
        </button>
      </header>
    </>
  );
}
