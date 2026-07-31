"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";

/* Trạng thái mở/đóng panel "Danh mục sản phẩm" dùng CHUNG giữa hai band:
   - Nút kích hoạt nằm ở nav navy (CatalogMenuButton, trong Navbar).
   - Overlay + panel render trong Header (đúng vị trí sidebar chuẩn).
   Trước đây header có nút "Danh mục" đỏ riêng — đã gộp về một nút duy nhất
   ở nav nên state phải nâng lên context này. */

type CategoryMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const CategoryMenuContext = createContext<CategoryMenuContextValue | null>(null);

export function useCategoryMenu(): CategoryMenuContextValue {
  const context = useContext(CategoryMenuContext);
  if (!context) {
    throw new Error("useCategoryMenu phải được dùng bên trong CategoryMenuProvider");
  }
  return context;
}

export function CategoryMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Đóng panel khi điều hướng sang trang khác.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Khi panel mở: khóa scroll nền + đóng bằng phím Esc.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggle = useCallback(() => setOpen((value) => !value), []);
  const value = useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return (
    <CategoryMenuContext.Provider value={value}>
      {children}
    </CategoryMenuContext.Provider>
  );
}

/* Nút "Danh mục sản phẩm" duy nhất của site — khối đỏ đầu nav navy.
   Bấm → panel danh mục thả xuống ngay dưới nút (kiểu GearVN/An Phát). */
export function CatalogMenuButton() {
  const { open, toggle } = useCategoryMenu();

  return (
    <button
      type="button"
      className={`catalog-trigger${open ? " open" : ""}`}
      aria-expanded={open}
      aria-controls="headerCategoryPanel"
      onClick={toggle}
    >
      <Menu size={17} strokeWidth={2.5} aria-hidden="true" />
      Danh mục sản phẩm
      <ChevronDown
        size={15}
        strokeWidth={2.75}
        className="catalog-trigger-chevron"
        aria-hidden="true"
      />
    </button>
  );
}
