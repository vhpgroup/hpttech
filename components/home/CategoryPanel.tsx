import Link from "next/link";
import type { CSSProperties } from "react";
import {
  BadgeCheck,
  BatteryCharging,
  Cable,
  Copy,
  Droplets,
  Eye,
  FolderOpen,
  GraduationCap,
  HardDrive,
  Laptop,
  List,
  Monitor,
  Network,
  Printer,
  Projector,
  ScanLine,
  Server,
  Video,
  Wrench,
  Workflow,
} from "lucide-react";
import type { ProductCategoryNavItem } from "@/lib/catalog-payload";

type MegaColumn = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

function buildCategoryFilterHref(category: string, options?: { search?: string; brand?: string }) {
  const params = new URLSearchParams();
  params.set("category", category);
  if (options?.search) params.set("search", options.search);
  if (options?.brand) params.set("brand", options.brand);
  return `/san-pham?${params.toString()}`;
}

const scannerMegaColumns: MegaColumn[] = [
  {
    title: "Theo nhu cầu",
    links: [
      { label: "Văn phòng", href: buildCategoryFilterHref("Máy scan", { search: "Văn phòng" }) },
      { label: "Doanh nghiệp", href: buildCategoryFilterHref("Máy scan", { search: "Doanh nghiệp" }) },
      { label: "Tốc độ cao", href: buildCategoryFilterHref("Máy scan", { search: "Tốc độ cao" }) },
      { label: "Di động", href: buildCategoryFilterHref("Máy scan", { search: "Di động" }) },
      { label: "Scan mạng", href: buildCategoryFilterHref("Máy scan", { search: "Scan mạng" }) },
      { label: "Số hóa tài liệu", href: buildCategoryFilterHref("Máy scan", { search: "Số hóa tài liệu" }) },
    ],
  },
  {
    title: "Loại máy scan",
    links: [
      { label: "ADF", href: buildCategoryFilterHref("Máy scan", { search: "ADF" }) },
      { label: "Flatbed", href: buildCategoryFilterHref("Máy scan", { search: "Flatbed" }) },
      { label: "Scan 2 mặt", href: buildCategoryFilterHref("Máy scan", { search: "Scan 2 mặt" }) },
      { label: "Duplex", href: buildCategoryFilterHref("Máy scan", { search: "Duplex" }) },
      { label: "Sheet-fed", href: buildCategoryFilterHref("Máy scan", { search: "Sheet-fed" }) },
      { label: "Network scanner", href: buildCategoryFilterHref("Máy scan", { search: "Network scanner" }) },
    ],
  },
  {
    title: "Khổ giấy / tính năng",
    links: [
      { label: "A4", href: buildCategoryFilterHref("Máy scan", { search: "A4" }) },
      { label: "A3", href: buildCategoryFilterHref("Máy scan", { search: "A3" }) },
      { label: "WiFi", href: buildCategoryFilterHref("Máy scan", { search: "WiFi" }) },
      { label: "USB", href: buildCategoryFilterHref("Máy scan", { search: "USB" }) },
      { label: "LAN", href: buildCategoryFilterHref("Máy scan", { search: "LAN" }) },
      { label: "Màn hình cảm ứng", href: buildCategoryFilterHref("Máy scan", { search: "Màn hình cảm ứng" }) },
    ],
  },
  {
    title: "Thương hiệu",
    links: [
      { label: "Ricoh", href: buildCategoryFilterHref("Máy scan", { brand: "Ricoh" }) },
      { label: "Brother", href: buildCategoryFilterHref("Máy scan", { brand: "Brother" }) },
      { label: "Epson", href: buildCategoryFilterHref("Máy scan", { brand: "Epson" }) },
      { label: "Plustek", href: buildCategoryFilterHref("Máy scan", { brand: "Plustek" }) },
      { label: "Microtek", href: buildCategoryFilterHref("Máy scan", { brand: "Microtek" }) },
    ],
  },
  {
    title: "Thương hiệu khác",
    links: [
      { label: "Canon", href: buildCategoryFilterHref("Máy scan", { brand: "Canon" }) },
      { label: "HP", href: buildCategoryFilterHref("Máy scan", { brand: "HP" }) },
      { label: "Kodak", href: buildCategoryFilterHref("Máy scan", { brand: "Kodak Alaris" }) },
      { label: "Fujitsu (Ricoh)", href: buildCategoryFilterHref("Máy scan", { search: "Fujitsu" }) },
      { label: "Avision", href: buildCategoryFilterHref("Máy scan", { brand: "Avision" }) },
    ],
  },
];

