import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  serverExternalPackages: ["sharp", "pg", "playwright", "puppeteer-core", "exceljs", "pdf-parse"],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000,
    deviceSizes: [384, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hpttech.vn",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.anphatpc.com.vn",
      },
      {
        // Icon 3D Microsoft Fluent Emoji cho sidebar danh mục (CategoryPanel).
        protocol: "https",
        hostname: "cdn.jsdelivr.net",
      },
    ],
  },
};

export default withPayload(nextConfig);
