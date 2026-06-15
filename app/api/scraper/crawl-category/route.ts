import { NextResponse } from "next/server";
import { assertScraperAccess } from "@/lib/scraper/auth";
import { searchProductMultiSource } from "@/lib/scraper/engine";
import { importBatchProduct } from "@/lib/scraper/batch-importer";
import { resolveProductTypeCode } from "@/lib/scraper/db-lookup";
import { discoverSourceCategory } from "@/lib/scraper/engine";
import type { ExcelRow } from "@/lib/scraper/types";

export const runtime = "nodejs";
// Category crawl can take a while — allow up to 5 min on Vercel Pro
export const maxDuration = 300;

type CrawlRequest = {
  categoryUrl?: string;
  forcePublish?: boolean;
  limit?: number;
  productType?: string;
  skip?: number;
};

type ProductResult = {
  adminUrl?: string;
  confidence?: number;
  error?: string;
  productId?: string | number;
  productName: string;
  publishGateReasons?: string[];
  slug?: string;
  sourceUrl: string;
  status: "published" | "draft" | "failed" | "skipped";
  warnings?: string[];
};

function adminUrl(productId: string | number) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/admin/collections/products/${productId}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST /api/scraper/crawl-category
 *
 * Body:
 *   categoryUrl  – URL trang danh mục (hiện hỗ trợ An Phát: anphatpc.com.vn)
 *   productType  – "scanner" | "printer" | "photocopier" | "software" | tên bất kỳ trong DB
 *   limit        – số sản phẩm tối đa cần crawl (mặc định 5 để test an toàn)
 *   skip         – bỏ qua bao nhiêu sản phẩm đầu (mặc định 0)
 *   forcePublish – true = publish ngay bỏ qua publication gate (mặc định false)
 *
 * Headers:
 *   Authorization: Bearer <SCRAPER_API_SECRET>
 */
export async function POST(request: Request) {
  try {
    assertScraperAccess(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CrawlRequest;
  const {
    categoryUrl,
    productType,
    limit = 5,
    skip = 0,
    forcePublish = false,
  } = body;

  if (!categoryUrl || !productType) {
    return NextResponse.json(
      { error: "Thiếu categoryUrl hoặc productType." },
      { status: 400 },
    );
  }

  // --- 1. Discover products from the category page ---
  let category: Awaited<ReturnType<typeof discoverSourceCategory>>;
  try {
    category = await discoverSourceCategory(categoryUrl);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không tải được danh mục.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const allProducts = category.products;
  if (!allProducts.length) {
    return NextResponse.json(
      { error: "Danh mục không có sản phẩm nào.", categoryTitle: category.title },
      { status: 404 },
    );
  }

  // Resolve productType code once (throws if not found)
  let productTypeCode: string;
  try {
    productTypeCode = await resolveProductTypeCode(productType);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không tìm thấy Product Type.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const slice = allProducts.slice(skip, skip + limit);
  const results: ProductResult[] = [];
  const delayMs = Number(process.env.SCRAPER_DELAY_MS || 2500);

  // --- 2. Crawl + import each product sequentially ---
  for (let index = 0; index < slice.length; index += 1) {
    const candidate = slice[index];
    const productName = candidate.productName;
    const sourceUrl = candidate.productUrl;

    try {
      // searchProductMultiSource with categoryUrl → uses searchProductFromCategory path
      // which leverages the already-fetched category data (cached in module-level Map).
      // The category products list is already in memory from step 1, so no extra fetch.
      const scraped = await searchProductMultiSource(productName, categoryUrl);

      // categoryName: use the resolved An Phát category title so resolveTaxonomy
      // can find-or-create the right Category record in Payload.
      const excelRow: ExcelRow = {
        category: category.title,
        name: productName,
        productType,
        rowNumber: skip + index + 1,
      };

      const imported = await importBatchProduct(excelRow, scraped, productTypeCode, {
        publish: forcePublish || scraped.confidence >= 0.75,
      });

      results.push({
        adminUrl: adminUrl(imported.productId),
        confidence: scraped.confidence,
        productId: imported.productId,
        productName,
        publishGateReasons: imported.publishGateReasons,
        slug: imported.slug,
        sourceUrl,
        status: imported.published ? "published" : "draft",
        warnings: [
          ...scraped.warnings,
          ...(imported.imageWarning ? [imported.imageWarning] : []),
          ...imported.publishGateReasons,
        ],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      results.push({
        error: message,
        productName,
        sourceUrl,
        status: "failed",
      });
    }

    // Delay between products to avoid rate-limiting
    if (index < slice.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const summary = {
    categoryTitle: category.title,
    categoryUrl,
    draft: results.filter((r) => r.status === "draft").length,
    failed: results.filter((r) => r.status === "failed").length,
    published: results.filter((r) => r.status === "published").length,
    results,
    total: results.length,
    totalInCategory: allProducts.length,
  };

  return NextResponse.json(summary);
}
