import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { List } from "lucide-react";
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
  lic?: string;
  aud?: string;
  fb?: string;
  mau?: string;
  orig?: string;
  cpu?: string;
  ram?: string;
  gpu?: string;
  sc?: string;
  line?: string;
}) {
  const params = new URLSearchParams();
  if (options.brand) params.set("brand", options.brand);
  if (options.size) params.set("size", options.size);
  if (options.speed) params.set("speed", options.speed);
  if (options.feature) params.set("feature", options.feature);
  if (options.func) params.set("func", options.func);
  if (options.pspeed) params.set("pspeed", options.pspeed);
  if (options.pfeat) params.set("pfeat", options.pfeat);
  if (options.lic) params.set("lic", options.lic);
  if (options.aud) params.set("aud", options.aud);
  if (options.fb) params.set("fb", options.fb);
  if (options.mau) params.set("mau", options.mau);
  if (options.orig) params.set("orig", options.orig);
  if (options.cpu) params.set("cpu", options.cpu);
  if (options.ram) params.set("ram", options.ram);
  if (options.gpu) params.set("gpu", options.gpu);
  if (options.sc) params.set("sc", options.sc);
  if (options.line) params.set("line", options.line);
  const query = params.toString();

  // Có danh mục → trỏ về LANDING PAGE rút gọn /<slug> của danh mục (kiểu An Phát);
  // bộ lọc kèm theo đi dưới dạng query trên landing. Không danh mục → /san-pham.
  if (options.category) {
    return `/${encodeURIComponent(options.category)}${query ? `?${query}` : ""}`;
  }
  return `/san-pham${query ? `?${query}` : ""}`;
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
      { label: "Máy chiếu vật thể (Document Camera)", href: buildProductFilterHref({ category: "may-chieu-vat-the-document-camera" }) },
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
      { label: "Joyusing", href: buildProductFilterHref({ category: SCANNER_PARENT_SLUG, brand: "Joyusing" }) },
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

// Slug danh mục cha nhóm phần mềm bản quyền (khớp categories.slug trong CMS).
const SOFTWARE_PARENT_SLUG = "phan-mem-ban-quyen";

const softwareMegaColumns: MegaColumn[] = [
  {
    // Trục 1 — DANH MỤC THẬT (category): nhóm phần mềm.
    title: "Theo nhóm phần mềm",
    links: [
      { label: "Hệ điều hành", href: buildProductFilterHref({ category: "phan-mem-he-dieu-hanh" }) },
      { label: "Office & ứng dụng văn phòng", href: buildProductFilterHref({ category: "phan-mem-office-van-phong" }) },
      { label: "Microsoft 365 & dịch vụ đám mây", href: buildProductFilterHref({ category: "microsoft-365-dich-vu-dam-may" }) },
      { label: "Windows Server & SQL", href: buildProductFilterHref({ category: "windows-server-sql" }) },
      { label: "Diệt virus & bảo mật", href: buildProductFilterHref({ category: "phan-mem-diet-virus-bao-mat" }) },
      { label: "Thiết kế & sáng tạo", href: buildProductFilterHref({ category: "phan-mem-thiet-ke-sang-tao" }) },
      { label: "CAD & kỹ thuật", href: buildProductFilterHref({ category: "phan-mem-cad-ky-thuat" }) },
      { label: "Tiện ích & AI", href: buildProductFilterHref({ category: "phan-mem-tien-ich-ai" }) },
    ],
  },
  {
    // Trục 2 — BỘ LỌC theo hãng (field brand).
    title: "Theo hãng",
    links: [
      { label: "Microsoft", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "Microsoft" }) },
      { label: "Adobe", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "Adobe" }) },
      { label: "Kaspersky", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "Kaspersky" }) },
      { label: "Autodesk", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "Autodesk" }) },
      { label: "Canva", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "Canva" }) },
      { label: "Bkav", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "Bkav" }) },
      { label: "OpenAI", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "OpenAI" }) },
      { label: "CapCut", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "CapCut" }) },
      { label: "TeamViewer", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, brand: "TeamViewer" }) },
    ],
  },
  {
    // Trục 3 — BỘ LỌC theo hình thức bản quyền (regex tên SP, whitelist phía server).
    title: "Theo bản quyền",
    links: [
      { label: "Vĩnh viễn (key/box)", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, lic: "vinhvien" }) },
      { label: "Thuê bao (theo năm)", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, lic: "thuebao" }) },
    ],
  },
  {
    // Trục 4 — BỘ LỌC theo đối tượng sử dụng.
    title: "Theo đối tượng",
    links: [
      { label: "Cá nhân & gia đình", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, aud: "canhan" }) },
      { label: "Doanh nghiệp", href: buildProductFilterHref({ category: SOFTWARE_PARENT_SLUG, aud: "doanhnghiep" }) },
    ],
  },
];