function categoryLandingHref(category: { name: string; slug?: string }) {
  return `/san-pham?category=${encodeURIComponent(category.slug || category.name)}`;
}

function buildMegaColumns(category: ProductCategoryNavItem): MegaColumn[] {
  if (category.name.trim().toLowerCase() === "máy scan") {
    return scannerMegaColumns;
  }

  if (!category.children.length) {
    return [];
  }

  const columnCount = Math.min(3, category.children.length);
  const chunkSize = Math.ceil(category.children.length / columnCount);
  const columns: MegaColumn[] = [];

  for (let index = 0; index < category.children.length; index += chunkSize) {
    const chunk = category.children.slice(index, index + chunkSize);
    columns.push({
      title: index === 0 ? category.name : `Nhóm ${columns.length + 1}`,
      links: chunk.map((child) => ({
        label: child.name,
        href: categoryLandingHref(child),
      })),
    });
  }

  return columns;
}

function getCategoryIcon(iconName: string, size = 20) {
  switch (iconName) {
    case "laptop":
      return <Laptop size={size} />;
    case "monitor":
      return <Monitor size={size} />;
    case "server":
      return <Server size={size} />;
    case "network":
      return <Network size={size} />;
    case "printer":
      return <Printer size={size} />;
    case "video":
      return <Video size={size} />;
    case "cctv":
      return <Eye size={size} />;
    case "graduation-cap":
      return <GraduationCap size={size} />;
    case "badge-check":
      return <BadgeCheck size={size} />;
    case "cable":
      return <Cable size={size} />;
    case "scan-line":
      return <ScanLine size={size} />;
    case "droplets":
      return <Droplets size={size} />;
    case "hard-drive":
      return <HardDrive size={size} />;
    case "wrench":
      return <Wrench size={size} />;
    case "workflow":
      return <Workflow size={size} />;
    case "copy":
      return <Copy size={size} />;
    case "projector":
      return <Projector size={size} />;
    case "battery-charging":
      return <BatteryCharging size={size} />;
    default:
      return <FolderOpen size={size} />;
  }
}

export default function CategoryPanel({ categories }: { categories: ProductCategoryNavItem[] }) {
  return (
    <aside className="category-panel desktop-only" id="categoryPanel">
      {categories.map((category, index) => {
        const megaColumns = buildMegaColumns(category);

        return (
          <article
            className="category-item"
            key={category.slug || category.name}
            style={{ ["--menu-index" as string]: index } as CSSProperties}
          >
            <Link href={categoryLandingHref(category)}>
              {getCategoryIcon(category.icon || "")}
              <span>{category.name}</span>
            </Link>
            {megaColumns.length ? <CategoryMegaPanel columns={megaColumns} /> : null}
          </article>
        );
      })}
      <article className="category-item">
        <Link href="/san-pham">
          <List size={20} />
          <span>Xem tất cả danh mục</span>
        </Link>
      </article>
    </aside>
  );
}

function CategoryMegaPanel({ columns }: { columns: MegaColumn[] }) {
  return (
    <div className="category-mega-panel">
      <div className="category-mega-grid">
        {columns.map((column) => (
          <div className="category-mega-col" key={column.title}>
            <h3>{column.title}</h3>
            <div>
              {column.links.map((link) => (
                <Link href={link.href} key={`${column.title}-${link.label}`}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
