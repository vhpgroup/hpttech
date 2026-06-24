import { loadEnvConfig } from "@next/env";
import { relationID } from "@/lib/catalog-schema";
import {
  appendSpreadsheetValues,
  deleteSpreadsheetRows,
  ensureSpreadsheetSheet,
  formatSpreadsheetSheet,
  readSpreadsheetValues,
  writeSpreadsheetValues,
} from "@/lib/google-sheets";
import { getPayloadClient } from "@/lib/payload";

loadEnvConfig(process.cwd());

const DEFAULT_SHEET_TITLE =
  process.env.GOOGLE_PRICE_SHEET_TITLE || "Bang gia san pham";

type ProductDoc = Record<string, unknown> & { id?: string | number };
type VariantDoc = Record<string, unknown> & { id?: string | number };
type OfferDoc = Record<string, unknown> & { id?: string | number };

const SHEET_HEADERS = [
  "productId",
  "variantId",
  "offerId",
  "sku",
  "Ten san pham",
  "Danh muc",
  "Gia ban",
  "Gia niem yet",
  "Ma giam gia",
  "Trang thai ban",
  "Ghi chu",
] as const;

type ImportedRow = {
  compareAtPrice: string;
  discountBadge: string;
  offerId: string;
  price: string;
  productId: string;
  saleStatus: string;
  sku: string;
  title: string;
  variantId: string;
};

type ExportedRow = {
  compareAtPrice: string;
  discountBadge: string;
  offerId: string;
  price: string;
  productId: string;
  saleStatus: string;
  sku: string;
  title: string;
  values: string[];
  variantId: string;
};

type ExportDiff = {
  appended: number;
  deleted: number;
  ensuredHeader: boolean;
  exported: number;
  updated: number;
};

function sheetId() {
  const value = String(process.env.GOOGLE_PRICE_SHEET_ID || "").trim();
  if (!value) throw new Error("Missing GOOGLE_PRICE_SHEET_ID.");
  return value;
}

function integerArg(name: string) {
  const raw = process.argv
    .slice(3)
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`--${name} must be a non-negative integer.`);
  }
  return value;
}

function docText(doc: unknown, key: string) {
  return typeof doc === "object" && doc && key in doc
    ? String((doc as Record<string, unknown>)[key] || "")
    : "";
}

function formatVnd(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return "";
  return `${Math.round(value).toLocaleString("vi-VN")}d`;
}

function parsePriceInput(value: string) {
  const text = String(value || "").trim();
  if (!text) return { isContact: false, value: undefined };

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/\b(lien he|call|contact)\b/.test(normalized)) {
    return { isContact: true, value: undefined };
  }

  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return { isContact: false, value: undefined };
  const parsed = Number(digits);
  return Number.isFinite(parsed)
    ? { isContact: false, value: parsed }
    : { isContact: false, value: undefined };
}

function normalizeSaleStatus(value: string, isContact: boolean) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return isContact ? "contact" : "active";
  if (
    text === "active" ||
    text === "contact" ||
    text === "paused" ||
    text === "discontinued"
  ) {
    return text;
  }
  if (text.includes("lien he") || text.includes("contact")) return "contact";
  if (text.includes("pause") || text.includes("tam")) return "paused";
  if (text.includes("ngung") || text.includes("discontinued")) {
    return "discontinued";
  }
  return isContact ? "contact" : "active";
}

function choosePrimaryVariant(variants: VariantDoc[]) {
  return (
    variants.find(
      (variant) => variant.isPrimary === true && variant.status === "active",
    ) ||
    variants.find((variant) => variant.status === "active") ||
    variants.find((variant) => variant.isPrimary === true) ||
    variants[0]
  );
}

function chooseCurrentOffer(offers: OfferDoc[]) {
  return (
    offers.find(
      (offer) =>
        offer.saleStatus === "active" || offer.saleStatus === "contact",
    ) || offers[0]
  );
}

async function loadPriceContext() {
  const payload = await getPayloadClient();
  const productsResult = await payload.find({
    collection: "products",
    depth: 1,
    limit: 5000,
    overrideAccess: true,
    sort: "title",
  });
  const products = productsResult.docs as ProductDoc[];
  const productIds = products
    .map((product) => relationID(product.id))
    .filter((id): id is string | number => id !== undefined);

  const variantsResult = await payload.find({
    collection: "product-variants",
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    where: {
      product: {
        in: productIds,
      },
    },
  });
  const variants = variantsResult.docs as VariantDoc[];
  const variantIds = variants
    .map((variant) => relationID(variant.id))
    .filter((id): id is string | number => id !== undefined);

  const offersResult = variantIds.length
    ? await payload.find({
        collection: "product-offers",
        depth: 0,
        limit: 5000,
        overrideAccess: true,
        where: {
          variant: {
            in: variantIds,
          },
        },
      })
    : { docs: [] };
  const offers = offersResult.docs as OfferDoc[];

  return { offers, payload, products, variants };
}

