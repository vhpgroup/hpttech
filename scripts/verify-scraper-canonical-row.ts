import assert from "node:assert/strict";
import { buildCanonicalImportRow } from "../lib/scraper/canonical-row";
import { commonProductTypeCode } from "../lib/scraper/db-lookup";
import { normalizeScrapedSpecs } from "../lib/scraper/spec-normalizer";
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
assert.equal(row.sku, "ADS-4700W");
assert.equal(row.price, "12990000");
assert.equal(row.saleStatus, "contact");
assert.equal(row.stockStatus, "unknown");
assert.equal(row.sourceType, "scraper");
assert.equal(row.sourceUrl, "https://brother.com.vn/ads-4700w");
assert.equal("images" in row, false);
assert.equal(commonProductTypeCode("Máy in đa năng"), "printer");
assert.equal(commonProductTypeCode("Máy photocopy A3"), "photocopier");

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

console.log("scraper canonical row verification passed");
