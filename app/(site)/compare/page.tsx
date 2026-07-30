import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { getProductsBySlugsFromPayload } from "@/lib/catalog-payload";
import type { CatalogProduct } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import CompareTableClient, {
  type CompareGroup,
  type CompareItem,
  type CompareRow,
} from "@/components/compare/CompareTableClient";

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
    .replace(/[̀-ͯ]/g, "")
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

function rowOf(label: string, values: string[]): CompareRow {
  const present = values.filter((value) => value.trim().length > 0).length;
  const same = present === values.length && new Set(values).size === 1;
  return { label, values, same, sparse: present < 2 };
}

/**
 * Gom thuộc tính thành nhóm: Thông tin chung → Thông số chính (theo thứ tự ưu tiên)
 * → Thông số khác (alphabet). Giá không còn là một hàng — nó nằm ở header ghim
 * cùng CTA. Giá trị thiếu để trống, client hiển thị "—" thay vì "Đang cập nhật".
 */
function buildCompareGroups(items: CatalogProduct[]): CompareGroup[] {
  const itemSpecs = items.map(specsObject);
  const labels = new Map<string, string>();
  itemSpecs.forEach((specs) => {
    specs.forEach((spec, key) => {
      if (!labels.has(key)) labels.set(key, spec.label);
    });
  });

  const preferredKeys = SPEC_FALLBACK_ORDER.map(normalizedLabel);
  const mainKeys = preferredKeys.filter((key) => labels.has(key));
  const otherKeys = Array.from(labels.keys())
    .filter((key) => !preferredKeys.includes(key))
    .sort((a, b) => (labels.get(a) || a).localeCompare(labels.get(b) || b, "vi"));

  const specRow = (key: string) =>
    rowOf(labels.get(key) || key, itemSpecs.map((specs) => specs.get(key)?.value || ""));

  const groups: CompareGroup[] = [
    {
      name: "Thông tin chung",
      rows: [
        rowOf("Thương hiệu", items.map((item) => item.brand || "")),
        rowOf("Danh mục", items.map((item) => item.category || "")),
      ],
    },
  ];

  if (mainKeys.length) {
    groups.push({ name: "Thông số chính", rows: mainKeys.map(specRow) });
  }
  if (otherKeys.length) {
    groups.push({ name: "Thông số khác", rows: otherKeys.map(specRow) });
  }
  if (!mainKeys.length && !otherKeys.length) {
    groups.push({
      name: "Mô tả",
      rows: [rowOf("Mô tả", items.map((item) => item.detail || ""))],
    });
  }

  return groups;
}

function buildCompareItems(items: CatalogProduct[]): CompareItem[] {
  return items.map((item) => {
    const image = item.images?.[0]?.url || item.image || "";
    const href = item.href || (item.slug ? `/san-pham/${item.slug}` : "/san-pham");

    return {
      key: item.slug || item.title,
      title: item.title || "Sản phẩm",
      slug: item.slug || "",
      href,
      image,
      price: item.price || "",
      compareAtPrice: item.compareAtPrice || "",
      // Sản phẩm chưa có giá (Liên hệ) → client hiển thị nút "Nhận báo giá nhanh" thay vì thêm giỏ.
      cart: item.price
        ? {
            id: item.id,
            slug: item.slug,
            href,
            title: item.title,
            brand: item.brand,
            category: item.category,
            image,
            images: item.images,
            price: item.price,
          }
        : null,
    };
  });
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
          <CompareTableClient items={buildCompareItems(items)} groups={buildCompareGroups(items)} />
        </div>
      )}
    </main>
  );
}
