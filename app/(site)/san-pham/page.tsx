import { Suspense } from "react";
import { getProductListPageFromPayload } from "@/lib/catalog-payload";
import ProductListClient from "@/components/ProductListClient";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Sản phẩm",
  description: "Danh mục máy in, máy scan và thiết bị văn phòng chính hãng do HPT Tech tư vấn và triển khai.",
  path: "/san-pham",
});

type ProductsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params?.page || 1);
  const productPage = await getProductListPageFromPayload({ page, limit: 24 });

  return (
    <Suspense fallback={null}>
      <ProductListClient
        products={productPage.products}
        page={productPage.page}
        totalPages={productPage.totalPages}
        totalProducts={productPage.totalProducts}
      />
    </Suspense>
  );
}