function offerDisplayValues(offer: OfferDoc | undefined, product: ProductDoc) {
  const regularPrice =
    typeof offer?.price === "number" &&
    Number.isFinite(offer.price) &&
    offer.price > 0
      ? offer.price
      : undefined;
  const promotionPrice =
    typeof offer?.promotionPrice === "number" &&
    Number.isFinite(offer.promotionPrice) &&
    offer.promotionPrice > 0
      ? offer.promotionPrice
      : undefined;
  const displayPrice = promotionPrice ?? regularPrice;
  const compareAtPrice =
    promotionPrice !== undefined && regularPrice !== undefined
      ? regularPrice
      : undefined;
  const saleStatus =
    typeof offer?.saleStatus === "string" ? String(offer.saleStatus) : "active";

  return {
    compareAtPrice:
      compareAtPrice !== undefined
        ? String(compareAtPrice)
        : docText(product, "compareAtPrice"),
    price:
      displayPrice !== undefined ? String(displayPrice) : docText(product, "price"),
    saleStatus,
  };
}

function buildExportRow(
  product: ProductDoc,
  variants: VariantDoc[],
  offers: OfferDoc[],
) {
  const productId = relationID(product.id);
  if (productId === undefined) return undefined;

  const productVariants = variants.filter(
    (variant) => relationID(variant.product) === productId,
  );
  const variant = choosePrimaryVariant(productVariants);
  const variantId = relationID(variant?.id);
  const offer = chooseCurrentOffer(
    offers.filter((item) => relationID(item.variant) === variantId),
  );
  const displayValues = offerDisplayValues(offer, product);

  const values = [
    String(productId),
    variantId === undefined ? "" : String(variantId),
    relationID(offer?.id) === undefined ? "" : String(relationID(offer?.id)),
    docText(variant, "sku") || docText(product, "sku"),
    docText(product, "title") || docText(product, "name"),
    docText(product.category, "name"),
    displayValues.price,
    displayValues.compareAtPrice,
    docText(product, "discountBadge"),
    displayValues.saleStatus || "active",
    "",
  ];

  return {
    compareAtPrice: values[7],
    discountBadge: values[8],
    offerId: values[2],
    price: values[6],
    productId: values[0],
    saleStatus: values[9],
    sku: values[3],
    title: values[4],
    values,
    variantId: values[1],
  } satisfies ExportedRow;
}

function exportedRowsFromProducts(
  products: ProductDoc[],
  variants: VariantDoc[],
  offers: OfferDoc[],
) {
  return products
    .map((product) => buildExportRow(product, variants, offers))
    .filter((row): row is ExportedRow => Boolean(row));
}

function rowsFromSheet(values: string[][]) {
  if (values.length < 2) return [];
  const [header, ...body] = values;
  const index = new Map(header.map((name, idx) => [String(name).trim(), idx]));

  return body
    .filter((row) => row.some((cell) => String(cell || "").trim()))
    .map(
      (row): ImportedRow => ({
        compareAtPrice: row[index.get("Gia niem yet") || 0] || "",
        discountBadge: row[index.get("Ma giam gia") || 0] || "",
        offerId: row[index.get("offerId") || 0] || "",
        price: row[index.get("Gia ban") || 0] || "",
        productId: row[index.get("productId") || 0] || "",
        saleStatus: row[index.get("Trang thai ban") || 0] || "",
        sku: row[index.get("sku") || 0] || "",
        title: row[index.get("Ten san pham") || 0] || "",
        variantId: row[index.get("variantId") || 0] || "",
      }),
    );
}

function normalizeComparableValue(value: string) {
  return String(value || "").trim();
}

function exportedRowChanged(existing: ImportedRow, next: ExportedRow) {
  return (
    normalizeComparableValue(existing.variantId) !==
      normalizeComparableValue(next.variantId) ||
    normalizeComparableValue(existing.offerId) !==
      normalizeComparableValue(next.offerId) ||
    normalizeComparableValue(existing.sku) !== normalizeComparableValue(next.sku) ||
    normalizeComparableValue(existing.title) !==
      normalizeComparableValue(next.title) ||
    normalizeComparableValue(existing.price) !==
      normalizeComparableValue(next.price) ||
    normalizeComparableValue(existing.compareAtPrice) !==
      normalizeComparableValue(next.compareAtPrice) ||
    normalizeComparableValue(existing.discountBadge) !==
      normalizeComparableValue(next.discountBadge) ||
    normalizeComparableValue(existing.saleStatus) !==
      normalizeComparableValue(next.saleStatus)
  );
}

