import {
  PC_FAMILY_TYPE_CODES,
  SERVER_FAMILY_TYPE_CODES,
} from "./pc-server-taxonomy";
import { cleanText } from "./text";
import type { ProductSpec } from "./types";

type CanonicalAttribute = {
  code: string;
  value: boolean | number | string | string[];
};

type TypedSpecs = Record<string, boolean | number | string>;

export type NormalizedScrapedSpecs = {
  attributes: CanonicalAttribute[];
  desktopSpecs?: TypedSpecs;
  laptopSpecs?: TypedSpecs;
  photocopierSpecs?: TypedSpecs;
  printerSpecs?: TypedSpecs;
  scannerSpecs?: TypedSpecs;
  serverSpecs?: TypedSpecs;
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

function completenessValue(scannerSpecs: TypedSpecs, key: string) {
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
  scannerSpecs: TypedSpecs,
  key: string,
  value: boolean | number | string | undefined,
) {
  if (value === undefined || value === "") return;
  if (!completenessValue(scannerSpecs, key)) {
    scannerSpecs[key] = value;
  }
}

function deriveFunctions(scannerSpecs: TypedSpecs) {
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

function deriveScannerSpecs(scannerSpecs: TypedSpecs, specs: ProductSpec[]) {
  if (!hasNumber(scannerSpecs.adfSheets) && hasNumber(scannerSpecs.adfCapacitySheets)) {
    scannerSpecs.adfSheets = scannerSpecs.adfCapacitySheets;
  }
  if (!hasText(scannerSpecs.scannerType)) {
    const inferred = specs
      .map((spec) => inferScannerType(`${spec.label}: ${spec.value}`))
      .find(Boolean);
    if (inferred) ensureScannerField(scannerSpecs, "scannerType", inferred);
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
  const value = normalize(spec.value);
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
    label.includes("thong tin cong ty") ||
    /^(bao hanh|warranty)$/.test(label) ||
    /^(giao hang|van chuyen|shipping|delivery)$/.test(label) ||
    /\b(mien phi ha noi|vietbis|hotline|doi tra|nguyen dai|nguyen kien|ho tro 24\/?7)\b/.test(value)
  );
}

function ensureTextField(specs: TypedSpecs, key: string, value: string | undefined) {
  if (!value?.trim()) return;
  if (!hasText(specs[key])) specs[key] = value.trim();
}

function derivePrinterSpecs(specs: ProductSpec[]) {
  const printerSpecs: TypedSpecs = {};

  for (const spec of specs) {
    const label = normalize(spec.label);
    const value = spec.value;
    const normalizedValue = normalize(value);

    if (label.includes("loai may") || label.includes("printer type")) {
      ensureTextField(printerSpecs, "printerType", value);
    }
    if (label.includes("chuc nang") || label.includes("function")) {
      ensureTextField(printerSpecs, "functions", value);
      if (normalizedValue.includes("mau") || normalizedValue.includes("color")) {
        ensureTextField(printerSpecs, "colorPrintText", "Có");
        printerSpecs.colorPrint = true;
      }
      if (
        normalizedValue.includes("hai mat") ||
        normalizedValue.includes("duplex") ||
        normalizedValue.includes("2-sided")
      ) {
        ensureTextField(printerSpecs, "autoDuplexPrintText", "Có");
        printerSpecs.autoDuplexPrint = true;
      }
    }
    if (
      label.includes("cong nghe in") ||
      label.includes("print technology") ||
      label.includes("technology")
    ) {
      ensureTextField(printerSpecs, "printTechnology", value);
    }
    if (
      label.includes("toc do in") ||
      label.includes("toc do") ||
      label.includes("print speed") ||
      label.includes("ppm")
    ) {
      ensureTextField(printerSpecs, "printSpeed", value);
      const speed = unitNumber(normalizedValue, "ppm") || firstNumber(normalizedValue);
      if (speed !== undefined && !hasNumber(printerSpecs.printSpeedPpm)) {
        printerSpecs.printSpeedPpm = speed;
      }
    }
    if (label.includes("do phan giai") || label.includes("resolution")) {
      ensureTextField(printerSpecs, "printResolution", value);
    }
    if (
      label.includes("kho giay") ||
      label.includes("paper size") ||
      label.includes("media size")
    ) {
      ensureTextField(printerSpecs, "maxPaperSize", value);
    }
    if (
      label.includes("in mau") ||
      label.includes("color print") ||
      label.includes("colour print")
    ) {
      ensureTextField(printerSpecs, "colorPrintText", value);
      const color = positiveBoolean(value);
      if (color !== undefined) printerSpecs.colorPrint = color;
    }
    if (
      label.includes("hai mat") ||
      label.includes("dao mat") ||
      label.includes("duplex") ||
      label.includes("2-sided")
    ) {
      ensureTextField(printerSpecs, "autoDuplexPrintText", value);
      const duplex = positiveBoolean(`${spec.label} ${value}`);
      if (duplex !== undefined) printerSpecs.autoDuplexPrint = duplex;
    }
    if (label.includes("khay giay") || label.includes("paper tray")) {
      if (label.includes("toi da") || label.includes("maximum") || label.includes("max")) {
        ensureTextField(printerSpecs, "maxPaperTray", value);
        const sheets = firstNumber(normalizedValue);
        if (sheets !== undefined) printerSpecs.maxPaperTraySheets = sheets;
      } else {
        ensureTextField(printerSpecs, "standardPaperTray", value);
        const sheets = firstNumber(normalizedValue);
        if (sheets !== undefined) printerSpecs.standardPaperTraySheets = sheets;
      }
    }
    if (label.includes("ram") || label.includes("bo nho") || label.includes("memory")) {
      ensureTextField(printerSpecs, "memoryRam", value);
    }
    if (label.includes("ket noi") || label.includes("giao tiep") || label.includes("connect")) {
      ensureTextField(printerSpecs, "connectivity", value);
    }
    if (label.includes("he dieu hanh") || label.includes("supported os") || osSummary(value)) {
      ensureTextField(printerSpecs, "supportedOs", osSummary(value) || value);
    }
    if (
      label.includes("cong suat") ||
      label.includes("monthly duty") ||
      label.includes("duty cycle")
    ) {
      if (label.includes("khuyen nghi") || label.includes("recommended")) {
        ensureTextField(printerSpecs, "recommendedMonthlyVolumeText", value);
        const pages = firstNumber(normalizedValue.replace(/[.,](?=\d{3}\b)/g, ""));
        if (pages !== undefined) printerSpecs.recommendedMonthlyVolume = pages;
      } else {
        ensureTextField(printerSpecs, "maxMonthlyDuty", value);
        const pages = firstNumber(normalizedValue.replace(/[.,](?=\d{3}\b)/g, ""));
        if (pages !== undefined) printerSpecs.monthlyDuty = pages;
      }
    }
    if (isDimensionsSpec(label, value)) {
      ensureTextField(printerSpecs, "dimensions", value);
    }
    if (isWeightSpec(label, value)) {
      ensureTextField(printerSpecs, "weight", value);
    }
    if (label.includes("muc") || label.includes("ink") || label.includes("toner")) {
      ensureTextField(printerSpecs, "inkType", value);
    }
  }

  return Object.keys(printerSpecs).length ? printerSpecs : undefined;
}

function derivePhotocopierSpecs(specs: ProductSpec[]) {
  const photocopierSpecs: TypedSpecs = {};

  for (const spec of specs) {
    const label = normalize(spec.label);
    const value = spec.value;
    const normalizedValue = normalize(value);
    const combined = `${label} ${normalizedValue}`;
    const dimensionOrWeight = isDimensionsWeightSpec(label, value);

    if (label.includes("loai may") || label.includes("type")) {
      ensureTextField(photocopierSpecs, "copierType", value);
    }
    if (label.includes("chuc nang") || label.includes("cau hinh") || label.includes("function")) {
      ensureTextField(photocopierSpecs, "functions", value);
      if (normalizedValue.includes("mau") || normalizedValue.includes("color")) {
        ensureTextField(photocopierSpecs, "colorPrintText", "Có");
        photocopierSpecs.colorPrint = true;
      }
      if (normalizedValue.includes("dadf") || normalizedValue.includes("adf")) {
        ensureTextField(photocopierSpecs, "adfText", "Có");
        photocopierSpecs.hasAdf = true;
      }
      if (
        normalizedValue.includes("dao mat") ||
        normalizedValue.includes("duplex") ||
        normalizedValue.includes("hai mat")
      ) {
        ensureTextField(photocopierSpecs, "autoDuplexPrintText", "Có");
        photocopierSpecs.autoDuplexPrint = true;
      }
    }
    if (label.includes("toc do copy") || label.includes("toc do sao") || label.includes("copy speed")) {
      ensureTextField(photocopierSpecs, "copySpeed", value);
      const speed = unitNumber(normalizedValue, "cpm") || firstNumber(normalizedValue);
      if (speed !== undefined) photocopierSpecs.copySpeedCpm = speed;
    }
    if (label.includes("toc do in") || label.includes("print speed")) {
      ensureTextField(photocopierSpecs, "printSpeed", value);
    }
    if (label.includes("toc do scan") || label.includes("scan speed")) {
      ensureTextField(photocopierSpecs, "scanSpeed", value);
      const speed = unitNumber(normalizedValue, "ppm") || firstNumber(normalizedValue);
      if (speed !== undefined) photocopierSpecs.scanSpeedPpm = speed;
    }
    if (
      label.includes("kho giay") ||
      label.includes("kich thuoc giay") ||
      label.includes("paper size") ||
      label.includes("paper sizes")
    ) {
      const paperCapacityOrWeight =
        label.includes("chua") ||
        label.includes("ra giay") ||
        label.includes("loai giay") ||
        label.includes("dinh luong");
      if (!paperCapacityOrWeight) {
        if (label === "kho giay" || label.includes("toi da") || label.includes("maximum")) {
          photocopierSpecs.maxPaperSize = value;
        } else {
          ensureTextField(photocopierSpecs, "maxPaperSize", value);
        }
      }
    }
    if (label.includes("do phan giai copy") || label.includes("copy resolution")) {
      ensureTextField(photocopierSpecs, "copyResolution", value);
    } else if (label.includes("do phan giai in") || label.includes("print resolution")) {
      ensureTextField(photocopierSpecs, "printResolution", value);
    } else if (label.includes("do phan giai scan") || label.includes("scan resolution")) {
      ensureTextField(photocopierSpecs, "scanResolution", value);
    } else if (label.includes("do phan giai") || label.includes("resolution")) {
      ensureTextField(photocopierSpecs, "copyResolution", value);
    }
    if (label.includes("in mau") || label.includes("mau") || label.includes("color")) {
      ensureTextField(photocopierSpecs, "colorPrintText", value);
      const color = positiveBoolean(value);
      if (color !== undefined) photocopierSpecs.colorPrint = color;
    }
    if (
      label.includes("dao mat") ||
      label.includes("hai mat") ||
      label.includes("duplex") ||
      combined.includes("duplex")
    ) {
      ensureTextField(photocopierSpecs, "autoDuplexPrintText", value);
      const duplex = positiveBoolean(`${spec.label} ${value}`);
      if (duplex !== undefined) photocopierSpecs.autoDuplexPrint = duplex;
    }
    if (
      !dimensionOrWeight &&
      (
        label.includes("adf") ||
        label.includes("dadf") ||
        label.includes("radf") ||
        (
          combined.includes("adf") &&
          (
            label.includes("cau hinh") ||
            label.includes("khay") ||
            label.includes("nap") ||
            label.includes("chua") ||
            /\b(to|sheet|sheets|page|pages)\b/.test(normalizedValue)
          )
        )
      )
    ) {
      ensureTextField(photocopierSpecs, "adfText", value);
      const adf = positiveBoolean(`${spec.label} ${value}`);
      if (adf !== undefined) photocopierSpecs.hasAdf = adf;
      const sheets = firstNumber(normalizedValue);
      if (sheets !== undefined) {
        photocopierSpecs.adfSheets = sheets;
        ensureTextField(photocopierSpecs, "adfCapacity", value);
      }
    }
    if (label.includes("ram") || label.includes("bo nho") || label.includes("memory")) {
      ensureTextField(photocopierSpecs, "memoryRam", value);
    }
    if (
      label.includes("ket noi") ||
      label.includes("cong giao tiep") ||
      label.includes("giao tiep") ||
      label.includes("connect") ||
      /\b(usb|lan|wifi|wi-fi|ethernet)\b/.test(normalizedValue)
    ) {
      ensureTextField(photocopierSpecs, "connectivity", value);
    }
    if (label.includes("cong suat") || label.includes("duty")) {
      ensureTextField(photocopierSpecs, "monthlyDuty", value);
    }
    if (dimensionOrWeight) {
      ensureTextField(photocopierSpecs, "dimensionsWeight", `${spec.label}: ${value}`);
    }
  }

  return Object.keys(photocopierSpecs).length ? photocopierSpecs : undefined;
}

function laptopRamGb(value: string) {
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*(?:gb|g)\b/i);
  if (!match) return undefined;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function laptopStorageGb(value: string) {
  const tbMatch = value.match(/(\d+(?:[.,]\d+)?)\s*tb\b/i);
  if (tbMatch) {
    const parsed = Number(tbMatch[1].replace(",", "."));
    return Number.isFinite(parsed) ? parsed * 1024 : undefined;
  }
  const gbMatch = value.match(/(\d+(?:[.,]\d+)?)\s*(?:gb|g)\b/i);
  if (!gbMatch) return undefined;
  const parsed = Number(gbMatch[1].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function laptopScreenSizeInch(value: string) {
  const match = value.match(/(\d+(?:[.,]\d+)?)\s*(?:-|–|—)?\s*(?:inch|in\b|")/i);
  if (!match) return undefined;
  const parsed = Number(match[1].replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 7 && parsed <= 35 ? parsed : undefined;
}

function deriveLaptopSpecs(specs: ProductSpec[]) {
  const laptopSpecs: TypedSpecs = {};
  const attributes: CanonicalAttribute[] = [];

  for (const spec of specs) {
    const label = normalize(spec.label);
    const value = spec.value;
    const normalizedValue = normalize(value);
    const combined = `${label} ${normalizedValue}`;
    const graphicsLabel =
      label.includes("card man hinh") ||
      label.includes("vga") ||
      label.includes("gpu") ||
      label.includes("graphics") ||
      label.includes("do hoa");

    if (
      label.includes("cpu") ||
      label.includes("processor") ||
      label.includes("bo xu ly") ||
      label.includes("chip")
    ) {
      ensureTextField(laptopSpecs, "cpu", value);
      addAttribute(attributes, "laptop_cpu", value);
    }

    if (
      label.includes("gpu") ||
      label.includes("vga") ||
      label.includes("card man hinh") ||
      label.includes("graphics") ||
      label.includes("do hoa")
    ) {
      ensureTextField(laptopSpecs, "gpu", value);
      addAttribute(attributes, "laptop_gpu", value);
    }

    const looksLikeCache =
      label.includes("cache") ||
      label.includes("dem") ||
      normalizedValue.includes("cache");
    const looksLikeRam =
      label.includes("ram") ||
      (!looksLikeCache &&
        (label.includes("memory") || label.includes("bo nho") || label.includes("dung luong")) &&
        /\b(ddr|ram|\d+(?:[.,]\d+)?\s*gb)\b/i.test(value));
    if (looksLikeRam) {
      ensureTextField(laptopSpecs, "ram", value);
      const ram = laptopRamGb(value);
      if (ram !== undefined) {
        laptopSpecs.ramGb = ram;
        addAttribute(attributes, "laptop_ram_gb", ram);
      }
    }

    if (
      label.includes("ssd") ||
      label.includes("hdd") ||
      label.includes("o cung") ||
      label.includes("storage") ||
      label.includes("luu tru")
    ) {
      ensureTextField(laptopSpecs, "storage", value);
      const storage = laptopStorageGb(value);
      if (storage !== undefined) laptopSpecs.storageGb = storage;
      addAttribute(attributes, "laptop_storage", value);
    }

    if (
      (label.includes("man hinh") && !graphicsLabel) ||
      label.includes("display") ||
      label.includes("screen")
    ) {
      ensureTextField(laptopSpecs, "screen", value);
      const size = laptopScreenSizeInch(value);
      if (size !== undefined) {
        laptopSpecs.screenSizeInch = size;
        addAttribute(attributes, "laptop_screen_size_inch", size);
      }
      const refresh = unitNumber(normalizedValue, "hz");
      if (refresh !== undefined) {
        laptopSpecs.refreshRateHz = refresh;
        addAttribute(attributes, "laptop_refresh_rate_hz", refresh);
      }
      if (/\b(wuxga|fhd|full hd|qhd|2k|3k|4k|uhd|1920|2560|3840)\b/.test(normalizedValue)) {
        ensureTextField(laptopSpecs, "screenResolution", value);
        addAttribute(attributes, "laptop_screen_resolution", value);
      }
      if (/\b(ips|oled|tn|va|mini led|micro led)\b/.test(normalizedValue)) {
        ensureTextField(laptopSpecs, "panel", value);
        addAttribute(attributes, "laptop_panel", value);
      }
    }

    if (label.includes("do phan giai") || label.includes("resolution")) {
      ensureTextField(laptopSpecs, "screenResolution", value);
      addAttribute(attributes, "laptop_screen_resolution", value);
    }

    if (label.includes("tan so") || label.includes("refresh") || combined.includes("hz")) {
      const refresh = unitNumber(normalizedValue, "hz");
      if (refresh !== undefined) {
        laptopSpecs.refreshRateHz = refresh;
        addAttribute(attributes, "laptop_refresh_rate_hz", refresh);
      }
    }

    if (label.includes("he dieu hanh") || label.includes("os") || combined.includes("windows")) {
      ensureTextField(laptopSpecs, "os", value);
      addAttribute(attributes, "laptop_os", value);
    }

    if (
      label.includes("ket noi") ||
      label.includes("cong giao tiep") ||
      label.includes("wireless") ||
      /\b(wifi|wi-fi|bluetooth|usb|hdmi|lan|thunderbolt)\b/.test(combined)
    ) {
      ensureTextField(laptopSpecs, "connectivity", value);
    }

    if (label.includes("pin") || label.includes("battery")) {
      ensureTextField(laptopSpecs, "battery", value);
    }

    if (isDimensionsSpec(label, value)) {
      ensureTextField(laptopSpecs, "dimensions", value);
    }
    if (isWeightSpec(label, value)) {
      ensureTextField(laptopSpecs, "weight", value);
      const weight = unitNumber(normalizedValue, "kg");
      if (weight !== undefined) addAttribute(attributes, "laptop_weight_kg", weight);
    }
  }

  return {
    attributes,
    laptopSpecs: Object.keys(laptopSpecs).length ? laptopSpecs : undefined,
  };
}

function formFactorValue(value: string) {
  const normalized = normalize(value);
  if (/\b(\d)\s*u\b/.test(normalized) || normalized.includes("rack")) {
    return value;
  }
  if (
    /\b(sff|usff|tower|mini tower|micro|mini pc|nuc|desktop|aio|all in one)\b/.test(
      normalized,
    )
  ) {
    return value;
  }
  return undefined;
}

// Trang PC/NUC của An Phát hay lẫn rác listing (giá, khuyến mãi, tên SP khác)
// vào value của spec — demo publish 2026-07-08 cho ra desktopSpecs.ram chứa cả
// "Giá niêm yết ... Giá Build PC ...". Bỏ qua value quá dài hoặc dính từ khoá
// thương mại; raw specs từ nguồn vẫn được giữ nguyên ở bảng specs.
const PC_SPEC_NOISE_PATTERN =
  /(gia niem yet|gia khuyen mai|gia uu dai|gia build pc|khuyen mai|so sanh|con hang|het hang|dat hang|tra gop)/;

function isCleanPcSpecValue(value: string, normalizedValue: string) {
  if (value.length > 160) return false;
  return !PC_SPEC_NOISE_PATTERN.test(normalizedValue);
}

// Lưu ý: desktop/server KHÔNG phát attribute canonical (attributes: []) giống
// printer/photocopier — mapAttributes sẽ throw nếu gặp code chưa có
// AttributeDefinition. Khi cần lọc facet, seed AttributeDefinitions trước rồi
// mới bật phát attribute ở đây.
function deriveDesktopSpecs(specs: ProductSpec[]) {
  const desktopSpecs: TypedSpecs = {};

  for (const spec of specs) {
    const label = normalize(spec.label);
    const value = spec.value;
    const normalizedValue = normalize(value);
    if (!isCleanPcSpecValue(value, normalizedValue)) continue;
    const combined = `${label} ${normalizedValue}`;
    const graphicsLabel =
      label.includes("card man hinh") ||
      label.includes("vga") ||
      label.includes("gpu") ||
      label.includes("graphics") ||
      label.includes("do hoa");

    if (
      label.includes("cpu") ||
      label.includes("processor") ||
      label.includes("bo xu ly") ||
      label.includes("chip")
    ) {
      ensureTextField(desktopSpecs, "cpu", value);
    }

    if (graphicsLabel) {
      ensureTextField(desktopSpecs, "gpu", value);
    }

    const looksLikeCache =
      label.includes("cache") ||
      label.includes("dem") ||
      normalizedValue.includes("cache");
    const looksLikeRam =
      label.includes("ram") ||
      (!looksLikeCache &&
        (label.includes("memory") || label.includes("bo nho") || label.includes("dung luong")) &&
        /\b(ddr|ram|\d+(?:[.,]\d+)?\s*gb)\b/i.test(value));
    if (looksLikeRam) {
      ensureTextField(desktopSpecs, "ram", value);
      const ram = laptopRamGb(value);
      if (ram !== undefined && !hasNumber(desktopSpecs.ramGb)) {
        desktopSpecs.ramGb = ram;
      }
    }

    if (
      label.includes("ssd") ||
      label.includes("hdd") ||
      label.includes("o cung") ||
      label.includes("storage") ||
      label.includes("luu tru")
    ) {
      ensureTextField(desktopSpecs, "storage", value);
      const storage = laptopStorageGb(value);
      if (storage !== undefined && !hasNumber(desktopSpecs.storageGb)) {
        desktopSpecs.storageGb = storage;
      }
    }

    if (
      (label.includes("man hinh") && !graphicsLabel) ||
      label.includes("display") ||
      label.includes("screen")
    ) {
      ensureTextField(desktopSpecs, "screen", value);
      const size = laptopScreenSizeInch(value);
      if (size !== undefined && !hasNumber(desktopSpecs.screenSizeInch)) {
        desktopSpecs.screenSizeInch = size;
      }
    }

    if (label.includes("he dieu hanh") || /\bos\b/.test(label) || combined.includes("windows")) {
      ensureTextField(desktopSpecs, "os", value);
    }

    if (
      label.includes("ket noi") ||
      label.includes("cong giao tiep") ||
      label.includes("wireless") ||
      /\b(wifi|wi-fi|bluetooth|usb|hdmi|lan|displayport)\b/.test(combined)
    ) {
      ensureTextField(desktopSpecs, "connectivity", value);
    }

    if (
      label.includes("kieu dang") ||
      label.includes("form factor") ||
      label.includes("thiet ke") ||
      label.includes("loai may")
    ) {
      ensureTextField(desktopSpecs, "formFactor", formFactorValue(value) || value);
    }

    if (
      label.includes("nguon") ||
      label.includes("power supply") ||
      label.includes("psu") ||
      label.includes("cong suat nguon")
    ) {
      ensureTextField(desktopSpecs, "psu", value);
    }

    if (isDimensionsSpec(label, value)) {
      ensureTextField(desktopSpecs, "dimensions", value);
    }
    if (isWeightSpec(label, value)) {
      ensureTextField(desktopSpecs, "weight", value);
    }
  }

  return Object.keys(desktopSpecs).length ? desktopSpecs : undefined;
}

function deriveServerSpecs(specs: ProductSpec[]) {
  const serverSpecs: TypedSpecs = {};

  for (const spec of specs) {
    const label = normalize(spec.label);
    const value = spec.value;
    const normalizedValue = normalize(value);
    if (!isCleanPcSpecValue(value, normalizedValue)) continue;

    if (
      label.includes("cpu") ||
      label.includes("processor") ||
      label.includes("bo xu ly") ||
      label.includes("vi xu ly")
    ) {
      if (label.includes("socket")) {
        ensureTextField(serverSpecs, "socket", value);
      } else if (
        label.includes("toi da") ||
        label.includes("max") ||
        label.includes("ho tro")
      ) {
        ensureTextField(serverSpecs, "cpuMax", value);
      } else {
        ensureTextField(serverSpecs, "cpu", value);
      }
    }

    if (label.includes("socket")) {
      ensureTextField(serverSpecs, "socket", value);
    }

    const looksLikeCache =
      label.includes("cache") ||
      label.includes("dem") ||
      normalizedValue.includes("cache");
    if (label.includes("ram") || (!looksLikeCache && label.includes("bo nho"))) {
      if (
        label.includes("toi da") ||
        label.includes("max") ||
        label.includes("ho tro")
      ) {
        ensureTextField(serverSpecs, "ramMax", value);
      } else {
        ensureTextField(serverSpecs, "ram", value);
        const ram = laptopRamGb(value);
        if (ram !== undefined && !hasNumber(serverSpecs.ramGb)) {
          serverSpecs.ramGb = ram;
        }
      }
    }

    if (
      label.includes("o cung") ||
      label.includes("hdd") ||
      label.includes("ssd") ||
      label.includes("storage") ||
      label.includes("luu tru")
    ) {
      ensureTextField(serverSpecs, "storage", value);
    }

    if (label.includes("khay") || label.includes("bay")) {
      ensureTextField(serverSpecs, "driveBays", value);
    }

    if (label.includes("raid")) {
      ensureTextField(serverSpecs, "raid", value);
    }

    if (
      label.includes("nguon") ||
      label.includes("power supply") ||
      label.includes("psu")
    ) {
      ensureTextField(serverSpecs, "psu", value);
    }

    if (
      label.includes("kieu dang") ||
      label.includes("form factor") ||
      label.includes("thiet ke") ||
      /\b(\d)\s*u\b|\brack\b|\btower\b/.test(normalizedValue)
    ) {
      const formFactor = formFactorValue(value);
      if (formFactor) ensureTextField(serverSpecs, "formFactor", formFactor);
    }

    if (
      label.includes("lan") ||
      label.includes("network") ||
      label.includes("cong mang") ||
      label.includes("ket noi")
    ) {
      ensureTextField(serverSpecs, "networkPorts", value);
    }

    if (
      label.includes("quan ly") ||
      label.includes("management") ||
      normalizedValue.includes("idrac") ||
      normalizedValue.includes("ilo") ||
      normalizedValue.includes("xclarity")
    ) {
      ensureTextField(serverSpecs, "management", value);
    }

    if (isDimensionsSpec(label, value)) {
      ensureTextField(serverSpecs, "dimensions", value);
    }
    if (isWeightSpec(label, value)) {
      ensureTextField(serverSpecs, "weight", value);
    }
  }

  return Object.keys(serverSpecs).length ? serverSpecs : undefined;
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
  if (productTypeCode === "printer") {
    return {
      attributes: [],
      printerSpecs: derivePrinterSpecs(specs),
      specs,
    };
  }

  if (productTypeCode === "photocopier") {
    return {
      attributes: [],
      photocopierSpecs: derivePhotocopierSpecs(specs),
      specs,
    };
  }

  if (productTypeCode === "laptop") {
    const laptop = deriveLaptopSpecs(specs);
    return {
      attributes: laptop.attributes,
      laptopSpecs: laptop.laptopSpecs,
      specs,
    };
  }

  if (PC_FAMILY_TYPE_CODES.has(productTypeCode)) {
    return {
      attributes: [],
      desktopSpecs: deriveDesktopSpecs(specs),
      specs,
    };
  }

  if (SERVER_FAMILY_TYPE_CODES.has(productTypeCode)) {
    return {
      attributes: [],
      serverSpecs:
        productTypeCode === "server" ? deriveServerSpecs(specs) : undefined,
      specs,
    };
  }

  if (productTypeCode !== "scanner") {
    return { attributes: [], specs };
  }

  const attributes: CanonicalAttribute[] = [];
  const scannerSpecs: TypedSpecs = {};

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
