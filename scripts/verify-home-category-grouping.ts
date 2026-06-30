import type { CatalogProduct } from "../lib/catalog";
import { homeDeviceTypeOf, isHomeDeviceType } from "../lib/home-category-sections";

type ExpectedHomeDeviceType = "scanner" | "printer" | "photocopier" | null;

type Case = {
  name: string;
  product: Partial<CatalogProduct>;
  expect: ExpectedHomeDeviceType;
};

const cases: Case[] = [
  {
    name: "Real scanner",
    product: { productType: "scanner", title: "May Scan Fujitsu Fi-7160" },
    expect: "scanner",
  },
  {
    name: "Multifunction printer with Scan in title",
    product: { productType: "printer", title: "HP Deskjet Ink Adv 4515 (Print, Scan, Copy)" },
    expect: "printer",
  },
  {
    name: "Laser printer Print-Scan-Copy-Fax",
    product: { productType: "printer", title: "HP M225DW (Print-Scan-Copy-Fax)" },
    expect: "printer",
  },
  {
    name: "Ink product with printer wording",
    product: { productType: "ink", title: "Muc in Epson C13T1054 mau vang" },
    expect: null,
  },
  {
    name: "Toner cartridge",
    product: { productType: "ink", title: "Hop muc Maetone 05A" },
    expect: null,
  },
  {
    name: "Photocopier",
    product: { productType: "photocopier", title: "May photocopy Ricoh MP 2014" },
    expect: "photocopier",
  },
  {
    name: "Laptop",
    product: { productType: "laptop", title: "Laptop Dell Latitude" },
    expect: null,
  },
  {
    name: "Software",
    product: { productType: "software", title: "Microsoft 365" },
    expect: null,
  },
];

let failed = 0;

for (const testCase of cases) {
  const got = homeDeviceTypeOf(testCase.product as Pick<CatalogProduct, "productType">);
  const ok = got === testCase.expect;
  if (!ok) failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} | ${testCase.name} | expect=${testCase.expect} got=${got}`);
}

const printerScan = {
  productType: "printer",
  title: "HP M225DW Print-Scan-Copy",
} as CatalogProduct;

if (isHomeDeviceType(printerScan, "scanner")) {
  console.log("FAIL | Multifunction printer was grouped into scanner section");
  failed += 1;
}

console.log(failed ? `\n${failed} case(s) failed` : "\nAll cases passed");
process.exit(failed ? 1 : 0);