function productKey(row: Pick<ImportedRow, "productId" | "sku">) {
  const productId = String(row.productId || "").trim();
  if (productId) return `product:${productId}`;
  const sku = String(row.sku || "").trim().toLowerCase();
  return sku ? `sku:${sku}` : "";
}

function rowNumberToA1(rowNumber: number) {
  return `${rowNumber}:${rowNumber}`;
}

async function exportToSheet() {
  const spreadsheetId = sheetId();
  const limit = integerArg("limit");
  const { offers, products, variants } = await loadPriceContext();
  const selectedProducts =
    limit === undefined ? products : products.slice(0, limit);
  const exportedRows = exportedRowsFromProducts(selectedProducts, variants, offers);
  const googleSheetId = await ensureSpreadsheetSheet(
    spreadsheetId,
    DEFAULT_SHEET_TITLE,
  );
  const currentValues = await readSpreadsheetValues(spreadsheetId, DEFAULT_SHEET_TITLE);
  const currentRows = rowsFromSheet(currentValues);
  const currentKeys = new Map<string, { row: ImportedRow; rowNumber: number }>();

  currentRows.forEach((row, index) => {
    const key = productKey(row);
    if (!key) return;
    currentKeys.set(key, {
      row,
      rowNumber: index + 2,
    });
  });

  let ensuredHeader = false;
  const updates: Array<{ range: string; values: string[][] }> = [];
  const appends: string[][] = [];
  const seenKeys = new Set<string>();
  let updated = 0;

  for (const row of exportedRows) {
    const key = productKey(row);
    if (!key) continue;
    seenKeys.add(key);
    const existing = currentKeys.get(key);

    if (!existing) {
      appends.push(row.values);
      continue;
    }

    if (!exportedRowChanged(existing.row, row)) continue;
    updates.push({
      range: `${DEFAULT_SHEET_TITLE}!${rowNumberToA1(existing.rowNumber)}`,
      values: [row.values],
    });
    updated += 1;
  }

  const rowIndexesToDelete =
    limit === undefined
      ? [...currentKeys.entries()]
          .filter(([key]) => !seenKeys.has(key))
          .map(([, value]) => value.rowNumber - 1)
      : [];

  if (
    currentValues.length === 0 ||
    currentValues[0].join("||") !== Array.from(SHEET_HEADERS).join("||")
  ) {
    ensuredHeader = true;
    updates.unshift({
      range: `${DEFAULT_SHEET_TITLE}!1:1`,
      values: [Array.from(SHEET_HEADERS)],
    });
  }

  await writeSpreadsheetValues(spreadsheetId, updates);
  await appendSpreadsheetValues(spreadsheetId, DEFAULT_SHEET_TITLE, appends);
  await deleteSpreadsheetRows(spreadsheetId, googleSheetId, rowIndexesToDelete);
  await formatSpreadsheetSheet(
    spreadsheetId,
    googleSheetId,
    SHEET_HEADERS.length,
  );

  const diff: ExportDiff = {
    appended: appends.length,
    deleted: rowIndexesToDelete.length,
    ensuredHeader,
    exported: exportedRows.length,
    updated,
  };

  console.log(
    JSON.stringify(
      {
        ...diff,
        limit: limit ?? null,
        sheetId: spreadsheetId,
        sheetTitle: DEFAULT_SHEET_TITLE,
      },
      null,
      2,
    ),
  );
}

function sameNumber(left: number | undefined, right: number | undefined) {
  return left === right;
}

function sameText(left: string, right: string) {
  return normalizeComparableValue(left) === normalizeComparableValue(right);
}

function normalizePriceText(value: string) {
  const text = String(value || "").trim();
  if (!text) return "";

  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  if (/\b(lien he|call|contact)\b/.test(normalized)) return "contact";

  const digits = text.replace(/[^\d]/g, "");
  return digits || text;
}

