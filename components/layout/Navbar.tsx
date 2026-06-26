import Link from "next/link";
import { List } from "lucide-react";

const navLinks = [
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/giai-phap", label: "Giải pháp" },
  { href: "/du-an", label: "Dự án" },
  { href: "/thuong-hieu", label: "Đối tác" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/ve-hpt", label: "Giới thiệu" },
  { href: "/tuyen-dung", label: "Tuyển dụng" },
  { href: "/lien-he", label: "Liên hệ" },
];

export default function Navbar() {
  return (
    <nav className="nav desktop-only">
      <Link className="catalog-trigger" href="/san-pham">
        <List size={18} /> Danh mục sản phẩm
      </Link>
      <Link className="nav-home" href="/">
        Trang chủ
      </Link>
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
