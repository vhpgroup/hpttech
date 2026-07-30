"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CompareDock from "@/components/home/CompareDock";
import type { CatalogProduct } from "@/lib/catalog";

const COMPARE_LIMIT = 4;
const STORAGE_KEY = "hpt:compare:items:v1";

type CompareResultStatus = "added" | "duplicate" | "full";

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

// Chỉ giữ các trường dock/trang so sánh cần — tránh phình localStorage.
function toStoredProduct(product: CatalogProduct): CatalogProduct {
  return {
    title: product.title,
    slug: product.slug,
    image: product.images?.[0]?.url || product.image,
    price: product.price,
    brand: product.brand,
    category: product.category,
    detail: product.detail,
    href: product.href,
  };
}

function readStoredItems(): CatalogProduct[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is CatalogProduct =>
          Boolean(item) && typeof item === "object" && typeof (item as CatalogProduct).title === "string",
      )
      .slice(0, COMPARE_LIMIT);
  } catch {
    return [];
  }
}

export default function GlobalCompareDock() {
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [open, setOpen] = useState(false);
  const itemsRef = useRef<CatalogProduct[]>([]);
  const hydratedRef = useRef(false);

  const broadcast = useCallback((nextItems: CatalogProduct[]) => {
    window.dispatchEvent(new CustomEvent<CatalogProduct[]>("hpt:compare:state", { detail: nextItems }));
  }, []);

  const emitResult = useCallback((product: CatalogProduct, status: CompareResultStatus) => {
    window.dispatchEvent(
      new CustomEvent("hpt:compare:result", { detail: { key: productKey(product), status } }),
    );
  }, []);

  const addProduct = useCallback(
    (product: CatalogProduct) => {
      const key = productKey(product);
      if (itemsRef.current.some((item) => productKey(item) === key)) {
        emitResult(product, "duplicate");
        return;
      }

      emitResult(product, "added");
      setItems((prev) => {
        if (prev.some((item) => productKey(item) === key)) return prev;
        const stored = toStoredProduct(product);
        if (prev.length >= COMPARE_LIMIT) return [...prev.slice(1), stored];
        return [...prev, stored];
      });
    },
    [emitResult],
  );

  const removeProduct = useCallback((product: CatalogProduct) => {
    setItems((prev) => prev.filter((item) => productKey(item) !== productKey(product)));
  }, []);

  // Khôi phục danh sách so sánh sau khi reload — trước đây F5 là mất toàn bộ lựa chọn.
  useEffect(() => {
    setItems(readStoredItems());
    hydratedRef.current = true;
  }, []);

  // Đồng bộ ref + localStorage và phát trạng thái cho ProductCard / ProductCompareButton.
  useEffect(() => {
    itemsRef.current = items;
    if (!hydratedRef.current) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage bị chặn/đầy — bỏ qua, so sánh vẫn hoạt động trong phiên hiện tại.
    }
    broadcast(items);
  }, [broadcast, items]);

  useEffect(() => {
    const handleAdd = (event: Event) => {
      const product = (event as CustomEvent<CatalogProduct>).detail;
      if (product) addProduct(product);
    };
    const handleRemove = (event: Event) => {
      const product = (event as CustomEvent<CatalogProduct>).detail;
      if (product) removeProduct(product);
    };
    const handleRequestState = () => broadcast(itemsRef.current);
    const handleOpen = () => setOpen(true);

    window.addEventListener("hpt:compare:add", handleAdd);
    window.addEventListener("hpt:compare:remove", handleRemove);
    window.addEventListener("hpt:compare:request-state", handleRequestState);
    window.addEventListener("hpt:compare:open", handleOpen);
    return () => {
      window.removeEventListener("hpt:compare:add", handleAdd);
      window.removeEventListener("hpt:compare:remove", handleRemove);
      window.removeEventListener("hpt:compare:request-state", handleRequestState);
      window.removeEventListener("hpt:compare:open", handleOpen);
    };
  }, [addProduct, broadcast, removeProduct]);

  return (
    <CompareDock
      items={items}
      open={open}
      onOpenChange={setOpen}
      onAdd={addProduct}
      onRemove={removeProduct}
      onClear={() => setItems([])}
    />
  );
}
