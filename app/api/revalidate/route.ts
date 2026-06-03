import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const collectionPaths: Record<string, string[]> = {
  banners: ["/"],
  solutions: ["/", "/giai-phap", "/dich-vu"],
  products: ["/", "/san-pham", "/compare"],
  posts: ["/", "/tin-tuc"],
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

  const paths = new Set<string>(["/"]);
  if (collection) {
    for (const path of collectionPaths[collection] || []) paths.add(path);
  }

  if (collection === "products" && slug) paths.add(`/san-pham/${slug}`);
  if (collection === "posts" && slug) paths.add(`/tin-tuc/${slug}`);
  if (collection === "static-pages" && slug) paths.add(`/${slug}`);
  if (body.global === "site-settings") paths.add("/");
  if (body.global === "about-page") paths.add("/ve-hpt");

  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, paths: Array.from(paths) });
}
