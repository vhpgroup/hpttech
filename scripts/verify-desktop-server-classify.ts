import assert from "node:assert/strict";

import {
  DESKTOP_PC_CATEGORY_NAME,
  MINI_PC_CATEGORY_NAME,
  SERVER_CATEGORY_NAME,
  SERVER_COMPONENT_CATEGORY_NAME,
  WORKSTATION_CATEGORY_NAME,
  canonicalizeCategoryName,
  canonicalizeCategorySlug,
} from "../lib/product-category";
import {
  buildCanonicalImportRow,
  inferScrapedProductTypeCode,
} from "../lib/scraper/canonical-row";
import { commonProductTypeCode } from "../lib/scraper/db-lookup";
import {
  detectPcServerTypeCode,
  pcServerBrandFromName,
  pcServerCategoryNameForType,
} from "../lib/scraper/pc-server-taxonomy";
import {
  inferScrapedProductType,
  validateExpectedProductType,
} from "../lib/scraper/product-type-guard";
import { normalizeScrapedSpecs } from "../lib/scraper/spec-normalizer";
import type { ScrapedProduct } from "../lib/scraper/types";

// ---------------------------------------------------------------------------
// 1) Phân loại theo tiêu đề danh mục thật của An Phát (nhánh MTĐB - Máy chủ)
// ---------------------------------------------------------------------------
assert.equal(commonProductTypeCode("Máy tính đồng bộ HP"), "desktop-pc");
assert.equal(commonProductTypeCode("Máy Tính Đồng Bộ Dell"), "desktop-pc");
assert.equal(commonProductTypeCode("PC ASUS"), "desktop-pc");
assert.equal(commonProductTypeCode("Máy tính All In One"), "all-in-one");
assert.equal(commonProductTypeCode("PC mini ASUS NUC"), "mini-pc");
assert.equal(commonProductTypeCode("ASUS NUC 14"), "mini-pc");
assert.equal(commonProductTypeCode("Máy Chủ - Server"), "server");
assert.equal(commonProductTypeCode("Máy chủ Dell"), "server");
assert.equal(commonProductTypeCode("Linh Kiện Máy Chủ"), "server-component");
assert.equal(commonProductTypeCode("CPU Cho Server"), "server-component");
assert.equal(commonProductTypeCode("RAM Cho Server"), "server-component");
assert.equal(commonProductTypeCode("Nguồn Cho Server"), "server-component");
assert.equal(commonProductTypeCode("Máy Trạm Workstation"), "workstation");
assert.equal(commonProductTypeCode("Máy tính công nghiệp"), "industrial-pc");

// h1 THẬT trên trang An Phát (xác nhận live 2026-07-07): typo "Sever" và
// h1 cụt chỉ còn tên hãng — phải nhận diện được qua typo-tolerance + URL slug.
assert.equal(commonProductTypeCode("Ram for Sever"), "server-component");
assert.equal(commonProductTypeCode("HDD for Sever"), "server-component");
assert.equal(commonProductTypeCode("VGA for Sever"), "server-component");
assert.equal(commonProductTypeCode("RAID for Sever"), "server-component");
assert.equal(commonProductTypeCode("CPU for Server"), "server-component");
assert.equal(commonProductTypeCode("Nguồn cho Server"), "server-component");
assert.equal(commonProductTypeCode("Mainboard Server"), "server-component");
assert.equal(commonProductTypeCode("Máy tính All-in-one"), "all-in-one");
assert.equal(commonProductTypeCode("ASUS NUC Gen 12"), "mini-pc");
// h1 cụt "HP"/"ASUS" + URL (cách classifyCategoryProduct ghép title + url):
assert.equal(
  commonProductTypeCode(
    "HP https://www.anphatpc.com.vn/may-tinh-dong-bo-hp_dm1044.html",
  ),
  "desktop-pc",
);
assert.equal(
  commonProductTypeCode(
    "IBM-LENOVO https://www.anphatpc.com.vn/may-tinh-dong-bo-ibm-lenovo_dm1056.html",
  ),
  "desktop-pc",
);

