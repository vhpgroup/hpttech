import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HPT Tech Design System",
  description: "Bo component va design tokens cho HPT Tech"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
