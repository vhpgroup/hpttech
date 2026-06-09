import type { Metadata } from "next";

export function siteURL() {
  const raw = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://hpttech.vn";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`;
}

export function absoluteURL(path = "/") {
  if (path.startsWith("http")) return path;
  return `${siteURL()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description,
  path = "/",
  image,
  type = "website",
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteURL(path);
  const fullTitle = title.includes("HPT Tech") ? title : `${title} | HPT Tech`;
  const images = image ? [{ url: absoluteURL(image) }] : undefined;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: "HPT Tech",
      type,
      images,
      locale: "vi_VN",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      images: image ? [absoluteURL(image)] : undefined,
    },
  };
}
