import { NextResponse } from "next/server";
import { getProductSearchPageFromPayload } from "@/lib/catalog-payload";
import type { CatalogProduct } from "@/lib/catalog";

export const revalidate = 300;
const COMPARE_PICKER_LIMIT = 300;

function toCompareProduct(product: CatalogProduct): CatalogProduct {
  const image = product.images?.[0]?.url || product.image;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    price: product.price,
    image,
    images: image ? [{ url: image, alt: product.title }] : [],
    detail: product.detail,
    href: product.href || `/san-pham/${product.slug}`,
  };
}

export async function GET() {
  const { products } = await getProductSearchPageFromPayload({
    limit: COMPARE_PICKER_LIMIT,
    sort: "popular",
  });

  return NextResponse.json(
    {
      products: products.map(toCompareProduct),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
      },
    },
  );
}
