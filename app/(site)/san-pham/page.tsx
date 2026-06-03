import { Suspense } from "react";
import { getProductsFromPayload } from "@/lib/catalog-payload";
import ProductListClient from "@/components/ProductListClient";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Sản phẩm",
  description: "Danh mục máy in, máy scan và thiết bị văn phòng chính hãng do HPT Tech tư vấn và triển khai.",
  path: "/san-pham",
});

export default async function ProductsPage() {
  const products = await getProductsFromPayload();

  return (
    <Suspense fallback={null}>
      <ProductListClient products={products} />
    </Suspense>
  );
}
