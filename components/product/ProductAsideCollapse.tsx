"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* Dưới xl, cụm 5 widget cột phải của trang sản phẩm (Cam kết / Trợ giúp /
   Mua hàng / Tư vấn / Hỗ trợ kỹ thuật) dồn hết vào luồng dọc làm trang
   mobile dài ~8.300px (~10 màn hình cuộn — audit 03/08). Gói lại thành một
   khối đóng sẵn có nút mở; từ xl trở lên hiển thị đầy đủ như cũ. */
export function ProductAsideCollapse({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wide text-slate-800 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/70 transition-colors hover:text-primary-600 xl:hidden"
      >
        Cam kết và hỗ trợ mua hàng
        <ChevronDown
          size={18}
          className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <div className={cn("space-y-4", open ? "block" : "hidden", "xl:block")}>{children}</div>
    </>
  );
}
