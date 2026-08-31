import { formatSlug } from "@/lib/payload/utils/slugify";

export type CleanProductBrandRoute = {
  brand: string;
  brandSlug: string;
  category: string;
  href: string;
};

export type CleanProductFilterRoute = {
  category: string;
  href: string;
  param: string;
  titlePart: string;
  value: string;
};

const PRODUCT_BRANDS: Record<string, string[]> = {
  "camera-giam-sat": ["Tenveo", "Western Digital", "Seagate", "Imou", "EZVIZ"],
  laptop: ["ASUS", "Lenovo", "Dell", "Acer", "MSI", "HP"],
  "laptop-gaming-do-hoa": ["ASUS", "Lenovo", "Acer", "MSI", "HP", "Gigabyte", "Dell"],
  "may-in": ["HP", "Canon", "Brother", "Epson", "Pantum", "Ricoh", "Konica Minolta"],
  "may-photocopy": ["Fujifilm", "Fuji Xerox", "Canon", "HP", "Sharp", "Ricoh", "Konica Minolta"],
  "may-scan": [
    "Canon",
    "Epson",
    "HP",
    "Ricoh",
    "Brother",
    "Plustek",
    "Microtek",
    "Kodak Alaris",
    "Avision",
    "Image Access",
    "Colortrac",
    "Xerox",
    "Viisan",
    "Zeutschel",
    "Visioneer",
    "Panasonic",
    "Czur",
    "ROWE",
    "SMA",
    "Fuji Xerox",
    "GP",
    "Joyusing",
  ],
  "may-tinh-dong-bo-may-chu": ["HP", "Dell", "Lenovo", "ASUS", "Supermicro", "AOC", "SingPC", "Advantech", "MSI"],
  "phan-mem-ban-quyen": [
    "Microsoft",
    "Kaspersky",
    "Adobe",
    "Bkav",
    "Autodesk",
    "Sophos",
    "ESET",
    "Trend Micro",
    "Bitdefender",
  ],
};

const CLEAN_BRAND_ROUTES: CleanProductBrandRoute[] = Object.entries(PRODUCT_BRANDS).flatMap(
  ([category, brands]) =>
    brands.map((brand) => {
      const brandSlug = formatSlug(brand);
      return {
        brand,
        brandSlug,
        category,
        href: `/${category}-${brandSlug}`,
      };
    }),
);

const CLEAN_SCANNER_FILTER_ROUTES: CleanProductFilterRoute[] = [
  { category: "may-scan", href: "/may-scan-kho-a4", param: "size", titlePart: "khổ A4", value: "A4" },
  { category: "may-scan", href: "/may-scan-kho-a3", param: "size", titlePart: "khổ A3", value: "A3" },
  { category: "may-scan", href: "/may-scan-kho-a2", param: "size", titlePart: "khổ A2", value: "A2" },
  { category: "may-scan", href: "/may-scan-kho-a1", param: "size", titlePart: "khổ A1", value: "A1" },
  { category: "may-scan", href: "/may-scan-kho-a0", param: "size", titlePart: "khổ A0", value: "A0" },
  {
    category: "may-scan",
    href: "/may-scan-van-phong-nho-duoi-30-trang-phut",
    param: "speed",
    titlePart: "văn phòng nhỏ dưới 30 trang/phút",
    value: "soho",
  },
  {
    category: "may-scan",
    href: "/may-scan-van-phong-31-60-trang-phut",
    param: "speed",
    titlePart: "văn phòng 31-60 trang/phút",
    value: "office",
  },
  {
    category: "may-scan",
    href: "/may-scan-phong-ban-61-100-trang-phut",
    param: "speed",
    titlePart: "phòng ban 61-100 trang/phút",
    value: "dept",
  },
  {
    category: "may-scan",
    href: "/may-scan-toc-do-cao-tren-100-trang-phut",
    param: "speed",
    titlePart: "tốc độ cao trên 100 trang/phút",
    value: "production",
  },
  { category: "may-scan", href: "/may-scan-quet-2-mat", param: "feature", titlePart: "quét 2 mặt", value: "duplex" },
  { category: "may-scan", href: "/may-scan-quet-mau", param: "feature", titlePart: "quét màu", value: "color" },
  { category: "may-scan", href: "/may-scan-ocr", param: "feature", titlePart: "OCR", value: "ocr" },
  {
    category: "may-scan",
    href: "/may-scan-quet-the-can-cuoc",
    param: "feature",
    titlePart: "quét thẻ căn cước",
    value: "card",
  },
  {
    category: "may-scan",
    href: "/may-scan-quet-ho-chieu",
    param: "feature",
    titlePart: "quét hộ chiếu",
    value: "passport",
  },
];

