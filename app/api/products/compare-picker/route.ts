import { NextResponse } from "next/server";
import { getProductsFromPayload } from "@/lib/catalog-payload";
import type { CatalogProduct } from "@/lib/catalog";

export const revalidate = 300;

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
  const products = await getProductsFromPayload();

  return NextResponse.json(
    {
      products: products.map(toCompareProduct),
    },
    {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
      },
    },
  );
}
