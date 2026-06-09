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
import { HPT_DATA } from "@/lib/data";

type MegaColumn = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

const defaultMegaColumns: MegaColumn[] = [
  {
    title: "Theo nhu cầu",
    links: [
      catalogSearch("Văn phòng"),
      catalogSearch("Doanh nghiệp"),
      catalogSearch("Hiệu suất cao"),
      catalogSearch("Dịch vụ kỹ thuật"),
    ],
  },
  {
    title: "Thương hiệu",
    links: [catalogBrand("HP"), catalogBrand("Brother"), catalogBrand("Epson"), catalogBrand("Ricoh")],
  },
  {
    title: "Thiết bị",
    links: [catalogCategory("Máy scan"), catalogCategory("Máy in"), catalogSearch("Thiết bị văn phòng"), catalogSearch("Phụ kiện")],
  },
];

const megaByCategory: Record<string, MegaColumn[]> = {
  "Laptop doanh nghiệp": [
    {
      title: "Laptop",
      links: [catalogSearch("Laptop doanh nghiệp"), catalogSearch("Laptop văn phòng"), catalogSearch("Laptop di động"), catalogSearch("Laptop hiệu năng cao")],
    },
    {
      title: "Theo nhu cầu",
      links: [catalogSearch("Làm việc văn phòng"), catalogSearch("Di chuyển nhiều"), catalogSearch("Thiết kế"), catalogSearch("Doanh nghiệp SMB")],
    },
    {
      title: "Thương hiệu",
      links: [catalogBrand("HP"), catalogBrand("Fujitsu"), catalogBrand("Brother"), catalogBrand("Epson")],
    },
  ],
  "Máy tính để bàn": [
    {
      title: "Máy bộ",
      links: [catalogSearch("Máy bộ"), catalogSearch("PC văn phòng"), catalogSearch("PC học tập"), catalogSearch("PC làm việc")],
    },
    {
      title: "Màn hình",
      links: [catalogSearch("Màn hình"), catalogSearch("Màn hình văn phòng"), catalogSearch("Màn hình doanh nghiệp"), catalogSearch("Màn hình đồ họa")],
    },
    {
      title: "Phụ kiện",
      links: [catalogSearch("Linh kiện"), catalogSearch("Thiết bị lưu trữ"), catalogSearch("UPS"), catalogSearch("Nguồn điện")],
    },
  ],
  "Thiết bị văn phòng": [
    {
      title: "Máy in",
      links: [catalogCategory("Máy in"), catalogBrand("HP"), catalogBrand("Brother"), catalogBrand("Epson")],
    },
    {
      title: "Máy scan",
      links: [catalogCategory("Máy scan"), catalogBrand("Ricoh"), catalogBrand("Plustek"), catalogBrand("Microtek")],
    },
    {
      title: "Vật tư",
      links: [catalogSearch("Mực in"), catalogSearch("Giấy"), catalogSearch("Máy photocopy"), catalogSearch("Thiết bị văn phòng")],
    },
  ],
  "Máy in": [
    {
      title: "Máy in",
      links: [catalogCategory("Máy in"), catalogBrand("HP"), catalogBrand("Brother"), catalogBrand("Epson")],
    },
    {
      title: "Nhu cầu in",
      links: [catalogSearch("Laser"), catalogSearch("In màu"), catalogSearch("Đa năng"), catalogSearch("WiFi")],
    },
    {
      title: "Vật tư",
      links: [catalogSearch("Mực in"), catalogSearch("PaperOne"), catalogSearch("OJI Paper"), catalogSearch("Bảo trì")],
    },
  ],
  "Máy scan": [
    {
      title: "Máy scan",
      links: [catalogCategory("Máy scan"), catalogBrand("Ricoh"), catalogBrand("Brother"), catalogBrand("Epson")],
    },
    {
      title: "Khổ giấy",
      links: [catalogSearch("A4"), catalogSearch("A3"), catalogSearch("ADF"), catalogSearch("Flatbed")],
    },
    {
      title: "Số hóa",
      links: [catalogSearch("Số hóa tài liệu"), catalogSearch("Scan 2 mặt"), catalogSearch("Công suất cao"), catalogSearch("Văn phòng")],
    },
  ],
};

function catalogSearch(label: string) {
  return { label, href: `/san-pham?search=${encodeURIComponent(label)}` };
}

function catalogCategory(label: string) {
  return { label, href: `/san-pham?category=${encodeURIComponent(label)}` };
}

function catalogBrand(label: string) {
  return { label, href: `/san-pham?brand=${encodeURIComponent(label)}` };
}

function categoryLandingHref(label: string) {
  const hasMatchingProducts = ["Máy in", "Máy scan"].includes(label);
  return hasMatchingProducts ? `/san-pham?category=${encodeURIComponent(label)}` : `/san-pham?search=${encodeURIComponent(label)}`;
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

export default function CategoryPanel() {
  return (
    <aside className="category-panel desktop-only" id="categoryPanel">
      {HPT_DATA.categories.map((cat, index) => (
        <article className="category-item" key={cat.name} style={{ ["--menu-index" as string]: index } as CSSProperties}>
          <Link href={categoryLandingHref(cat.name)}>
            {getCategoryIcon(cat.icon)}
            <span>{cat.name}</span>
          </Link>
          <CategoryMegaPanel columns={megaByCategory[cat.name] || defaultMegaColumns} />
        </article>
      ))}
      <article className="category-item">
        <Link href="/san-pham">
          <List size={20} />
          <span>Xem tất cả danh mục</span>
        </Link>
        <CategoryMegaPanel columns={defaultMegaColumns} />
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