const CLEAN_PRINTER_FILTER_ROUTES: CleanProductFilterRoute[] = [
  { category: "may-in", href: "/may-in-don-nang", param: "func", titlePart: "đơn năng", value: "don" },
  { category: "may-in", href: "/may-in-da-nang", param: "func", titlePart: "đa năng", value: "da" },
  { category: "may-in", href: "/may-in-co-fax", param: "func", titlePart: "có fax", value: "fax" },
  {
    category: "may-in",
    href: "/may-in-toc-do-duoi-20-trang-phut",
    param: "pspeed",
    titlePart: "tốc độ dưới 20 trang/phút",
    value: "p1",
  },
  {
    category: "may-in",
    href: "/may-in-toc-do-21-40-trang-phut",
    param: "pspeed",
    titlePart: "tốc độ 21-40 trang/phút",
    value: "p2",
  },
  {
    category: "may-in",
    href: "/may-in-toc-do-41-60-trang-phut",
    param: "pspeed",
    titlePart: "tốc độ 41-60 trang/phút",
    value: "p3",
  },
  {
    category: "may-in",
    href: "/may-in-toc-do-tren-60-trang-phut",
    param: "pspeed",
    titlePart: "tốc độ trên 60 trang/phút",
    value: "p4",
  },
  { category: "may-in", href: "/may-in-mau", param: "pfeat", titlePart: "màu", value: "color" },
  {
    category: "may-in",
    href: "/may-in-2-mat-tu-dong",
    param: "pfeat",
    titlePart: "2 mặt tự động",
    value: "duplex",
  },
  {
    category: "may-in",
    href: "/may-in-ket-noi-mang-wifi",
    param: "pfeat",
    titlePart: "kết nối mạng WiFi",
    value: "network",
  },
];

const CLEAN_PHOTOCOPY_FILTER_ROUTES: CleanProductFilterRoute[] = [
  { category: "may-photocopy", href: "/may-photocopy-mau", param: "ccolor", titlePart: "màu", value: "mau" },
  {
    category: "may-photocopy",
    href: "/may-photocopy-den-trang",
    param: "ccolor",
    titlePart: "đen trắng",
    value: "den",
  },
  {
    category: "may-photocopy",
    href: "/may-photocopy-toc-do-duoi-25-ban-phut",
    param: "cspeed",
    titlePart: "tốc độ dưới 25 bản/phút",
    value: "c1",
  },
  {
    category: "may-photocopy",
    href: "/may-photocopy-toc-do-26-40-ban-phut",
    param: "cspeed",
    titlePart: "tốc độ 26-40 bản/phút",
    value: "c2",
  },
  {
    category: "may-photocopy",
    href: "/may-photocopy-toc-do-tren-40-ban-phut",
    param: "cspeed",
    titlePart: "tốc độ trên 40 bản/phút",
    value: "c3",
  },
  {
    category: "may-photocopy",
    href: "/may-photocopy-2-mat-tu-dong",
    param: "cfeat",
    titlePart: "2 mặt tự động",
    value: "duplex",
  },
  {
    category: "may-photocopy",
    href: "/may-photocopy-nap-ban-goc-adf",
    param: "cfeat",
    titlePart: "nạp bản gốc ADF",
    value: "adf",
  },
  { category: "may-photocopy", href: "/may-photocopy-co-fax", param: "cfeat", titlePart: "có fax", value: "fax" },
  {
    category: "may-photocopy",
    href: "/may-photocopy-ket-noi-mang-wifi",
    param: "cfeat",
    titlePart: "kết nối mạng WiFi",
    value: "network",
  },
];

