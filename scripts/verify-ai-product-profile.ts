import assert from "node:assert/strict";
import {
  productAIProfileFromCatalogProduct,
  toProductAIProfile,
} from "../lib/ai/products.ts";

const profile = toProductAIProfile(
  {
    id: 101,
    attributes: [
      {
        dataType: "number",
        definition: {
          code: "scanner_scan_speed_simplex",
          comparable: true,
          filterable: true,
          label: "Scan speed simplex",
          required: true,
          searchable: true,
          unit: "ppm",
        },
        numberValue: 70,
        rawValue: "70 ppm",
        unit: "ppm",
      },
      {
        dataType: "enum_list",
        definition: {
          code: "scanner_connectivity",
          comparable: true,
          filterable: true,
          label: "Connectivity",
          searchable: true,
          unit: "none",
        },
        enumListValue: [{ value: "usb" }, { value: "lan" }],
        rawValue: "USB, LAN",
        unit: "none",
      },
      {
        booleanValue: true,
        dataType: "boolean",
        definition: {
          code: "scanner_duplex",
          label: "Duplex scan",
          required: true,
          searchable: true,
          unit: "none",
        },
        unit: "none",
      },
    ],
    brand: { name: "Ricoh", slug: "ricoh" },
    category: { name: "May scan", slug: "may-scan" },
    descriptionHTML: "<p>Fast A4 document scanner for business records.</p>",
    images: [{ url: "https://cdn.example.com/fi-8170.png" }],
    internalId: "HPT-RICOH-FI8170",
    model: "fi-8170",
    mpn: "PA03810-B051",
    name: "Ricoh fi-8170",
    productType: { code: "scanner", name: "May scan" },
    shortDescription: "A4 scanner, 70 ppm, ADF 100 sheets.",
    slug: "may-scan-ricoh-fi-8170",
    source: {
      type: "manufacturer",
      url: "https://www.pfu.ricoh.com/global/scanners/fi/fi-8170/",
      verified: false,
    },
    status: "published",
  },
  {
    commercial: {
      currency: "VND",
      price: "Lien he",
      quantity: 3,
      sku: "RICOH-FI8170",
      stockStatus: "in_stock",
      vatIncluded: true,
      warranty: "12 thang",
    },
    metadata: {
      advantages: [{ value: "ADF 100 sheets" }],
      aiGenerated: false,
      competitorModels: [{ value: "Epson DS-790WN" }],
      keywords: [{ value: "scan ho so" }],
      useCases: [{ value: "So hoa ho so hanh chinh" }],
      verified: true,
    },
  },
);

assert.equal(profile.id, "101");
assert.equal(profile.name, "Ricoh fi-8170");
assert.equal(profile.productType, "scanner");
assert.equal(profile.brand, "Ricoh");
assert.equal(profile.sku, "RICOH-FI8170");
assert.equal(profile.stockStatus, "in_stock");
assert.equal(profile.stockQuantity, 3);
assert.equal(profile.warranty, "12 thang");
assert.equal(profile.metadataVerified, true);
assert.deepEqual(profile.useCases, ["So hoa ho so hanh chinh"]);
assert.deepEqual(profile.keywords, ["scan ho so"]);

const speed = profile.specs.find((spec) => spec.code === "scanner_scan_speed_simplex");
assert.equal(speed?.value, 70);
assert.equal(speed?.unit, "ppm");
assert.equal(speed?.filterable, true);
assert.equal(speed?.required, true);

const connectivity = profile.specs.find((spec) => spec.code === "scanner_connectivity");
assert.deepEqual(connectivity?.value, ["usb", "lan"]);
assert.equal(connectivity?.displayValue, "usb, lan");

assert.match(profile.searchableText, /Ricoh fi-8170/);
assert.match(profile.searchableText, /scanner_scan_speed_simplex/);
assert.match(profile.searchableText, /So hoa ho so hanh chinh/);

const catalogProfile = productAIProfileFromCatalogProduct({
  brand: "Brother",
  category: "May scan",
  detail: "Compact scanner",
  price: "13.900.000d",
  priceValue: 13900000,
  slug: "brother-ads-4300n",
  specs: [{ label: "Scan speed", value: "40 ppm" }],
  stockStatus: "in_stock",
  title: "Brother ADS-4300N",
});

assert.equal(catalogProfile.name, "Brother ADS-4300N");
assert.equal(catalogProfile.priceValue, 13900000);
assert.equal(catalogProfile.specs[0]?.label, "Scan speed");
assert.match(catalogProfile.searchableText, /Compact scanner/);

console.log("AI product profile mapper verified.");
