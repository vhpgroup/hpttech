"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";

const COMPARE_LIMIT = 4;

type CompareDockProps = {
  items: CatalogProduct[];
  products: CatalogProduct[];
  onAdd: (product: CatalogProduct) => void;
  onRemove: (product: CatalogProduct) => void;
  onClear: () => void;
};

export default function CompareDock({
  items,
  products,
  onAdd,
  onRemove,
  onClear,
}: CompareDockProps) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

  const slots = Array.from({ length: COMPARE_LIMIT }, (_, index) => items[index] || null);
  const canCompare = items.length >= 2;
  const compareHref = `/compare?products=${encodeURIComponent(items.map((p) => p.title).join(","))}`;
  const pickerResults = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (q.length < 3) return [];
    return products
      .filter((product) => !items.some((item) => item.title === product.title))
      .filter((product) =>
        [product.title, product.detail, product.brand, product.category].join(" ").toLowerCase().includes(q)
      )
      .slice(0, 16);
  }, [items, pickerQuery, products]);

  return (
    <div id="compareShell">
      <button className="compare-fab visible" type="button" aria-label="Mở so sánh sản phẩm" onClick={() => setOpen(true)}>
        So sánh ({items.length})
      </button>
      <button className={`compare-overlay ${open ? "open" : ""}`} type="button" aria-label="Đóng so sánh" onClick={() => {
        setOpen(false);
        setPickerOpen(false);
      }} />
      <aside className={`compare-drawer ${open ? "open" : ""}`} aria-hidden={open ? "false" : "true"}>
        <div className="compare-drawer-head">
          <h2>So sánh sản phẩm</h2>
          <button className="compare-close" type="button" aria-label="Đóng so sánh" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className="compare-drawer-body">
          <div className="compare-slot-grid">
            {slots.map((item, index) =>
              item ? (
                <article className="compare-slot filled" key={item.title}>
                  <button className="compare-remove" type="button" aria-label={`Xóa ${item.title}`} onClick={() => onRemove(item)}>
                    ×
                  </button>
                  <img src={item.image} alt={item.title} />
                  <h3>{item.title}</h3>
                  <p>{item.price}</p>
                </article>
              ) : (
                <button className="compare-slot empty" type="button" key={`empty-${index}`} onClick={() => {
                  setOpen(true);
                  setPickerOpen(true);
                  setPickerQuery("");
                }}>
                  <span className="compare-slot-plus">+</span>
                  <p>Thêm sản phẩm</p>
                </button>
              )
            )}
          </div>
          <div className="compare-actions">
            {canCompare ? (
              <Link className="compare-submit" href={compareHref}>
                So sánh ngay
              </Link>
            ) : (
              <button className="compare-submit" type="button" disabled>
                So sánh ngay
              </button>
            )}
            <button className={`compare-clear ${items.length ? "" : "hidden"}`} type="button" onClick={onClear}>
              Xóa tất cả sản phẩm
            </button>
          </div>
        </div>
      </aside>

      <div className={`compare-picker-overlay ${pickerOpen ? "open" : ""}`}>
        <section className={`compare-picker ${pickerOpen ? "open" : ""}`}>
          <div className="compare-picker-head">
            <button className="compare-picker-close" type="button" onClick={() => setPickerOpen(false)}>
              Đóng
            </button>
          </div>
          <div className="compare-picker-body">
            <label className="compare-picker-search">
              <Sparkles size={18} />
              <input
                type="search"
                value={pickerQuery}
                placeholder="Nhập tên sản phẩm để tìm"
                onChange={(event) => setPickerQuery(event.target.value)}
              />
            </label>
            <div className="compare-picker-feedback" id="comparePickerFeedback">
              {pickerQuery.trim().length < 3 ? (
                <p className="compare-picker-message error">Vui lòng nhập tối thiểu 3 ký tự!</p>
              ) : pickerResults.length ? (
                <div className="compare-picker-results">
                  {pickerResults.map((product) => (
                    <button className="compare-picker-item" type="button" key={product.title} onClick={() => {
                      onAdd(product);
                      setPickerOpen(false);
                    }}>
                      <img src={product.image} alt={product.title} />
                      <span>
                        <strong>{product.title}</strong>
                        <small>{product.brand}{product.category ? ` - ${product.category}` : ""}</small>
                      </span>
                      <b>{product.price}</b>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="compare-picker-message">Không tìm thấy sản phẩm phù hợp.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
