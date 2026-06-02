import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import FloatingContactDock from "@/components/FloatingContactDock";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { normalizeSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "HPT Tech - Giao diện mới",
  description: "Bản dựng giao diện HPT Tech mới với dữ liệu sản phẩm, danh mục và bài viết mẫu.",
};

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = normalizeSiteSettings(await getSiteSettingsFromPayload());

  return (
    <html lang="vi">
      <body className="site-shell">
        <Header settings={settings} />
        <Navbar />
        {children}
        <FloatingContactDock settings={settings} />
      </body>
    </html>
  );
}
