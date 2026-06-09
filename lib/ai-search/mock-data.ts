import type { CatalogProduct } from "@/lib/catalog";

export type AIRequirementKey =
  | "deviceType"
  | "purpose"
  | "environment"
  | "speed"
  | "connectivity"
  | "budget";

export type AIRequirement = {
  key: AIRequirementKey;
  label: string;
  value: string;
};

export type AISearchProduct = CatalogProduct & {
  speedPpm: number;
  adfSheets: number;
  connectivityTags: string[];
  speedLabel: string;
  adfLabel: string;
  connectivityLabel: string;
  resolutionLabel: string;
  dailyDutyLabel: string;
  warranty: string;
  priceValue: number;
  stockLabel: string;
  stockPlaces: string;
  matchScore: number;
  matchLabel: string;
  matchTone: "best" | "stretch" | "stable";
  summary: string;
  strengths: string[];
};

export type RelatedAIProduct = CatalogProduct & {
  stockLabel: string;
};

export type AISearchFilters = {
  priceCeiling: number;
  minimumSpeed: number;
  connectivity: "all" | "LAN" | "WiFi";
  adf: "all" | "50" | "80" | "100";
  brand: "all" | "Brother" | "Epson" | "Ricoh";
};

export const DEFAULT_AI_SEARCH_QUERY =
  "Tôi cần máy scan cho trường học, scan hồ sơ học sinh, tốc độ khoảng 40 tờ/phút, có LAN, ngân sách dưới 15 triệu.";

export const DEFAULT_AI_SEARCH_FILTERS: AISearchFilters = {
  priceCeiling: 16000000,
  minimumSpeed: 40,
  connectivity: "LAN",
  adf: "all",
  brand: "all",
};

export const QUICK_SEARCH_PROMPTS = [
  "Máy scan cho trường học, cần LAN, khoảng 40 tờ/phút",
  "Máy scan cho bệnh viện, scan hồ sơ bệnh án số lượng lớn",
  "So sánh DS-790WN và ADS-4300N",
  "Máy scan cho cơ quan nhà nước, dễ quản trị mạng",
];

export const SIDEBAR_QUESTIONS = [
  "Máy nào có màn hình cảm ứng?",
  "Máy nào sẵn hàng tại Hà Nội?",
  "So sánh 3 sản phẩm này",
  "Giải pháp scan cho trường học",
  "Máy nào bảo hành lâu nhất?",
];

