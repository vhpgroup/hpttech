import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "../globals.css";
import DesktopStage, { DesktopStageScript } from "@/components/layout/DesktopStage";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import FloatingContactDockLoader from "@/components/FloatingContactDockLoader";
import GlobalCompareDock from "@/components/GlobalCompareDock";
import { CartProvider } from "@/components/cart/CartProvider";
import { QuoteProvider } from "@/components/quote/QuoteProvider";
import { getProductsFromPayload } from "@/lib/catalog-payload";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { pageMetadata, siteURL } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

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
  const [settings, products] = await Promise.all([
    getSiteSettingsFromPayload().then(normalizeSiteSettings),
    getProductsFromPayload(),
  ]);

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} ${geist.variable}`}
      style={{ "--desktop-scale": "1" } as React.CSSProperties}
    >
      <head>
        <DesktopStageScript />
      </head>
      <body className="site-shell">
        <CartProvider>
          <QuoteProvider>
            <DesktopStage>
              <Header settings={settings} />
              <Navbar />
              {children}
              <Footer settings={settings} />
            </DesktopStage>
            <GlobalCompareDock products={products} />
            <FloatingContactDockLoader settings={settings} />
          </QuoteProvider>
        </CartProvider>
      </body>
    </html>
  );
}
