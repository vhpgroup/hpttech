import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { assertScraperAccess } from "@/lib/scraper/auth";
import { scrapeProductUrl, searchProduct } from "@/lib/scraper/engine";

export const runtime = "nodejs";

type SearchRequest = {
  query?: string;
  url?: string;
};

export async function POST(request: Request) {
  try {
    assertScraperAccess(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized scraper request.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SearchRequest;
  const searchParams = new URL(request.url).searchParams;
  const queryFromUrl = searchParams.get("query");
  const productUrl = String(body.url || searchParams.get("url") || "").trim();
  const query = String(body.query || queryFromUrl || "").trim();

  if (!query && !productUrl) {
    return NextResponse.json({ error: "Vui long nhap ten san pham hoac URL san pham." }, { status: 400 });
  }

  try {
    const product = productUrl ? await scrapeProductUrl(productUrl) : await searchProduct(query);
    const payload = await getPayloadClient();
    const job = await payload.create({
      collection: "scraper-jobs",
      data: {
        brandDetected: product.source.brand,
        confidence: product.confidence,
        generatedContent: product.generated,
        query: query || product.data.title || productUrl,
        rawExtractedData: product.data,
        reviewStatus: product.reviewStatus,
        searchQuery: product.source.searchQuery,
        seoPreview: product.seo,
        sourceUrl: product.source.url,
        warnings: product.warnings.map((message) => ({ message })),
      },
      overrideAccess: true,
    });

    return NextResponse.json({
      found: true,
      jobId: job.id,
      product,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Khong cao duoc san pham.";

    try {
      const payload = await getPayloadClient();
      await payload.create({
        collection: "scraper-jobs",
        data: {
          error: message,
          query,
          reviewStatus: "failed",
        },
        overrideAccess: true,
      });
    } catch {
      // If logging fails, still return the scraper error.
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
