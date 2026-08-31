import type { Metadata } from "next";
import Script from "next/script";
import "../globals.css";
import { Geist, Inter } from "next/font/google";
import { CategoryMenuProvider } from "@/components/layout/CategoryMenu";
import DesktopStage from "@/components/layout/DesktopStage";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import SiteSideBanners from "@/components/layout/SiteSideBanners";
import SiteJsonLd from "@/components/seo/SiteJsonLd";
import FloatingContactDockLoader from "@/components/FloatingContactDockLoader";
import GlobalCompareDock from "@/components/GlobalCompareDock";
import { CartProvider } from "@/components/cart/CartProvider";
import { QuoteProvider } from "@/components/quote/QuoteProvider";
import CategoryPanel from "@/components/home/CategoryPanel";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { getProductCategoryNavFromPayload } from "@/lib/catalog-payload";
import { pageMetadata, siteURL } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";
import { ProductInfoPopupLayer } from "@/components/product/ProductQuickInfoPopup";
import CoreWebVitalsTracker from "@/components/analytics/CoreWebVitalsTracker";

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
  // Favicon PHAI vuong va canh la boi so cua 48px thi Google moi chap nhan.
  // Truoc day ca 3 khai bao deu tro ve /assets/logo/hptlogo.png (1661x1007, ~624KB) —
  // logo ngang nen Google tu choi, ket qua tim kiem hien icon qua dia cau mac dinh.
  // Bo icon vuong duoi day sinh boi scripts/extract-favicon-assets.cjs (predev/prebuild).
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/assets/logo/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/assets/logo/icon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/assets/logo/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/assets/logo/apple-icon.png", sizes: "180x180" }],
  },
  verification: {
    google: "uSw_FL3iLj0w-MjCqh8DQI1aPEKi6g0ozC-KgHFxUls",
  },
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
  // Lấy settings + cây danh mục song song. Cây danh mục đổ vào panel "Danh mục"
  // thả xuống từ header (CategoryPanel — cùng component với sidebar trang chủ).
  const [settings, categoryNav] = await Promise.all([
    getSiteSettingsFromPayload().then(normalizeSiteSettings),
    getProductCategoryNavFromPayload(),
  ]);
  const googleAnalyticsId = settings.googleAnalyticsId.trim();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <SiteJsonLd settings={settings} />
        {googleAnalyticsId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${googleAnalyticsId}');
              `}
            </Script>
            <CoreWebVitalsTracker />
          </>
        ) : null}
        <div className={`${inter.variable} ${geist.variable} site-shell`}>
          <CartProvider>
            <QuoteProvider>
              <ProductInfoPopupLayer>
                <DesktopStage>
                  {/* Provider giữ state mở/đóng panel danh mục dùng chung giữa
                      nút "Danh mục sản phẩm" (Navbar) và panel thả xuống (Header). */}
                  <CategoryMenuProvider>
                    <Header
                      settings={settings}
                      categoryMenu={
                        <CategoryPanel categories={categoryNav} panelId="headerCategoryList" />
                      }
                    />
                    <Navbar />
                    <SiteSideBanners />
                    {children}
                    <Footer settings={settings} />
                  </CategoryMenuProvider>
                </DesktopStage>
                <GlobalCompareDock />
                <FloatingContactDockLoader settings={settings} />
              </ProductInfoPopupLayer>
            </QuoteProvider>
          </CartProvider>
        </div>
      </body>
    </html>
  );
}
