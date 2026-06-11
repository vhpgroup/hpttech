import { basename, dirname, extname, join } from "node:path";
import ExcelJS from "exceljs";
import type { BatchResult } from "./types";

function dateStamp(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function buildReportPath(inputPath: string, now = new Date()) {
  const name = basename(inputPath, extname(inputPath));
  return join(dirname(inputPath), `${name}_report_${dateStamp(now)}.xlsx`);
}

export async function generateReport(results: BatchResult[], outputPath: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Kết quả");
  sheet.columns = [
    { header: "STT", key: "index", width: 8 },
    { header: "Tên sản phẩm", key: "productName", width: 36 },
    { header: "Trạng thái", key: "status", width: 14 },
    { header: "Confidence", key: "confidence", width: 14 },
    { header: "Link Admin", key: "adminUrl", width: 45 },
    { header: "Nguồn URL", key: "sourceUrls", width: 70 },
    { header: "Lỗi", key: "error", width: 45 },
    { header: "Cảnh báo", key: "warnings", width: 55 },
  ];

  results.forEach((result, index) => {
    sheet.addRow({
      adminUrl: result.adminUrl || "",
      confidence:
        typeof result.confidence === "number"
          ? `${Math.round(result.confidence * 100)}%`
          : "",
      error: result.error || "",
      index: index + 1,
      productName: result.productName,
      sourceUrls: result.sourceUrls.join("\n"),
      status: result.status,
      warnings: result.warnings.join("\n"),
    });
  });

  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle" };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: true };
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  await workbook.xlsx.writeFile(outputPath);
}
