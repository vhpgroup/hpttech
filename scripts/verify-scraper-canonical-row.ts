import assert from "node:assert/strict";
import { buildCanonicalImportRow } from "../lib/scraper/canonical-row";
import { commonProductTypeCode } from "../lib/scraper/db-lookup";
import { extractRequestedModel } from "../lib/scraper/model-identity";
import { normalizeScrapedSpecs } from "../lib/scraper/spec-normalizer";
import {
  sourceIdentityKey,
  sourceVariantSku,
} from "../lib/scraper/source-identity";
import type { ScrapedProduct } from "../lib/scraper/types";

const product: ScrapedProduct = {
  confidence: 0.94,
  data: {
    price: "12.990.000đ",
    sku: "SCBR0009",
    specs: [{ label: "Tốc độ", value: "40 ppm" }],
    title: "Máy scan Brother ADS-4700W",
    warranty: "12 tháng",
  },
  generated: {
    description: "Mô tả",
    summary: "Tóm tắt",
  },
  reviewStatus: "ready_to_review",
  seo: {
    canonical: "/san-pham/may-scan-brother-ads-4700w",
    description: "SEO description",
    imageAlt: "",
    title: "SEO title",
  },
  source: {
    brand: "Brother",
    searchQuery: "Brother ADS-4700W",
    url: "https://brother.com.vn/ads-4700w",
    urls: [
      "https://brother.com.vn/ads-4700w",
      "https://phucanh.vn/ads-4700w",
    ],
  },
  warnings: [],
};

const row = buildCanonicalImportRow(
  {
    category: "Máy scan",
    name: "Brother ADS-4700W",
    productType: "Máy scan",
    rowNumber: 2,
  },
  product,
  "scanner",
);

assert.equal(row.productTypeCode, "scanner");
assert.equal(row.productStatus, "draft");
assert.equal(row.variantStatus, "draft");
assert.equal(row.model, "ADS-4700W");
assert.equal(row.internalId, sourceIdentityKey(product.source.url));
assert.equal(row.sku, sourceVariantSku(product.source.url, "SCBR0009"));
assert.equal(row.price, "12990000");
assert.equal(row.saleStatus, "active");
assert.equal(row.stockStatus, "unknown");
assert.equal(row.sourceType, "scraper");
assert.equal(row.sourceUrl, "https://brother.com.vn/ads-4700w");
assert.equal("images" in row, false);
const publishedRow = buildCanonicalImportRow(
  {
    category: "Máy scan",
    name: "Brother ADS-4700W",
    productType: "Máy scan",
    rowNumber: 2,
  },
  product,
  "scanner",
  { publish: true },
);
assert.equal(publishedRow.variantStatus, "active");
const decimalPriceRow = buildCanonicalImportRow(
  {
    category: "Máy scan",
    name: "Ricoh SP1425",
    productType: "Máy scan",
    rowNumber: 3,
  },
  {
    ...product,
    data: {
      ...product.data,
      price: "14000000.00",
      sku: "SP1425",
      title: "Máy scan Ricoh SP1425",
    },
  },
  "scanner",
);
assert.equal(decimalPriceRow.price, "14000000");
assert.equal(decimalPriceRow.saleStatus, "active");
assert.equal(commonProductTypeCode("Máy in đa năng"), "printer");
assert.equal(commonProductTypeCode("Máy photocopy A3"), "photocopier");
assert.equal(
  extractRequestedModel("Máy in HP Laser MFP 136w (A4/A5 | In, Scan, Copy | Wifi)"),
  "136W",
);
assert.equal(
  extractRequestedModel("Máy in HP 4103fdw 2Z629A (A4 | Scan ADF 2 mặt | LAN | WiFi)"),
  "2Z629A",
);
assert.equal(
  extractRequestedModel("Máy in Canon LBP 6030W (A4 | USB | Wifi)"),
  "6030W",
);
assert.equal(
  extractRequestedModel("Máy in HP Laser MFP 136w 4ZB86A (A4 | In, Scan, Copy | Wifi)"),
  "4ZB86A",
);
assert.equal(extractRequestedModel("Máy in A5 test fake model"), undefined);

