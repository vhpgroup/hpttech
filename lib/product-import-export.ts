import { getPayloadClient } from "@/lib/payload";
import {
  canonicalizeCategoryName,
  canonicalizeCategorySlug,
} from "@/lib/product-category";
import { formatSlug } from "@/lib/payload/utils/slugify";
import ExcelJS from "exceljs";

const PRODUCT_COLUMNS = [
  "sku",
  "slug",
  "title",
  "model",
  "brandSlug",
  "brandName",
  "categorySlug",
  "categoryName",
  "specProfile",
  "status",
  "stockStatus",
  "price",
  "compareAtPrice",
  "vatIncluded",
  "rating",
  "reviewCount",
  "viewCount",
  "discountBadge",
  "promoText",
  "warranty",
  "origin",
  "tag",
  "featured",
  "sortOrder",
  "scanner.scannerType",
  "scanner.functions",
  "scanner.scanSpeedSimplexPpm",
  "scanner.scanSpeedDuplexIpm",
  "scanner.scanModes",
  "scanner.scanResolution",
  "scanner.adfSheets",
  "scanner.adfCapacitySheets",
  "scanner.maxPaperSize",
  "scanner.minPaperSize",
  "scanner.dailyDuty",
  "scanner.passportScanText",
  "scanner.duplexScanText",
  "scanner.colorScanText",
  "scanner.ocrText",
  "scanner.plasticCardScanText",
  "scanner.connectivity",
  "scanner.supportedOs",
  "scanner.dimensionsWeight",
  "printer.printerType",
  "printer.functions",
  "printer.printTechnology",
  "printer.printSpeed",
  "printer.printResolution",
  "printer.maxPaperSize",
  "printer.colorPrintText",
  "printer.autoDuplexPrintText",
  "printer.standardPaperTray",
  "printer.maxPaperTray",
  "printer.memoryRam",
  "printer.connectivity",
  "printer.supportedOs",
  "printer.recommendedMonthlyVolumeText",
  "printer.maxMonthlyDuty",
  "printer.dimensions",
  "printer.weight",
  "photocopier.copierType",
  "photocopier.functions",
  "photocopier.copySpeed",
  "photocopier.printSpeed",
  "photocopier.scanSpeed",
  "photocopier.maxPaperSize",
  "photocopier.copyResolution",
  "photocopier.printResolution",
  "photocopier.scanResolution",
  "photocopier.colorPrintText",
  "photocopier.autoDuplexPrintText",
  "photocopier.adfText",
  "photocopier.adfCapacity",
  "photocopier.memoryRam",
  "photocopier.connectivity",
  "photocopier.monthlyDuty",
  "photocopier.dimensionsWeight",
  "laptop.cpu",
  "laptop.gpu",
  "laptop.ram",
  "laptop.storage",
  "laptop.screen",
  "laptop.screenResolution",
  "laptop.screenSizeInch",
  "laptop.refreshRateHz",
  "laptop.panel",
  "laptop.os",
  "laptop.connectivity",
  "laptop.battery",
  "laptop.dimensions",
  "laptop.weight",
  "specs",
  "internalNote",
] as const;

type ProductColumn = (typeof PRODUCT_COLUMNS)[number];
type CsvRecord = Record<string, string>;
type PayloadDoc = Record<string, unknown> & { id?: string | number };
export type ProductExportProfile =
  | "all"
  | "scanner"
  | "printer"
  | "photocopier"
  | "laptop"
  | "software";

const COMMON_COLUMNS: ProductColumn[] = [
  "sku",
  "slug",
  "title",
  "model",
  "brandSlug",
  "brandName",
  "categorySlug",
  "categoryName",
  "specProfile",
  "status",
  "stockStatus",
  "price",
  "compareAtPrice",
  "vatIncluded",
  "rating",
  "reviewCount",
  "viewCount",
  "discountBadge",
  "promoText",
  "warranty",
  "origin",
  "tag",
  "featured",
  "sortOrder",
];

const SCANNER_COLUMNS = PRODUCT_COLUMNS.filter((column) => column.startsWith("scanner.")) as ProductColumn[];
const PRINTER_COLUMNS = PRODUCT_COLUMNS.filter((column) => column.startsWith("printer.")) as ProductColumn[];
const PHOTOCOPIER_COLUMNS = PRODUCT_COLUMNS.filter((column) => column.startsWith("photocopier.")) as ProductColumn[];
const LAPTOP_COLUMNS = PRODUCT_COLUMNS.filter((column) => column.startsWith("laptop.")) as ProductColumn[];
const EXTRA_COLUMNS: ProductColumn[] = ["specs", "internalNote"];

