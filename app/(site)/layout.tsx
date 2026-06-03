import type { Metadata } from "next";
import "../globals.css";
import DesktopStage, { DesktopStageScript } from "@/components/layout/DesktopStage";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import FloatingContactDockLoader from "@/components/FloatingContactDockLoader";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { pageMetadata, siteURL } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  metadataBase: new URL(siteURL()),
  ...pageMetadata({
    title: "HPT Tech - Thiết bị văn phòng & giải pháp số hóa",
    description:
      "HPT Tech cung cấp máy in, máy scan, thiết bị văn phòng và giải pháp số hóa tài liệu cho doanh nghiệp.",
  }),
};

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = normalizeSiteSettings(await getSiteSettingsFromPayload());

  return (
    <html lang="vi" suppressHydrationWarning style={{ "--desktop-scale": "1" } as React.CSSProperties}>
      <head>
        <DesktopStageScript />
      </head>
      <body className="site-shell">
        <DesktopStage>
          <Header settings={settings} />
          <Navbar />
          {children}
          <FloatingContactDockLoader settings={settings} />
        </DesktopStage>
      </body>
    </html>
  );
}