// Mã productType phải tự map về chính nó (validateExpectedProductType dùng
// commonProductTypeCode trên cột "Loại sản phẩm" của workbook).
for (const code of [
  "desktop-pc",
  "all-in-one",
  "mini-pc",
  "workstation",
  "industrial-pc",
  "server",
  "server-component",
]) {
  assert.equal(commonProductTypeCode(code), code);
}

// ---------------------------------------------------------------------------
// 2) Chống hijack: các loại sẵn có KHÔNG bị nhánh PC/Server nuốt
// ---------------------------------------------------------------------------
assert.equal(commonProductTypeCode("Máy in đa năng All-in-One HP"), "printer");
assert.equal(commonProductTypeCode("Windows Server 2022 Standard"), "software");
assert.equal(
  commonProductTypeCode("Phần mềm Windows 11 Pro bản quyền"),
  "software",
);
assert.equal(
  commonProductTypeCode("Laptop Dell Precision Workstation 3590"),
  "laptop",
);
assert.equal(commonProductTypeCode("Máy scan Fujitsu fi-8170"), "scanner");
assert.equal(commonProductTypeCode("Mực in Canon 337"), "ink");
assert.equal(commonProductTypeCode("Switch PoE 8 port"), "networking");
assert.equal(detectPcServerTypeCode("SQL Server 2022"), undefined);

// ---------------------------------------------------------------------------
// 3) Map productType -> tên Category đích (node lá trong Payload)
// ---------------------------------------------------------------------------
assert.equal(
  pcServerCategoryNameForType("desktop-pc"),
  DESKTOP_PC_CATEGORY_NAME,
);
assert.equal(pcServerCategoryNameForType("server"), SERVER_CATEGORY_NAME);
assert.equal(
  pcServerCategoryNameForType("server-component"),
  SERVER_COMPONENT_CATEGORY_NAME,
);
assert.equal(pcServerCategoryNameForType("scanner"), undefined);
assert.equal(canonicalizeCategoryName("PC đồng bộ"), DESKTOP_PC_CATEGORY_NAME);
assert.equal(canonicalizeCategoryName("Máy chủ"), SERVER_CATEGORY_NAME);
assert.equal(canonicalizeCategorySlug(undefined, "PC đồng bộ"), "pc-dong-bo");
assert.equal(
  canonicalizeCategorySlug(undefined, "Máy chủ - Server"),
  "may-chu-server",
);
assert.equal(
  canonicalizeCategorySlug(undefined, "Mini PC - NUC"),
  "mini-pc-nuc",
);