const PRODUCT_COLUMN_LABELS: Record<ProductColumn, string> = {
  sku: "Mã SKU",
  slug: "Đường dẫn",
  title: "Tên sản phẩm",
  model: "Model",
  brandSlug: "Mã thương hiệu",
  brandName: "Tên thương hiệu",
  categorySlug: "Mã danh mục",
  categoryName: "Tên danh mục",
  specProfile: "Loại bộ thông số",
  status: "Trạng thái đăng",
  stockStatus: "Tình trạng hàng",
  price: "Giá bán",
  compareAtPrice: "Giá niêm yết",
  vatIncluded: "Giá gồm VAT",
  rating: "Điểm đánh giá",
  reviewCount: "Số đánh giá",
  viewCount: "Lượt xem",
  discountBadge: "Nhãn giảm giá",
  promoText: "Nội dung khuyến mãi",
  warranty: "Bảo hành",
  origin: "Xuất xứ",
  tag: "Nhãn nổi bật",
  featured: "Nổi bật",
  sortOrder: "Thứ tự ưu tiên",
  "scanner.scannerType": "Loại máy scan",
  "scanner.functions": "Chức năng scan",
  "scanner.scanSpeedSimplexPpm": "Tốc độ scan",
  "scanner.scanSpeedDuplexIpm": "Tốc độ scan 2 mặt",
  "scanner.scanModes": "Chế độ quét",
  "scanner.scanResolution": "Độ phân giải quang học",
  "scanner.adfSheets": "ADF",
  "scanner.adfCapacitySheets": "Sức chứa ADF",
  "scanner.maxPaperSize": "Khổ giấy tối đa",
  "scanner.minPaperSize": "Khổ giấy tối thiểu",
  "scanner.dailyDuty": "Công suất/ngày",
  "scanner.passportScanText": "Scan hộ chiếu",
  "scanner.duplexScanText": "Scan hai mặt",
  "scanner.colorScanText": "Scan màu",
  "scanner.ocrText": "OCR",
  "scanner.plasticCardScanText": "Scan thẻ nhựa",
  "scanner.connectivity": "Kết nối scan",
  "scanner.supportedOs": "Hệ điều hành hỗ trợ scan",
  "scanner.dimensionsWeight": "Kích thước / Trọng lượng scan",
  "printer.printerType": "Loại máy in",
  "printer.functions": "Chức năng máy in",
  "printer.printTechnology": "Công nghệ in",
  "printer.printSpeed": "Tốc độ in",
  "printer.printResolution": "Độ phân giải in",
  "printer.maxPaperSize": "Khổ giấy tối đa máy in",
  "printer.colorPrintText": "In màu",
  "printer.autoDuplexPrintText": "In đảo mặt tự động",
  "printer.standardPaperTray": "Khay giấy tiêu chuẩn",
  "printer.maxPaperTray": "Khay giấy tối đa",
  "printer.memoryRam": "Bộ nhớ RAM máy in",
  "printer.connectivity": "Kết nối máy in",
  "printer.supportedOs": "Hệ điều hành hỗ trợ máy in",
  "printer.recommendedMonthlyVolumeText": "Công suất khuyến nghị/tháng",
  "printer.maxMonthlyDuty": "Công suất tối đa/tháng",
  "printer.dimensions": "Kích thước máy in",
  "printer.weight": "Trọng lượng máy in",
  "photocopier.copierType": "Loại máy photocopy",
  "photocopier.functions": "Chức năng photocopy",
  "photocopier.copySpeed": "Tốc độ copy",
  "photocopier.printSpeed": "Tốc độ in photocopy",
  "photocopier.scanSpeed": "Tốc độ scan photocopy",
  "photocopier.maxPaperSize": "Khổ giấy tối đa photocopy",
  "photocopier.copyResolution": "Độ phân giải copy",
  "photocopier.printResolution": "Độ phân giải in photocopy",
  "photocopier.scanResolution": "Độ phân giải scan photocopy",
  "photocopier.colorPrintText": "In màu photocopy",
  "photocopier.autoDuplexPrintText": "In hai mặt tự động photocopy",
  "photocopier.adfText": "ADF photocopy",
  "photocopier.adfCapacity": "Sức chứa ADF photocopy",
  "photocopier.memoryRam": "Bộ nhớ RAM photocopy",
  "photocopier.connectivity": "Kết nối photocopy",
  "photocopier.monthlyDuty": "Công suất/tháng photocopy",
  "photocopier.dimensionsWeight": "Kích thước / Trọng lượng photocopy",
  "laptop.cpu": "CPU laptop",
  "laptop.gpu": "GPU laptop",
  "laptop.ram": "RAM laptop",
  "laptop.storage": "Lưu trữ laptop",
  "laptop.screen": "Màn hình laptop",
  "laptop.screenResolution": "Độ phân giải màn hình laptop",
  "laptop.screenSizeInch": "Kích thước màn hình laptop",
  "laptop.refreshRateHz": "Tần số quét laptop",
  "laptop.panel": "Tấm nền laptop",
  "laptop.os": "Hệ điều hành laptop",
  "laptop.connectivity": "Kết nối laptop",
  "laptop.battery": "Pin laptop",
  "laptop.dimensions": "Kích thước laptop",
  "laptop.weight": "Trọng lượng laptop",
  specs: "Thông số bổ sung",
  internalNote: "Ghi chú nội bộ",
};