// Slug danh mục cha nhóm mực in & phụ kiện (khớp categories.slug trong CMS).
const INK_PARENT_SLUG = "muc-in-phu-kien";

const inkMegaColumns: MegaColumn[] = [
  {
    // Trục 1 — DANH MỤC THẬT (category): loại vật tư.
    title: "Theo loại vật tư",
    links: [
      { label: "Mực in laser (Toner)", href: buildProductFilterHref({ category: "muc-in-laser" }) },
      { label: "Mực in phun (Cartridge)", href: buildProductFilterHref({ category: "muc-in-phun-cartridge" }) },
      { label: "Mực chai / bình (Ink Tank)", href: buildProductFilterHref({ category: "muc-chai-binh" }) },
      { label: "Mực máy photocopy", href: buildProductFilterHref({ category: "muc-may-photocopy" }) },
      { label: "Trống / Drum", href: buildProductFilterHref({ category: "trong-drum" }) },
      { label: "Ruy băng & mực in tem nhãn", href: buildProductFilterHref({ category: "ruy-bang-muc-in-tem" }) },
      { label: "Linh kiện & phụ kiện in ấn", href: buildProductFilterHref({ category: "linh-kien-phu-kien-in" }) },
    ],
  },
  {
    // Trục 2 — BỘ LỌC theo hãng máy sử dụng (regex tên SP, whitelist phía server).
    title: "Dùng cho máy hãng",
    links: [
      { label: "HP", href: buildProductFilterHref({ category: INK_PARENT_SLUG, fb: "hp" }) },
      { label: "Canon", href: buildProductFilterHref({ category: INK_PARENT_SLUG, fb: "canon" }) },
      { label: "Brother", href: buildProductFilterHref({ category: INK_PARENT_SLUG, fb: "brother" }) },
      { label: "Epson", href: buildProductFilterHref({ category: INK_PARENT_SLUG, fb: "epson" }) },
      { label: "Ricoh", href: buildProductFilterHref({ category: INK_PARENT_SLUG, fb: "ricoh" }) },
      { label: "Fuji Xerox / Fujifilm", href: buildProductFilterHref({ category: INK_PARENT_SLUG, fb: "fujixerox" }) },
      { label: "Pantum", href: buildProductFilterHref({ category: INK_PARENT_SLUG, fb: "pantum" }) },
    ],
  },
  {
    // Trục 3 — BỘ LỌC theo màu mực.
    title: "Theo màu mực",
    links: [
      { label: "Đen", href: buildProductFilterHref({ category: INK_PARENT_SLUG, mau: "den" }) },
      { label: "Xanh (Cyan)", href: buildProductFilterHref({ category: INK_PARENT_SLUG, mau: "xanh" }) },
      { label: "Đỏ (Magenta)", href: buildProductFilterHref({ category: INK_PARENT_SLUG, mau: "do" }) },
      { label: "Vàng (Yellow)", href: buildProductFilterHref({ category: INK_PARENT_SLUG, mau: "vang" }) },
      { label: "Bộ nhiều màu", href: buildProductFilterHref({ category: INK_PARENT_SLUG, mau: "bo" }) },
    ],
  },
  {
    // Trục 4 — BỘ LỌC theo nguồn gốc.
    title: "Theo nguồn gốc",
    links: [
      { label: "Mực chính hãng", href: buildProductFilterHref({ category: INK_PARENT_SLUG, orig: "chinhhang" }) },
      { label: "Mực tương thích", href: buildProductFilterHref({ category: INK_PARENT_SLUG, orig: "tuongthich" }) },
    ],
  },
];

