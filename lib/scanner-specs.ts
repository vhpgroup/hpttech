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
  { key: "scannerType", label: "Loại máy scan", isFilled: (value) => hasText(value?.["scannerType"]) },
  { key: "functions", label: "Chức năng", isFilled: (value) => hasText(value?.["functions"]) },
  {
    key: "scanSpeedSimplexPpm",
    label: "Tốc độ scan một mặt",
    isFilled: (value) => hasNumber(value?.["scanSpeedSimplexPpm"]),
  },
  {
    key: "scanSpeedDuplexIpm",
    label: "Tốc độ scan hai mặt",
    isFilled: (value) => hasNumber(value?.["scanSpeedDuplexIpm"]),
  },
  { key: "scanModes", label: "Chế độ quét", isFilled: (value) => hasText(value?.["scanModes"]) },
  {
    key: "scanResolution",
    label: "Độ phân giải quang học",
    isFilled: (value) => hasText(value?.["scanResolution"]),
  },
  { key: "displayScreen", label: "Màn hình hiển thị", isFilled: (value) => hasText(value?.["displayScreen"]) },
  { key: "scanTechnology", label: "Công nghệ quét", isFilled: (value) => hasText(value?.["scanTechnology"]) },
  {
    key: "adfSheets",
    label: "ADF",
    isFilled: (value) =>
      hasNumber(value?.["adfSheets"]) || hasNumber(value?.["adfCapacitySheets"]),
  },
  {
    key: "adfCapacitySheets",
    label: "Sức chứa ADF",
    isFilled: (value) => hasNumber(value?.["adfCapacitySheets"]),
  },
  {
    key: "maxPaperSize",
    label: "Khổ giấy tối đa",
    isFilled: (value) => hasText(value?.["maxPaperSize"]),
  },
  {
    key: "minPaperSize",
    label: "Khổ giấy tối thiểu",
    isFilled: (value) => hasText(value?.["minPaperSize"]),
  },
  { key: "dailyDuty", label: "Công suất/ngày", isFilled: (value) => hasNumber(value?.["dailyDuty"]) },
  {
    key: "passportScanText",
    label: "Ghi chú scan hộ chiếu",
    isFilled: (value) => hasText(value?.["passportScanText"]),
  },
  {
    key: "duplexScanText",
    label: "Ghi chú scan hai mặt",
    isFilled: (value) => hasText(value?.["duplexScanText"]),
  },
  {
    key: "colorScanText",
    label: "Ghi chú scan màu",
    isFilled: (value) => hasText(value?.["colorScanText"]),
  },
  {
    key: "ocrText",
    label: "Ghi chu OCR",
    isFilled: (value) => hasText(value?.["ocrText"]),
  },
  {
    key: "plasticCardScanText",
    label: "Ghi chú scan thẻ nhựa",
    isFilled: (value) => hasText(value?.["plasticCardScanText"]),
  },
  { key: "connectivity", label: "Kết nối", isFilled: (value) => hasText(value?.["connectivity"]) },
  {
    key: "supportedOs",
    label: "Hệ điều hành hỗ trợ",
    isFilled: (value) => hasText(value?.["supportedOs"]),
  },
  {
    key: "dimensionsWeight",
    label: "Kích thước / Trọng lượng",
    isFilled: (value) =>
      hasText(value?.["dimensionsWeight"]) ||
      (hasText(value?.["dimensions"]) && hasText(value?.["weight"])),
  },
  {
    key: "passportScan",
    label: "Có scan hộ chiếu",
    isFilled: (value) => hasCheckbox(value, "passportScan", "passportScanText"),
  },
  {
    key: "duplexScan",
    label: "Có scan hai mặt",
    isFilled: (value) => hasCheckbox(value, "duplexScan", "duplexScanText"),
  },
  {
    key: "colorScan",
    label: "Có scan màu",
    isFilled: (value) => hasCheckbox(value, "colorScan", "colorScanText"),
  },
  {
    key: "ocr",
    label: "Co OCR",
    isFilled: (value) => hasCheckbox(value, "ocr", "ocrText"),
  },
  {
    key: "plasticCardScan",
    label: "Có scan thẻ nhựa",
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
