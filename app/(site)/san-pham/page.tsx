import { getProductsFromPayload } from "@/lib/catalog-payload";
import ProductListClient from "@/components/ProductListClient";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProductsFromPayload();
  return (
    <ProductListClient products={products} />
  );
}
