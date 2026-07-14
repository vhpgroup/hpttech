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

// Slug danh mục cha của nhóm máy scan (khớp categories.slug trong CMS).
const SCANNER_PARENT_SLUG = "may-scan";

/**
 * Dựng href tới trang danh sách sản phẩm với bộ lọc.
 * Mọi lọc chuyên biệt máy scan (size/speed/feature) được kèm category cha "may-scan"
 * để chỉ áp trong phạm vi máy scan. Các trục đều trỏ chung 1 kho SP (không nhân bản dữ liệu).
 */
function buildProductFilterHref(options: {
  category?: string;
  brand?: string;
  size?: string;
  speed?: string;
  feature?: string;
  func?: string;
  pspeed?: string;
  pfeat?: string;
}) {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.brand) params.set("brand", options.brand);
  if (options.size) params.set("size", options.size);
  if (options.speed) params.set("speed", options.speed);
  if (options.feature) params.set("feature", options.feature);
  if (options.func) params.set("func", options.func);
  if (options.pspeed) params.set("pspeed", options.pspeed);
  if (options.pfeat) params.set("pfeat", options.pfeat);
  return `/san-pham?${params.toString()}`;
}

// Slug danh mục cha nhóm máy in (khớp categories.slug trong CMS).
const PRINTER_PARENT_SLUG = "may-in";

const printerMegaColumns: MegaColumn[] = [
  {
    // Trục 1 — DANH MỤC THẬT (category): công nghệ in.
    title: "Theo công nghệ",
    links: [
      { label: "Máy in laser đen trắng", href: buildProductFilterHref({ category: "may-in-laser-den-trang" }) },
      { label: "Máy in laser màu", href: buildProductFilterHref({ category: "may-in-laser-mau" }) },
      { label: "Máy in phun", href: buildProductFilterHref({ category: "may-in-phun" }) },
      { label: "Máy in nhiệt / tem nhãn", href: buildProductFilterHref({ category: "may-in-nhiet-tem-nhan" }) },
      { label: "Máy in kim", href: buildProductFilterHref({ category: "may-in-kim" }) },
    ],
  },
  {
    // Trục 2 — BỘ LỌC theo chức năng.
    title: "Theo chức năng",
    links: [
      { label: "Máy in đơn năng", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, func: "don" }) },
      { label: "Đa năng (In-Copy-Scan)", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, func: "da" }) },
      { label: "Có Fax", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, func: "fax" }) },
    ],
  },
  {
    // Trục 3 — BỘ LỌC theo hãng.
    title: "Theo hãng",
    links: [
      { label: "HP", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, brand: "HP" }) },
      { label: "Canon", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, brand: "Canon" }) },
      { label: "Brother", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, brand: "Brother" }) },
      { label: "Epson", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, brand: "Epson" }) },
      { label: "Pantum", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, brand: "Pantum" }) },
      { label: "Ricoh", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, brand: "Ricoh" }) },
      { label: "Konica Minolta", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, brand: "Konica Minolta" }) },
    ],
  },
  {
    // Trục 4 — BỘ LỌC theo tốc độ/quy mô (printSpeedPpm).
    title: "Theo tốc độ / quy mô",
    links: [
      { label: "Cá nhân (≤20 trang/phút)", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, pspeed: "p1" }) },
      { label: "Văn phòng (21–40 trang/phút)", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, pspeed: "p2" }) },
      { label: "Nhóm làm việc (41–60 trang/phút)", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, pspeed: "p3" }) },
      { label: "In số lượng lớn (>60 trang/phút)", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, pspeed: "p4" }) },
    ],
  },
  {
    // Trục 5 — BỘ LỌC theo tính năng.
    title: "Theo tính năng",
    links: [
      { label: "In màu", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, pfeat: "color" }) },
      { label: "In 2 mặt tự động", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, pfeat: "duplex" }) },
      { label: "Kết nối mạng / WiFi", href: buildProductFilterHref({ category: PRINTER_PARENT_SLUG, pfeat: "network" }) },
    ],
  },
];

