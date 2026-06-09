import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { assertScraperAccess } from "@/lib/scraper/auth";
import { importScrapedProduct } from "@/lib/scraper/importer";
import type { ScrapedProduct } from "@/lib/scraper/types";

export const runtime = "nodejs";

type ImportRequest = {
  categoryId?: string;
  jobId?: string | number;
  product?: ScrapedProduct;
};

function warningsFromJob(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (item && typeof item === "object" && "message" in item && typeof item.message === "string") {
        return item.message;
      }
      return undefined;
    })
    .filter((message): message is string => Boolean(message));
}

async function productFromJob(jobId: string | number): Promise<ScrapedProduct> {
  const payload = await getPayloadClient();
  const job = await payload.findByID({
    collection: "scraper-jobs",
    id: jobId,
  });

  if (!job.rawExtractedData || !job.generatedContent || !job.seoPreview) {
    throw new Error("Job nay chua co du preview de import.");
  }

  return {
    confidence: typeof job.confidence === "number" ? job.confidence : 0.4,
    data: job.rawExtractedData as ScrapedProduct["data"],
    generated: job.generatedContent as ScrapedProduct["generated"],
    reviewStatus:
      job.reviewStatus === "ready_to_review" || job.reviewStatus === "needs_human_input"
        ? job.reviewStatus
        : "needs_human_input",
    seo: job.seoPreview as ScrapedProduct["seo"],
    source: {
      brand: job.brandDetected || "",
      searchQuery: job.searchQuery || "",
      url: job.sourceUrl || "",
    },
    warnings: warningsFromJob(job.warnings),
  };
}

export async function POST(request: Request) {
  try {
    assertScraperAccess(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized scraper request.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ImportRequest;
  const searchParams = new URL(request.url).searchParams;
  const jobId = body.jobId || searchParams.get("jobId") || undefined;
  const categoryId = body.categoryId || searchParams.get("categoryId") || undefined;

  if (!body.product && !jobId) {
    return NextResponse.json({ error: "Thieu product preview hoac jobId de import." }, { status: 400 });
  }

  try {
    const product = body.product || (await productFromJob(jobId as string | number));
    const result = await importScrapedProduct({
      categoryId,
      product,
    });

    if (jobId) {
      const payload = await getPayloadClient();
      await payload.update({
        collection: "scraper-jobs",
        data: {
          productCreated: result.productId,
          reviewStatus: result.duplicate ? "needs_human_input" : "ready_to_review",
        },
        id: jobId,
        overrideAccess: true,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chua import duoc san pham.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
