import Link from "next/link";
import { List } from "lucide-react";

const navLinks = [
  { href: "/ai-search", label: "AI Search" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/giai-phap", label: "Giải pháp" },
  { href: "/thuong-hieu", label: "Thương hiệu" },
  { href: "/download-center", label: "Download Center" },
  { href: "/du-an", label: "Dự án" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/ve-hpt", label: "Giới thiệu" },
  { href: "/lien-he", label: "Liên hệ" },
];

export default function Navbar() {
  return (
    <nav className="nav desktop-only">
      <Link className="catalog-trigger" href="/san-pham">
        <List size={18} /> Danh mục sản phẩm
      </Link>
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
