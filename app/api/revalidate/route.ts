import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const collectionPaths: Record<string, string[]> = {
  banners: ["/"],
  solutions: ["/", "/giai-phap", "/dich-vu"],
  products: ["/", "/san-pham", "/compare", "/google-merchant.xml"],
  categories: ["/", "/san-pham"],
  "post-categories": ["/tin-tuc", "/sitemap.xml", "/sitemap/static"],
  posts: ["/", "/tin-tuc"],
  certifications: ["/thuong-hieu", "/sitemap.xml", "/sitemap/static"],
  projects: ["/du-an"],
  faq: ["/dich-vu"],
  "static-pages": [],
};

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const collection = typeof body.collection === "string" ? body.collection : undefined;
  const slug = typeof body.slug === "string" ? body.slug : undefined;
  const path = typeof body.path === "string" ? body.path : undefined;
  const bodyPaths = Array.isArray(body.paths)
    ? body.paths.filter((item: unknown): item is string => typeof item === "string")
    : [];
  const tags = new Set<string>();

  const paths = new Set<string>(["/"]);
  for (const item of bodyPaths) paths.add(item);
  if (collection) {
    for (const path of collectionPaths[collection] || []) paths.add(path);
  }

  if (collection === "products") {
    tags.add("products:list");
    if (slug) {
      tags.add(`product:${slug}`);
      paths.add(`/san-pham/${slug}`);
    }
  }
  if (collection === "product-offers" || collection === "product-variants" || collection === "product-inventory") {
    tags.add("products:list");
    paths.add("/san-pham");
    paths.add("/google-merchant.xml");
  }
  if (collection === "categories") {
    tags.add("categories:list");
    tags.add("products:list");
    if (slug) tags.add(`category:${slug}`);
  }
  if (collection === "posts") {
    tags.add("posts:list");
    if (slug) {
      tags.add(`post:${slug}`);
      paths.add(`/tin-tuc/${slug}`);
    }
    if (path) paths.add(`/tin-tuc/${path}`);
  }
  if (collection === "post-categories") {
    tags.add("post-categories:list");
    tags.add("posts:list");
    if (slug) tags.add(`category:${slug}`);
  }
  if (collection === "certifications") {
    tags.add("certifications");
    if (slug) {
      tags.add(`certification:${slug}`);
      paths.add(`/thuong-hieu/${slug}`);
    }
  }
  if (collection === "landing-pages") {
    tags.add("landing-pages:list");
    if (path) tags.add(`landing-page:${path}`);
    for (const item of bodyPaths) {
      if (item.startsWith("/giai-phap/")) tags.add(`landing-page:${item}`);
    }
  }
  if (collection === "static-pages" && slug) paths.add(`/${slug}`);
  if (body.global === "site-settings") paths.add("/");
  if (body.global === "about-page") paths.add("/ve-hpt");

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, paths: Array.from(paths), tags: Array.from(tags) });
}