// ---------------------------------------------------------------------------
// 4) Tinh chỉnh trong nội bộ họ PC/Server (danh mục trộn "Máy chủ, Linh kiện")
// ---------------------------------------------------------------------------
assert.equal(
  inferScrapedProductTypeCode("CPU Intel Xeon Silver 4310", "server"),
  "server-component",
);
assert.equal(
  inferScrapedProductTypeCode("RAM Samsung 32GB DDR4 ECC cho máy chủ", "server"),
  "server-component",
);
assert.equal(
  inferScrapedProductTypeCode("Máy chủ Dell PowerEdge R750", "server"),
  "server",
);
// Tên chứa "Windows" không được kéo PC sang software.
assert.equal(
  inferScrapedProductTypeCode(
    "Máy tính đồng bộ HP ProDesk 400 G9 (i5/8GB/256GB/Windows 11)",
    "desktop-pc",
  ),
  "desktop-pc",
);
// Sản phẩm AIO nằm trong danh mục PC theo hãng phải về all-in-one — cả ở
// workbook (classifyCategoryProduct tinh chỉnh theo tên) lẫn ở import
// (inferScrapedProductTypeCode). Tên SP thật từ dry-run dm1044 (2026-07-07).
assert.equal(
  detectPcServerTypeCode("Máy tính để bàn HP AIO ProOne 240 G10 AY2G5PT"),
  "all-in-one",
);
assert.equal(
  inferScrapedProductTypeCode(
    "Máy tính để bàn HP AIO ProOne 240 G10 AY2G5PT",
    "desktop-pc",
  ),
  "all-in-one",
);
assert.equal(
  detectPcServerTypeCode("Máy tính để bàn đồng bộ HP Pro Tower 400 G9 BG8P9AT"),
  "desktop-pc",
);
// "Pro Mini" (USFF) chấp nhận ở desktop-pc — nhóm Mini PC - NUC dành cho dòng NUC.
assert.equal(
  detectPcServerTypeCode("Máy tính để bàn đồng bộ HP Pro Mini 400 G9 AZ8Q8PT"),
  "desktop-pc",
);
// Tên không đủ tín hiệu → classify giữ loại theo danh mục (không undefined-hoá).
assert.equal(detectPcServerTypeCode("Samsung 32GB DDR4 ECC Registered"), undefined);
// Loại ngoài họ PC/Server giữ nguyên hành vi cũ.
assert.equal(
  inferScrapedProductTypeCode("Máy scan Brother ADS-4700W", "scanner"),
  "scanner",
);

// ---------------------------------------------------------------------------
// 5) Guard nguồn: trang PC/máy chủ chứa "Intel Core/SSD/DDR" không bị nhận
//    nhầm thành laptop; expected/actual cùng họ không throw
// ---------------------------------------------------------------------------
function fakeProduct(
  title: string,
  url: string,
  specs: Array<{ label: string; value: string }>,
  brand = "HP",
): ScrapedProduct {
  return {
    confidence: 0.9,
    data: {
      price: "15.990.000đ",
      sku: "",
      specs,
      title,
      warranty: "36 tháng",
    },
    generated: {
      description: "Mô tả",
      summary: "Tóm tắt",
    },
    reviewStatus: "ready_to_review",
    seo: {
      canonical: "/san-pham/test",
      description: "SEO description",
      imageAlt: "",
      title: "SEO title",
    },
    source: {
      brand,
      searchQuery: title,
      url,
      urls: [url],
    },
    warnings: [],
  };
}

const desktopProduct = fakeProduct(
  "Máy tính đồng bộ HP ProDesk 400 G9 SFF",
  "https://www.anphatpc.com.vn/may-tinh-dong-bo-hp_dm1044.html",
  [
    { label: "CPU", value: "Intel Core i5-13500" },
    { label: "RAM", value: "8GB DDR4 3200MHz" },
    { label: "Ổ cứng", value: "SSD 256GB NVMe" },
    { label: "Hệ điều hành", value: "Windows 11 Home" },
  ],
);
assert.equal(inferScrapedProductType(desktopProduct), "desktop-pc");
validateExpectedProductType("desktop-pc", desktopProduct);

const serverProduct = fakeProduct(
  "Máy chủ Dell PowerEdge R750 Rack 2U",
  "https://www.anphatpc.com.vn/may-chu-dell_dm1417.html",
  [
    { label: "CPU", value: "Intel Xeon Silver 4310" },
    { label: "RAM", value: "32GB DDR4 ECC" },
    { label: "Khay ổ cứng", value: "8 x 2.5 inch hot-swap" },
    { label: "RAID", value: "PERC H755" },
    { label: "Nguồn", value: "2 x 800W hot-plug" },
  ],
);
assert.equal(inferScrapedProductType(serverProduct), "server");
validateExpectedProductType("server", serverProduct);
// Linh kiện dưới danh mục server (cùng họ) không throw.
const componentProduct = fakeProduct(
  "RAM Samsung 32GB DDR4 ECC Registered cho máy chủ",
  "https://www.anphatpc.com.vn/ram-sever_dm1224.html",
  [{ label: "Dung lượng", value: "32GB DDR4 ECC" }],
);
validateExpectedProductType("server", componentProduct);
validateExpectedProductType("server-component", componentProduct);
// Khác họ phải throw (giữ nguyên lưới an toàn).
assert.throws(() => validateExpectedProductType("printer", desktopProduct));