const CLEAN_LAPTOP_FILTER_ROUTES: CleanProductFilterRoute[] = [
  { category: "laptop", href: "/laptop-core-ultra", param: "cpu", titlePart: "Core Ultra", value: "ultra" },
  { category: "laptop", href: "/laptop-core-i7", param: "cpu", titlePart: "Core i7", value: "i7" },
  { category: "laptop", href: "/laptop-core-i5", param: "cpu", titlePart: "Core i5", value: "i5" },
  { category: "laptop", href: "/laptop-core-i3", param: "cpu", titlePart: "Core i3", value: "i3" },
  { category: "laptop", href: "/laptop-amd-ryzen", param: "cpu", titlePart: "AMD Ryzen", value: "ryzen" },
  { category: "laptop", href: "/laptop-snapdragon", param: "cpu", titlePart: "Snapdragon", value: "snapdragon" },
  { category: "laptop", href: "/laptop-ram-8gb", param: "ram", titlePart: "RAM 8GB", value: "8" },
  { category: "laptop", href: "/laptop-ram-16gb", param: "ram", titlePart: "RAM 16GB", value: "16" },
  { category: "laptop", href: "/laptop-ram-32gb", param: "ram", titlePart: "RAM 32GB", value: "32" },
  { category: "laptop", href: "/laptop-man-hinh-14-inch", param: "sc", titlePart: "màn hình 14 inch", value: "14" },
  { category: "laptop", href: "/laptop-man-hinh-15-inch", param: "sc", titlePart: "màn hình 15.6 inch", value: "15" },
  { category: "laptop", href: "/laptop-man-hinh-16-inch", param: "sc", titlePart: "màn hình 16 inch", value: "16" },
  { category: "laptop", href: "/laptop-thinkpad", param: "line", titlePart: "ThinkPad", value: "thinkpad" },
  { category: "laptop", href: "/laptop-vivobook", param: "line", titlePart: "Vivobook", value: "vivobook" },
  { category: "laptop", href: "/laptop-zenbook", param: "line", titlePart: "Zenbook", value: "zenbook" },
  { category: "laptop", href: "/laptop-yoga", param: "line", titlePart: "Yoga", value: "yoga" },
  { category: "laptop", href: "/laptop-swift", param: "line", titlePart: "Swift", value: "swift" },
  { category: "laptop", href: "/laptop-ideapad", param: "line", titlePart: "IdeaPad", value: "ideapad" },
  { category: "laptop", href: "/laptop-xps", param: "line", titlePart: "XPS", value: "xps" },
  { category: "laptop", href: "/laptop-prestige-modern", param: "line", titlePart: "Prestige Modern", value: "prestige" },
];

const CLEAN_GAMING_LAPTOP_FILTER_ROUTES: CleanProductFilterRoute[] = [
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-core-ultra", param: "cpu", titlePart: "Core Ultra", value: "ultra" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-core-i9", param: "cpu", titlePart: "Core i9", value: "i9" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-core-i7", param: "cpu", titlePart: "Core i7", value: "i7" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-core-i5", param: "cpu", titlePart: "Core i5", value: "i5" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-amd-ryzen", param: "cpu", titlePart: "AMD Ryzen", value: "ryzen" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-rtx-50-series", param: "gpu", titlePart: "RTX 50 series", value: "rtx50" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-rtx-40-series", param: "gpu", titlePart: "RTX 40 series", value: "rtx40" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-rtx-30-series", param: "gpu", titlePart: "RTX 30 series", value: "rtx30" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-radeon", param: "gpu", titlePart: "Radeon", value: "radeon" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-ram-8gb", param: "ram", titlePart: "RAM 8GB", value: "8" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-ram-16gb", param: "ram", titlePart: "RAM 16GB", value: "16" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-ram-32gb", param: "ram", titlePart: "RAM 32GB", value: "32" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-man-hinh-14-inch", param: "sc", titlePart: "màn hình 14 inch", value: "14" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-man-hinh-15-inch", param: "sc", titlePart: "màn hình 15.6 inch", value: "15" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-man-hinh-16-inch", param: "sc", titlePart: "màn hình 16 inch", value: "16" },
  { category: "laptop-gaming-do-hoa", href: "/laptop-gaming-do-hoa-man-hinh-17-inch", param: "sc", titlePart: "màn hình 17 inch", value: "17" },
];

