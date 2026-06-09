"use client";

import { useEffect, useState } from "react";
import CompareDock from "@/components/home/CompareDock";
import type { CatalogProduct } from "@/lib/catalog";

const COMPARE_LIMIT = 4;

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

export default function GlobalCompareDock({ products }: { products: CatalogProduct[] }) {
  const [items, setItems] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    const handleCompareAdd = (event: Event) => {
      const product = (event as CustomEvent<CatalogProduct>).detail;
      if (!product) return;

      setItems((prev) => {
        const key = productKey(product);
        if (prev.some((item) => productKey(item) === key)) return prev;
        if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), product];
        return [...prev, product];
      });
    };

    window.addEventListener("hpt:compare:add", handleCompareAdd);
    return () => window.removeEventListener("hpt:compare:add", handleCompareAdd);
  }, []);

  const addProduct = (product: CatalogProduct) => {
    setItems((prev) => {
      const key = productKey(product);
      if (prev.some((item) => productKey(item) === key)) return prev;
      if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), product];
      return [...prev, product];
    });
  };

  const removeProduct = (product: CatalogProduct) => {
    setItems((prev) => prev.filter((item) => productKey(item) !== productKey(product)));
  };

  return (
    <CompareDock
      items={items}
      products={products}
      onAdd={addProduct}
      onRemove={removeProduct}
      onClear={() => setItems([])}
    />
  );
}
