"use client";

import { ArrowRight, Check, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";

type CompareResult = {
  key: string;
  status: "added" | "duplicate" | "full";
};

function productKey(product: CatalogProduct) {
  return product.slug || product.title;
}

export default function ProductCompareButton({ product }: { product: CatalogProduct }) {
  const [added, setAdded] = useState(false);
  const key = productKey(product);

  useEffect(() => {
    const handleResult = (event: Event) => {
      const result = (event as CustomEvent<CompareResult>).detail;
      if (!result || result.key !== key) return;
      if (result.status === "added" || result.status === "duplicate") setAdded(true);
    };
    const handleState = (event: Event) => {
      const items = (event as CustomEvent<CatalogProduct[]>).detail;
      if (!Array.isArray(items)) return;
      setAdded(items.some((item) => productKey(item) === key));
    };

    window.addEventListener("hpt:compare:result", handleResult);
    window.addEventListener("hpt:compare:state", handleState);
    window.dispatchEvent(new CustomEvent("hpt:compare:request-state"));
    return () => {
      window.removeEventListener("hpt:compare:result", handleResult);
      window.removeEventListener("hpt:compare:state", handleState);
    };
  }, [key]);

  const handleClick = () => {
    if (added) {
      window.dispatchEvent(new CustomEvent("hpt:compare:open"));
      return;
    }

    window.dispatchEvent(new CustomEvent<CatalogProduct>("hpt:compare:add", { detail: product }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-100 hover:shadow-md"
    >
      {added ? <Check size={17} strokeWidth={3} /> : <Scale size={17} />}
      <span>{added ? "Xem danh sách so sánh" : "Thêm sản phẩm vào danh sách so sánh"}</span>
      <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
    </button>
  );
}
