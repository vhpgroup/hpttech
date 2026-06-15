"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CompareDock from "@/components/home/CompareDock";
import type { CatalogProduct } from "@/lib/catalog";

const COMPARE_LIMIT = 4;

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

export default function GlobalCompareDock({ products }: { products: CatalogProduct[] }) {
  const [items, setItems] = useState<CatalogProduct[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{
    status: "added" | "duplicate" | "full";
    message: string;
  } | null>(null);
  const itemsRef = useRef<CatalogProduct[]>([]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((status: "added" | "duplicate" | "full") => {
    const messages = {
      added: "Đã thêm vào danh sách so sánh.",
      duplicate: "Sản phẩm đã có trong danh sách.",
      full: "Danh sách đã đủ 4 sản phẩm.",
    };

    setToast({ status, message: messages[status] });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2_500);
  }, []);

  const publishItems = useCallback((next: CatalogProduct[]) => {
    window.dispatchEvent(new CustomEvent("hpt:compare:state", { detail: next }));
  }, []);

  const tryAddProduct = useCallback((product: CatalogProduct) => {
    const key = productKey(product);
    const current = itemsRef.current;
    let status: "added" | "duplicate" | "full";

    if (current.some((item) => productKey(item) === key)) {
      status = "duplicate";
    } else if (current.length >= COMPARE_LIMIT) {
      status = "full";
    } else {
      status = "added";
      const next = [...current, product];
      itemsRef.current = next;
      setItems(next);
      publishItems(next);
    }

    showToast(status);
    window.dispatchEvent(
      new CustomEvent("hpt:compare:result", { detail: { key, status } }),
    );
    return status === "added";
  }, [publishItems, showToast]);

  useEffect(() => {
    const handleCompareAdd = (event: Event) => {
      const product = (event as CustomEvent<CatalogProduct>).detail;
      if (!product) return;
      tryAddProduct(product);
    };
    const handleCompareRemove = (event: Event) => {
      const product = (event as CustomEvent<CatalogProduct>).detail;
      if (!product) return;
      const next = itemsRef.current.filter((item) => productKey(item) !== productKey(product));
      itemsRef.current = next;
      setItems(next);
      publishItems(next);
    };
    const handleOpen = () => setOpen(true);
    const handleStateRequest = () => publishItems(itemsRef.current);

    window.addEventListener("hpt:compare:add", handleCompareAdd);
    window.addEventListener("hpt:compare:remove", handleCompareRemove);
    window.addEventListener("hpt:compare:open", handleOpen);
    window.addEventListener("hpt:compare:request-state", handleStateRequest);
    publishItems(itemsRef.current);
    return () => {
      window.removeEventListener("hpt:compare:add", handleCompareAdd);
      window.removeEventListener("hpt:compare:remove", handleCompareRemove);
      window.removeEventListener("hpt:compare:open", handleOpen);
      window.removeEventListener("hpt:compare:request-state", handleStateRequest);
    };
  }, [publishItems, tryAddProduct]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const addProduct = (product: CatalogProduct) => {
    return tryAddProduct(product);
  };

  const removeProduct = (product: CatalogProduct) => {
    const next = itemsRef.current.filter((item) => productKey(item) !== productKey(product));
    itemsRef.current = next;
    setItems(next);
    publishItems(next);
  };

  return (
    <>
      <CompareDock
        items={items}
        products={products}
        onAdd={addProduct}
        onRemove={removeProduct}
        onClear={() => {
          itemsRef.current = [];
          setItems([]);
          publishItems([]);
        }}
        open={open}
        onOpenChange={setOpen}
      />
      {toast ? (
        <div className={`compare-toast compare-toast-${toast.status}`} role="status">
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setToast(null);
            }}
          >
            Xem danh sách
          </button>
        </div>
      ) : null}
    </>
  );
}
