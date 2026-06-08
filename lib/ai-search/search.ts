import {
  AI_COMPARISON_PRODUCTS,
  type AIRequirement,
  type AISearchFilters,
  type AISearchProduct,
} from "@/lib/ai-search/mock-data";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function findSpeed(question: string) {
  const match = normalizeText(question).match(/(\d{2,3})\s*(to|trang|ppm|ipm)/);
  return match ? `Khoảng ${match[1]} tờ/phút` : "Khoảng 40 tờ/phút";
}

function findBudget(question: string) {
  const normalized = normalizeText(question);
  const match = normalized.match(/(?:duoi|khong qua|toi da|<)\s*(\d{1,3})\s*(trieu|m)/);
  if (!match) return "Dưới 15 triệu";
  return `Dưới ${match[1]} triệu`;
}

export function analyzeAISearchQuestion(question: string): AIRequirement[] {
  const normalized = normalizeText(question);
  const isPrinter = normalized.includes("may in") || normalized.includes("printer");
  const isHospital = normalized.includes("benh vien") || normalized.includes("benh an");
  const isGovernment = normalized.includes("co quan") || normalized.includes("nha nuoc");
  const isSchool = normalized.includes("truong") || normalized.includes("hoc sinh") || normalized.includes("giao duc");
  const wantsWifi = normalized.includes("wifi") || normalized.includes("khong day");
  const wantsLan = normalized.includes("lan") || normalized.includes("ethernet") || normalized.includes("mang");

  return [
    {
      key: "deviceType",
      label: "Loại thiết bị",
      value: isPrinter ? "Máy in / thiết bị đa chức năng" : "Máy scan tài liệu",
    },
    {
      key: "purpose",
      label: "Mục đích sử dụng",
      value: isHospital
        ? "Scan hồ sơ bệnh án"
        : isGovernment
          ? "Số hóa hồ sơ hành chính"
          : isPrinter
            ? "In và xử lý tài liệu văn phòng"
            : "Scan hồ sơ học sinh",
    },
    {
      key: "environment",
      label: "Môi trường dùng",
      value: isHospital ? "Bệnh viện" : isGovernment ? "Cơ quan nhà nước" : isSchool ? "Trường học" : "Doanh nghiệp",
    },
    {
      key: "speed",
      label: "Tốc độ mong muốn",
      value: findSpeed(question),
    },
    {
      key: "connectivity",
      label: "Kết nối",
      value: wantsWifi ? "LAN, WiFi" : wantsLan ? "Có LAN" : "LAN hoặc USB",
    },
    {
      key: "budget",
      label: "Ngân sách",
      value: findBudget(question),
    },
  ];
}

export function filterAISearchProducts(filters: AISearchFilters, products: AISearchProduct[] = AI_COMPARISON_PRODUCTS) {
  return products
    .filter((product) => product.priceValue <= filters.priceCeiling)
    .filter((product) => product.speedPpm >= filters.minimumSpeed)
    .filter((product) => filters.connectivity === "all" || product.connectivityTags.includes(filters.connectivity))
    .filter((product) => filters.adf === "all" || product.adfSheets >= Number(filters.adf))
    .filter((product) => filters.brand === "all" || product.brand === filters.brand)
    .sort((a, b) => b.matchScore - a.matchScore);
}