// Slug danh mục cha nhóm máy tính đồng bộ - máy chủ (khớp categories.slug trong CMS).
const PC_PARENT_SLUG = "may-tinh-dong-bo-may-chu";

const pcMegaColumns: MegaColumn[] = [
  {
    // Trục 1 — DANH MỤC THẬT (category): dòng máy.
    title: "Theo dòng máy",
    links: [
      { label: "PC đồng bộ", href: buildProductFilterHref({ category: "pc-dong-bo" }) },
      { label: "PC All-in-One", href: buildProductFilterHref({ category: "pc-all-in-one" }) },
      { label: "Mini PC - NUC", href: buildProductFilterHref({ category: "mini-pc-nuc" }) },
      { label: "Máy trạm Workstation", href: buildProductFilterHref({ category: "may-tram-workstation" }) },
      { label: "Máy chủ - Server", href: buildProductFilterHref({ category: "may-chu-server" }) },
      { label: "Linh kiện máy chủ", href: buildProductFilterHref({ category: "linh-kien-may-chu" }) },
      { label: "Máy tính công nghiệp", href: buildProductFilterHref({ category: "may-tinh-cong-nghiep" }) },
    ],
  },
  {
    // Trục 2 — BỘ LỌC theo hãng (field brand).
    title: "Theo hãng",
    links: [
      { label: "HP", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "HP" }) },
      { label: "Dell", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "Dell" }) },
      { label: "Lenovo", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "Lenovo" }) },
      { label: "ASUS", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "ASUS" }) },
      { label: "Supermicro", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "Supermicro" }) },
      { label: "AOC", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "AOC" }) },
      { label: "SingPC", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "SingPC" }) },
      { label: "Advantech", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "Advantech" }) },
      { label: "MSI", href: buildProductFilterHref({ category: PC_PARENT_SLUG, brand: "MSI" }) },
    ],
  },
  {
    // Trục 3 — BỘ LỌC theo CPU (tên + spec, whitelist phía server).
    title: "Theo CPU",
    links: [
      { label: "Intel Core i3 / Core 3", href: buildProductFilterHref({ category: PC_PARENT_SLUG, cpu: "i3" }) },
      { label: "Intel Core i5 / Core 5", href: buildProductFilterHref({ category: PC_PARENT_SLUG, cpu: "i5" }) },
      { label: "Intel Core i7 / Core 7", href: buildProductFilterHref({ category: PC_PARENT_SLUG, cpu: "i7" }) },
      { label: "Intel Core i9 / Core 9", href: buildProductFilterHref({ category: PC_PARENT_SLUG, cpu: "i9" }) },
      { label: "Intel Core Ultra", href: buildProductFilterHref({ category: PC_PARENT_SLUG, cpu: "ultra" }) },
      { label: "Intel Xeon (trạm / chủ)", href: buildProductFilterHref({ category: PC_PARENT_SLUG, cpu: "xeon" }) },
      { label: "AMD Ryzen", href: buildProductFilterHref({ category: PC_PARENT_SLUG, cpu: "ryzen" }) },
    ],
  },
  {
    // Trục 4 — BỘ LỌC theo RAM (cột số desktop/server_specs_ram_gb).
    title: "Theo RAM",
    links: [
      { label: "RAM 8GB", href: buildProductFilterHref({ category: PC_PARENT_SLUG, ram: "8" }) },
      { label: "RAM 16GB", href: buildProductFilterHref({ category: PC_PARENT_SLUG, ram: "16" }) },
      { label: "RAM 32GB trở lên", href: buildProductFilterHref({ category: PC_PARENT_SLUG, ram: "32" }) },
    ],
  },
];

// Slug danh mục laptop gaming - đồ họa (khớp categories.slug trong CMS).
const LAPTOP_PARENT_SLUG = "laptop-gaming-do-hoa";