// ---------------------------------------------------------------------------
// 6) Chuẩn hóa spec: desktopSpecs/serverSpecs + KHÔNG phát attribute canonical
//    (mapAttributes sẽ throw nếu gặp code chưa có AttributeDefinition)
// ---------------------------------------------------------------------------
const desktopNormalized = normalizeScrapedSpecs(
  desktopProduct.data.specs,
  "desktop-pc",
);
assert.equal(desktopNormalized.attributes.length, 0);
assert.ok(desktopNormalized.desktopSpecs);
assert.equal(desktopNormalized.desktopSpecs?.cpu, "Intel Core i5-13500");
assert.equal(desktopNormalized.desktopSpecs?.ramGb, 8);
assert.equal(desktopNormalized.desktopSpecs?.storageGb, 256);
assert.equal(desktopNormalized.desktopSpecs?.os, "Windows 11 Home");

const serverNormalized = normalizeScrapedSpecs(
  serverProduct.data.specs,
  "server",
);
assert.equal(serverNormalized.attributes.length, 0);
assert.ok(serverNormalized.serverSpecs);
assert.equal(serverNormalized.serverSpecs?.cpu, "Intel Xeon Silver 4310");
assert.equal(serverNormalized.serverSpecs?.ramGb, 32);
assert.equal(serverNormalized.serverSpecs?.driveBays, "8 x 2.5 inch hot-swap");
assert.equal(serverNormalized.serverSpecs?.raid, "PERC H755");
assert.equal(serverNormalized.serverSpecs?.psu, "2 x 800W hot-plug");

const componentNormalized = normalizeScrapedSpecs(
  componentProduct.data.specs,
  "server-component",
);
assert.equal(componentNormalized.attributes.length, 0);
assert.equal(componentNormalized.serverSpecs, undefined);

// ---------------------------------------------------------------------------
// 7) Canonical row: category đích, SKU HPT- (nguồn anphat), giữ productType
// ---------------------------------------------------------------------------
const desktopRow = buildCanonicalImportRow(
  {
    category: DESKTOP_PC_CATEGORY_NAME,
    name: "Máy tính đồng bộ HP ProDesk 400 G9 SFF",
    productType: "desktop-pc",
    rowNumber: 2,
  },
  desktopProduct,
  "desktop-pc",
);
assert.equal(desktopRow.productTypeCode, "desktop-pc");
assert.equal(desktopRow.categoryName, DESKTOP_PC_CATEGORY_NAME);
assert.ok(desktopRow.sku.startsWith("HPT-"));
assert.equal(desktopRow.productStatus, "draft");
assert.deepEqual(JSON.parse(desktopRow.attributesJSON), []);

const serverRow = buildCanonicalImportRow(
  {
    category: SERVER_CATEGORY_NAME,
    name: "Máy chủ Dell PowerEdge R750",
    productType: "server",
    rowNumber: 3,
  },
  serverProduct,
  "server",
);
assert.equal(serverRow.productTypeCode, "server");
assert.equal(serverRow.categoryName, SERVER_CATEGORY_NAME);
assert.ok(serverRow.sku.startsWith("HPT-"));

const workstationName = pcServerCategoryNameForType("workstation");
assert.equal(workstationName, WORKSTATION_CATEGORY_NAME);
const miniPcName = pcServerCategoryNameForType("mini-pc");
assert.equal(miniPcName, MINI_PC_CATEGORY_NAME);