export const AI_COMPARISON_PRODUCTS: AISearchProduct[] = [
  {
    title: "Brother ADS-4300N",
    slug: "brother-ads-4300n",
    brand: "Brother",
    category: "Máy scan",
    detail: "Máy scan tài liệu A4 2 mặt, có LAN, phù hợp phòng hành chính trường học.",
    price: "13.900.000 đ",
    image: "https://hpttech.vn/media/173/catalog/BROTHER-DS-740D.jpg?size=380",
    href: "/san-pham?search=Brother%20ADS-4300N",
    rating: 4.8,
    reviewCount: 32,
    warranty: "12 tháng",
    stockStatus: "in_stock",
    speedPpm: 40,
    adfSheets: 80,
    connectivityTags: ["USB 3.0", "LAN"],
    speedLabel: "40 ppm / 80 ipm",
    adfLabel: "80 tờ",
    connectivityLabel: "USB 3.0, LAN",
    resolutionLabel: "600 x 600 dpi",
    dailyDutyLabel: "4.000 tờ",
    priceValue: 13900000,
    stockLabel: "Còn hàng",
    stockPlaces: "HN: 6, HCM: 3",
    matchScore: 96,
    matchLabel: "Phù hợp nhất",
    matchTone: "best",
    summary:
      "Cân bằng tốt giữa tốc độ 40 ppm, ADF 80 tờ, LAN và mức giá nằm trong ngân sách trường học.",
    strengths: ["Đúng ngân sách", "ADF lớn", "LAN sẵn có", "Bảo hành dài"],
  },
  {
    title: "Epson DS-790WN",
    slug: "epson-ds-790wn",
    brand: "Epson",
    category: "Máy scan",
    detail: "Máy scan mạng tốc độ cao, có WiFi/LAN, màn hình cảm ứng và ADF 100 tờ.",
    price: "15.490.000 đ",
    image: "https://hpttech.vn/media/119/catalog/Epson-WorkForce-DS-790WN.png?size=380",
    href: "/san-pham?search=Epson%20DS-790WN",
    rating: 4.7,
    reviewCount: 18,
    warranty: "12 tháng",
    stockStatus: "in_stock",
    speedPpm: 45,
    adfSheets: 100,
    connectivityTags: ["USB 3.0", "LAN", "WiFi"],
    speedLabel: "45 ppm / 90 ipm",
    adfLabel: "100 tờ",
    connectivityLabel: "USB 3.0, LAN, WiFi",
    resolutionLabel: "600 x 600 dpi",
    dailyDutyLabel: "7.000 tờ",
    priceValue: 15490000,
    stockLabel: "Còn hàng",
    stockPlaces: "HN: 2, HCM: 1",
    matchScore: 91,
    matchLabel: "Cao cấp hơn",
    matchTone: "stretch",
    summary:
      "Nhỉnh hơn ngân sách nhưng có WiFi, ADF 100 tờ, màn hình cảm ứng và duty cycle cao hơn.",
    strengths: ["Tốc độ 45 ppm", "ADF 100 tờ", "LAN + WiFi", "Duty cycle cao"],
  },
  {
    title: "Ricoh fi-8040",
    slug: "ricoh-fi-8040",
    brand: "Ricoh",
    category: "Máy scan",
    detail: "Máy scan tài liệu bền bỉ, có LAN, DirectScan và màn hình cảm ứng cho nhóm dùng chung.",
    price: "14.200.000 đ",
    image: "https://hpttech.vn/media/150/catalog/Ricoh-fi-7480.jpg?size=380",
    href: "/san-pham?search=Ricoh%20fi-8040",
    rating: 4.6,
    reviewCount: 25,
    warranty: "12 tháng",
    stockStatus: "in_stock",
    speedPpm: 40,
    adfSheets: 50,
    connectivityTags: ["USB 3.0", "LAN"],
    speedLabel: "40 ppm / 80 ipm",
    adfLabel: "50 tờ",
    connectivityLabel: "USB 3.0, LAN",
    resolutionLabel: "600 x 600 dpi",
    dailyDutyLabel: "5.000 tờ",
    priceValue: 14200000,
    stockLabel: "Còn hàng",
    stockPlaces: "HN: 2, HCM: 2",
    matchScore: 88,
    matchLabel: "Bền, ổn định",
    matchTone: "stable",
    summary:
      "Phù hợp nhóm dùng chung cần LAN, thao tác trực tiếp trên máy và độ ổn định cao.",
    strengths: ["DirectScan", "LAN sẵn có", "Màn hình cảm ứng", "Thiết kế bền"],
  },
];

export const RELATED_AI_PRODUCTS: RelatedAIProduct[] = [
  {
    title: "Fujitsu fi-8150",
    slug: "fujitsu-fi-8150",
    brand: "Fujitsu",
    category: "Máy scan",
    price: "16.500.000 đ",
    image: "https://hpttech.vn/media/0/default-image.png?size=512",
    href: "/san-pham?search=Fujitsu%20fi-8150",
    stockLabel: "Còn hàng",
  },
  {
    title: "Kodak S2085f",
    slug: "kodak-s2085f",
    brand: "Kodak",
    category: "Máy scan",
    price: "17.900.000 đ",
    image: "https://hpttech.vn/media/0/default-image.png?size=512",
    href: "/san-pham?search=Kodak%20S2085f",
    stockLabel: "Còn hàng",
  },
  {
    title: "Canon DR-C240",
    slug: "canon-dr-c240",
    brand: "Canon",
    category: "Máy scan",
    price: "9.990.000 đ",
    image: "https://hpttech.vn/media/0/default-image.png?size=512",
    href: "/san-pham?search=Canon%20DR-C240",
    stockLabel: "Còn hàng",
  },
  {
    title: "Brother ADS-4700W",
    slug: "brother-ads-4700w",
    brand: "Brother",
    category: "Máy scan",
    price: "17.200.000 đ",
    image: "https://hpttech.vn/media/173/catalog/BROTHER-DS-740D.jpg?size=380",
    href: "/san-pham?search=Brother%20ADS-4700W",
    stockLabel: "Còn hàng",
  },
  {
    title: "Epson DS-870",
    slug: "epson-ds-870",
    brand: "Epson",
    category: "Máy scan",
    price: "19.900.000 đ",
    image: "https://hpttech.vn/media/334/catalog/Epson%20WorkForce%20DS-970.png?size=380",
    href: "/san-pham?search=Epson%20DS-870",
    stockLabel: "Còn hàng",
  },
  {
    title: "Ricoh fi-8190",
    slug: "ricoh-fi-8190",
    brand: "Ricoh",
    category: "Máy scan",
    price: "18.500.000 đ",
    image: "https://hpttech.vn/media/150/catalog/Ricoh-fi-7480.jpg?size=380",
    href: "/san-pham?search=Ricoh%20fi-8190",
    stockLabel: "Còn hàng",
  },
];
