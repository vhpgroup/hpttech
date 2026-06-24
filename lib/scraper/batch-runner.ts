import { getPayloadClient } from "@/lib/payload";
import { importBatchProduct } from "./batch-importer";
import type { BulkImportOptions } from "./batch-options";
import { resolveProductTypeCode } from "./db-lookup";
import { validateExpectedProductType } from "./product-type-guard";
import { assertScraperDatabaseReady } from "./database-preflight";
import { discoverSourceCategory, searchProductMultiSource } from "./engine";
import { parseExcelInput } from "./excel-parser";
import { findExistingProductForSourceCandidate } from "./duplicate-check";
import { buildReportPath, generateReport } from "./report";
import {
  selectProductSources,
  tavilyMultiSourceSearch,
} from "./tavily-searcher";
import { notifyProductResult, notifySummary } from "./telegram";
import type {
  BatchResult,
  BatchSummary,
  ExcelRow,
  ScrapedProduct,
} from "./types";

type RunBulkImportOptions = BulkImportOptions & {
  onResult?: (result: BatchResult, index: number, total: number) => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function adminUrl(productId: string | number) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/admin/collections/products/${productId}`;
}

function productUrl(slug?: string) {
  if (!slug) return undefined;
  const base =
    process.env.NEXT_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/san-pham/${slug}`;
}

function sourceDomain(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

async function createScraperJob(
  row: ExcelRow,
  product: ScrapedProduct,
): Promise<string | number> {
  const payload = await getPayloadClient();
  const job = await payload.create({
    collection: "scraper-jobs",
    data: {
      brandDetected: product.source.brand,
      confidence: product.confidence,
      generatedContent: product.generated,
      query: row.name,
      rawExtractedData: product.data,
      reviewStatus: product.reviewStatus,
      searchQuery: product.source.searchQuery,
      seoPreview: product.seo,
      sourceUrl: product.source.url,
      warnings: product.warnings.map((message) => ({ message })),
    },
    overrideAccess: true,
  });
  return job.id;
}

async function markJobImported(
  jobId: string | number,
  productId: string | number,
) {
  const payload = await getPayloadClient();
  await payload.update({
    collection: "scraper-jobs",
    data: {
      productCreated: productId,
      reviewStatus: "ready_to_review",
    },
    id: jobId,
    overrideAccess: true,
  });
}

async function recordFailedJob(row: ExcelRow, error: string) {
  const payload = await getPayloadClient();
  await payload.create({
    collection: "scraper-jobs",
    data: {
      error,
      query: row.name,
      reviewStatus: "failed",
    },
    overrideAccess: true,
  });
}

function summarize(results: BatchResult[], durationMs: number): BatchSummary {
  return {
    draft: results.filter((result) => result.status === "draft").length,
    durationMs,
    failed: results.filter((result) => result.status === "failed").length,
    published: results.filter((result) => result.status === "published").length,
    results,
    searched: results.filter((result) => result.status === "searched").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    total: results.length,
  };
}

function isDatabaseConnectionError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("cannot connect to postgres") ||
    normalized.includes("econnrefused") ||
    normalized.includes("database_uri")
  );
}

async function searchOnly(row: ExcelRow): Promise<BatchResult> {
  const results = await tavilyMultiSourceSearch(row.name);
  const sources = selectProductSources(results, row.name);
  if (!sources.length) {
    throw new Error("Tavily khong tim thay nguon phu hop trong whitelist.");
  }
  return {
    confidence: Math.max(...sources.map((source) => source.score)),
    productName: row.name,
    sourceUrls: sources.map((source) => source.url),
    status: "searched",
    warnings:
      sources.length < 2
        ? ["Chi tim thay mot nguon phu hop."]
        : [],
  };
}

async function processRow(
  row: ExcelRow,
  options: RunBulkImportOptions,
): Promise<BatchResult> {
  if (options.searchOnly) return searchOnly(row);

  if (options.categoryUrl) {
    const category = await discoverSourceCategory(options.categoryUrl);
    const candidate = category.products.find((product) => product.productName === row.name);
    if (candidate) {
      const existing = await findExistingProductForSourceCandidate(candidate, category.url);
      if (existing?.id !== undefined) {
        const slug = typeof existing.slug === "string" ? existing.slug : undefined;
        return {
          adminUrl: adminUrl(existing.id),
          productId: existing.id,
          productName: row.name,
          productReport: { productUrl: productUrl(slug) },
          sourceUrls: [candidate.productUrl],
          status: "skipped",
          warnings: [
            `Skipped duplicate product already in Payload: ${existing.title || existing.name || existing.id}.`,
          ],
        };
      }
    }
  }

  const product = await searchProductMultiSource(row.name, options.categoryUrl);
  validateExpectedProductType(row.productType, product);
  const sourceUrls = product.source.urls || [product.source.url];
  if (options.dryRun) {
    return {
      confidence: product.confidence,
      productName: row.name,
      sourceUrls,
      status: "draft",
      warnings: [...product.warnings, "Dry run: khong ghi Payload CMS."],
    };
  }

  const productTypeCode = await resolveProductTypeCode(row.productType);
  const jobId = await createScraperJob(row, product);
  const imported = await importBatchProduct(row, product, productTypeCode, {
    publish: options.publish,
  });
  await markJobImported(jobId, imported.productId);
  return {
    adminUrl: adminUrl(imported.productId),
    confidence: product.confidence,
    jobId,
    productId: imported.productId,
    productReport: {
      imageCount: imported.imageCount,
      imageStatus: imported.imageCount > 0 ? "ok" : "missing",
      productUrl: productUrl(imported.slug),
      rating: imported.rating,
      sellingPointCount: imported.sellingPointCount,
      sourceDomain: sourceDomain(product.source.url),
      specCount: imported.specCount,
      viewCount: imported.viewCount,
      warranty: imported.warranty,
    },
    productName: row.name,
    sourceUrls,
    status: imported.published ? "published" : "draft",
    warnings: [
      ...product.warnings,
      ...(imported.imageWarning ? [imported.imageWarning] : []),
      ...imported.publishGateReasons,
    ],
  };
}

export async function runBulkImport(options: RunBulkImportOptions) {
  const startedAt = Date.now();
  const parsedRows = await parseExcelInput(options.filePath);
  const end =
    options.limit === undefined
      ? undefined
      : options.skip + options.limit;
  const rows = parsedRows.slice(options.skip, end);
  const results: BatchResult[] = [];
  const delayMs = Number(process.env.SCRAPER_DELAY_MS || 3000);
  if (!options.dryRun && !options.searchOnly && rows.length) {
    await assertScraperDatabaseReady();
  }

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    let result: BatchResult;
    try {
      result = await processRow(row, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result = {
        error: message,
        productName: row.name,
        sourceUrls: [],
        status: "failed",
        warnings: [],
      };
      if (
        !options.dryRun &&
        !options.searchOnly &&
        !isDatabaseConnectionError(message)
      ) {
        await recordFailedJob(row, message).catch(() => undefined);
      }
    }

    results.push(result);
    options.onResult?.(result, index + 1, rows.length);
    if (!options.dryRun && !options.searchOnly) {
      await notifyProductResult(result).catch(() => false);
    }
    if (index < rows.length - 1 && delayMs > 0) await sleep(delayMs);
  }

  const reportPath = buildReportPath(options.filePath);
  await generateReport(results, reportPath);
  const summary = summarize(results, Date.now() - startedAt);
  if (!options.dryRun && !options.searchOnly) {
    await notifySummary(summary, reportPath).catch(() => false);
  }
  return { reportPath, summary };
}
