import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import FloatingContactDock from "@/components/FloatingContactDock";

export const metadata: Metadata = {
  title: "HPT Tech - Giao diện mới",
  description: "Bản dựng giao diện HPT Tech mới với dữ liệu sản phẩm, danh mục và bài viết mẫu.",
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="site-shell">
        <Header />
        <Navbar />
        {children}
        <FloatingContactDock />
      </body>
    </html>
  );
}
