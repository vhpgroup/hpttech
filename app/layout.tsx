import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import FloatingContactDock from "@/components/FloatingContactDock";

export const metadata: Metadata = {
  metadataBase: new URL("https://hpttech.vercel.app"),
  title: {
    default: "HPT Tech - Thiết bị văn phòng & giải pháp số hóa",
    template: "%s | HPT Tech",
  },
  description:
    "HPT Tech cung cấp máy in, máy scan, thiết bị văn phòng và giải pháp số hóa tài liệu cho doanh nghiệp.",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "HPT Tech",
    url: "https://hpttech.vercel.app",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.ico" },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "HPT Tech",
  url: "https://hpttech.vercel.app",
  logo: "https://hpttech.vn/media/32/content/HPT-Logo.png",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+84-876-645-432",
    contactType: "customer service",
    areaServed: "VN",
    availableLanguage: ["vi"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="site-shell">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Header />
        <Navbar />
        {children}
        <FloatingContactDock />
      </body>
    </html>
  );
}