// ---------------------------------------------------------------------------
// 8) Brand từ tên SP (họ PC/Server) — nguồn anphat gán brand config "APOS"
//    theo domain, sai cho hàng chính hãng (phát hiện từ demo publish, id 3314)
// ---------------------------------------------------------------------------
assert.equal(
  pcServerBrandFromName("Bộ Mini PC Asus NUC 14 PRO Tall RNUC14RVSU5"),
  "ASUS",
);
assert.equal(pcServerBrandFromName("Máy tính đồng bộ HP ProDesk 400 G9"), "HP");
assert.equal(pcServerBrandFromName("Máy chủ Dell PowerEdge R750"), "Dell");
// Hãng nguyên chiếc thắng hãng linh kiện trong cùng tên.
assert.equal(
  pcServerBrandFromName("Máy chủ Dell PowerEdge R750 (Intel Xeon Silver)"),
  "Dell",
);
assert.equal(pcServerBrandFromName("RAM Samsung 32GB DDR4 ECC"), "Samsung");
assert.equal(pcServerBrandFromName("CPU Intel Xeon Silver 4310"), "Intel");
assert.equal(pcServerBrandFromName("Máy chủ HPE ProLiant DL360 Gen11"), "HPE");
assert.equal(pcServerBrandFromName("PC APOS Office i5"), "APOS");
assert.equal(pcServerBrandFromName("Máy tính công nghiệp Axiomtek"), undefined);

// Row canonical: brand APOS từ nguồn bị thay bằng brand thật theo tên.
const nucProduct = fakeProduct(
  "Bộ Mini PC Asus NUC 14 PRO Tall RNUC14RVSU5",
  "https://www.anphatpc.com.vn/bo-mini-pc-asus-nuc-14-pro-tall-rnuc14rvsu5.html",
  [{ label: "CPU", value: "INTEL U5-125H" }],
  "APOS",
);
const nucRow = buildCanonicalImportRow(
  {
    category: MINI_PC_CATEGORY_NAME,
    name: "Bộ Mini PC Asus NUC 14 PRO Tall RNUC14RVSU5",
    productType: "mini-pc",
    rowNumber: 5,
  },
  { ...nucProduct, data: { ...nucProduct.data, sku: "RNUC14RVSU5" } },
  "mini-pc",
);
assert.equal(nucRow.brandName, "ASUS");
assert.equal(nucRow.categoryName, MINI_PC_CATEGORY_NAME);
// Ngoài họ PC/Server: brand giữ nguyên từ nguồn (không ảnh hưởng scanner...).
assert.equal(desktopRow.brandName, "HP");

// ---------------------------------------------------------------------------
// 9) Lọc rác listing trong spec (demo id 3314: desktopSpecs.ram dính cả giá
//    "Giá niêm yết ... Giá Build PC ..." + tên SP khác từ trang nguồn)
// ---------------------------------------------------------------------------
const dirtySpecs = [
  { label: "CPU", value: "INTEL U5-125H" },
  {
    label: "RAM",
    value:
      "Intel Processor N150, (TDP 6W , 6MB cache, up to 3.6 GHz) GPU: Intel Onboard Graphics RAM: 1x DDR5 SO-DIMM 4800MHz Giá niêm yết: 6.989.000 đ -33% Giá khuyến mãi: 4.689.000 đ Giá Build PC: 0 đ",
  },
  { label: "Ổ cứng", value: "Khuyến mãi tặng SSD khi So sánh Còn hàng" },
];
const dirtyNormalized = normalizeScrapedSpecs(dirtySpecs, "mini-pc");
assert.equal(dirtyNormalized.desktopSpecs?.cpu, "INTEL U5-125H");
assert.equal(dirtyNormalized.desktopSpecs?.ram, undefined);
assert.equal(dirtyNormalized.desktopSpecs?.storage, undefined);
// Value sạch bình thường không bị lọc oan.
const cleanNormalized = normalizeScrapedSpecs(
  [{ label: "RAM", value: "16GB DDR5 SO-DIMM 5600MHz (2 khe, tối đa 96GB)" }],
  "desktop-pc",
);
assert.equal(
  cleanNormalized.desktopSpecs?.ram,
  "16GB DDR5 SO-DIMM 5600MHz (2 khe, tối đa 96GB)",
);
assert.equal(cleanNormalized.desktopSpecs?.ramGb, 16);

