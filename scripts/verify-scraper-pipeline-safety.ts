import assert from "node:assert/strict";

import { evaluatePublicationGate } from "../lib/scraper/publication-gate";
import { validateExpectedProductType } from "../lib/scraper/product-type-guard";
import {
  findExactSourceCandidate,
  sourceIdentityKey,
  sourceVariantSku,
} from "../lib/scraper/source-identity";
import {
  buildProductSeoArticleHTML,
  seoArticleWordCount,
} from "../lib/scraper/seo-article";
import type { ScrapedProduct } from "../lib/scraper/types";

const candidates = [
  {
    productName: "Phần mềm Microsoft Windows Server 2025 Standard - 2 Core",
    productSKU: "PMWD0088",
    productUrl:
      "/phan-mem-microsoft-windows-server-2025-standard-2-core.html",
  },
  {
    productName:
      "Phần mềm Microsoft Windows Server 2025 Standard - 16 Core License Pack",
    productSKU: "PMWD0086",
    productUrl:
      "/phan-mem-microsoft-windows-server-2025-standard-16-core-license-pack.html",
  },
];

assert.equal(
  findExactSourceCandidate(
    candidates,
    "Phần mềm Microsoft Windows Server 2025 Standard - 2 Core",
  ).productSKU,
  "PMWD0088",
);
assert.throws(
  () =>
    findExactSourceCandidate(
      candidates,
      "Phần mềm Microsoft Windows Server 2025 Standard",
    ),
  /Không tìm thấy sản phẩm khớp chính xác/,
);

const firstFallbackSku = sourceVariantSku(
  "https://www.anphatpc.com.vn/software-a.html",
  "0",
);
const secondFallbackSku = sourceVariantSku(
  "https://www.anphatpc.com.vn/software-b.html",
  "0",
);
assert.notEqual(firstFallbackSku, secondFallbackSku);
assert.equal(
  sourceIdentityKey("https://www.anphatpc.com.vn/software-a.html?tracking=1"),
  sourceIdentityKey("https://anphatpc.com.vn/software-a.html"),
);

const product: ScrapedProduct = {
  confidence: 1,
  data: {
    price: "12990000",
    sku: "ADS-4300N",
    specs: [
      { label: "Tốc độ quét", value: "40 trang/phút" },
      { label: "Khay nạp giấy", value: "80 tờ" },
      { label: "Kết nối", value: "USB, LAN" },
      { label: "Quét hai mặt", value: "Có" },
      { label: "Độ phân giải", value: "600 dpi" },
    ],
    title: "Máy scan Brother ADS-4300N",
  },
  generated: {
    description: "Mô tả sản phẩm",
    summary: "Máy scan tài liệu dành cho văn phòng và doanh nghiệp.",
  },
  images: [
    {
      source: "gallery",
      url: "https://example.com/brother-ads-4300n.jpg",
    },
  ],
  reviewStatus: "ready_to_review",
  seo: {
    canonical: "/san-pham/may-scan-brother-ads-4300n",
    description:
      "Máy scan Brother ADS-4300N hỗ trợ quét tài liệu, kết nối mạng LAN và khay nạp giấy cho văn phòng.",
    imageAlt: "Máy scan Brother ADS-4300N",
    title: "Máy scan Brother ADS-4300N chính hãng | HPT Tech",
  },
  source: {
    brand: "Brother",
    identity: {
      exact: true,
      key: "ANPHAT-TEST",
      method: "name",
    },
    searchQuery: "Máy scan Brother ADS-4300N",
    url: "https://www.anphatpc.com.vn/may-scan-brother-ads-4300n.html",
  },
  warnings: [],
};

const article = buildProductSeoArticleHTML(product, [
  { id: 1, url: "/api/r2-media/brother-ads-4300n.jpg" },
]);
const words = seoArticleWordCount(article);
assert.ok(words >= 1000, `SEO article only has ${words} words`);
assert.ok(words <= 1500, `SEO article has ${words} words`);
assert.equal(
  evaluatePublicationGate({
    articleHTML: article,
    imageCount: 1,
    product,
  }).allowed,
  true,
);
assert.equal(
  evaluatePublicationGate({
    articleHTML: `<p>${Array.from({ length: 1839 }, (_, index) => `tu${index}`).join(" ")}</p>`,
    imageCount: 1,
    product,
  }).allowed,
  true,
);
const softwareProduct: ScrapedProduct = {
  ...product,
  data: {
    ...product.data,
    sku: "PMWD0086",
    specs: [],
    title: "Phần mềm Microsoft Windows Server 2025 Standard - 16 Core License Pack",
  },
  seo: {
    ...product.seo,
    description:
      "Phần mềm Microsoft Windows Server 2025 Standard bản quyền cho doanh nghiệp, hỗ trợ triển khai hệ thống máy chủ ổn định.",
    imageAlt: "Phần mềm Microsoft Windows Server 2025 Standard",
    title: "Windows Server 2025 Standard bản quyền | HPT Tech",
  },
  source: {
    ...product.source,
    brand: "Microsoft",
    url: "https://anphatpc.com.vn/phan-mem-microsoft-windows-server-2025-standard-16-core-license-pack.html",
  },
};
const softwareArticle = buildProductSeoArticleHTML(softwareProduct, [
  { id: 2, url: "/api/r2-media/windows-server-2025.jpg" },
]);
assert.ok(!/NEED_REVIEW/i.test(softwareArticle));
assert.equal(
  evaluatePublicationGate({
    articleHTML: softwareArticle,
    imageCount: 1,
    product: softwareProduct,
  }).allowed,
  true,
);
assert.equal(
  evaluatePublicationGate({
    articleHTML: article,
    imageCount: 0,
    product,
  }).allowed,
  false,
);
assert.equal(
  evaluatePublicationGate({
    articleHTML: article,
    imageCount: 1,
    product: {
      ...product,
      source: {
        ...product.source,
        identity: {
          exact: false,
          key: "ANPHAT-TEST",
          method: "name",
        },
      },
    },
  }).allowed,
  false,
);
assert.throws(
  () =>
    validateExpectedProductType("Phần mềm", {
      ...product,
      data: {
        ...product.data,
        specs: [
          { label: "Cảm biến", value: "Sony CMOS" },
          { label: "Chức năng", value: "Camera PTZ" },
        ],
        title: "Camera PTZ Tenveo NV3U",
      },
    }),
  /Sai loại sản phẩm/,
);
assert.doesNotThrow(() =>
  validateExpectedProductType("Mực in & Phụ kiện", {
    ...product,
    data: {
      ...product.data,
      specs: [{ label: "Số trang in", value: "2.400 trang" }],
      title: "Hộp mực Canon 337 chính hãng",
    },
    source: {
      ...product.source,
      brand: "Canon",
      url: "https://example.com/hop-muc-canon-337",
    },
  }),
);
assert.throws(
  () =>
    validateExpectedProductType("Mực in & Phụ kiện", {
      ...product,
      data: {
        ...product.data,
        specs: [
          { label: "Tốc độ in", value: "40 trang/phút" },
          { label: "Kết nối", value: "USB, LAN" },
        ],
        title: "Máy in HP LaserJet Pro 4003dn",
      },
    }),
  /Sai loại sản phẩm/,
);

console.log("scraper pipeline safety verification passed");
