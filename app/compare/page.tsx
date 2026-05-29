"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { formatPrice, HPT_DATA, Product } from "@/lib/data";
import { HPT_PRODUCT_SPECS } from "@/lib/specs";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Scale } from "lucide-react";

const SPEC_FALLBACK_ORDER = [
  "Loại máy",
  "Khổ giấy",
  "Tốc độ quét",
  "Tốc độ in",
  "ADF",
  "Quét hai mặt",
  "In hai mặt",
  "Kết nối",
  "Độ phân giải quang học",
  "Công suất ngày",
  "Chức năng",
  "Nguồn điện",
  "Bộ nhớ",
];

function CompareContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const productsParam = searchParams.get("products");
    if (productsParam) {
      const ids = productsParam.split(",");
      const matched = HPT_DATA.products.filter((product) => ids.includes(product.id) || ids.includes(product.title));
      setItems(matched);
    }
  }, [searchParams]);

  if (items.length < 2) {
    return (
      <div className="compare-page-empty">
        <div className="compare-empty-icon">
          <Scale size={28} />
        </div>
        <h2>Chưa đủ sản phẩm để so sánh</h2>
        <p>Hãy chọn ít nhất 2 sản phẩm từ trang chủ hoặc trang danh mục.</p>
        <Link className="compare-page-back primary" href="/">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  // Gather unique spec labels across all items
  const labels = new Set<string>();
  items.forEach((item) => {
    const specs = HPT_PRODUCT_SPECS[item.href] || {};
    Object.keys(specs).forEach((label) => labels.add(label));
  });

  const orderedLabels = [
    ...SPEC_FALLBACK_ORDER.filter((label) => labels.has(label)),
    ...Array.from(labels).filter((label) => !SPEC_FALLBACK_ORDER.includes(label)).sort(),
  ];

  // Construct table rows
  const rows: [string, string[]][] = [
    ["Thương hiệu", items.map((item) => item.brand || "Đang cập nhật")],
    ["Danh mục", items.map((item) => item.category || "Đang cập nhật")],
  ];

  if (orderedLabels.length) {
    orderedLabels.forEach((label) => {
      rows.push([
        label,
        items.map((item) => {
          const specs = HPT_PRODUCT_SPECS[item.href] || {};
          return specs[label] || "Đang cập nhật";
        }),
      ]);
    });
  } else {
    rows.push(["Mô tả", items.map((item) => item.detail || "Đang cập nhật")]);
  }

  rows.push(["Giá", items.map((item) => formatPrice(item.price))]);

  return (
    <div className="compare-page-content">
      <div className="compare-page-table-wrap">
      <table className="compare-page-table">
        <thead>
          <tr>
            <th>Thuộc tính</th>
            {items.map((item, idx) => (
              <th key={idx}>
                <img
                  src={item.image || ""}
                  alt={item.title || "Sản phẩm"}
                />
                <strong>{item.title || "Sản phẩm"}</strong>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, values], rowIdx) => (
            <tr key={rowIdx}>
              <td>{label}</td>
              {values.map((val, valIdx) => (
                <td key={valIdx}>
                  {val}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td>Liên kết</td>
            {items.map((item, idx) => (
              <td key={idx}>
                <a
                  href={item.href || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="compare-product-link"
                >
                  Xem sản phẩm <ExternalLink size={14} />
                </a>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <main className="compare-page-main">
      <section className="compare-page-hero">
        <div>
          <p>HPT Tech</p>
          <h1>So sánh chi tiết sản phẩm</h1>
        </div>
        <Link className="compare-page-back" href="/">
          <ArrowLeft size={16} />
          Về trang chủ
        </Link>
      </section>
      <Suspense fallback={<div className="compare-page-empty">Đang tải bảng so sánh...</div>}>
        <CompareContent />
      </Suspense>
    </main>
  );
}
