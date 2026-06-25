import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Scale } from "lucide-react";
import { getProductsBySlugsFromPayload } from "@/lib/catalog-payload";
import type { CatalogProduct } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { SubpageHeader } from "@/components/layout/SubpageHeader";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "So sánh sản phẩm",
  description: "So sánh nhanh thông số, giá và danh mục sản phẩm thiết bị văn phòng tại HPT Tech.",
  path: "/compare",
});

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

type ComparePageProps = {
  searchParams?: Promise<{
    products?: string;
  }>;
};

function normalizedLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const RESERVED_SPEC_LABELS = new Set(["thuong hieu", "danh muc", "gia"]);

function specsObject(item: CatalogProduct) {
  const specs = new Map<string, { label: string; value: string }>();
  for (const spec of item.specs || []) {
    const key = normalizedLabel(spec.label);
    if (!key || RESERVED_SPEC_LABELS.has(key) || specs.has(key)) continue;
    specs.set(key, spec);
  }
  return specs;
}

function getCompareRows(items: CatalogProduct[]) {
  const itemSpecs = items.map(specsObject);
  const labels = new Map<string, string>();
  itemSpecs.forEach((specs) => {
    specs.forEach((spec, key) => {
      if (!labels.has(key)) labels.set(key, spec.label);
    });
  });

  const preferredKeys = SPEC_FALLBACK_ORDER.map(normalizedLabel);
  const orderedKeys = [
    ...preferredKeys.filter((key) => labels.has(key)),
    ...Array.from(labels.keys())
      .filter((key) => !preferredKeys.includes(key))
      .sort((a, b) =>
        (labels.get(a) || a).localeCompare(labels.get(b) || b, "vi"),
      ),
  ];

  const rows: [string, string[]][] = [
    ["Thương hiệu", items.map((item) => item.brand || "Đang cập nhật")],
    ["Danh mục", items.map((item) => item.category || "Đang cập nhật")],
  ];

  if (orderedKeys.length) {
    orderedKeys.forEach((key) => {
      rows.push([
        labels.get(key) || key,
        itemSpecs.map((specs) => specs.get(key)?.value || "Đang cập nhật"),
      ]);
    });
  } else {
    rows.push(["Mô tả", items.map((item) => item.detail || "Đang cập nhật")]);
  }

  rows.push(["Giá", items.map((item) => item.price || "Liên hệ")]);
  return rows;
}

function EmptyCompare() {
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

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const requestedKeys = params?.products
    ? params.products.split(",").map((key) => key.trim()).filter(Boolean)
    : [];
  const items = requestedKeys.length ? await getProductsBySlugsFromPayload(requestedKeys, 8) : [];
  const rows = getCompareRows(items);

  return (
    <main className="compare-page-main">
      <SubpageHeader
        eyebrow="Công cụ mua hàng"
        title="So sánh sản phẩm"
        description="So sánh nhanh thông số, giá và danh mục sản phẩm thiết bị văn phòng tại HPT Tech."
        badge={items.length ? `${items.length} sản phẩm` : undefined}
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "So sánh sản phẩm" },
        ]}
        className="mb-6"
      />

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

      {items.length < 2 ? (
        <EmptyCompare />
      ) : (
        <div className="compare-page-content">
          <div className="compare-page-table-wrap">
            <table className="compare-page-table">
              <thead>
                <tr>
                  <th>Thuộc tính</th>
                  {items.map((item) => {
                    const image = item.images?.[0]?.url || item.image;

                    return (
                      <th key={item.slug || item.title}>
                        {image ? <Image src={image} alt={item.title || "Sản phẩm"} width={120} height={90} sizes="120px" /> : null}
                        <strong>{item.title || "Sản phẩm"}</strong>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, values]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {values.map((value, index) => (
                      <td key={`${label}-${index}`}>{value}</td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>Liên kết</td>
                  {items.map((item) => (
                    <td key={item.slug || item.title}>
                      <Link href={item.href || `/san-pham/${item.slug}`} className="compare-product-link">
                        Xem sản phẩm <ExternalLink size={14} />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
