import { importCanonicalProductsRows } from "@/lib/canonical-product-import-export";
import { relationID } from "@/lib/catalog-schema";
import { getPayloadClient } from "@/lib/payload";
import { SCANNER_SPEC_FIELDS } from "@/lib/scanner-specs";
import { buildCanonicalImportRow } from "./canonical-row";
import { importScrapedImages } from "./media";
import { normalizeScrapedSpecs } from "./spec-normalizer";
import { lexicalParagraphs } from "./text";
import type { ExcelRow, ScrapedProduct } from "./types";

function scannerSpecsForUpdate(productTypeCode: string, scannerSpecs: unknown) {
  if (productTypeCode !== "scanner") return scannerSpecs;
  return {
    ...Object.fromEntries(
      SCANNER_SPEC_FIELDS.map((field) => [field.key, null]),
    ),
    ...(scannerSpecs && typeof scannerSpecs === "object" ? scannerSpecs : {}),
  };
}

export async function importBatchProduct(
  input: ExcelRow,
  product: ScrapedProduct,
  productTypeCode: string,
) {
  const row = buildCanonicalImportRow(input, product, productTypeCode);
  const normalizedSpecs = normalizeScrapedSpecs(
    product.data.specs,
    productTypeCode,
  );
  const payload = await getPayloadClient();
  const productTypes = await payload.find({
    collection: "product-types",
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { code: { equals: productTypeCode } },
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
  if (productId === undefined) {
    throw new Error("Da import canonical row nhung khong tim thay Product.");
  }

  const sourceUrls = product.source.urls || [product.source.url];
  const manualSpecs = productTypeCode === "scanner" ? [] : normalizedSpecs.specs;
  let uploadedImages: Array<{ id: string | number; url: string }> = [];
  let imageWarning = "";
  try {
    uploadedImages = await importScrapedImages(product);
  } catch (error) {
    imageWarning = `Image import failed: ${error instanceof Error ? error.message : String(error)}`;
  }
  await payload.update({
    collection: "products",
    data: {
      description: lexicalParagraphs(product.generated.description),
      images: uploadedImages.map((image) => image.id),
      internalNote: [
        "Auto-filled by bulk scraper.",
        `Confidence: ${product.confidence}`,
        `Sources: ${sourceUrls.join(" | ")}`,
        uploadedImages.length
          ? `Images imported: ${uploadedImages.map((image) => image.url).join(" | ")}`
          : "",
        imageWarning,
        product.warnings.length
          ? `Warnings: ${product.warnings.join(" | ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
      seo: {
        canonical: product.seo.canonical,
        description: product.seo.description,
        noIndex: true,
        title: product.seo.title,
      },
      source: {
        type: "scraper",
        url: product.source.url,
        verified: false,
      },
      scannerSpecs: scannerSpecsForUpdate(
        productTypeCode,
        normalizedSpecs.scannerSpecs,
      ),
      specProfile: productTypeCode,
      specs: manualSpecs,
      status: "draft",
      _status: "draft",
      summary: lexicalParagraphs(product.generated.summary),
    },
    id: productId,
    overrideAccess: true,
  });

  return {
    created: result.created === 1,
    productId,
    sku: row.sku,
  };
}