const laptopMegaColumns: MegaColumn[] = [
  {
    // Trục 1 — BỘ LỌC theo hãng (field brand).
    title: "Theo hãng",
    links: [
      { label: "ASUS", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, brand: "ASUS" }) },
      { label: "Lenovo", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, brand: "Lenovo" }) },
      { label: "Acer", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, brand: "Acer" }) },
      { label: "MSI", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, brand: "MSI" }) },
      { label: "HP", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, brand: "HP" }) },
      { label: "Gigabyte", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, brand: "Gigabyte" }) },
      { label: "Dell", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, brand: "Dell" }) },
    ],
  },
  {
    // Trục 2 — BỘ LỌC theo CPU (dùng chung whitelist cpu với PC/máy chủ).
    title: "Theo CPU",
    links: [
      { label: "Intel Core Ultra", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, cpu: "ultra" }) },
      { label: "Intel Core i9", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, cpu: "i9" }) },
      { label: "Intel Core i7", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, cpu: "i7" }) },
      { label: "Intel Core i5", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, cpu: "i5" }) },
      { label: "AMD Ryzen", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, cpu: "ryzen" }) },
    ],
  },
  {
    // Trục 3 — BỘ LỌC theo GPU (thế hệ card rời).
    title: "Theo card đồ họa",
    links: [
      { label: "RTX 50 series", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, gpu: "rtx50" }) },
      { label: "RTX 40 series", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, gpu: "rtx40" }) },
      { label: "RTX 20/30 series", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, gpu: "rtx30" }) },
      { label: "GTX / Radeon RX", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, gpu: "radeon" }) },
    ],
  },
  {
    // Trục 4 — BỘ LỌC theo RAM (cột số laptop_specs_ram_gb).
    title: "Theo RAM",
    links: [
      { label: "RAM 8GB", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, ram: "8" }) },
      { label: "RAM 16GB", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, ram: "16" }) },
      { label: "RAM 32GB trở lên", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, ram: "32" }) },
    ],
  },
  {
    // Trục 5 — BỘ LỌC theo kích màn hình (cột số laptop_specs_screen_size_inch).
    title: "Theo màn hình",
    links: [
      { label: "14 inch trở xuống", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, sc: "14" }) },
      { label: "15.6 inch", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, sc: "15" }) },
      { label: "16 inch", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, sc: "16" }) },
      { label: "17 inch trở lên", href: buildProductFilterHref({ category: LAPTOP_PARENT_SLUG, sc: "17" }) },
    ],
  },
];

// Slug danh mục laptop văn phòng (khớp categories.slug trong CMS — giữ slug "laptop" cũ).
const OFFICE_LAPTOP_PARENT_SLUG = "laptop";

const officeLaptopMegaColumns: MegaColumn[] = [
  {
    // Trục 1 — BỘ LỌC theo hãng (field brand).
    title: "Theo hãng",
    links: [
      { label: "ASUS", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, brand: "ASUS" }) },
      { label: "Lenovo", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, brand: "Lenovo" }) },
      { label: "Dell", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, brand: "Dell" }) },
      { label: "Acer", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, brand: "Acer" }) },
      { label: "MSI", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, brand: "MSI" }) },
      { label: "HP", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, brand: "HP" }) },
    ],
  },
  {
    // Trục 2 — BỘ LỌC theo CPU (whitelist dùng chung, có cả chip ARM Snapdragon).
    title: "Theo CPU",
    links: [
      { label: "Intel Core Ultra", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, cpu: "ultra" }) },
      { label: "Intel Core i7", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, cpu: "i7" }) },
      { label: "Intel Core i5", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, cpu: "i5" }) },
      { label: "Intel Core i3", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, cpu: "i3" }) },
      { label: "AMD Ryzen", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, cpu: "ryzen" }) },
      { label: "Snapdragon (ARM)", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, cpu: "snapdragon" }) },
    ],
  },
  {
    // Trục 3 — BỘ LỌC theo RAM (cột số laptop_specs_ram_gb).
    title: "Theo RAM",
    links: [
      { label: "RAM 8GB", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, ram: "8" }) },
      { label: "RAM 16GB", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, ram: "16" }) },
      { label: "RAM 32GB trở lên", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, ram: "32" }) },
    ],
  },
  {
    // Trục 4 — BỘ LỌC theo kích màn hình (nhóm văn phòng không có 17").
    title: "Theo màn hình",
    links: [
      { label: "14 inch trở xuống", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, sc: "14" }) },
      { label: "15.6 inch", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, sc: "15" }) },
      { label: "16 inch", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, sc: "16" }) },
    ],
  },
  {
    // Trục 5 — BỘ LỌC theo dòng máy (regex tên, whitelist).
    title: "Theo dòng",
    links: [
      { label: "ThinkPad", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, line: "thinkpad" }) },
      { label: "Vivobook", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, line: "vivobook" }) },
      { label: "Zenbook", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, line: "zenbook" }) },
      { label: "Yoga", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, line: "yoga" }) },
      { label: "Swift", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, line: "swift" }) },
      { label: "IdeaPad", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, line: "ideapad" }) },
      { label: "XPS", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, line: "xps" }) },
      { label: "Prestige / Modern", href: buildProductFilterHref({ category: OFFICE_LAPTOP_PARENT_SLUG, line: "prestige" }) },
    ],
  },
];

