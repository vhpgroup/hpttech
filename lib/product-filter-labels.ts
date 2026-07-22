// Nhãn hiển thị cho các TRỤC LỌC của trang /san-pham — bám sát mega-menu
// (components/home/CategoryPanel.tsx). Dùng cho breadcrumb "theo trục menu": mỗi bộ lọc
// đang bật (brand / cpu / ram / ...) hiện thành một mắt breadcrumb sau chuỗi danh mục.
// LƯU Ý: nếu đổi nhãn/giá trị trong mega-menu, cập nhật cả bảng này cho khớp.

export const FILTER_CRUMB_LABELS: Record<string, Record<string, string>> = {
  cpu: {
    i3: "CPU Core i3",
    i5: "CPU Core i5",
    i7: "CPU Core i7",
    i9: "CPU Core i9",
    ultra: "CPU Core Ultra",
    xeon: "CPU Xeon",
    ryzen: "CPU AMD Ryzen",
    snapdragon: "CPU Snapdragon",
  },
  ram: { "8": "RAM 8GB", "16": "RAM 16GB", "32": "RAM 32GB+" },
  gpu: {
    rtx50: "RTX 50 series",
    rtx40: "RTX 40 series",
    rtx30: "RTX 20/30 series",
    radeon: "GTX / Radeon RX",
  },
  sc: { "14": 'Màn hình ≤14"', "15": 'Màn hình 15.6"', "16": 'Màn hình 16"', "17": 'Màn hình ≥17"' },
  line: {
    thinkpad: "ThinkPad",
    vivobook: "Vivobook",
    zenbook: "Zenbook",
    yoga: "Yoga",
    swift: "Swift",
    ideapad: "IdeaPad",
    xps: "XPS",
    prestige: "Prestige / Modern",
  },
  size: { A4: "Khổ A4", A3: "Khổ A3", A2: "Khổ A2", A1: "Khổ A1", A0: "Khổ A0" },
  speed: {
    soho: "≤30 trang/phút",
    office: "31–60 trang/phút",
    dept: "61–100 trang/phút",
    production: ">100 trang/phút",
  },
  feature: {
    duplex: "Quét 2 mặt",
    color: "Quét màu",
    ocr: "OCR nhận chữ",
    card: "Quét thẻ nhựa",
    passport: "Quét hộ chiếu",
  },
  func: { don: "In đơn năng", da: "Đa năng (In-Copy-Scan)", fax: "Có Fax" },
  pspeed: {
    p1: "≤20 trang/phút",
    p2: "21–40 trang/phút",
    p3: "41–60 trang/phút",
    p4: ">60 trang/phút",
  },
  pfeat: { color: "In màu", duplex: "In 2 mặt", network: "Kết nối mạng / WiFi" },
  lic: { vinhvien: "Bản quyền vĩnh viễn", thuebao: "Thuê bao theo năm" },
  aud: { canhan: "Cá nhân & gia đình", doanhnghiep: "Doanh nghiệp" },
  fb: {
    hp: "HP",
    canon: "Canon",
    brother: "Brother",
    epson: "Epson",
    ricoh: "Ricoh",
    fujixerox: "Fuji Xerox",
    pantum: "Pantum",
  },
  mau: {
    den: "Màu đen",
    xanh: "Màu xanh (Cyan)",
    do: "Màu đỏ (Magenta)",
    vang: "Màu vàng (Yellow)",
    bo: "Bộ nhiều màu",
  },
  orig: { chinhhang: "Mực chính hãng", tuongthich: "Mực tương thích" },
};

// Thứ tự hiển thị các mắt lọc trong breadcrumb (sau chuỗi danh mục).
export const FILTER_CRUMB_ORDER = [
  "brand",
  "cpu",
  "ram",
  "gpu",
  "sc",
  "line",
  "size",
  "speed",
  "feature",
  "func",
  "pspeed",
  "pfeat",
  "lic",
  "aud",
  "fb",
  "mau",
  "orig",
] as const;

// Trả nhãn cho một cặp (key, value). brand: giá trị chính là nhãn (ASUS, HP...).
// Không tra được thì fallback về chính giá trị (an toàn, không vỡ breadcrumb).
export function filterCrumbLabel(key: string, value: string): string {
  const clean = (value || "").trim();
  if (!clean) return "";
  if (key === "brand") return clean;
  return FILTER_CRUMB_LABELS[key]?.[clean] ?? clean;
}

// ---------------------------------------------------------------------------
// BỘ LỌC THEO NGÀNH HÀNG (kiểu An Phát): mỗi danh mục GỐC có bộ nhóm lọc riêng,
// hiển thị ở sidebar /san-pham. Nhóm lọc nối thẳng vào các query param chuyên
// biệt sẵn có của productSearchWhere (size/speed/feature/func/.../cpu/ram/gpu).
// Nhãn tái dùng FILTER_CRUMB_LABELS — một nguồn chân lý với breadcrumb.
// ---------------------------------------------------------------------------

export type FilterGroupDef = {
  param: string;
  title: string;
  options: Array<{ value: string; label: string }>;
};

function group(param: string, title: string): FilterGroupDef {
  return {
    param,
    title,
    options: Object.entries(FILTER_CRUMB_LABELS[param] ?? {}).map(([value, label]) => ({ value, label })),
  };
}

// Key = slug danh mục GỐC (categoryTrail[0]). Danh mục không có ở đây → chỉ có
// bộ lọc chung (Danh mục / Thương hiệu / Giá).
export const CATEGORY_FILTER_GROUPS: Record<string, FilterGroupDef[]> = {
  "may-scan": [group("size", "Khổ giấy"), group("speed", "Tốc độ quét"), group("feature", "Tính năng")],
  "may-in": [group("func", "Loại máy in"), group("pspeed", "Tốc độ in"), group("pfeat", "Tính năng in")],
  "muc-in-phu-kien": [group("fb", "Dùng cho máy"), group("mau", "Màu mực"), group("orig", "Loại mực")],
  "may-tinh-dong-bo-may-chu": [group("cpu", "CPU"), group("ram", "RAM")],
  "laptop-gaming-do-hoa": [group("cpu", "CPU"), group("gpu", "Card đồ họa"), group("sc", "Màn hình"), group("line", "Dòng máy")],
  laptop: [group("cpu", "CPU"), group("gpu", "Card đồ họa"), group("sc", "Màn hình"), group("line", "Dòng máy")],
  "phan-mem-ban-quyen": [group("lic", "Loại bản quyền"), group("aud", "Đối tượng")],
};

export function filterGroupsForCategory(rootSlug: string | undefined | null): FilterGroupDef[] {
  if (!rootSlug) return [];
  return CATEGORY_FILTER_GROUPS[rootSlug] ?? [];
}
