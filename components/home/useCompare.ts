"use client";

import { useCallback, useState } from "react";
import type { Product } from "@/lib/data";

export const COMPARE_LIMIT = 4;

export function useCompare() {
  const [items, setItems] = useState<Product[]>([]);

  const isComparing = useCallback((id: string) => items.some((product) => product.id === id), [items]);

  const add = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === product.id)) return prev;
      if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), product];
      return [...prev, product];
    });
  }, []);

  const toggle = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev.filter((item) => item.id !== product.id);
      }
      if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), product];
      return [...prev, product];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((product) => product.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return { items, isComparing, add, toggle, remove, clear };
}