// Mega-menu "Thiết bị mạng" — 4 nhóm theo bản chất thiết bị (cây danh mục thật 3 tầng).
// Mỗi cột: "Tất cả …" trỏ danh mục cấp 2 (gom cả nhóm qua filter 2/3 tầng) + các danh mục lá cấp 3.
const networkMegaColumns: MegaColumn[] = [
  {
    title: "Router - Bộ phát Wifi - 4G",
    links: [
      { label: "Tất cả Router & Wifi", href: buildProductFilterHref({ category: "router-bo-phat-wifi-4g" }) },
      { label: "Router Wifi", href: buildProductFilterHref({ category: "router-wifi" }) },
      { label: "Mesh / Mở rộng sóng", href: buildProductFilterHref({ category: "mesh-bo-mo-rong-song" }) },
      { label: "Access Point / Controller", href: buildProductFilterHref({ category: "access-point-controller" }) },
      { label: "Router 4G / LTE", href: buildProductFilterHref({ category: "router-4g-lte" }) },
    ],
  },
  {
    title: "Switch - Chia mạng",
    links: [
      { label: "Tất cả Switch", href: buildProductFilterHref({ category: "thiet-bi-chia-mang-switch" }) },
      { label: "Switch thường", href: buildProductFilterHref({ category: "switch-thuong" }) },
      { label: "Switch PoE", href: buildProductFilterHref({ category: "switch-poe" }) },
      { label: "Switch Smart / Quản lý", href: buildProductFilterHref({ category: "switch-smart-quan-ly" }) },
    ],
  },
  {
    title: "Card mạng",
    links: [
      { label: "Tất cả Card mạng", href: buildProductFilterHref({ category: "card-mang-nw" }) },
      { label: "Card USB Wifi", href: buildProductFilterHref({ category: "card-usb-wifi" }) },
      { label: "Card PCIe", href: buildProductFilterHref({ category: "card-pcie" }) },
      { label: "Card Wifi khác", href: buildProductFilterHref({ category: "card-wifi-khac" }) },
      { label: "Card mạng có dây", href: buildProductFilterHref({ category: "card-mang-co-day" }) },
    ],
  },
  {
    title: "Linh phụ kiện TB mạng",
    links: [
      { label: "Tất cả linh phụ kiện", href: buildProductFilterHref({ category: "linh-phu-kien-tb-mang" }) },
      { label: "Kìm bấm, Cáp mạng, Tool", href: buildProductFilterHref({ category: "kim-bam-cap-mang-tool" }) },
      { label: "Thiết bị Firewall", href: buildProductFilterHref({ category: "thiet-bi-firewall" }) },
      { label: "Tủ mạng / Rack", href: buildProductFilterHref({ category: "tu-mang-rack" }) },
      { label: "Converter / Module quang", href: buildProductFilterHref({ category: "converter-module-quang" }) },
      { label: "Nguồn PoE / Adapter", href: buildProductFilterHref({ category: "nguon-poe-adapter" }) },
      { label: "Cân bằng tải", href: buildProductFilterHref({ category: "can-bang-tai" }) },
    ],
  },
];

