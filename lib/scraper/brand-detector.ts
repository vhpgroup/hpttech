import { brandConfigs, findBrandByName } from "./brands";
import type { BrandConfig } from "./types";

const modelHints: Array<{ brand: string; patterns: RegExp[] }> = [
  { brand: "epson", patterns: [/\bl\d{3,5}\b/i, /\becotank\b/i] },
  { brand: "canon", patterns: [/\b(mf|lbp|g|ts|tr)\d{3,5}\w*\b/i, /\bimageclass\b/i] },
  { brand: "ricoh", patterns: [/\bim\s?[c]?\d{3,5}\b/i, /\bsp\s?\d{3,5}\b/i] },
  { brand: "brother", patterns: [/\b(hl|dcp|mfc)-?\w+\b/i] },
  { brand: "hp", patterns: [/\b(laserjet|deskjet|officejet)\b/i] },
];

export async function detectBrand(productName: string): Promise<BrandConfig> {
  const keywordMatch = findBrandByName(productName);
  if (keywordMatch) return keywordMatch;

  const hint = modelHints.find((entry) => entry.patterns.some((pattern) => pattern.test(productName)));
  const hintedBrand = hint ? brandConfigs.find((brand) => brand.slug === hint.brand) : undefined;
  if (hintedBrand) return hintedBrand;

  throw new Error(
    "Chua nhan dien duoc thuong hieu. MVP hien ho tro Epson, Ricoh va Canon.",
  );
}
