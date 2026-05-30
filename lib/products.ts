import { HPT_DATA, type Product } from "@/lib/data";

export type ProductWithSlug = Product & {
  slug: string;
};

export type ProductSource = {
  getProducts: () => ProductWithSlug[];
  getProductBySlug: (slug: string) => ProductWithSlug | null;
  getProductCategories: () => string[];
  getProductBrands: () => string[];
};

export function getSeedProducts(slugForProduct: (product: Product) => string): ProductWithSlug[] {
  return HPT_DATA.products.map((product) => ({
    ...product,
    slug: slugForProduct(product),
  }));
}

export function createSeedProductSource(slugForProduct: (product: Product) => string): ProductSource {
  const getProducts = () => getSeedProducts(slugForProduct);

  return {
    getProducts,
    getProductBySlug: (slug: string) => getProducts().find((product) => product.slug === slug) ?? null,
    getProductCategories: () => Array.from(new Set(HPT_DATA.products.map((product) => product.category))).sort(),
    getProductBrands: () => Array.from(new Set(HPT_DATA.products.map((product) => product.brand))).sort(),
  };
}