// ---------------------------------------------------------------------------
// 10) Bảng specs lưu trên product phải loại rác footer/khuyến mãi của trang
//     nguồn (mẫu rác THẬT từ SP 3315: 11 dòng liên hệ An Phát + khối mua kèm
//     + label "..." + value 600-4000 ký tự lọt vào bảng thông số)
// ---------------------------------------------------------------------------
const noisySourceSpecs = [
  { label: "CPU", value: "INTEL U5-125H" },
  {
    label: "Back I/O",
    value:
      "2 x Thunderbolt 4 Type-C Ports 1 x USB 3.2 Gen 2 Type-A 1 x 2.0 Type-A 2 x HDMI 2.1 (TMDS) ports 1 x RJ45 LAN Port 1 x DC-in",
  },
  { label: "Lưu ý", value: "Sản phẩm chưa bao gồm Ram, ổ cứng" },
  { label: "Điện thoại", value: "1900.0323 Phím 2" },
  { label: "Hotline", value: "0918.557.006" },
  { label: "Email", value: "hainam@anphat.com.vn" },
  { label: "Giờ mở cửa", value: "8H15 - 21H (Chủ nhật & ngày lễ)" },
  { label: "Địa chỉ", value: "158 - 160 Lý Thường Kiệt - P.Diên Hồng - HCM" },
  { label: "Bảo Hành - miền Bắc", value: "1900.0323 phím 5 hoặc 0964.599.915" },
  { label: "Kỹ thuật - miền Bắc", value: "0981.961.296 hoặc 0902.030.408" },
  { label: "Kinh doanh online", value: "1900.0323 phím 1" },
  { label: "Máy chấm công", value: "0936.164.114" },
  { label: "... CPU", value: "Intel Core Ultra 7 155H 1.4GHz up to 4.8GHz" },
  {
    label:
      "🎁 Mua kèm Card mạng không dây USB Asus USB-AC53 Nano (TBAS0021) với giá",
    value: "330,000đ",
  },
  { label: "Giới thiệu dài", value: "x".repeat(600) },
];
const cleanedSpecs = normalizeScrapedSpecs(noisySourceSpecs, "mini-pc").specs;
const cleanedLabels = cleanedSpecs.map((s) => s.label);
assert.ok(cleanedLabels.includes("CPU"));
assert.ok(cleanedLabels.includes("Back I/O"));
for (const junk of [
  "Điện thoại",
  "Hotline",
  "Email",
  "Giờ mở cửa",
  "Địa chỉ",
  "Bảo Hành - miền Bắc",
  "Kỹ thuật - miền Bắc",
  "Kinh doanh online",
  "Máy chấm công",
  "... CPU",
  "Giới thiệu dài",
  // "Lưu ý" thuộc khối tóm tắt của An Phát — họ PC/Server không lưu vào bảng
  // (yêu cầu 2026-07-09: bảng chỉ giữ đúng dòng thuộc bảng thông số gốc).
  "Lưu ý",
]) {
  assert.ok(!cleanedLabels.includes(junk), `phải loại rác: ${junk}`);
}
assert.ok(!cleanedLabels.some((l) => l.includes("Mua kèm")));
assert.equal(cleanedSpecs.length, 2);