const COLUMN_BY_LABEL = new Map<string, ProductColumn>(
  Object.entries(PRODUCT_COLUMN_LABELS).map(([key, label]) => [label.toLowerCase(), key as ProductColumn]),
);

function columnsForProfile(profile: ProductExportProfile = "all") {
  if (profile === "scanner") return [...COMMON_COLUMNS, ...SCANNER_COLUMNS, ...EXTRA_COLUMNS];
  if (profile === "printer") return [...COMMON_COLUMNS, ...PRINTER_COLUMNS, ...EXTRA_COLUMNS];
  if (profile === "photocopier") return [...COMMON_COLUMNS, ...PHOTOCOPIER_COLUMNS, ...EXTRA_COLUMNS];
  if (profile === "laptop") return [...COMMON_COLUMNS, ...LAPTOP_COLUMNS, ...EXTRA_COLUMNS];
  return PRODUCT_COLUMNS;
}

function profileLabel(profile: ProductExportProfile) {
  if (profile === "scanner") return "may-scan";
  if (profile === "printer") return "may-in";
  if (profile === "photocopier") return "photocopy";
  if (profile === "laptop") return "laptop";
  return "tat-ca";
}

function normalizeProfile(value: string | null): ProductExportProfile {
  if (
    value === "scanner" ||
    value === "printer" ||
    value === "photocopier" ||
    value === "laptop" ||
    value === "software"
  ) {
    return value;
  }
  return "all";
}

