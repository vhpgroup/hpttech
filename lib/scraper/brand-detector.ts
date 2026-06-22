import { brandConfigs, findBrandByName } from "./brands";
import type { BrandConfig } from "./types";

const modelHints: Array<{ brand: string; patterns: RegExp[] }> = [
  { brand: "epson", patterns: [/\bl\d{3,5}\b/i, /\becotank\b/i] },
  { brand: "canon", patterns: [/\b(mf|lbp|g|ts|tr|dr)\d{3,5}\w*\b/i, /\b(imageclass|lide)\b/i] },
  { brand: "ricoh", patterns: [/\bim\s?[c]?\d{3,5}\b/i, /\bsp\s?\d{3,5}\b/i] },
  { brand: "brother", patterns: [/\b(hl|dcp|mfc|ads|pds)-?\w+\b/i] },
  { brand: "hp", patterns: [/\b(laserjet|deskjet|officejet)\b/i] },
  { brand: "pantum", patterns: [/\b(?:pantum|bm\d{4,5}\w*|bp\d{4,5}\w*|m\d{4,5}\w*|p\d{4,5}\w*)\b/i] },
  { brand: "zebra", patterns: [/\b(?:zebra|zd\d{3,4}|zt\d{3,4})\b/i] },
  { brand: "apos", patterns: [/\bapos[-\s]?[a-z0-9-]+\b/i] },
  { brand: "atp", patterns: [/\batp[-\s]?[a-z0-9-]+\b/i] },
  { brand: "avision", patterns: [/\b(av|an|ap)\d{2,4}\w*\b/i] },
  { brand: "plustek", patterns: [/\b(opticslim|opticbook|opticfilm|d\d{3,4})\b/i] },
  { brand: "kodak-alaris", patterns: [/\b(s\d{4}|i\d{4}|scanmate)\b/i, /\bkodak\b/i] },
  { brand: "panasonic", patterns: [/\bkv-\w+\b/i] },
  {
    brand: "microtek",
    patterns: [
      /\b(artixscan|filescan|h[\s\u2010-\u2015-]?screen|ls-\d+|objectscan|scanmaker|xt\d+)\b/i,
    ],
  },
  { brand: "xerox", patterns: [/\bd35wn\b/i] },
];

export async function detectBrand(productName: string): Promise<BrandConfig> {
  const keywordMatch = findBrandByName(productName);
  if (keywordMatch) return keywordMatch;

  const hint = modelHints.find((entry) => entry.patterns.some((pattern) => pattern.test(productName)));
  const hintedBrand = hint ? brandConfigs.find((brand) => brand.slug === hint.brand) : undefined;
  if (hintedBrand) return hintedBrand;

  throw new Error(
    "Chưa nhận diện được thương hiệu được hỗ trợ.",
  );
}
