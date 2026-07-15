import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { promotionPriceForOfferWrite } from "../lib/import-pricing-policy";
import { parseBulkImportArgs } from "../lib/scraper/batch-options";
import { parseExcelInput } from "../lib/scraper/excel-parser";
import { buildReportPath, generateReport } from "../lib/scraper/report";
import type { BatchResult } from "../lib/scraper/types";

async function main() {
  const directory = await mkdtemp(join(tmpdir(), "hpt-bulk-import-"));

  try {
    const inputPath = join(directory, "products.xlsx");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Products");
    sheet.addRow(["Tên sản phẩm", "Danh mục", "Loại sản phẩm"]);
    sheet.addRow(["Brother ADS-4700W", "Máy scan", "scanner"]);
    sheet.addRow(["", "Máy in", "printer"]);
    sheet.addRow(["Epson L3250", "Máy in", "printer"]);
    await workbook.xlsx.writeFile(inputPath);

    assert.deepEqual(await parseExcelInput(inputPath), [
      {
        category: "Máy scan",
        name: "Brother ADS-4700W",
        productType: "scanner",
        rowNumber: 2,
      },
      {
        category: "Máy in",
        name: "Epson L3250",
        productType: "printer",
        rowNumber: 4,
      },
    ]);

    assert.deepEqual(
      parseBulkImportArgs([
        inputPath,
        "--dry-run",
        "--search-only",
        "--skip=2",
        "--limit=5",
      ]),
      {
        dryRun: true,
        filePath: inputPath,
        limit: 5,
        publish: false,
        searchOnly: true,
        skip: 2,
      },
    );

    assert.match(
      buildReportPath(inputPath, new Date("2026-06-10T00:00:00.000Z")),
      /products_report_2026-06-10\.xlsx$/,
    );

    const results: BatchResult[] = [
      {
        confidence: 0.92,
        productName: "Brother ADS-4700W",
        sourceUrls: ["https://brother.com.vn/example"],
        status: "draft",
        warnings: ["Cần nhân viên kiểm tra giá."],
      },
      {
        error: "Không tìm thấy nguồn phù hợp.",
        productName: "Unknown Product",
        sourceUrls: [],
        status: "failed",
        warnings: [],
      },
    ];
    const reportPath = join(directory, "report.xlsx");
    await generateReport(results, reportPath);
    const report = new ExcelJS.Workbook();
    await report.xlsx.readFile(reportPath);
    const reportSheet = report.worksheets[0];
    assert.equal(reportSheet.rowCount, 3);
    assert.equal(reportSheet.getRow(2).getCell(2).text, "Brother ADS-4700W");
    assert.equal(reportSheet.getRow(3).getCell(10).text, "Không tìm thấy nguồn phù hợp.");
  } finally {
    await rm(directory, { force: true, recursive: true });
  }

  // Ô promotionPrice trống trong file import phải XÓA được khuyến mãi cũ:
  // Payload/drizzle bỏ qua field undefined khi update nên offer write phải
  // chuẩn hóa về null tường minh (numberValue trả undefined cho ô trống).
  assert.equal(promotionPriceForOfferWrite(undefined), null);
  assert.equal(promotionPriceForOfferWrite(null), null);
  assert.equal(promotionPriceForOfferWrite(0), null);
  assert.equal(promotionPriceForOfferWrite(-5), null);
  assert.equal(promotionPriceForOfferWrite(Number.NaN), null);
  assert.equal(promotionPriceForOfferWrite(1500000), 1500000);

  console.log("bulk import core verification passed");
}

void main();
