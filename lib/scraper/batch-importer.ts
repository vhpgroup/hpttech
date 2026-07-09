import { importCanonicalProductsRows } from "@/lib/canonical-product-import-export";
import { relationID } from "@/lib/catalog-schema";
import { getPayloadClient } from "@/lib/payload";
import {
  buildCanonicalImportRow,
  cleanWarrantyValue,
  inferScrapedProductTypeCode,
  warrantyFromSpecs,
} from "./canonical-row";
import {
  lexicalFromArticleBlocks,
  parseArticleBlocks,
} from "./lexical-from-html";
import { importArticleImages, importScrapedImagesWithReport } from "./media";
import {
  PC_FAMILY_TYPE_CODES,
  PC_SERVER_TYPE_CODES,
  SERVER_FAMILY_TYPE_CODES,
} from "./pc-server-taxonomy";
import { evaluatePublicationGate } from "./publication-gate";
import { generateSeo } from "./seo-generator";
import { normalizeScrapedSpecs } from "./spec-normalizer";
import {
  buildProductSeoArticleHTML,
  buildProductSeoArticleHTMLWithOptions,
  summaryHTML,
  updateProductSeoHTML,
} from "./seo-article";
import {
  blockTextFromHTML,
  cleanText,
  lexicalParagraphs,
  productShortDescription,
  productSellingPoints,
} from "./text";
import type { ExcelRow, ScrapedProduct } from "./types";

type PayloadWrite = {
  create(options: {
    collection: string;
    data: Record<string, unknown>;
    overrideAccess?: boolean;
  }): Promise<unknown>;
  update(options: {
    collection: string;
    data: Record<string, unknown>;
    id: string | number;
    overrideAccess?: boolean;
  }): Promise<unknown>;
};

function numericRelationID(value: unknown) {
  const id = relationID(value);
  const numeric =
    typeof id === "number"
      ? id
      : typeof id === "string" && /^\d+$/.test(id)
        ? Number(id)
        : undefined;
  return Number.isFinite(numeric) ? numeric : undefined;
}

function randomRating() {
  const values = [4, 4.5, 5];
  return values[Math.floor(Math.random() * values.length)];
}

function randomViewCount() {
  return Math.floor(Math.random() * 151) + 50;
}

function vndPriceNumber(value?: string) {
  if (!value) return undefined;
  const text = value.trim();
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/lien he|call|contact/.test(normalized)) return undefined;
  const million = normalized.match(/(\d+(?:[,.]\d+)?)\s*(trieu|tr)\b/);
  if (million) {
    const amount = Number(million[1].replace(",", "."));
    return Number.isFinite(amount) ? Math.round(amount * 1_000_000) : undefined;
  }
  const decimalNumber = text.match(/^\s*(\d{6,})(?:[.,]\d{1,2})?\s*(?:vnd|vnđ|đ)?\s*$/i);
  if (decimalNumber) return Number(decimalNumber[1]);
  const digits = text.replace(/[^\d]/g, "");
  const parsed = digits ? Number(digits) : undefined;
  return parsed && parsed >= 100_000 ? parsed : undefined;
}

