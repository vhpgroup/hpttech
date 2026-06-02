export function GET() {
  const raw = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://hpttech.vn";
  const base = raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw}`;

  return new Response(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}
