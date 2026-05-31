"use client";

import Link from "next/link";
import { List } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="nav desktop-only">
      <Link className="catalog-trigger" href="/san-pham">
        <List size={18} /> Danh mục sản phẩm
      </Link>
      <Link href="/">Trang chủ</Link>
      <Link href="/giai-phap">Giải pháp</Link>
      <Link href="/thuong-hieu">Thương hiệu</Link>
      <Link href="/du-an">Dự án</Link>
      <Link href="/dich-vu">Dịch vụ</Link>
      <Link href="/tin-tuc">Tin tức</Link>
      <Link href="/ve-hpt">Giới thiệu</Link>
      <Link href="/lien-he">Liên hệ</Link>
    </nav>
  );
}