const scannerMegaColumns: MegaColumn[] = [
  {
    // Trục 1 — DANH MỤC THẬT (category, single-select). Link tới slug danh mục con.
    title: "Theo loại máy",
    links: [
      { label: "Máy scan tài liệu ADF", href: buildProductFilterHref({ category: "may-scan-tai-lieu-adf" }) },
      { label: "Máy scan ADF + Flatbed", href: buildProductFilterHref({ category: "may-scan-adf-flatbed" }) },
      { label: "Máy scan phẳng (Flatbed)", href: buildProductFilterHref({ category: "may-scan-phang" }) },
      { label: "Máy scan khổ lớn A2/A1/A0", href: buildProductFilterHref({ category: "may-scan-kho-lon" }) },
      { label: "Máy scan sách & số hóa", href: buildProductFilterHref({ category: "may-scan-sach-so-hoa" }) },
      { label: "Máy scan phim & ảnh", href: buildProductFilterHref({ category: "may-scan-phim-anh" }) },
      { label: "Máy scan di động / cầm tay", href: buildProductFilterHref({ category: "may-scan-di-dong" }) },
      { label: "Máy scan chuyên dụng", href: buildProductFilterHref({ category: "may-scan-chuyen-dung" }) },
    ],
  },
  {
    // Trục 2 — BỘ LỌC theo hãng (field brand).
    title: "Theo hãng",
    links: [
      { label: "Canon", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Canon" }) },
      { label: "Epson", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Epson" }) },
      { label: "HP", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "HP" }) },
      { label: "Ricoh / Fujitsu", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Ricoh" }) },
      { label: "Brother", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Brother" }) },
      { label: "Plustek", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Plustek" }) },
      { label: "Microtek", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Microtek" }) },
      { label: "Kodak Alaris", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Kodak Alaris" }) },
      { label: "Avision", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Avision" }) },
      { label: "Image Access", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Image Access" }) },
      { label: "Colortrac", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Colortrac" }) },
      { label: "Xerox", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Xerox" }) },
      { label: "Viisan", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Viisan" }) },
      { label: "Zeutschel", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Zeutschel" }) },
      { label: "Visioneer", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Visioneer" }) },
      { label: "Panasonic", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Panasonic" }) },
      { label: "Czur", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Czur" }) },
      { label: "ROWE", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "ROWE" }) },
      { label: "SMA", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "SMA" }) },
      { label: "Fuji Xerox", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Fuji Xerox" }) },
      { label: "GP", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "GP" }) },
    ],
  },
  {
    // Trục 3 — BỘ LỌC theo khổ giấy (scannerSpecs.maxPaperSize).
    title: "Theo khổ giấy",
    links: [
      { label: "Máy scan A4", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, size: "A4" }) },
      { label: "Máy scan A3", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, size: "A3" }) },
      { label: "Máy scan A2", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, size: "A2" }) },
      { label: "Máy scan A1", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, size: "A1" }) },
      { label: "Máy scan A0", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, size: "A0" }) },
    ],
  },
  {
    // Trục 4 — BỘ LỌC theo tốc độ/quy mô (scannerSpecs.scanSpeedSimplexPpm).
    title: "Theo tốc độ / quy mô",
    links: [
      { label: "Cá nhân / VP nhỏ (≤30 trang/phút)", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, speed: "soho" }) },
      { label: "Văn phòng (31–60 trang/phút)", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, speed: "office" }) },
      { label: "Phòng ban (61–100 trang/phút)", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, speed: "dept" }) },
      { label: "Trung tâm số hóa (>100 trang/phút)", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, speed: "production" }) },
    ],
  },
  {
    // Trục 5 — BỘ LỌC theo tính năng (cờ boolean trong scannerSpecs).
    title: "Theo tính năng",
    links: [
      { label: "Quét 2 mặt (Duplex)", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, feature: "duplex" }) },
      { label: "Quét màu", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, feature: "color" }) },
      { label: "OCR nhận dạng chữ", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, feature: "ocr" }) },
      { label: "Quét thẻ nhựa / CMND", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, feature: "card" }) },
      { label: "Quét hộ chiếu", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, feature: "passport" }) },
    ],
  },
];

function categoryLandingHref(category: { name: string; slug?: string }) {
  return `/san-pham?category=${encodeURIComponent(category.slug || category.name)}`;
}

function buildMegaColumns(category: ProductCategoryNavItem): MegaColumn[] {
  const nameKey = category.name.trim().toLowerCase();
  if (nameKey === "máy scan") {
    return scannerMegaColumns;
  }
  if (nameKey === "máy in") {
    return printerMegaColumns;
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