function formatVnd(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

function normalizeScannerPrice(value: number) {
  let normalized = value;
  while (normalized >= 100_000_000) normalized = Math.round(normalized / 10);
  return normalized;
}

function scraperPriceTarget() {
  return process.env.SCRAPER_PRICE_TARGET === "compareAtPrice"
    ? "compareAtPrice"
    : "price";
}

function sourceSpecValue(product: ScrapedProduct, labelPattern: RegExp) {
  return product.data.specs.find((spec) => labelPattern.test(spec.label))?.value || "";
}

function shouldPublishSourceDescriptionHTML(productTypeCode: string) {
  // Mô tả lấy từ trang nguồn An Phát (trừ laptop — theo quyết định người dùng
  // 2026-07-09: giữ nội dung mô tả An Phát; lỗi trước đó là mất định dạng do
  // cleanText — họ PC/Server đã chuyển sang blockTextFromHTML giữ đoạn văn).
  return productTypeCode !== "laptop";
}

async function upsertAIMetadata(
  productId: string | number,
  product: ScrapedProduct,
  sellingPoints: string[],
) {
  const payload = await getPayloadClient();
  const productRelationId = numericRelationID(productId);
  if (productRelationId === undefined) {
    throw new Error(`Product ID khong hop le de tao AI metadata: ${String(productId)}`);
  }
  const existing = await payload.find({
    collection: "product-ai-metadata",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { product: { equals: productRelationId } },
  });
  const data = {
    advantages: sellingPoints.slice(0, 10).map((value) => ({ value })),
    aiGenerated: true,
    keywords: [
      product.data.title,
      product.source.brand,
      ...product.data.specs.slice(0, 6).map((spec) => spec.label),
    ]
      .filter(Boolean)
      .map((value) => ({ value })),
    note: `Nguồn: ${product.source.url}. Confidence: ${product.confidence}.`,
    product: productRelationId,
    useCases: [],
    verified: false,
  };
  if (existing.docs[0]?.id !== undefined) {
    await payload.update({
      collection: "product-ai-metadata",
      data,
      id: existing.docs[0].id,
      overrideAccess: true,
    });
    return;
  }
  await payload.create({
    collection: "product-ai-metadata",
    data,
    overrideAccess: true,
  });
}

export async function importBatchProduct(
  input: ExcelRow,
  product: ScrapedProduct,
  productTypeCode: string,
  options: { bypassPublicationGate?: boolean; publish?: boolean } = {},
) {
  const effectiveProductTypeCode = inferScrapedProductTypeCode(
    input.name,
    productTypeCode,
  );
  const row = buildCanonicalImportRow(input, product, effectiveProductTypeCode, options);
  const normalizedSpecs = normalizeScrapedSpecs(
    product.data.specs,
    effectiveProductTypeCode,
  );
  const displayProduct: ScrapedProduct = {
    ...product,
    data: {
      ...product.data,
      specs: normalizedSpecs.specs,
      title: input.name,
    },
    seo: generateSeo(
      {
        ...product.data,
        specs: normalizedSpecs.specs,
        title: input.name,
      },
      product.source.brand,
    ),
  };
  const payload = await getPayloadClient();
  const productTypes = await payload.find({
    collection: "product-types",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { code: { equals: effectiveProductTypeCode } },
  });
  const productTypeId = productTypes.docs[0]?.id;
  if (productTypeId !== undefined) {
    const definitions = await payload.find({
      collection: "attribute-definitions",
      depth: 0,
      limit: 500,
      overrideAccess: true,
      where: {
        and: [
          { productType: { equals: productTypeId } },
          { status: { equals: "active" } },
        ],
      },
    });
    const availableCodes = new Set(definitions.docs.map((definition) => definition.code));
    const attributes = normalizedSpecs.attributes.filter((attribute) =>
      availableCodes.has(attribute.code),
    );
    row.attributesJSON = JSON.stringify(attributes);
  }
  const result = await importCanonicalProductsRows([row]);
  if (result.errors.length) {
    throw new Error(result.errors[0].message);
  }

  const variantResult = await payload.find({
    collection: "product-variants",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { sku: { equals: row.sku } },
  });
  const productId = relationID(variantResult.docs[0]?.product);
  const productRelationId = numericRelationID(productId);
  if (productId === undefined) {
    throw new Error("Da import canonical row nhung khong tim thay Product.");
  }

  const sourceUrls = product.source.urls || [product.source.url];
  const manualSpecs = normalizedSpecs.specs;
  const sourceDescriptionHTML = shouldPublishSourceDescriptionHTML(effectiveProductTypeCode)
    ? product.data.descriptionHTML?.trim()
    : "";
  const summaryText = productShortDescription(displayProduct.data.title, displayProduct.data.specs);
  const sellingPointLimit = effectiveProductTypeCode === "laptop" ? 20 : 10;
  const sellingPoints =
    effectiveProductTypeCode === "software"
      ? (product.data.sellingPoints?.length
          ? product.data.sellingPoints
          : normalizedSpecs.specs.map(
              (spec) => `${spec.label.replace(/[:：]\s*$/, "")}: ${spec.value}`,
            )
        )
          .filter((text) => text.length >= 5 && text.length <= 700)
          .slice(0, sellingPointLimit)
      : (product.data.sellingPoints?.length
          ? product.data.sellingPoints
          : productSellingPoints(product.data.description, normalizedSpecs.specs)
        )
          .filter((text) => text.length >= 5 && text.length <= 700)
          .slice(0, sellingPointLimit);
  // Dùng chung logic chống CTA/hotline với canonical-row — field này ghi vào
  // product.warranty (fallback hiển thị khi variant.warranty trống).
  const warranty =
    cleanWarrantyValue(product.data.warranty) || warrantyFromSpecs(product);
  const priceValue = vndPriceNumber(product.data.price);
  const compareAtPriceValue = vndPriceNumber(product.data.compareAtPrice);
  const rating = randomRating();
  const viewCount = randomViewCount();
  const existing = await payload.findByID({
    collection: "products",
    depth: 1,
    id: productId,
    overrideAccess: true,
  });
  const existingImages = Array.isArray(existing.images)
    ? existing.images.flatMap((image) => {
        const imageId = relationID(image);
        if (imageId === undefined) return [];
        const url =
          image && typeof image === "object" && "url" in image && typeof image.url === "string"
            ? image.url
            : "";
        return [{ id: imageId, url }];
      })
    : [];
  const imageReport = await importScrapedImagesWithReport(displayProduct);
  const articleImages = imageReport.images.length
    ? imageReport.images
    : existingImages;
  const imageWarning = imageReport.warnings.join(" | ");
  const descriptionHTML =
    sourceDescriptionHTML ||
    (effectiveProductTypeCode === "laptop"
      ? buildProductSeoArticleHTMLWithOptions(displayProduct, articleImages, {
          compact: true,
          includeMainImage: true,
        })
      : buildProductSeoArticleHTML(displayProduct, articleImages));
  const descriptionText =
    effectiveProductTypeCode === "laptop"
      ? sourceDescriptionHTML
        ? cleanText(sourceDescriptionHTML)
        : summaryText
      : sourceDescriptionHTML
        ? PC_SERVER_TYPE_CODES.has(effectiveProductTypeCode)
          // Họ PC/Server: giữ ranh giới đoạn văn của bài mô tả An Phát —
          // cleanText nghiền hết \n làm lexicalParagraphs chỉ tạo được 1 khối.
          ? blockTextFromHTML(sourceDescriptionHTML)
          : cleanText(sourceDescriptionHTML)
        : product.generated.description || product.data.description || "";
  // Họ PC/Server — quyết định người dùng 2026-07-09: TẠM THỜI BỎ phần mô tả
  // sản phẩm khi crawl (để trống, biên tập sau). Chế độ mô tả rich (heading/
  // list/ảnh từ bài An Phát, dựng bằng lexical-from-html) vẫn sẵn sàng — bật
  // lại bằng env SCRAPER_PC_DESCRIPTION=rich, không cần sửa code.
  let descriptionLexical: unknown = lexicalParagraphs(descriptionText);
  if (PC_SERVER_TYPE_CODES.has(effectiveProductTypeCode)) {
    if (
      process.env.SCRAPER_PC_DESCRIPTION === "rich" &&
      sourceDescriptionHTML
    ) {
      try {
        const articleBlocks = parseArticleBlocks(
          sourceDescriptionHTML,
          product.source.url,
        );
        const articleImageBlocks = articleBlocks.filter(
          (block): block is Extract<typeof block, { kind: "image" }> =>
            block.kind === "image",
        );
        const articleImageReport = await importArticleImages(
          displayProduct,
          articleImageBlocks.map((block) => ({ alt: block.alt, url: block.src })),
        );
        const richLexical = lexicalFromArticleBlocks(
          articleBlocks,
          articleImageReport.idBySrc,
        );
        if (richLexical) descriptionLexical = richLexical;
      } catch {
        // Bất kỳ lỗi nào -> giữ fallback lexicalParagraphs, không chặn import.
      }
    } else {
      descriptionLexical = lexicalParagraphs("");
    }
  }

  const publicationGate = evaluatePublicationGate({
    articleHTML: descriptionHTML,
    imageCount: articleImages.length,
    imageWarning,
    product: displayProduct,
  });
  const gateAllowsPublish =
    publicationGate.allowed || Boolean(options.bypassPublicationGate);
  const publish = Boolean(options.publish && gateAllowsPublish);
  const seoSummaryHTML = summaryHTML(summaryText);
  const typedSpecs =
    effectiveProductTypeCode === "scanner"
      ? { scannerSpecs: normalizedSpecs.scannerSpecs }
      : effectiveProductTypeCode === "printer"
        ? { printerSpecs: normalizedSpecs.printerSpecs }
      : effectiveProductTypeCode === "photocopier"
        ? { photocopierSpecs: normalizedSpecs.photocopierSpecs }
        : effectiveProductTypeCode === "laptop"
          ? { laptopSpecs: normalizedSpecs.laptopSpecs }
          : PC_FAMILY_TYPE_CODES.has(effectiveProductTypeCode)
            ? { desktopSpecs: normalizedSpecs.desktopSpecs }
            : SERVER_FAMILY_TYPE_CODES.has(effectiveProductTypeCode)
              ? { serverSpecs: normalizedSpecs.serverSpecs }
              : {};
  const writePayload = payload as unknown as PayloadWrite;
  const updated = await writePayload.update({
    collection: "products",
    data: {
      ...typedSpecs,
      compareAtPrice:
        effectiveProductTypeCode === "software" && compareAtPriceValue
          ? formatVnd(compareAtPriceValue)
          : scraperPriceTarget() === "compareAtPrice" && priceValue
            ? formatVnd(normalizeScannerPrice(priceValue))
            : compareAtPriceValue
              ? formatVnd(compareAtPriceValue)
              : product.data.compareAtPrice,
      description: descriptionLexical,
      ...(imageReport.images.length
        ? { images: imageReport.images.map((image) => image.id) }
        : {}),
      internalNote: [
        "Auto-filled by bulk scraper.",
        `Confidence: ${product.confidence}`,
        `Sources: ${sourceUrls.join(" | ")}`,
        imageReport.images.length
          ? `Images imported: ${imageReport.images.map((image) => image.url).join(" | ")}`
          : "",
        imageWarning,
        publicationGate.reasons.length
          ? `Publish gate: ${publicationGate.reasons.join(" | ")}`
          : "",
        product.warnings.length
          ? `Warnings: ${product.warnings.join(" | ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      seo: {
        canonical: product.seo.canonical,
        description: displayProduct.seo.description,
        imageAlt: displayProduct.seo.imageAlt,
        noIndex: !publish,
        title: displayProduct.seo.title,
      },
      warranty,
      source: {
        type: "scraper",
        url: product.source.url,
        verified: false,
      },
      rating,
      promoText: product.data.promoText,
      sellingPoints: sellingPoints.map((text) => ({ text })),
      shortDescription: summaryText,
      specProfile: effectiveProductTypeCode,
      specs: manualSpecs,
      status: publish ? "published" : "draft",
      _status: publish ? "published" : "draft",
      summary: lexicalParagraphs(summaryText),
      viewCount,
    } as unknown as Record<string, unknown>,
    id: productId,
    overrideAccess: true,
  });
  await updateProductSeoHTML(
    productId,
    seoSummaryHTML,
    descriptionHTML,
    summaryText,
  );
  await upsertAIMetadata(productRelationId ?? productId, displayProduct, sellingPoints);

  return {
    created: result.created === 1,
    imageCount: articleImages.length,
    imageWarning,
    publishGateReasons: publicationGate.reasons,
    published: publish,
    productId,
    rating,
    specCount: manualSpecs.length,
    sellingPointCount: sellingPoints.length,
    slug:
      updated && typeof updated === "object" && "slug" in updated
        ? String(updated.slug || "")
        : "",
    sku: row.sku,
    viewCount,
    warranty,
  };
}