async function importFromSheet() {
  const spreadsheetId = sheetId();
  const values = await readSpreadsheetValues(spreadsheetId, DEFAULT_SHEET_TITLE);
  const rows = rowsFromSheet(values);
  const { offers, payload, products, variants } = await loadPriceContext();
  const productsById = new Map(
    products
      .map((product) => [String(relationID(product.id) || ""), product] as const)
      .filter(([id]) => Boolean(id)),
  );
  const productsBySku = new Map(
    products
      .map((product) => [docText(product, "sku"), product] as const)
      .filter(([sku]) => Boolean(sku)),
  );

  let skipped = 0;
  let updated = 0;

  for (const row of rows) {
    const price = parsePriceInput(row.price);
    const listPrice = parsePriceInput(row.compareAtPrice);
    const saleStatus = normalizeSaleStatus(
      row.saleStatus,
      price.isContact || listPrice.isContact,
    );
    const product =
      productsById.get(String(row.productId).trim()) ||
      productsBySku.get(String(row.sku).trim());

    if (!product?.id) {
      skipped += 1;
      continue;
    }

    const productId = relationID(product.id);
    const variant = choosePrimaryVariant(
      variants.filter((item) => relationID(item.product) === productId),
    );
    const existingOffer =
      offers.find(
        (offer) => String(relationID(offer.id) || "") === String(row.offerId),
      ) ||
      chooseCurrentOffer(
        offers.filter(
          (offer) => relationID(offer.variant) === relationID(variant?.id),
        ),
      );

    let regularPrice = price.value;
    let promotionPrice: number | null = null;
    let compareAtText = "";

    if (
      saleStatus !== "contact" &&
      price.value !== undefined &&
      listPrice.value !== undefined &&
      listPrice.value > price.value
    ) {
      regularPrice = listPrice.value;
      promotionPrice = price.value;
      compareAtText = formatVnd(listPrice.value);
    } else if (saleStatus !== "contact" && price.value !== undefined) {
      regularPrice = price.value;
    }

    const productPriceText =
      saleStatus === "contact"
        ? "Lien he"
        : promotionPrice !== null
          ? formatVnd(promotionPrice)
          : formatVnd(price.value);

    const currentOfferValues = offerDisplayValues(existingOffer, product);
    const productNeedsUpdate =
      !sameText(docText(product, "discountBadge"), row.discountBadge.trim()) ||
      normalizePriceText(docText(product, "compareAtPrice")) !==
        normalizePriceText(compareAtText) ||
      normalizePriceText(docText(product, "price")) !==
        normalizePriceText(productPriceText);
    const offerNeedsUpdate =
      Boolean(variant?.id) &&
      (!sameText(currentOfferValues.saleStatus, saleStatus) ||
        !sameNumber(
          typeof existingOffer?.price === "number" ? existingOffer.price : undefined,
          saleStatus === "contact" ? 0 : regularPrice || 0,
        ) ||
        !sameNumber(
          typeof existingOffer?.promotionPrice === "number"
            ? existingOffer.promotionPrice
            : undefined,
          promotionPrice === null ? undefined : promotionPrice,
        ));

    if (!productNeedsUpdate && !offerNeedsUpdate) {
      skipped += 1;
      continue;
    }

    if (productNeedsUpdate) {
      await payload.update({
        collection: "products",
        data: {
          compareAtPrice: compareAtText,
          discountBadge: row.discountBadge.trim(),
          price: productPriceText,
        },
        id: product.id as string | number,
        overrideAccess: true,
      });
    }

    if (variant?.id && offerNeedsUpdate) {
      const offerData: Record<string, unknown> = {
        currency: docText(existingOffer, "currency") || "VND",
        price: saleStatus === "contact" ? 0 : regularPrice || 0,
        promotionPrice: promotionPrice === null ? undefined : promotionPrice,
        saleStatus,
        variant: relationID(variant.id),
        vatIncluded:
          typeof existingOffer?.vatIncluded === "boolean"
            ? existingOffer.vatIncluded
            : true,
        vatRate:
          typeof existingOffer?.vatRate === "number" &&
          Number.isFinite(existingOffer.vatRate)
            ? existingOffer.vatRate
            : 10,
      };

      try {
        if (existingOffer?.id !== undefined) {
          await payload.update({
            collection: "product-offers",
            data: offerData,
            id: existingOffer.id as string | number,
            overrideAccess: true,
          });
        } else {
          await payload.create({
            collection: "product-offers",
            data: offerData,
            overrideAccess: true,
          });
        }
      } catch (error) {
        throw new Error(
          [
            `Offer sync failed for productId=${String(productId || "")}`,
            `sku=${row.sku}`,
            `title=${row.title}`,
            `price=${row.price}`,
            `compareAtPrice=${row.compareAtPrice}`,
            `saleStatus=${saleStatus}`,
            `regularPrice=${String(regularPrice ?? "")}`,
            `promotionPrice=${String(promotionPrice ?? "")}`,
            error instanceof Error ? error.message : String(error),
          ].join(" | "),
        );
      }
    }

    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        imported: rows.length,
        skipped,
        updated,
      },
      null,
      2,
    ),
  );
}

async function syncSheet() {
  await importFromSheet();
  await exportToSheet();
}

async function main() {
  const mode = process.argv[2];
  if (mode === "export") {
    await exportToSheet();
    return;
  }
  if (mode === "import") {
    await importFromSheet();
    return;
  }
  if (mode === "sync") {
    await syncSheet();
    return;
  }
  throw new Error("Usage: tsx scripts/sync-price-sheet.ts <export|import|sync>");
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  },
);