export type ProductImportResult = {
  created: number;
  errors: Array<{ message: string; row: number; sku?: string }>;
  skipped: number;
  updated: number;
};

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  if (!/[",\r\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

export function recordsToCSV(records: CsvRecord[], profile: ProductExportProfile = "all") {
  const columns = columnsForProfile(profile);
  const rows = [
    columns.map((column) => csvEscape(PRODUCT_COLUMN_LABELS[column] || column)).join(","),
    ...records.map((record) => columns.map((column) => csvEscape(record[column])).join(",")),
  ];

  return `\uFEFF${rows.join("\r\n")}`;
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnWidth(column: ProductColumn) {
  if (column === "title") return 260;
  if (column === "brandName" || column === "categoryName") return 160;
  if (column === "sku" || column === "model" || column.includes("Speed")) return 120;
  if (column.includes("connectivity") || column.includes("functions") || column.includes("dimensions")) return 220;
  if (column === "specs" || column === "internalNote") return 320;
  return 140;
}

export function recordsToExcelHTML(records: CsvRecord[], profile: ProductExportProfile = "all") {
  const columns = columnsForProfile(profile);
  const colgroup = columns.map((column) => `<col style="width:${columnWidth(column)}px" />`).join("");
  const header = columns.map((column) => `<th>${htmlEscape(PRODUCT_COLUMN_LABELS[column] || column)}</th>`).join("");
  const rows = records
    .map((record, index) => {
      const cells = columns
        .map((column) => `<td style="mso-number-format:'\\@';">${htmlEscape(record[column])}</td>`)
        .join("");
      return `<tr class="${index % 2 === 0 ? "alt" : ""}"><td class="stt">${index + 1}</td>${cells}</tr>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; table-layout: fixed; }
    th { background: #1f5a86; border: 1px solid #17486d; color: #fff; font-weight: 700; height: 28px; padding: 6px 8px; text-align: center; vertical-align: middle; white-space: nowrap; }
    td { border: 1px solid #6bb4d3; color: #111827; height: 30px; padding: 5px 8px; vertical-align: top; white-space: normal; }
    tr.alt td { background: #c7eefb; }
    .stt { text-align: center; width: 50px; }
  </style>
</head>
<body>
  <table>
    <colgroup><col style="width:50px" />${colgroup}</colgroup>
    <thead><tr><th>STT</th>${header}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

function decodeHTML(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function stripTags(value: string) {
  return decodeHTML(value.replace(/<[^>]+>/g, "")).trim();
}

function dataColumn(attrs: string) {
  const match = attrs.match(/\bdata-column=(["'])(.*?)\1/i);
  return match ? decodeHTML(match[2]).trim() : "";
}

function parseExcelHTML(input: string): CsvRecord[] {
  const rows = Array.from(input.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi))
    .filter((match) => !/\bdata-import-skip=(["'])true\1/i.test(match[1]))
    .map((match) => ({
      cells: Array.from(match[2].matchAll(/<t[dh]\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi)).map((cell) =>
        dataColumn(cell[1]) || stripTags(cell[2]),
      ),
      header: /\bdata-import-header=(["'])true\1/i.test(match[1]),
    }))
    .filter((row) => row.cells.some((cell) => cell.trim()));
  const headerIndex = rows.findIndex((row) => row.header);
  const headerRowIndex = headerIndex >= 0 ? headerIndex : 0;
  const rawHeader = rows[headerRowIndex]?.cells || [];
  const dataRows = rows.slice(headerRowIndex + 1).map((row) => row.cells);
  const header = rawHeader[0]?.toLowerCase() === "stt" ? rawHeader.slice(1) : rawHeader;

  return dataRows.map((rawCells) => {
    const cells = rawHeader[0]?.toLowerCase() === "stt" ? rawCells.slice(1) : rawCells;
    const record: CsvRecord = {};
    header.forEach((column, index) => {
      const mappedColumn = COLUMN_BY_LABEL.get(column.trim().toLowerCase()) || column.trim();
      record[mappedColumn] = cells[index]?.trim() ?? "";
    });
    return record;
  });
}

export function parseCSV(input: string): CsvRecord[] {
  if (/<table[\s>]/i.test(input)) return parseExcelHTML(input);

  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;
  const text = input.replace(/^\uFEFF/, "");

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  if (row.some((cell) => cell.trim())) rows.push(row);

  const [header = [], ...dataRows] = rows;
  return dataRows.map((cells) => {
    const record: CsvRecord = {};
    header.forEach((column, index) => {
      const headerName = column.trim();
      const mappedColumn = COLUMN_BY_LABEL.get(headerName.toLowerCase()) || headerName;
      record[mappedColumn] = cells[index]?.trim() ?? "";
    });
    return record;
  });
}

function spreadsheetCellText(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== "object") return String(value).trim();
  if ("text" in value && typeof value.text === "string") return value.text.trim();
  if ("result" in value && value.result !== undefined && value.result !== null) return String(value.result).trim();
  if ("richText" in value && Array.isArray(value.richText)) {
    return value.richText.map((part) => String(part.text || "")).join("").trim();
  }
  return String(value).trim();
}

function cleanSpreadsheetHeader(value: string) {
  return value
    .split(/\r?\n/)[0]
    .replace(/\s+\*$/, "")
    .trim();
}

function rowValues(row: ExcelJS.Row) {
  const values: string[] = [];
  row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
    values[columnNumber - 1] = spreadsheetCellText(cell);
  });
  return values.map((value) => value || "");
}

function looksLikeHeader(cells: string[]) {
  const normalized = cells.map((cell) => cleanSpreadsheetHeader(cell).toLowerCase());
  return (
    normalized.includes("sku") ||
    normalized.includes("producttypecode") ||
    normalized.includes("loại sản phẩm") ||
    normalized.includes("tên product") ||
    normalized.includes("tên sản phẩm")
  );
}

export async function parseExcelWorkbook(input: ArrayBuffer): Promise<CsvRecord[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(input);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: Array<{ cells: string[]; hidden: boolean }> = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const cells = rowValues(row);
    if (!cells.some((cell) => cell.trim())) return;
    rows.push({ cells, hidden: row.hidden === true });
  });

  const headerIndex =
    rows.findIndex((row) => row.hidden && looksLikeHeader(row.cells)) >= 0
      ? rows.findIndex((row) => row.hidden && looksLikeHeader(row.cells))
      : rows.findIndex((row) => looksLikeHeader(row.cells));
  if (headerIndex < 0) return [];

  const rawHeader = rows[headerIndex].cells;
  const header = rawHeader[0]?.toLowerCase() === "stt" ? rawHeader.slice(1) : rawHeader;
  return rows.slice(headerIndex + 1)
    .filter((row) => !row.hidden)
    .filter((row) => !looksLikeHeader(row.cells))
    .map((row) => {
      const cells = rawHeader[0]?.toLowerCase() === "stt" ? row.cells.slice(1) : row.cells;
      const record: CsvRecord = {};
      header.forEach((column, index) => {
        const headerName = cleanSpreadsheetHeader(column);
        const mappedColumn = COLUMN_BY_LABEL.get(headerName.toLowerCase()) || headerName;
        record[mappedColumn] = cells[index]?.trim() ?? "";
      });
      return record;
    })
    .filter((record) => Object.values(record).some((value) => value.trim()));
}

function value(record: CsvRecord, key: ProductColumn) {
  return record[key]?.trim() || undefined;
}

function numberValue(record: CsvRecord, key: ProductColumn) {
  const raw = value(record, key);
  if (!raw) return undefined;
  const parsed = Number(raw.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanValue(record: CsvRecord, key: ProductColumn, fallback?: boolean) {
  const raw = value(record, key);
  if (!raw) return fallback;
  return ["1", "true", "yes", "co", "có", "x"].includes(raw.toLowerCase());
}

function docText(doc: unknown, key: string) {
  return typeof doc === "object" && doc && key in doc ? String((doc as Record<string, unknown>)[key] || "") : "";
}

function group(record: CsvRecord, prefix: "scanner" | "printer" | "photocopier" | "laptop", keys: string[]) {
  const data: Record<string, string | number> = {};
  for (const key of keys) {
    const column = `${prefix}.${key}` as ProductColumn;
    const raw = value(record, column);
    if (!raw) continue;
    const maybeNumber = Number(raw.replace(",", "."));
    data[key] = Number.isFinite(maybeNumber) && /^(scanSpeed|adf|dailyDuty)/i.test(key) ? maybeNumber : raw;
  }
  return Object.keys(data).length ? data : undefined;
}

function specsFromText(text?: string) {
  if (!text) return undefined;
  const specs = text
    .split("|")
    .map((item) => {
      const [label, ...rest] = item.split(":");
      return { label: label?.trim(), value: rest.join(":").trim() };
    })
    .filter((item) => item.label && item.value);

  return specs.length ? specs : undefined;
}

function specsToText(specs: unknown) {
  if (!Array.isArray(specs)) return "";
  return specs
    .map((item) => {
      const label = docText(item, "label");
      const specValue = docText(item, "value");
      return label && specValue ? `${label}: ${specValue}` : "";
    })
    .filter(Boolean)
    .join(" | ");
}

async function findOne(collection: "brands" | "categories" | "products", field: string, query: string) {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    where: {
      [field]: {
        equals: query,
      },
    },
  });

  return result.docs[0] as PayloadDoc | undefined;
}

async function resolveTaxonomy(collection: "brands" | "categories", slug?: string, name?: string) {
  const normalizedName =
    collection === "categories" ? canonicalizeCategoryName(name) : name;
  const lookupSlug =
    collection === "categories"
      ? canonicalizeCategorySlug(slug, normalizedName)
      : slug || (name ? formatSlug(name) : undefined);
  if (lookupSlug) {
      const existingBySlug = await findOne(collection, "slug", lookupSlug);
      if (existingBySlug?.id) return existingBySlug.id;
  }

  if (normalizedName) {
      const existingByName = await findOne(collection, "name", normalizedName);
      if (existingByName?.id) return existingByName.id;
  }

  if (!normalizedName && !lookupSlug) return undefined;

  const payload = await getPayloadClient();
  const created = await payload.create({
      collection,
      data: {
        name: normalizedName || lookupSlug,
        slug: lookupSlug || formatSlug(String(normalizedName)),
      },
      overrideAccess: true,
  });

  return (created as PayloadDoc).id;
}

function productData(record: CsvRecord, brand: string | number, category: string | number) {
  const title = value(record, "title");
  const slug = value(record, "slug") || (title ? formatSlug(title) : undefined);

  return {
    title,
    sku: value(record, "sku"),
    slug,
    model: value(record, "model"),
    brand,
    category,
    specProfile: value(record, "specProfile") || "other",
    status: value(record, "status") || "draft",
    stockStatus: value(record, "stockStatus") || "in_stock",
    price: value(record, "price"),
    compareAtPrice: value(record, "compareAtPrice"),
    vatIncluded: booleanValue(record, "vatIncluded", true),
    rating: numberValue(record, "rating"),
    reviewCount: numberValue(record, "reviewCount"),
    viewCount: numberValue(record, "viewCount"),
    discountBadge: value(record, "discountBadge"),
    promoText: value(record, "promoText"),
    warranty: value(record, "warranty"),
    origin: value(record, "origin"),
    tag: value(record, "tag"),
    featured: booleanValue(record, "featured", false),
    sortOrder: numberValue(record, "sortOrder") || 0,
    scannerSpecs: group(record, "scanner", [
      "scannerType",
      "functions",
      "scanSpeedSimplexPpm",
      "scanSpeedDuplexIpm",
      "scanModes",
      "scanResolution",
      "adfSheets",
      "adfCapacitySheets",
      "maxPaperSize",
      "minPaperSize",
      "dailyDuty",
      "passportScanText",
      "duplexScanText",
      "colorScanText",
      "ocrText",
      "plasticCardScanText",
      "connectivity",
      "supportedOs",
      "dimensionsWeight",
    ]),
    printerSpecs: group(record, "printer", [
      "printerType",
      "functions",
      "printTechnology",
      "printSpeed",
      "printResolution",
      "maxPaperSize",
      "colorPrintText",
      "autoDuplexPrintText",
      "standardPaperTray",
      "maxPaperTray",
      "memoryRam",
      "connectivity",
      "supportedOs",
      "recommendedMonthlyVolumeText",
      "maxMonthlyDuty",
      "dimensions",
      "weight",
    ]),
    photocopierSpecs: group(record, "photocopier", [
      "copierType",
      "functions",
      "copySpeed",
      "printSpeed",
      "scanSpeed",
      "maxPaperSize",
      "copyResolution",
      "printResolution",
      "scanResolution",
      "colorPrintText",
      "autoDuplexPrintText",
      "adfText",
      "adfCapacity",
      "memoryRam",
      "connectivity",
      "monthlyDuty",
      "dimensionsWeight",
    ]),
    laptopSpecs: group(record, "laptop", [
      "cpu",
      "gpu",
      "ram",
      "storage",
      "screen",
      "screenResolution",
      "screenSizeInch",
      "refreshRateHz",
      "panel",
      "os",
      "connectivity",
      "battery",
      "dimensions",
      "weight",
    ]),
    specs: specsFromText(value(record, "specs")),
    internalNote: value(record, "internalNote"),
  };
}

function sampleRecord(profile: ProductExportProfile): CsvRecord {
  if (profile === "printer") {
    return {
      sku: "PRINTER-001",
      title: "Máy in mẫu",
      model: "PRINTER-001",
      brandSlug: "hp",
      brandName: "HP",
      categorySlug: "may-in",
      categoryName: "Máy in",
      specProfile: "printer",
      status: "published",
      stockStatus: "in_stock",
      price: "9900000",
      warranty: "12 tháng",
      featured: "false",
      "printer.printerType": "Laser trắng đen",
      "printer.functions": "In, scan, copy",
      "printer.printTechnology": "Laser",
      "printer.printSpeed": "40 trang/phút",
      "printer.printResolution": "1200 x 1200 dpi",
      "printer.maxPaperSize": "A4",
      "printer.autoDuplexPrintText": "Có",
      "printer.connectivity": "USB, LAN, WiFi",
      specs: "Màn hình: LCD | Hộp mực: Chính hãng",
    };
  }

  if (profile === "photocopier") {
    return {
      sku: "PHOTO-001",
      title: "Máy photocopy mẫu",
      model: "PHOTO-001",
      brandSlug: "ricoh",
      brandName: "Ricoh",
      categorySlug: "may-photocopy",
      categoryName: "Máy photocopy",
      specProfile: "photocopier",
      status: "published",
      stockStatus: "in_stock",
      price: "28900000",
      warranty: "12 tháng",
      featured: "false",
      "photocopier.copierType": "Photocopy A3",
      "photocopier.functions": "Copy, in, scan",
      "photocopier.copySpeed": "27 bản/phút",
      "photocopier.printSpeed": "27 trang/phút",
      "photocopier.scanSpeed": "80 ảnh/phút",
      "photocopier.maxPaperSize": "A3",
      "photocopier.adfText": "Có",
      "photocopier.connectivity": "LAN, USB",
      specs: "Bộ nhớ: 2GB | Khay giấy: 500 tờ",
    };
  }

  if (profile === "laptop") {
    return {
      sku: "LAPTOP-001",
      title: "Laptop gaming do hoa mau",
      model: "LAPTOP-001",
      brandSlug: "asus",
      brandName: "ASUS",
      categorySlug: "laptop-gaming-do-hoa",
      categoryName: "Laptop Gaming - Đồ Họa",
      specProfile: "laptop",
      status: "published",
      stockStatus: "in_stock",
      price: "25900000",
      warranty: "24 thang",
      featured: "false",
      "laptop.cpu": "Intel Core 7 240H",
      "laptop.gpu": "NVIDIA GeForce RTX 5060 8GB",
      "laptop.ram": "16GB",
      "laptop.storage": "1TB SSD",
      "laptop.screen": "16 inch WUXGA 144Hz",
      "laptop.os": "Windows 11",
      specs: "CPU: Intel Core 7 240H | GPU: RTX 5060 8GB | RAM: 16GB",
    };
  }

  return {
      sku: "ADS-4300N",
      title: "Brother ADS-4300N Scanner",
      model: "ADS-4300N",
      brandSlug: "brother",
      brandName: "Brother",
      categorySlug: "may-scan",
      categoryName: "Máy scan",
      specProfile: "scanner",
      status: "published",
      stockStatus: "in_stock",
      price: "13900000",
      warranty: "12 tháng",
      featured: "false",
      "scanner.scanSpeedSimplexPpm": "40",
      "scanner.scanSpeedDuplexIpm": "80",
      "scanner.adfSheets": "80",
      "scanner.connectivity": "USB 3.0, LAN",
      specs: "Độ phân giải: 600 x 600 dpi | Khổ giấy: A4",
    };
}

export function productImportTemplateCSV(profile: ProductExportProfile = "scanner") {
  return recordsToCSV([sampleRecord(profile)], profile);
}

export function productImportTemplateExcel(profile: ProductExportProfile = "scanner") {
  return recordsToExcelHTML([sampleRecord(profile)], profile);
}

function matchesProfile(record: CsvRecord, profile: ProductExportProfile) {
  if (profile === "all") return true;
  const haystack = `${record.specProfile} ${record.categorySlug} ${record.categoryName}`.toLowerCase();
  if (profile === "scanner") return haystack.includes("scanner") || haystack.includes("scan");
  if (profile === "printer") return haystack.includes("printer") || haystack.includes("may-in") || haystack.includes("máy in");
  if (profile === "laptop") return haystack.includes("laptop") || haystack.includes("notebook");
  return haystack.includes("photo") || haystack.includes("copy");
}

export async function exportProductsCSV(profile: ProductExportProfile = "all") {
  const payload = await getPayloadClient();
  const products = await payload.find({
    collection: "products",
    depth: 1,
    limit: 1000,
    sort: "title",
    overrideAccess: true,
  });

  const records = products.docs.map((product) => {
    const doc = product as PayloadDoc;
    const scanner = (doc.scannerSpecs || {}) as Record<string, unknown>;
    const printer = (doc.printerSpecs || {}) as Record<string, unknown>;
    const photocopier = (doc.photocopierSpecs || {}) as Record<string, unknown>;
    const laptop = (doc.laptopSpecs || {}) as Record<string, unknown>;
    const record: CsvRecord = {
      sku: docText(doc, "sku"),
      slug: docText(doc, "slug"),
      title: docText(doc, "title"),
      model: docText(doc, "model"),
      brandSlug: docText(doc.brand, "slug"),
      brandName: docText(doc.brand, "name"),
      categorySlug: docText(doc.category, "slug"),
      categoryName: docText(doc.category, "name"),
      specProfile: docText(doc, "specProfile"),
      status: docText(doc, "status"),
      stockStatus: docText(doc, "stockStatus"),
      price: docText(doc, "price"),
      compareAtPrice: docText(doc, "compareAtPrice"),
      vatIncluded: docText(doc, "vatIncluded"),
      rating: docText(doc, "rating"),
      reviewCount: docText(doc, "reviewCount"),
      viewCount: docText(doc, "viewCount"),
      discountBadge: docText(doc, "discountBadge"),
      promoText: docText(doc, "promoText"),
      warranty: docText(doc, "warranty"),
      origin: docText(doc, "origin"),
      tag: docText(doc, "tag"),
      featured: docText(doc, "featured"),
      sortOrder: docText(doc, "sortOrder"),
      specs: specsToText(doc.specs),
      internalNote: docText(doc, "internalNote"),
    };

    for (const [key, item] of Object.entries(scanner)) record[`scanner.${key}`] = String(item ?? "");
    for (const [key, item] of Object.entries(printer)) record[`printer.${key}`] = String(item ?? "");
    for (const [key, item] of Object.entries(photocopier)) record[`photocopier.${key}`] = String(item ?? "");
    for (const [key, item] of Object.entries(laptop)) record[`laptop.${key}`] = String(item ?? "");

    return record;
  }).filter((record) => matchesProfile(record, profile));

  return recordsToCSV(records, profile);
}

export async function exportProductsExcel(profile: ProductExportProfile = "all") {
  const payload = await getPayloadClient();
  const products = await payload.find({
    collection: "products",
    depth: 1,
    limit: 1000,
    sort: "title",
    overrideAccess: true,
  });

  const records = products.docs.map((product) => {
    const doc = product as PayloadDoc;
    const scanner = (doc.scannerSpecs || {}) as Record<string, unknown>;
    const printer = (doc.printerSpecs || {}) as Record<string, unknown>;
    const photocopier = (doc.photocopierSpecs || {}) as Record<string, unknown>;
    const laptop = (doc.laptopSpecs || {}) as Record<string, unknown>;
    const record: CsvRecord = {
      sku: docText(doc, "sku"),
      slug: docText(doc, "slug"),
      title: docText(doc, "title"),
      model: docText(doc, "model"),
      brandSlug: docText(doc.brand, "slug"),
      brandName: docText(doc.brand, "name"),
      categorySlug: docText(doc.category, "slug"),
      categoryName: docText(doc.category, "name"),
      specProfile: docText(doc, "specProfile"),
      status: docText(doc, "status"),
      stockStatus: docText(doc, "stockStatus"),
      price: docText(doc, "price"),
      compareAtPrice: docText(doc, "compareAtPrice"),
      vatIncluded: docText(doc, "vatIncluded"),
      rating: docText(doc, "rating"),
      reviewCount: docText(doc, "reviewCount"),
      viewCount: docText(doc, "viewCount"),
      discountBadge: docText(doc, "discountBadge"),
      promoText: docText(doc, "promoText"),
      warranty: docText(doc, "warranty"),
      origin: docText(doc, "origin"),
      tag: docText(doc, "tag"),
      featured: docText(doc, "featured"),
      sortOrder: docText(doc, "sortOrder"),
      specs: specsToText(doc.specs),
      internalNote: docText(doc, "internalNote"),
    };

    for (const [key, item] of Object.entries(scanner)) record[`scanner.${key}`] = String(item ?? "");
    for (const [key, item] of Object.entries(printer)) record[`printer.${key}`] = String(item ?? "");
    for (const [key, item] of Object.entries(photocopier)) record[`photocopier.${key}`] = String(item ?? "");
    for (const [key, item] of Object.entries(laptop)) record[`laptop.${key}`] = String(item ?? "");

    return record;
  }).filter((record) => matchesProfile(record, profile));

  return recordsToExcelHTML(records, profile);
}

export async function importProductsCSV(csv: string): Promise<ProductImportResult> {
  const payload = await getPayloadClient();
  const rows = parseCSV(csv);
  const result: ProductImportResult = { created: 0, errors: [], skipped: 0, updated: 0 };

  for (const [index, record] of rows.entries()) {
    const rowNumber = index + 2;
    const sku = value(record, "sku");
    const title = value(record, "title");

    try {
      if (!title) {
        result.skipped += 1;
        result.errors.push({ message: "Missing title", row: rowNumber, sku });
        continue;
      }

      const brand = await resolveTaxonomy("brands", value(record, "brandSlug"), value(record, "brandName"));
      const category = await resolveTaxonomy("categories", value(record, "categorySlug"), value(record, "categoryName"));

      if (!brand || !category) {
        result.skipped += 1;
        result.errors.push({ message: "Missing brand/category", row: rowNumber, sku });
        continue;
      }

      const data = productData(record, brand, category);
      const existingBySku = sku ? await findOne("products", "sku", sku) : undefined;
      const existingBySlug = !existingBySku && data.slug ? await findOne("products", "slug", data.slug) : undefined;
      const existing = existingBySku || existingBySlug;

      if (existing?.id) {
        await payload.update({
          collection: "products",
          id: existing.id,
          data,
          overrideAccess: true,
        });
        result.updated += 1;
      } else {
        await payload.create({
          collection: "products",
          data,
          overrideAccess: true,
        });
        result.created += 1;
      }
    } catch (error) {
      result.skipped += 1;
      result.errors.push({
        message: error instanceof Error ? error.message : String(error),
        row: rowNumber,
        sku,
      });
    }
  }

  return result;
}

export function productImportExportAuthorized(request: Request) {
  const secret = process.env.PRODUCT_IMPORT_EXPORT_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const url = new URL(request.url);
  return request.headers.get("x-product-import-export-secret") === secret || url.searchParams.get("secret") === secret;
}

export function productCSVResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}

export function productExcelResponse(workbook: Buffer, filename: string) {
  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}

export function productExportProfileFromRequest(request: Request) {
  const url = new URL(request.url);
  return normalizeProfile(url.searchParams.get("profile"));
}

export function productExportFilename(kind: "export" | "template", profile: ProductExportProfile) {
  const suffix = profileLabel(profile);
  return kind === "template" ? `hpt-mau-import-${suffix}.csv` : `hpt-products-${suffix}.csv`;
}

export function productExcelFilename(kind: "export" | "template", profile: ProductExportProfile) {
  const suffix = profileLabel(profile);
  return kind === "template" ? `hpt-mau-import-${suffix}.xlsx` : `hpt-products-${suffix}.xlsx`;
}
