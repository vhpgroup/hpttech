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
      brand: "HP",
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

console.log(
  "Desktop/Server classification verified: phân loại, guard, spec và canonical row đều đạt.",
);