// ---------------------------------------------------------------------------
// 11) Dòng tóm tắt từ API danh mục (source: "summary") — họ PC/Server KHÔNG
//     lưu vào bảng thông số (đã hiển thị ở khối "thông số nổi bật" qua typed
//     specs), nhưng VẪN được trích vào desktopSpecs. Bảng chỉ giữ đúng các
//     dòng thuộc bảng thông số gốc của trang nguồn (yêu cầu 2026-07-09).
// ---------------------------------------------------------------------------
const withSummarySpecs = [
  { label: "Part No", value: "90AR0051-M00030" },
  { label: "CPU", value: "INTEL U5-125H" },
  { label: "Lưu ý", source: "summary" as const, value: "Sản phẩm chưa bao gồm Ram, ổ cứng" },
  { label: "GPU", source: "summary" as const, value: "Intel® Arc™ GPU" },
  { label: "RAM", source: "summary" as const, value: "2 Slot SODIMM DDR5-5600 MHz kênh đôi (tối đa 96 GB)" },
  { label: "OS hỗ trợ", source: "summary" as const, value: "Windows 10 | 11" },
  { label: "Hệ điều hành hỗ trợ", source: "summary" as const, value: "Windows 10 | 11" },
];
const withSummary = normalizeScrapedSpecs(withSummarySpecs, "mini-pc");
assert.deepEqual(
  withSummary.specs.map((s) => s.label),
  ["Part No", "CPU"],
);
// Typed specs vẫn được trích từ dòng tóm tắt.
assert.equal(withSummary.desktopSpecs?.gpu, "Intel® Arc™ GPU");
assert.equal(withSummary.desktopSpecs?.ramGb, 96);
// Field source nội bộ không lọt vào bảng lưu.
assert.ok(withSummary.specs.every((s) => !("source" in s)));

// QUAN TRỌNG (xác minh trên SP 3319): AI extract cũng nhặt khối summary từ
// chính trang sản phẩm — các dòng này KHÔNG có source marker. Vẫn phải loại
// khỏi bảng khi nội dung đã capture vào typed specs (hiển thị ở khối nổi bật).
const unmarkedSummary = normalizeScrapedSpecs(
  [
    { label: "Part No", value: "90AR0051-M00030" },
    { label: "CPU", value: "INTEL U5-125H" },
    { label: "Lưu ý", value: "Sản phẩm chưa bao gồm Ram, ổ cứng" },
    { label: "GPU", value: "Intel® Arc™ GPU" },
    { label: "RAM", value: "2 Slot SODIMM DDR5-5600 MHz kênh đôi (tối đa 96 GB)" },
    { label: "Ổ cứng", value: "1 x Khe cắm M.2 2280 | 1x Khe M.2 2242" },
    { label: "Kết nối không dây", value: "Intel Wi-Fi 6E AX211 hỗ trợ 802.11ax" },
    { label: "OS hỗ trợ", value: "Windows 10 | 11" },
    { label: "Hệ điều hành hỗ trợ", value: "Windows 10 | 11" },
  ],
  "mini-pc",
);
assert.deepEqual(
  unmarkedSummary.specs.map((s) => s.label),
  ["Part No", "CPU"],
);
assert.equal(unmarkedSummary.desktopSpecs?.gpu, "Intel® Arc™ GPU");
assert.equal(unmarkedSummary.desktopSpecs?.os, "Windows 10 | 11");
// Lưới an toàn: label summary nhưng typed KHÔNG capture được (value dính rác
// thương mại nên derive bỏ qua) → GIỮ trong bảng, không làm mất thông tin.
const notCaptured = normalizeScrapedSpecs(
  [{ label: "RAM", value: "32GB DDR4 Giá khuyến mãi: 1.000.000 đ" }],
  "mini-pc",
);
assert.equal(notCaptured.desktopSpecs?.ram, undefined);
assert.equal(notCaptured.specs.length, 1);
// Ngoài họ PC/Server (scanner...): dòng tóm tắt vẫn nằm trong bảng như cũ.
const scannerWithSummary = normalizeScrapedSpecs(
  [
    { label: "Tốc độ", value: "40 ppm" },
    { label: "Khổ giấy", source: "summary" as const, value: "A4" },
  ],
  "scanner",
);
assert.equal(scannerWithSummary.specs.length, 2);

console.log(
  "Desktop/Server classification verified: phân loại, guard, spec và canonical row đều đạt.",
);
