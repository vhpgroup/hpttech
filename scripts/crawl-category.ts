import { loadEnvConfig } from "@next/env";
import ExcelJS from "exceljs";
import path from "node:path";

import { commonProductTypeCode } from "../lib/scraper/db-lookup";
import { discoverSourceCategory } from "../lib/scraper/engine";

loadEnvConfig(process.cwd());

function integerOption(args: string[], name: string, defaultValue?: number) {
  const raw = args
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
  if (raw === undefined) return defaultValue;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`--${name} phải là số nguyên không âm.`);
  }
  return value;
}

async function createCategoryWorkbook(
  categoryUrl: string,
  rows: Array<{ productName: string }>,
  categoryName: string,
  productType: string,
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");
  sheet.addRow(["Tên sản phẩm", "Danh mục", "Loại sản phẩm"]);
  for (const row of rows) {
    sheet.addRow([row.productName.trim(), categoryName, productType]);
  }
  const host = new URL(categoryUrl).hostname.replace(/^www\./, "");
  const filePath = path.resolve(
    "tmp",
    `category-${host}-${Date.now()}.xlsx`,
  );
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

async function main() {
  const args = process.argv.slice(2);
  const categoryUrl = args.find((arg) => !arg.startsWith("--"))?.trim();
  if (!categoryUrl) {
    throw new Error(
      "Cách dùng: npm run products:crawl-category -- <category-url> [--publish] [--skip=N] [--limit=N]",
    );
  }

  const category = await discoverSourceCategory(categoryUrl);
  const productType = commonProductTypeCode(category.title);
  if (!productType) {
    throw new Error(
      `Chưa nhận diện được loại sản phẩm từ danh mục "${category.title}".`,
    );
  }
  const skip = integerOption(args, "skip", 0) || 0;
  const limit = integerOption(args, "limit");
  const selected = category.products.slice(
    skip,
    limit === undefined ? undefined : skip + limit,
  );
  if (!selected.length) throw new Error("Danh mục không có sản phẩm để chạy.");

  const filePath = await createCategoryWorkbook(
    category.url,
    selected,
    category.title,
    productType,
  );
  const { runBulkImport } = await import("../lib/scraper/batch-runner");
  const result = await runBulkImport({
    categoryUrl: category.url,
    dryRun: args.includes("--dry-run"),
    filePath,
    publish: args.includes("--publish"),
    searchOnly: false,
    skip: 0,
  });

  console.log(
    JSON.stringify(
      {
        category: category.title,
        categoryUrl: category.url,
        discovered: category.products.length,
        selected: selected.length,
        summary: {
          draft: result.summary.draft,
          failed: result.summary.failed,
          published: result.summary.published,
        },
      },
      null,
      2,
    ),
  );
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
