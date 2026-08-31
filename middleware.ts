import { NextResponse, type NextRequest } from "next/server";
import {
  cleanProductBrandRedirectPath,
  cleanProductFilterRedirectPath,
} from "@/lib/product-filter-seo-routes";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  const cleanBrandPath = cleanProductBrandRedirectPath(url.pathname, url.searchParams);
  if (cleanBrandPath) {
    const cleanURL = url.clone();
    cleanURL.pathname = cleanBrandPath;
    cleanURL.search = "";
    return NextResponse.redirect(cleanURL, 308);
  }

  const cleanFilterPath = cleanProductFilterRedirectPath(url.pathname, url.searchParams);
  if (cleanFilterPath) {
    const cleanURL = url.clone();
    cleanURL.pathname = cleanFilterPath;
    cleanURL.search = "";
    return NextResponse.redirect(cleanURL, 308);
  }

  if (url.pathname === "/admin/collections/products" && url.searchParams.has("columns")) {
    const cleanURL = url.clone();
    cleanURL.searchParams.delete("columns");
    cleanURL.searchParams.delete("depth");

    return NextResponse.redirect(cleanURL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/collections/products",
    "/((?!api|_next|assets|favicon.ico|robots.txt|sitemap.xml|google-merchant.xml).*)",
  ],
};
