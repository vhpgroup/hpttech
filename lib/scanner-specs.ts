type ScannerSpecsRecord = Record<string, unknown> | null | undefined;

type ScannerSpecField = {
  key: string;
  label: string;
  isFilled: (value: ScannerSpecsRecord) => boolean;
};

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function hasCheckbox(value: ScannerSpecsRecord, key: string, pairedTextKey: string) {
  return hasText(value?.[pairedTextKey]) || value?.[key] === true;
}

export const SCANNER_SPEC_FIELDS: ScannerSpecField[] = [
  { key: "scannerType", label: "Loai may scan", isFilled: (value) => hasText(value?.["scannerType"]) },
  { key: "functions", label: "Chuc nang", isFilled: (value) => hasText(value?.["functions"]) },
  {
    key: "scanSpeedSimplexPpm",
    label: "Toc do scan mot mat",
    isFilled: (value) => hasNumber(value?.["scanSpeedSimplexPpm"]),
  },
  {
    key: "scanSpeedDuplexIpm",
    label: "Toc do scan hai mat",
    isFilled: (value) => hasNumber(value?.["scanSpeedDuplexIpm"]),
  },
  { key: "scanModes", label: "Che do quet", isFilled: (value) => hasText(value?.["scanModes"]) },
  {
    key: "scanResolution",
    label: "Do phan giai quang hoc",
    isFilled: (value) => hasText(value?.["scanResolution"]),
  },
  {
    key: "adfSheets",
    label: "ADF",
    isFilled: (value) =>
      hasNumber(value?.["adfSheets"]) || hasNumber(value?.["adfCapacitySheets"]),
  },
  {
    key: "adfCapacitySheets",
    label: "Suc chua ADF",
    isFilled: (value) => hasNumber(value?.["adfCapacitySheets"]),
  },
  {
    key: "maxPaperSize",
    label: "Kho giay toi da",
    isFilled: (value) => hasText(value?.["maxPaperSize"]),
  },
  {
    key: "minPaperSize",
    label: "Kho giay toi thieu",
    isFilled: (value) => hasText(value?.["minPaperSize"]),
  },
  { key: "dailyDuty", label: "Cong suat/ngay", isFilled: (value) => hasNumber(value?.["dailyDuty"]) },
  {
    key: "passportScanText",
    label: "Ghi chu scan ho chieu",
    isFilled: (value) => hasText(value?.["passportScanText"]),
  },
  {
    key: "duplexScanText",
    label: "Ghi chu scan hai mat",
    isFilled: (value) => hasText(value?.["duplexScanText"]),
  },
  {
    key: "colorScanText",
    label: "Ghi chu scan mau",
    isFilled: (value) => hasText(value?.["colorScanText"]),
  },
  {
    key: "ocrText",
    label: "Ghi chu OCR",
    isFilled: (value) => hasText(value?.["ocrText"]),
  },
  {
    key: "plasticCardScanText",
    label: "Ghi chu scan the nhua",
    isFilled: (value) => hasText(value?.["plasticCardScanText"]),
  },
  { key: "connectivity", label: "Ket noi", isFilled: (value) => hasText(value?.["connectivity"]) },
  {
    key: "supportedOs",
    label: "He dieu hanh ho tro",
    isFilled: (value) => hasText(value?.["supportedOs"]),
  },
  {
    key: "dimensionsWeight",
    label: "Kich thuoc / Trong luong",
    isFilled: (value) => hasText(value?.["dimensionsWeight"]),
  },
  {
    key: "passportScan",
    label: "Co scan ho chieu",
    isFilled: (value) => hasCheckbox(value, "passportScan", "passportScanText"),
  },
  {
    key: "duplexScan",
    label: "Co scan hai mat",
    isFilled: (value) => hasCheckbox(value, "duplexScan", "duplexScanText"),
  },
  {
    key: "colorScan",
    label: "Co scan mau",
    isFilled: (value) => hasCheckbox(value, "colorScan", "colorScanText"),
  },
  {
    key: "ocr",
    label: "Co OCR",
    isFilled: (value) => hasCheckbox(value, "ocr", "ocrText"),
  },
  {
    key: "plasticCardScan",
    label: "Co scan the nhua",
    isFilled: (value) => hasCheckbox(value, "plasticCardScan", "plasticCardScanText"),
  },
];

export const MIN_SCANNER_SPECS_FILLED = SCANNER_SPEC_FIELDS.length - 3;

export function evaluateScannerSpecs(value: ScannerSpecsRecord) {
  const filled = SCANNER_SPEC_FIELDS.filter((field) => field.isFilled(value));
  const missing = SCANNER_SPEC_FIELDS.filter((field) => !field.isFilled(value));
  return {
    filledCount: filled.length,
    filledKeys: filled.map((field) => field.key),
    missingKeys: missing.map((field) => field.key),
    missingLabels: missing.map((field) => field.label),
    totalCount: SCANNER_SPEC_FIELDS.length,
  };
}