const normalizedSpecs = normalizeScrapedSpecs(
  [
    {
      label: "TỐC ĐỘ QU&Eacute;T/SCAN",
      value: "25ppm/50ipm, (A4) 2-sided colour scan speed",
    },
    {
      label: "Độ ph&acirc;n giải",
      value: "600 x 600 dpi",
    },
    {
      label: "Giao tiếp",
      value: "USB 3.0, Wireless Network, LAN",
    },
    {
      label: "Qu&eacute;t hai mặt tự động (Duplex)",
      value: "C&oacute;",
    },
    {
      label: "Tốc độ",
      value:
        "Tốc độ quét: 25 trang/phút ở chế độ quét 1 mặt, 50 trang/phút ở chế độ quét 2 mặt",
    },
    {
      label: "Tính năng",
      value:
        "Scan hai mặt tự động (Màu, Đơn sắc), bảo mật mạng không dây",
    },
  ],
  "scanner",
);
assert.deepEqual(normalizedSpecs.specs[0], {
  label: "TỐC ĐỘ QUÉT/SCAN",
  value: "25ppm/50ipm, (A4) 2-sided colour scan speed",
});
assert.equal(normalizedSpecs.scannerSpecs?.scanSpeedSimplexPpm, 25);
assert.equal(normalizedSpecs.scannerSpecs?.scanSpeedDuplexIpm, 50);
assert.equal(normalizedSpecs.scannerSpecs?.duplexScan, true);
assert.equal(normalizedSpecs.scannerSpecs?.connectivity, "USB 3.0, Wireless Network, LAN");
assert.deepEqual(
  normalizedSpecs.attributes.find(
    (attribute) => attribute.code === "scanner_connectivity",
  )?.value,
  ["usb", "lan", "wifi"],
);
const filteredSpecs = normalizeScrapedSpecs(
  [
    { label: "Toc do", value: "25 ppm" },
    { label: "Ho ten", value: "So dien thoai" },
    { label: "'+ item.fullname +'", value: "'+ item.mobile +'" },
    { label: "Gia khuyen mai:", value: "6.999.000 d" },
  ],
  "scanner",
);
assert.deepEqual(filteredSpecs.specs, [{ label: "Toc do", value: "25 ppm" }]);
const genericSpeedSpecs = normalizeScrapedSpecs(
  [
    {
      label: "Tốc độ",
      value:
        "Tốc độ quét: 25 trang/phút ở chế độ quét 1 mặt, 50 trang/phút ở chế độ quét 2 mặt",
    },
    {
      label: "Tính năng",
      value: "Scan hai mặt tự động (Màu, Đơn sắc), bảo mật mạng",
    },
  ],
  "scanner",
);
assert.equal(genericSpeedSpecs.scannerSpecs?.scanSpeedSimplexPpm, 25);
assert.equal(genericSpeedSpecs.scannerSpecs?.scanSpeedDuplexIpm, 50);
assert.equal(genericSpeedSpecs.scannerSpecs?.duplexScan, true);

const ads3000nSpecs = normalizeScrapedSpecs(
  [
    {
      label: "ADF",
      value: "ADF (automatic document feeder) Up to 50 pages",
    },
    {
      label: "Dimensions (W x D x H)",
      value: "12.0 in x 10.2 in x 9.8 in (306 mm x 258 mm x 250 mm)",
    },
    { label: "Approx. Weights", value: "9.8 lb (4.45 kg) 10 lb (4.55 kg)" },
    {
      label: "Document Size",
      value: "Multiple Paper Width 2.0 to 8.5 in. (51 to 215.9 mm)",
    },
    { label: "Kho giay toi da", value: "A4 8.3 in. x 11.7 in. (210 mm x 297 mm)" },
    { label: "Length", value: "2.0 to 14.0 in. (51 to 355.6 mm)" },
    { label: "Color /Black", value: "Yes/Yes" },
    {
      label: "He dieu hanh",
      value: "TWAIN Compliant Windows, Macintosh OS X",
    },
    {
      label: "Kich thuoc trong luong",
      value: "Thickness 2 mil to 10 mil (0.05 mm to 0.26 mm)",
    },
    { label: "Tinh nang", value: "Duplex, OCR, Plastic card, Color scan" },
  ],
  "scanner",
);