function categoryLandingHref(category: { name: string; slug?: string }) {
  // Landing page rút gọn /<slug> của danh mục (kiểu An Phát).
  // Mục nav CHƯA có category trong CMS (không slug — vd Máy chiếu, UPS, Lưu trữ...)
  // → về catalog tổng thay vì phát URL tên-encode 404.
  if (!category.slug) return "/san-pham";
  return `/${encodeURIComponent(category.slug)}`;
}

function buildMegaColumns(category: ProductCategoryNavItem): MegaColumn[] {
  const nameKey = category.name.trim().toLowerCase();
  if (nameKey === "máy scan") {
    return scannerMegaColumns;
  }
  if (nameKey === "máy in") {
    return printerMegaColumns;
  }
  if (nameKey === "phần mềm bản quyền") {
    return softwareMegaColumns;
  }
  if (nameKey === "mực in & phụ kiện" || nameKey === "mực in & vật tư") {
    return inkMegaColumns;
  }
  if (nameKey === "máy tính đồng bộ - máy chủ" || nameKey === "máy tính đồng bộ & máy chủ") {
    return pcMegaColumns;
  }
  if (nameKey === "laptop gaming - đồ họa") {
    return laptopMegaColumns;
  }
  if (nameKey === "laptop văn phòng") {
    return officeLaptopMegaColumns;
  }
  if (nameKey === "thiết bị mạng") {
    return networkMegaColumns;
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

// Icon 3D — Microsoft Fluent Emoji (MIT, github.com/microsoft/fluentui-emoji),
// pin theo commit SHA để URL bất biến (không trôi theo main của repo icon).
// Key = giá trị field `icon` của danh mục (giữ nguyên bộ key cũ từ CMS/HPT_DATA).
const FLUENT_EMOJI_BASE =
  "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@62ecdc0d7ca5c6df32148c169556bc8d3782fca4/assets";

const FLUENT_CATEGORY_ICONS: Record<string, string> = {
  laptop: "Laptop/3D/laptop_3d.png",
  monitor: "Desktop computer/3D/desktop_computer_3d.png",
  server: "File cabinet/3D/file_cabinet_3d.png",
  network: "Globe with meridians/3D/globe_with_meridians_3d.png",
  printer: "Printer/3D/printer_3d.png",
  video: "Video camera/3D/video_camera_3d.png",
  cctv: "Camera/3D/camera_3d.png",
  "graduation-cap": "Graduation cap/3D/graduation_cap_3d.png",
  "badge-check": "Optical disk/3D/optical_disk_3d.png",
  cable: "Electric plug/3D/electric_plug_3d.png",
  "scan-line": "Fax machine/3D/fax_machine_3d.png",
  droplets: "Droplet/3D/droplet_3d.png",
  "hard-drive": "Floppy disk/3D/floppy_disk_3d.png",
  wrench: "Wrench/3D/wrench_3d.png",
  workflow: "Gear/3D/gear_3d.png",
  copy: "Bookmark tabs/3D/bookmark_tabs_3d.png",
  projector: "Film projector/3D/film_projector_3d.png",
  "battery-charging": "Battery/3D/battery_3d.png",
};

const FLUENT_DEFAULT_ICON = "Open file folder/3D/open_file_folder_3d.png";

function fluentIconUrl(assetPath: string) {
  return `${FLUENT_EMOJI_BASE}/${assetPath.split("/").map(encodeURIComponent).join("/")}`;
}

function getCategoryIcon(iconName: string, size = 22) {
  const asset = FLUENT_CATEGORY_ICONS[iconName] || FLUENT_DEFAULT_ICON;
  return (
    <Image
      src={fluentIconUrl(asset)}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      loading="lazy"
    />
  );
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
