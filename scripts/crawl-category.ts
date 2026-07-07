import { loadEnvConfig } from "@next/env";
import ExcelJS from "exceljs";
import path from "node:path";

import { LAPTOP_GAMING_CATEGORY_NAME } from "../lib/product-category";
import { commonProductTypeCode } from "../lib/scraper/db-lookup";
import { discoverSourceCategory } from "../lib/scraper/engine";
import {
  pcServerCategoryNameForType,
  PC_SERVER_TYPE_CODES,
} from "../lib/scraper/pc-server-taxonomy";

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
  rows: Array<{ categoryName: string; productName: string; productType: string }>,
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");
  sheet.addRow(["Tên sản phẩm", "Danh mục", "Loại sản phẩm"]);
  for (const row of rows) {
    sheet.addRow([row.productName.trim(), row.categoryName, row.productType]);
  }
  const host = new URL(categoryUrl).hostname.replace(/^www\./, "");
  const filePath = path.resolve(
    "tmp",
    `category-${host}-${Date.now()}.xlsx`,
  );
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

function classifyCategoryProduct(
  categoryTitle: string,
  categoryUrl: string,
  productName: string,
) {
  // Nhiều trang An Phát có h1 cụt (vd chỉ "HP", "ASUS" trên trang PC đồng bộ
  // theo hãng — xác nhận live 2026-07-07) → bổ sung tín hiệu từ URL slug
  // (may-tinh-dong-bo-hp_dm1044 → "may tinh dong bo hp") khi title không đủ.
  const categoryType =
    commonProductTypeCode(categoryTitle) ||
    commonProductTypeCode(`${categoryTitle} ${categoryUrl}`);
  const categoryKey = categoryTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isMixedNetworkingCameraCategory =
    categoryKey.includes("thiet bi mang") && categoryKey.includes("camera");
  // Trang cha "May chu, Linh kien" (may-chu_dm1018) cua An Phat tron ca may chu
  // nguyen chiec lan linh kien server -> uu tien nhan dien theo ten san pham.
  const isMixedServerComponentCategory =
    (categoryKey.includes("may chu") || categoryKey.includes("server")) &&
    categoryKey.includes("linh kien");
  const preferProductName =
    isMixedNetworkingCameraCategory || isMixedServerComponentCategory;
  const detected = preferProductName
    ? commonProductTypeCode(productName) || categoryType
    : categoryType || commonProductTypeCode(productName);
  if (detected === "camera") {
    return { categoryName: "Camera & An ninh", productType: "camera" };
  }
  if (detected === "networking") {
    return { categoryName: "Thiết bị mạng", productType: "networking" };
  }
  if (detected === "printer") {
    return { categoryName: "Máy in", productType: "printer" };
  }
  if (detected === "laptop") {
    return { categoryName: LAPTOP_GAMING_CATEGORY_NAME, productType: "laptop" };
  }
  if (detected && PC_SERVER_TYPE_CODES.has(detected)) {
    const categoryName = pcServerCategoryNameForType(detected);
    if (categoryName) return { categoryName, productType: detected };
  }
  if (!detected) return undefined;
  return { categoryName: categoryTitle, productType: detected };
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
  const skip = integerOption(args, "skip", 0) || 0;
  const limit = integerOption(args, "limit");
  const selected = category.products.slice(
    skip,
    limit === undefined ? undefined : skip + limit,
  );
  if (!selected.length) throw new Error("Danh mục không có sản phẩm để chạy.");

  const rows = selected.map((product) => {
    const classified = classifyCategoryProduct(
      category.title,
      category.url,
      product.productName,
    );
    if (!classified) {
      throw new Error(
        `Chưa nhận diện được loại sản phẩm "${product.productName}" từ danh mục "${category.title}".`,
      );
    }
    return {
      categoryName: classified.categoryName,
      productName: product.productName,
      productType: classified.productType,
    };
  });

  const filePath = await createCategoryWorkbook(
    category.url,
    rows,
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
          skipped: result.summary.skipped,
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
