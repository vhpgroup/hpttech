import ExcelJS from "exceljs";
import type { ExcelRow } from "./types";

const HEADER_ALIASES = {
  category: ["danh muc", "category"],
  name: ["ten san pham", "product name", "name"],
  productType: ["loai san pham", "product type", "producttype"],
} as const;

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cellText(value: ExcelJS.CellValue) {
  if (value && typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value) return String(value.result ?? "").trim();
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("").trim();
    }
  }
  return String(value ?? "").trim();
}

function headerIndex(headers: string[], aliases: readonly string[]) {
  const index = headers.findIndex((header) => aliases.includes(header));
  return index >= 0 ? index + 1 : undefined;
}

export async function parseExcelInput(filePath: string): Promise<ExcelRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("File Excel không có worksheet.");

  const headers = (sheet.getRow(1).values as ExcelJS.CellValue[])
    .slice(1)
    .map(normalize);
  const columns = {
    category: headerIndex(headers, HEADER_ALIASES.category),
    name: headerIndex(headers, HEADER_ALIASES.name),
    productType: headerIndex(headers, HEADER_ALIASES.productType),
  };
  const missing = Object.entries(columns)
    .filter(([, index]) => !index)
    .map(([field]) => field);
  if (missing.length) {
    throw new Error(
      "File Excel phải có 3 cột: Tên sản phẩm, Danh mục, Loại sản phẩm.",
    );
  }

  const rows: ExcelRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const name = cellText(row.getCell(columns.name!).value);
    if (!name) continue;
    rows.push({
      category: cellText(row.getCell(columns.category!).value),
      name,
      productType: cellText(row.getCell(columns.productType!).value),
      rowNumber,
    });
  }
  return rows;
}
