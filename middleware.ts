import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  if (url.pathname === "/admin/collections/products" && url.searchParams.has("columns")) {
    const cleanURL = url.clone();
    cleanURL.searchParams.delete("columns");
    cleanURL.searchParams.delete("depth");

    return NextResponse.redirect(cleanURL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/collections/products"],
};