assert.equal(ads3000nSpecs.scannerSpecs?.adfCapacitySheets, 50);
assert.equal(ads3000nSpecs.scannerSpecs?.adfSheets, 50);
assert.equal(ads3000nSpecs.scannerSpecs?.supportedOs, "TWAIN Compliant Windows, Macintosh OS X");
assert.equal(ads3000nSpecs.scannerSpecs?.duplexScan, true);
assert.equal(ads3000nSpecs.scannerSpecs?.duplexScanText, "Có");
assert.equal(ads3000nSpecs.scannerSpecs?.colorScan, true);
assert.equal(ads3000nSpecs.scannerSpecs?.colorScanText, "Có");
assert.equal(ads3000nSpecs.scannerSpecs?.ocr, true);
assert.equal(ads3000nSpecs.scannerSpecs?.ocrText, "Có");
assert.equal(ads3000nSpecs.scannerSpecs?.plasticCardScan, true);
assert.equal(ads3000nSpecs.scannerSpecs?.plasticCardScanText, "Có");
assert.equal(
  ads3000nSpecs.scannerSpecs?.dimensionsWeight,
  "Dimensions (W x D x H): 12.0 in x 10.2 in x 9.8 in (306 mm x 258 mm x 250 mm) | Approx. Weights: 9.8 lb (4.45 kg) 10 lb (4.55 kg)",
);
assert.equal(
  ads3000nSpecs.scannerSpecs?.minPaperSize,
  "Document Size: Multiple Paper Width 2.0 to 8.5 in. (51 to 215.9 mm) | Length: 2.0 to 14.0 in. (51 to 355.6 mm)",
);

const scannerWithoutType = normalizeScrapedSpecs(
  [{ label: "Độ phân giải", value: "600 dpi" }],
  "scanner",
);
assert.equal(scannerWithoutType.scannerSpecs?.scannerType, undefined);

const printerSpecs = normalizeScrapedSpecs(
  [
    { label: "Công nghệ in", value: "Laser màu" },
    { label: "Tốc độ in", value: "31 trang/phút" },
    { label: "Độ phân giải in", value: "2.400 x 600 dpi" },
    { label: "Kết nối", value: "USB, LAN, WiFi" },
    { label: "In đảo mặt tự động", value: "Có" },
    { label: "Khay giấy tiêu chuẩn", value: "250 tờ" },
  ],
  "printer",
);

assert.deepEqual(printerSpecs.attributes, []);
assert.equal(printerSpecs.printerSpecs?.printTechnology, "Laser màu");
assert.equal(printerSpecs.printerSpecs?.printSpeed, "31 trang/phút");
assert.equal(printerSpecs.printerSpecs?.printSpeedPpm, 31);
assert.equal(printerSpecs.printerSpecs?.printResolution, "2.400 x 600 dpi");
assert.equal(printerSpecs.printerSpecs?.connectivity, "USB, LAN, WiFi");
assert.equal(printerSpecs.printerSpecs?.autoDuplexPrint, true);
assert.equal(printerSpecs.printerSpecs?.standardPaperTray, "250 tờ");
assert.equal(printerSpecs.specs.length, 6);

const photocopierSpecs = normalizeScrapedSpecs(
  [
    { label: "Cấu hình chuẩn", value: "Copy, In mạng, Scan màu, ADF, đảo mặt" },
    { label: "Tốc độ copy", value: "25 trang/phút" },
    { label: "Khổ giấy", value: "A3, A4" },
    { label: "Cổng giao tiếp", value: "USB, LAN, WiFi" },
    { label: "Độ phân giải", value: "600 x 600 dpi" },
  ],
  "photocopier",
);

assert.deepEqual(photocopierSpecs.attributes, []);
assert.equal(photocopierSpecs.photocopierSpecs?.functions, "Copy, In mạng, Scan màu, ADF, đảo mặt");
assert.equal(photocopierSpecs.photocopierSpecs?.copySpeed, "25 trang/phút");
assert.equal(photocopierSpecs.photocopierSpecs?.copySpeedCpm, 25);
assert.equal(photocopierSpecs.photocopierSpecs?.maxPaperSize, "A3, A4");
assert.equal(photocopierSpecs.photocopierSpecs?.connectivity, "USB, LAN, WiFi");
assert.equal(photocopierSpecs.photocopierSpecs?.hasAdf, true);

console.log("scraper canonical row verification passed");