const CLEAN_PC_FILTER_ROUTES: CleanProductFilterRoute[] = [
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-core-ultra", param: "cpu", titlePart: "Core Ultra", value: "ultra" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-core-i9", param: "cpu", titlePart: "Core i9", value: "i9" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-core-i7", param: "cpu", titlePart: "Core i7", value: "i7" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-core-i5", param: "cpu", titlePart: "Core i5", value: "i5" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-core-i3", param: "cpu", titlePart: "Core i3", value: "i3" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-amd-ryzen", param: "cpu", titlePart: "AMD Ryzen", value: "ryzen" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-xeon", param: "cpu", titlePart: "Xeon", value: "xeon" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-ram-8gb", param: "ram", titlePart: "RAM 8GB", value: "8" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-ram-16gb", param: "ram", titlePart: "RAM 16GB", value: "16" },
  { category: "may-tinh-dong-bo-may-chu", href: "/may-tinh-dong-bo-may-chu-ram-32gb", param: "ram", titlePart: "RAM 32GB", value: "32" },
];

const CLEAN_INK_FILTER_ROUTES: CleanProductFilterRoute[] = [
  { category: "muc-in-phu-kien", href: "/muc-in-phu-kien-cho-may-brother", param: "fb", titlePart: "cho máy Brother", value: "brother" },
  { category: "muc-in-phu-kien", href: "/muc-in-phu-kien-cho-may-canon", param: "fb", titlePart: "cho máy Canon", value: "canon" },
  { category: "muc-in-phu-kien", href: "/muc-in-phu-kien-cho-may-epson", param: "fb", titlePart: "cho máy Epson", value: "epson" },
  { category: "muc-in-phu-kien", href: "/muc-in-phu-kien-cho-may-fuji-xerox", param: "fb", titlePart: "cho máy Fuji Xerox", value: "fujixerox" },
  { category: "muc-in-phu-kien", href: "/muc-in-phu-kien-cho-may-hp", param: "fb", titlePart: "cho máy HP", value: "hp" },
  { category: "muc-in-phu-kien", href: "/muc-in-phu-kien-cho-may-pantum", param: "fb", titlePart: "cho máy Pantum", value: "pantum" },
  { category: "muc-in-phu-kien", href: "/muc-in-phu-kien-cho-may-ricoh", param: "fb", titlePart: "cho máy Ricoh", value: "ricoh" },
  { category: "muc-in-phu-kien", href: "/muc-in-mau-den", param: "mau", titlePart: "màu đen", value: "den" },
  { category: "muc-in-phu-kien", href: "/muc-in-mau-xanh", param: "mau", titlePart: "màu xanh", value: "xanh" },
  { category: "muc-in-phu-kien", href: "/muc-in-mau-do", param: "mau", titlePart: "màu đỏ", value: "do" },
  { category: "muc-in-phu-kien", href: "/muc-in-mau-vang", param: "mau", titlePart: "màu vàng", value: "vang" },
  { category: "muc-in-phu-kien", href: "/muc-in-bo-nhieu-mau", param: "mau", titlePart: "bộ nhiều màu", value: "bo" },
  { category: "muc-in-phu-kien", href: "/muc-in-chinh-hang", param: "orig", titlePart: "chính hãng", value: "chinhhang" },
  { category: "muc-in-phu-kien", href: "/muc-in-tuong-thich", param: "orig", titlePart: "tương thích", value: "tuongthich" },
];

