import Link from "next/link";
import { CatalogMenuButton } from "@/components/layout/CategoryMenu";

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
      {/* Nút danh mục DUY NHẤT của site: bấm → panel danh mục thả xuống
          (gộp từ nút "Danh mục" đỏ cũ trên header). Link tới trang /san-pham
          vẫn còn ngay bên cạnh qua mục "Sản phẩm". */}
      <CatalogMenuButton />
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
