import { NextResponse } from "next/server";
import { getProductsFromPayload } from "@/lib/catalog-payload";
import { getBannersFromPayload, getSiteSettingsFromPayload, getSolutionsFromPayload } from "@/lib/content-payload";
import { normalizeSiteSettings } from "@/lib/site-settings";

export async function GET() {
  const [products, banners, solutions, settings] = await Promise.all([
    getProductsFromPayload().catch(() => []),
    getBannersFromPayload().catch(() => []),
    getSolutionsFromPayload().catch(() => []),
    getSiteSettingsFromPayload().then(normalizeSiteSettings).catch(() => normalizeSiteSettings()),
  ]);

  return NextResponse.json({ products, banners, solutions, settings });
}