const CLEAN_SOFTWARE_FILTER_ROUTES: CleanProductFilterRoute[] = [
  { category: "phan-mem-ban-quyen", href: "/phan-mem-ban-quyen-vinh-vien", param: "lic", titlePart: "vĩnh viễn", value: "vinhvien" },
  { category: "phan-mem-ban-quyen", href: "/phan-mem-ban-quyen-thue-bao", param: "lic", titlePart: "thuê bao", value: "thuebao" },
  { category: "phan-mem-ban-quyen", href: "/phan-mem-ban-quyen-ca-nhan-gia-dinh", param: "aud", titlePart: "cá nhân gia đình", value: "canhan" },
  { category: "phan-mem-ban-quyen", href: "/phan-mem-ban-quyen-doanh-nghiep", param: "aud", titlePart: "doanh nghiệp", value: "doanhnghiep" },
];

const CLEAN_FILTER_ROUTES = [
  ...CLEAN_SCANNER_FILTER_ROUTES,
  ...CLEAN_PRINTER_FILTER_ROUTES,
  ...CLEAN_PHOTOCOPY_FILTER_ROUTES,
  ...CLEAN_LAPTOP_FILTER_ROUTES,
  ...CLEAN_GAMING_LAPTOP_FILTER_ROUTES,
  ...CLEAN_PC_FILTER_ROUTES,
  ...CLEAN_INK_FILTER_ROUTES,
  ...CLEAN_SOFTWARE_FILTER_ROUTES,
];

const CLEAN_BRAND_ROUTE_BY_HREF = new Map(CLEAN_BRAND_ROUTES.map((route) => [route.href, route]));
const CLEAN_BRAND_ROUTE_BY_CATEGORY_BRAND = new Map(
  CLEAN_BRAND_ROUTES.map((route) => [`${route.category}:${route.brandSlug}`, route]),
);
const CLEAN_FILTER_ROUTE_BY_HREF = new Map(CLEAN_FILTER_ROUTES.map((route) => [route.href, route]));
const CLEAN_FILTER_ROUTE_BY_CATEGORY_PARAM_VALUE = new Map(
  CLEAN_FILTER_ROUTES.map((route) => [`${route.category}:${route.param}:${route.value}`, route]),
);

function normalizePathname(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function buildCleanProductBrandHref(category?: string, brand?: string) {
  if (!category || !brand) return undefined;
  return CLEAN_BRAND_ROUTE_BY_CATEGORY_BRAND.get(`${category}:${formatSlug(brand)}`)?.href;
}

export function buildCleanProductFilterHref(category: string | undefined, param: string, value: string | undefined) {
  if (!category || !value) return undefined;
  return CLEAN_FILTER_ROUTE_BY_CATEGORY_PARAM_VALUE.get(`${category}:${param}:${value}`)?.href;
}

export function findCleanProductBrandRoute(slugOrPathname: string) {
  const pathname = normalizePathname(slugOrPathname.startsWith("/") ? slugOrPathname : `/${slugOrPathname}`);
  return CLEAN_BRAND_ROUTE_BY_HREF.get(pathname);
}

export function findCleanProductFilterRoute(slugOrPathname: string) {
  const pathname = normalizePathname(slugOrPathname.startsWith("/") ? slugOrPathname : `/${slugOrPathname}`);
  return CLEAN_FILTER_ROUTE_BY_HREF.get(pathname);
}

export function cleanProductBrandRedirectPath(pathname: string, searchParams: URLSearchParams) {
  const keys = Array.from(searchParams.keys());
  if (keys.length !== 1 || keys[0] !== "brand") return undefined;
  return buildCleanProductBrandHref(normalizePathname(pathname).replace(/^\//, ""), searchParams.get("brand") || "");
}

export function cleanProductFilterRedirectPath(pathname: string, searchParams: URLSearchParams) {
  const keys = Array.from(searchParams.keys());
  if (keys.length !== 1) return undefined;

  const category = normalizePathname(pathname).replace(/^\//, "");
  const key = keys[0];
  if (!key) return undefined;

  return buildCleanProductFilterHref(category, key, searchParams.get(key) || "");
}

export function cleanProductBrandRoutes() {
  return CLEAN_BRAND_ROUTES;
}

export function cleanProductFilterRoutes() {
  return CLEAN_FILTER_ROUTES;
}
