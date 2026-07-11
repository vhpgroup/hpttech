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

// Mega-menu "Máy tính đồng bộ - Máy chủ" — chia đúng như An Phát (10 nhóm).
// Hãng của PC đồng bộ + thế hệ NUC = danh mục thật (link theo slug danh mục con);
// AIO/Server/Workstation/Công nghiệp để phẳng + lọc theo hãng/CPU/RAM (như An Phát).
const desktopServerMegaColumns: MegaColumn[] = [
  {
    title: "PC All-in-One",
    links: [
      { label: "Tất cả AIO", href: buildCategoryFilterHref("pc-all-in-one") },
      { label: "AIO HP", href: buildCategoryFilterHref("pc-all-in-one", { brand: "HP" }) },
      { label: "AIO ASUS", href: buildCategoryFilterHref("pc-all-in-one", { brand: "ASUS" }) },
      { label: "AIO Lenovo", href: buildCategoryFilterHref("pc-all-in-one", { brand: "Lenovo" }) },
      { label: "AIO Dell", href: buildCategoryFilterHref("pc-all-in-one", { brand: "Dell" }) },
      { label: "Màn hình 23.8 inch", href: buildCategoryFilterHref("pc-all-in-one", { search: "23.8" }) },
    ],
  },
  {
    title: "Máy tính đồng bộ — Theo hãng",
    links: [
      { label: "PC đồng bộ HP", href: buildCategoryFilterHref("pc-dong-bo-hp") },
      { label: "PC đồng bộ Dell", href: buildCategoryFilterHref("pc-dong-bo-dell") },
      { label: "PC đồng bộ Lenovo", href: buildCategoryFilterHref("pc-dong-bo-lenovo") },
      { label: "PC đồng bộ ASUS", href: buildCategoryFilterHref("pc-dong-bo-asus") },
      { label: "Tất cả PC đồng bộ", href: buildCategoryFilterHref("pc-dong-bo") },
    ],
  },
  {
    title: "PC đồng bộ HP",
    links: [
      { label: "Tất cả HP", href: buildCategoryFilterHref("pc-dong-bo-hp") },
      { label: "HP ProDesk", href: buildCategoryFilterHref("pc-dong-bo-hp", { search: "ProDesk" }) },
      { label: "HP EliteDesk", href: buildCategoryFilterHref("pc-dong-bo-hp", { search: "EliteDesk" }) },
      { label: "HP Pro Tower", href: buildCategoryFilterHref("pc-dong-bo-hp", { search: "Pro Tower" }) },
      { label: "CPU Core i5", href: buildCategoryFilterHref("pc-dong-bo-hp", { search: "i5" }) },
      { label: "CPU Core i7", href: buildCategoryFilterHref("pc-dong-bo-hp", { search: "i7" }) },
    ],
  },
  {
    title: "PC đồng bộ Dell",
    links: [
      { label: "Tất cả Dell", href: buildCategoryFilterHref("pc-dong-bo-dell") },
      { label: "Dell OptiPlex", href: buildCategoryFilterHref("pc-dong-bo-dell", { search: "OptiPlex" }) },
      { label: "Dell Pro Tower", href: buildCategoryFilterHref("pc-dong-bo-dell", { search: "Tower" }) },
      { label: "CPU Core i5", href: buildCategoryFilterHref("pc-dong-bo-dell", { search: "i5" }) },
      { label: "CPU Core i7", href: buildCategoryFilterHref("pc-dong-bo-dell", { search: "i7" }) },
    ],
  },
  {
    title: "PC đồng bộ Lenovo",
    links: [
      { label: "Tất cả Lenovo", href: buildCategoryFilterHref("pc-dong-bo-lenovo") },
      { label: "ThinkCentre", href: buildCategoryFilterHref("pc-dong-bo-lenovo", { search: "ThinkCentre" }) },
      { label: "ThinkCentre Neo", href: buildCategoryFilterHref("pc-dong-bo-lenovo", { search: "Neo" }) },
      { label: "CPU Core i5", href: buildCategoryFilterHref("pc-dong-bo-lenovo", { search: "i5" }) },
      { label: "CPU Core i7", href: buildCategoryFilterHref("pc-dong-bo-lenovo", { search: "i7" }) },
    ],
  },
  {
    title: "PC đồng bộ ASUS",
    links: [
      { label: "Tất cả ASUS", href: buildCategoryFilterHref("pc-dong-bo-asus") },
      { label: "ASUS ExpertCenter", href: buildCategoryFilterHref("pc-dong-bo-asus", { search: "ExpertCenter" }) },
      { label: "ASUS S500/D500", href: buildCategoryFilterHref("pc-dong-bo-asus", { search: "500" }) },
      { label: "CPU Core i5", href: buildCategoryFilterHref("pc-dong-bo-asus", { search: "i5" }) },
      { label: "CPU Core i7", href: buildCategoryFilterHref("pc-dong-bo-asus", { search: "i7" }) },
    ],
  },
  {
    title: "PC mini ASUS NUC",
    links: [
      { label: "ASUS NUC 12", href: buildCategoryFilterHref("nuc-gen-12") },
      { label: "ASUS NUC 13", href: buildCategoryFilterHref("nuc-gen-13") },
      { label: "ASUS NUC 14", href: buildCategoryFilterHref("nuc-gen-14") },
      { label: "ASUS NUC 15", href: buildCategoryFilterHref("nuc-gen-15") },
      { label: "ASUS NUC khác", href: buildCategoryFilterHref("nuc-khac") },
    ],
  },
  {
    title: "Máy chủ & Linh kiện",
    links: [
      { label: "Máy chủ - Server", href: buildCategoryFilterHref("may-chu-server") },
      { label: "Server Dell", href: buildCategoryFilterHref("may-chu-server", { brand: "Dell" }) },
      { label: "Server HP/HPE", href: buildCategoryFilterHref("may-chu-server", { brand: "HP" }) },
      { label: "Linh kiện máy chủ", href: buildCategoryFilterHref("linh-kien-may-chu") },
      { label: "RAM Server", href: buildCategoryFilterHref("linh-kien-may-chu", { search: "RAM" }) },
    ],
  },
  {
    title: "Máy trạm Workstation",
    links: [
      { label: "Tất cả Workstation", href: buildCategoryFilterHref("may-tram-workstation") },
      { label: "WS Dell", href: buildCategoryFilterHref("may-tram-workstation", { brand: "Dell" }) },
      { label: "WS Supermicro", href: buildCategoryFilterHref("may-tram-workstation", { brand: "Supermicro" }) },
      { label: "CPU Core i9", href: buildCategoryFilterHref("may-tram-workstation", { search: "i9" }) },
      { label: "CPU Xeon", href: buildCategoryFilterHref("may-tram-workstation", { search: "Xeon" }) },
    ],
  },
  {
    title: "Máy tính công nghiệp",
    links: [
      { label: "Tất cả công nghiệp", href: buildCategoryFilterHref("may-tinh-cong-nghiep") },
      { label: "Advantech", href: buildCategoryFilterHref("may-tinh-cong-nghiep", { brand: "Advantech" }) },
      { label: "CPU Core i5", href: buildCategoryFilterHref("may-tinh-cong-nghiep", { search: "i5" }) },
      { label: "CPU Core i7", href: buildCategoryFilterHref("may-tinh-cong-nghiep", { search: "i7" }) },
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

  if (category.name.trim().toLowerCase() === "máy tính đồng bộ - máy chủ") {
    return desktopServerMegaColumns;
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
