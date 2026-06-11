import { cleanText } from "./text";
import type { ProductSpec } from "./types";

type CanonicalAttribute = {
  code: string;
  value: boolean | number | string | string[];
};

type ScannerSpecs = Record<string, boolean | number | string>;

export type NormalizedScrapedSpecs = {
  attributes: CanonicalAttribute[];
  scannerSpecs?: ScannerSpecs;
  specs: ProductSpec[];
};

function normalize(value: string) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function firstNumber(value: string) {
  const match = value.match(/\d+(?:[.,]\d+)?/);
  if (!match) return undefined;
  const number = Number(match[0].replace(",", "."));
  return Number.isFinite(number) ? number : undefined;
}

function unitNumber(value: string, unit: string) {
  const match = value.match(
    new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${unit}\\b`, "i"),
  );
  if (!match) return undefined;
  const number = Number(match[1].replace(",", "."));
  return Number.isFinite(number) ? number : undefined;
}

function pagesPerMinute(value: string) {
  return [
    ...value.matchAll(
      /(\d+(?:[.,]\d+)?)\s*(?:trang\s*\/?\s*phut|pages?\s+per\s+minute)/gi,
    ),
  ]
    .map((match) => Number(match[1].replace(",", ".")))
    .filter(Number.isFinite);
}

function positiveBoolean(value: string) {
  const normalized = normalize(value);
  if (
    /^(khong|no|false|none)$/.test(normalized) ||
    /\b(khong ho tro|khong co)\b/.test(normalized)
  ) {
    return false;
  }
  if (
    /\b(co|yes|true|automatic|tu dong|duplex|2-sided|hai mat)\b/.test(
      normalized,
    )
  ) {
    return true;
  }
  return undefined;
}

function addAttribute(
  attributes: CanonicalAttribute[],
  code: string,
  value: CanonicalAttribute["value"] | undefined,
) {
  if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
    return;
  }
  if (!attributes.some((attribute) => attribute.code === code)) {
    attributes.push({ code, value });
  }
}

function connectivityValues(value: string) {
  const normalized = normalize(value);
  return [
    normalized.includes("usb") ? "usb" : undefined,
    /\b(lan|ethernet|network tcp)\b/.test(normalized) ? "lan" : undefined,
    /\b(wifi|wi-fi|wireless)\b/.test(normalized) ? "wifi" : undefined,
  ].filter((item): item is string => Boolean(item));
}

function paperSize(value: string) {
  const normalized = normalize(value);
  if (/\ba3\b/.test(normalized)) return "a3";
  if (/\blegal\b/.test(normalized)) return "legal";
  if (/\ba4\b/.test(normalized)) return "a4";
  return undefined;
}

function inferPaperRange(spec: ProductSpec) {
  const label = normalize(spec.label);
  const value = cleanText(spec.value);
  const normalizedValue = normalize(value);
  if (normalizedValue.includes("thickness")) return undefined;
  if (
    label.includes("toi da") ||
    label.includes("maximum") ||
    label.includes("max")
  ) {
    return undefined;
  }
  if (
    !(
      label.includes("kho tai lieu") ||
      label.includes("kho giay") ||
      label.includes("do rong quet") ||
      label.includes("do dai") ||
      label.includes("document size") ||
      label.includes("paper width") ||
      label === "length" ||
      label === "width"
    )
  ) {
    return undefined;
  }
  if (!/\d/.test(value)) return undefined;
  const explicitMinimum =
    label.includes("toi thieu") ||
    label.includes("minimum") ||
    label.includes("min") ||
    normalizedValue.includes("toi thieu") ||
    normalizedValue.includes("minimum");
  const hasDimensionRange =
    /\d+(?:[.,]\d+)?\s*(?:mm|cm|in\.?|inch)\s*(?:-|to|den|–|—|x)\s*\d+(?:[.,]\d+)?/i.test(
      normalizedValue,
    ) ||
    /\d+(?:[.,]\d+)?\s*(?:-|to|den|–|—)\s*\d+(?:[.,]\d+)?\s*(?:mm|cm|in\.?|inch)/i.test(
      normalizedValue,
    );
  if (!explicitMinimum && !hasDimensionRange) return undefined;
  return `${spec.label}: ${value}`;
}

function inferScannerType(value: string) {
  const normalized = normalize(value);
  if (normalized.includes("flatbed")) return "ADF + Flatbed";
  if (normalized.includes("sheet-fed") || normalized.includes("sheet fed")) return "Sheet-fed";
  if (normalized.includes("adf")) return "ADF";
  return undefined;
}

function osSummary(value: string) {
  const normalized = normalize(value);
  const parts = [
    /\bwindows\b/.test(normalized) ? "Windows" : undefined,
    /\bmac|macos|os x\b/.test(normalized) ? "macOS" : undefined,
    /\blinux\b/.test(normalized) ? "Linux" : undefined,
  ].filter((item): item is string => Boolean(item));
  return parts.length ? parts.join(", ") : undefined;
}

function modeSummary(value: string) {
  const normalized = normalize(value);
  const parts = [
    normalized.includes("mau") || normalized.includes("color") ? "Mau" : undefined,
    normalized.includes("xam") || normalized.includes("gray") || normalized.includes("greyscale")
      ? "Xam"
      : undefined,
    normalized.includes("den trang") || normalized.includes("black") || normalized.includes("mono")
      ? "Den trang"
      : undefined,
    normalized.includes("hai mat") || normalized.includes("duplex") ? "Hai mat" : undefined,
  ].filter((item): item is string => Boolean(item));
  return parts.length ? parts.join(", ") : undefined;
}

function yesNoText(value: boolean | undefined, positiveLabel: string) {
  if (value === undefined) return undefined;
  return value ? positiveLabel : "Không";
}

function booleanText(value: boolean) {
  return value ? "Có" : "Không";
}

function isDimensionsWeightSpec(label: string, value: string) {
  const normalizedValue = normalize(value);
  if (normalizedValue.includes("thickness")) return false;
  return (
    label.includes("kich thuoc") ||
    label.includes("trong luong") ||
    label.includes("dimensions") ||
    label.includes("weights") ||
    label === "weight"
  );
}

function isDimensionsSpec(label: string, value: string) {
  const normalizedValue = normalize(value);
  return !normalizedValue.includes("thickness") && (label.includes("kich thuoc") || label.includes("dimensions"));
}

function isWeightSpec(label: string, value: string) {
  const normalizedValue = normalize(value);
  return !normalizedValue.includes("thickness") && (label.includes("trong luong") || label === "weight" || label.includes("weights"));
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasBooleanEvidence(textValue: unknown, boolValue: unknown) {
  return hasText(textValue) || boolValue === true;
}

function completenessValue(scannerSpecs: ScannerSpecs, key: string) {
  switch (key) {
    case "passportScan":
      return hasBooleanEvidence(scannerSpecs.passportScanText, scannerSpecs.passportScan);
    case "duplexScan":
      return hasBooleanEvidence(scannerSpecs.duplexScanText, scannerSpecs.duplexScan);
    case "colorScan":
      return hasBooleanEvidence(scannerSpecs.colorScanText, scannerSpecs.colorScan);
    case "ocr":
      return hasBooleanEvidence(scannerSpecs.ocrText, scannerSpecs.ocr);
    case "plasticCardScan":
      return hasBooleanEvidence(
        scannerSpecs.plasticCardScanText,
        scannerSpecs.plasticCardScan,
      );
    default:
      return hasText(scannerSpecs[key]) || hasNumber(scannerSpecs[key]);
  }
}

function ensureScannerField(
  scannerSpecs: ScannerSpecs,
  key: string,
  value: boolean | number | string | undefined,
) {
  if (value === undefined || value === "") return;
  if (!completenessValue(scannerSpecs, key)) {
    scannerSpecs[key] = value;
  }
}

function deriveFunctions(scannerSpecs: ScannerSpecs) {
  const functions = [
    scannerSpecs.duplexScanText || scannerSpecs.duplexScan
      ? "Scan 2 mat"
      : undefined,
    scannerSpecs.colorScanText || scannerSpecs.colorScan
      ? "Scan mau"
      : undefined,
    scannerSpecs.ocrText || scannerSpecs.ocr
      ? "OCR"
      : undefined,
    scannerSpecs.plasticCardScanText || scannerSpecs.plasticCardScan
      ? "Scan the nhua"
      : undefined,
    scannerSpecs.passportScanText || scannerSpecs.passportScan
      ? "Scan ho chieu"
      : undefined,
  ].filter((item): item is string => Boolean(item));
  return functions.length ? functions.join(", ") : undefined;
}

function deriveScannerSpecs(scannerSpecs: ScannerSpecs, specs: ProductSpec[]) {
  if (!hasNumber(scannerSpecs.adfSheets) && hasNumber(scannerSpecs.adfCapacitySheets)) {
    scannerSpecs.adfSheets = scannerSpecs.adfCapacitySheets;
  }
  if (!hasText(scannerSpecs.scannerType)) {
    const inferred = specs
      .map((spec) => inferScannerType(`${spec.label}: ${spec.value}`))
      .find(Boolean);
    ensureScannerField(scannerSpecs, "scannerType", inferred || "ADF");
  }
  if (!hasText(scannerSpecs.minPaperSize)) {
    const ranges = specs
      .map((spec) => inferPaperRange(spec))
      .filter((item): item is string => Boolean(item));
    if (ranges.length) {
      ensureScannerField(scannerSpecs, "minPaperSize", ranges.join(" | "));
    }
  }
  if (!hasText(scannerSpecs.supportedOs)) {
    const inferred = specs
      .map((spec) => osSummary(`${spec.label}: ${spec.value}`))
      .find(Boolean);
    ensureScannerField(scannerSpecs, "supportedOs", inferred);
  }
  if (!hasText(scannerSpecs.scanModes)) {
    const inferred = specs
      .map((spec) => modeSummary(`${spec.label}: ${spec.value}`))
      .find(Boolean);
    ensureScannerField(scannerSpecs, "scanModes", inferred);
  }
  if (!hasText(scannerSpecs.colorScanText) && hasText(scannerSpecs.scanModes)) {
    const inferred = positiveBoolean(String(scannerSpecs.scanModes));
    ensureScannerField(scannerSpecs, "colorScan", inferred);
    ensureScannerField(scannerSpecs, "colorScanText", yesNoText(inferred, "Có"));
  }
  if (!hasText(scannerSpecs.duplexScanText) && scannerSpecs.duplexScan !== undefined) {
    ensureScannerField(
      scannerSpecs,
      "duplexScanText",
      booleanText(Boolean(scannerSpecs.duplexScan)),
    );
  }
  if (!hasText(scannerSpecs.colorScanText) && scannerSpecs.colorScan !== undefined) {
    ensureScannerField(
      scannerSpecs,
      "colorScanText",
      booleanText(Boolean(scannerSpecs.colorScan)),
    );
  }
  if (!hasText(scannerSpecs.ocrText) && scannerSpecs.ocr !== undefined) {
    ensureScannerField(scannerSpecs, "ocrText", booleanText(Boolean(scannerSpecs.ocr)));
  }
  if (
    !hasText(scannerSpecs.plasticCardScanText) &&
    scannerSpecs.plasticCardScan !== undefined
  ) {
    ensureScannerField(
      scannerSpecs,
      "plasticCardScanText",
      booleanText(Boolean(scannerSpecs.plasticCardScan)),
    );
  }
  if (!hasText(scannerSpecs.passportScanText) && scannerSpecs.passportScan !== undefined) {
    ensureScannerField(
      scannerSpecs,
      "passportScanText",
      booleanText(Boolean(scannerSpecs.passportScan)),
    );
  }
  if (!hasText(scannerSpecs.functions)) {
    ensureScannerField(scannerSpecs, "functions", deriveFunctions(scannerSpecs));
  }
}

function isUsefulSpec(spec: ProductSpec) {
  const label = normalize(spec.label);
  if (
    spec.label.length > 180 ||
    /item\.[a-z]+/i.test(`${spec.label} ${spec.value}`)
  ) {
    return false;
  }

  return !(
    /^gia (niem yet|khuyen mai|khuyen mai)/.test(label) ||
    /^(facebook|ho ten|ma bao ve)$/.test(label) ||
    /^(kho hang|nhap thong tin de binh luan)/.test(label) ||
    /^(phong ban hang|phong du an)/.test(label) ||
    label.includes("thong tin cong ty")
  );
}

export function normalizeScrapedSpecs(
  input: ProductSpec[],
  productTypeCode: string,
): NormalizedScrapedSpecs {
  const seenSpecs = new Set<string>();
  const specs = input
    .map((spec) => ({
      label: cleanText(spec.label).replace(/[:：]\s*$/, ""),
      value: cleanText(spec.value),
    }))
    .filter((spec) => {
      if (!spec.label || !spec.value || !isUsefulSpec(spec)) return false;
      const key = normalize(spec.label);
      if (seenSpecs.has(key)) return false;
      seenSpecs.add(key);
      return true;
    });
  if (productTypeCode !== "scanner") {
    return { attributes: [], specs };
  }

  const attributes: CanonicalAttribute[] = [];
  const scannerSpecs: ScannerSpecs = {};

  for (const spec of specs) {
    const label = normalize(spec.label);
    const value = spec.value;
    const normalizedValue = normalize(value);

    if (label.includes("toc do")) {
      const pageSpeeds = pagesPerMinute(normalizedValue);
      const simplex =
        unitNumber(normalizedValue, "ppm") ||
        pageSpeeds[0];
      const duplex =
        unitNumber(normalizedValue, "ipm") ||
        (normalizedValue.includes("anh/phut")
          ? firstNumber(normalizedValue)
          : label.includes("hai mat") ||
              label.includes("duplex") ||
              normalizedValue.includes("double sided") ||
              normalizedValue.includes("two-sided") ||
              normalizedValue.includes("2-sided")
            ? pageSpeeds[0]
          : normalizedValue.includes("1 mat") &&
              normalizedValue.includes("2 mat") &&
              pageSpeeds.length >= 2
            ? pageSpeeds[1]
          : undefined);
      if (simplex !== undefined) {
        scannerSpecs.scanSpeedSimplexPpm = simplex;
        addAttribute(attributes, "scanner_scan_speed_simplex", simplex);
      }
      if (duplex !== undefined) {
        scannerSpecs.scanSpeedDuplexIpm = duplex;
        addAttribute(attributes, "scanner_scan_speed_duplex", duplex);
        scannerSpecs.duplexScan = true;
        scannerSpecs.duplexScanText = booleanText(true);
        addAttribute(attributes, "scanner_duplex", true);
      }
    }

    if (label.includes("do phan giai")) {
      scannerSpecs.scanResolution = value;
      const dpi = unitNumber(normalizedValue, "dpi");
      addAttribute(attributes, "scanner_optical_resolution", dpi);
    }

    if (label.includes("giao tiep") || label.includes("ket noi")) {
      scannerSpecs.connectivity = value;
      addAttribute(
        attributes,
        "scanner_connectivity",
        connectivityValues(value),
      );
    }

    if (
      label.includes("hai mat") ||
      label.includes("2 mat") ||
      label.includes("duplex")
    ) {
      const duplex = positiveBoolean(`${spec.label} ${value}`);
      if (duplex !== undefined) {
        scannerSpecs.duplexScan = duplex;
        scannerSpecs.duplexScanText = booleanText(duplex);
        addAttribute(attributes, "scanner_duplex", duplex);
      }
    }

    if (
      label.includes("adf") &&
      (label.includes("suc chua") ||
        label.includes("khay") ||
        label.includes("capacity") ||
        /\b(pages?|sheets?)\b/.test(normalizedValue) ||
        /\bto\b/.test(normalizedValue))
    ) {
      const capacity = firstNumber(normalizedValue);
      if (capacity !== undefined) {
        scannerSpecs.adfCapacitySheets = capacity;
        scannerSpecs.adfSheets = scannerSpecs.adfSheets ?? capacity;
        addAttribute(attributes, "scanner_adf_capacity", capacity);
      }
    }

    if (
      label.includes("khay giay") &&
      /\b(to|pages?|sheets?)\b/.test(normalizedValue)
    ) {
      const capacity = firstNumber(normalizedValue);
      if (capacity !== undefined) {
        scannerSpecs.adfCapacitySheets = capacity;
        scannerSpecs.adfSheets = scannerSpecs.adfSheets ?? capacity;
        addAttribute(attributes, "scanner_adf_capacity", capacity);
      }
    }

    if (
      label.includes("kho giay toi da") ||
      label.includes("kho tai lieu toi da") ||
      label.includes("kho giay ho tro")
    ) {
      scannerSpecs.maxPaperSize = value;
      addAttribute(attributes, "scanner_max_paper_size", paperSize(value));
    }

    if (
      label.includes("kho giay toi thieu") ||
      label.includes("kho tai lieu toi thieu")
    ) {
      scannerSpecs.minPaperSize = value;
      addAttribute(attributes, "scanner_min_paper_size", value);
    }

    if (
      (label.includes("cong suat") || label.includes("chu ky hoat dong")) &&
      (label.includes("ngay") || normalizedValue.includes("ngay"))
    ) {
      const duty = firstNumber(normalizedValue.replace(/[.,](?=\d{3}\b)/g, ""));
      if (duty !== undefined) {
        scannerSpecs.dailyDuty = duty;
        addAttribute(attributes, "scanner_daily_duty", duty);
      }
    }

    if (label.includes("he dieu hanh")) {
      scannerSpecs.supportedOs = value;
      addAttribute(attributes, "scanner_supported_os", value);
    }

    if (label.includes("ho tro he dieu hanh") || osSummary(value)) {
      scannerSpecs.supportedOs = scannerSpecs.supportedOs || osSummary(value) || value;
      addAttribute(attributes, "scanner_supported_os", scannerSpecs.supportedOs);
    }

    if (isDimensionsWeightSpec(label, value)) {
      if (isDimensionsSpec(label, value)) {
        scannerSpecs.dimensions = value;
      }
      if (isWeightSpec(label, value)) {
        scannerSpecs.weight = value;
      }
      scannerSpecs.dimensionsWeight = [
        scannerSpecs.dimensionsWeight,
        `${spec.label}: ${value}`,
      ]
        .filter(Boolean)
        .join(" | ");
      addAttribute(
        attributes,
        "scanner_dimensions_weight",
        String(scannerSpecs.dimensionsWeight),
      );
    }

    if (label.includes("man hinh hien thi") || label.includes("display")) {
      scannerSpecs.displayScreen = value;
    }

    if (label.includes("cong nghe quet") || label.includes("scan technology")) {
      scannerSpecs.scanTechnology = value;
    }

    if (label.includes("tinh nang") || label.includes("chuc nang")) {
      scannerSpecs.functions = value;
      addAttribute(attributes, "scanner_functions", value);
      const duplex = positiveBoolean(value);
      if (
        duplex !== undefined &&
        (normalizedValue.includes("hai mat") ||
          normalizedValue.includes("duplex") ||
          normalizedValue.includes("2-sided"))
      ) {
        scannerSpecs.duplexScan = duplex;
        scannerSpecs.duplexScanText = booleanText(duplex);
        addAttribute(attributes, "scanner_duplex", duplex);
      }
      const color = /\bmau|color\b/.test(normalizedValue) ? true : undefined;
      if (color !== undefined) {
        scannerSpecs.colorScan = color;
        scannerSpecs.colorScanText = booleanText(color);
        addAttribute(attributes, "scanner_color_scan", color);
      }
      const ocr = /\bocr\b/.test(normalizedValue) ? true : undefined;
      if (ocr !== undefined) {
        scannerSpecs.ocr = ocr;
        scannerSpecs.ocrText = booleanText(ocr);
        addAttribute(attributes, "scanner_ocr", ocr);
      }
      const plasticCard =
        /\b(the nhua|plastic card|id card|card)\b/.test(normalizedValue) ? true : undefined;
      if (plasticCard !== undefined) {
        scannerSpecs.plasticCardScan = plasticCard;
        scannerSpecs.plasticCardScanText = booleanText(plasticCard);
        addAttribute(attributes, "scanner_plastic_card_scan", plasticCard);
      }
      const passport =
        /\b(ho chieu|passport)\b/.test(normalizedValue) ? true : undefined;
      if (passport !== undefined) {
        scannerSpecs.passportScan = passport;
        scannerSpecs.passportScanText = booleanText(passport);
        addAttribute(attributes, "scanner_passport_scan", passport);
      }
    }

    if (label.includes("che do quet")) {
      scannerSpecs.scanModes = value;
      addAttribute(attributes, "scanner_scan_modes", value);
    }

    if (label.includes("quet mau") || label.includes("mau / don sac")) {
      const color = positiveBoolean(value);
      if (color !== undefined) {
        scannerSpecs.colorScan = color;
        scannerSpecs.colorScanText = booleanText(color);
        addAttribute(attributes, "scanner_color_scan", color);
      }
    }

    if (label.includes("ocr")) {
      const ocr = positiveBoolean(value);
      if (ocr !== undefined) {
        scannerSpecs.ocr = ocr;
        scannerSpecs.ocrText = booleanText(ocr);
        addAttribute(attributes, "scanner_ocr", ocr);
      }
    }

    if (label.includes("the nhua") || label.includes("plastic card")) {
      const card = positiveBoolean(value);
      if (card !== undefined) {
        scannerSpecs.plasticCardScan = card;
        scannerSpecs.plasticCardScanText = booleanText(card);
        addAttribute(attributes, "scanner_plastic_card_scan", card);
      }
    }

    if (label.includes("ho chieu") || label.includes("passport")) {
      const passport = positiveBoolean(value);
      if (passport !== undefined) {
        scannerSpecs.passportScan = passport;
        scannerSpecs.passportScanText = booleanText(passport);
        addAttribute(attributes, "scanner_passport_scan", passport);
      }
    }
  }

  deriveScannerSpecs(scannerSpecs, specs);

  return { attributes, scannerSpecs, specs };
}
