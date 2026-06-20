import type { Payload } from "payload";
import { relationID } from "@/lib/catalog-schema";

export type CatalogRecord = Record<string, unknown> & {
  id?: string | number;
};

export type CanonicalCommercialProjection = {
  compareAtPrice?: string;
  currency?: string;
  price?: string;
  priceValue?: number;
  promotionPriceValue?: number;
  quantity?: number;
  sku?: string;
  stockStatus?: string;
  vatIncluded?: boolean;
  warranty?: string;
};

function formatMoney(value: number, currency = "VND") {
  if (currency === "VND") return `${Math.round(value).toLocaleString("vi-VN")}đ`;
  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(value);
}

function dateIsActive(value: unknown, mode: "from" | "to") {
  if (typeof value !== "string" || !value) return true;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return true;
  return mode === "from" ? timestamp <= Date.now() : timestamp >= Date.now();
}

function choosePrimaryVariant(variants: CatalogRecord[]) {
  return (
    variants.find((variant) => variant.isPrimary === true && variant.status === "active") ||
    variants.find((variant) => variant.status === "active") ||
    variants.find((variant) => variant.isPrimary === true) ||
    variants[0]
  );
}

function chooseCurrentOffer(offers: CatalogRecord[]) {
  return (
    offers.find(
      (offer) =>
        (offer.saleStatus === "active" || offer.saleStatus === "contact") &&
        dateIsActive(offer.validFrom, "from") &&
        dateIsActive(offer.validTo, "to"),
    ) || offers[0]
  );
}

function inventoryProjection(rows: CatalogRecord[]) {
  const quantity = rows.reduce(
    (sum, row) =>
      sum +
      (typeof row.quantity === "number" && Number.isFinite(row.quantity)
        ? row.quantity
        : 0),
    0,
  );
  if (quantity > 0) return { quantity, stockStatus: "in_stock" };
  if (rows.some((row) => row.stockStatus === "preorder")) {
    return { quantity, stockStatus: "preorder" };
  }
  if (rows.some((row) => row.stockStatus === "out_of_stock")) {
    return { quantity, stockStatus: "out_of_stock" };
  }
  return { quantity, stockStatus: "unknown" };
}

export async function loadCanonicalCommercialProjections(
  payload: Payload,
  productIDs: Array<string | number>,
) {
  const result = new Map<string, CanonicalCommercialProjection>();
  if (!productIDs.length) return result;

  const variantsResult = await payload.find({
    collection: "product-variants" as never,
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    select: {
      id: true,
      isPrimary: true,
      product: true,
      sku: true,
      status: true,
      warranty: true,
    },
    where: {
      product: {
        in: productIDs,
      },
    },
  });
  const variants = variantsResult.docs as CatalogRecord[];
  const variantIDs = variants
    .map((variant) => relationID(variant.id))
    .filter((id): id is string | number => id !== undefined);

  const [offersResult, inventoryResult] = variantIDs.length
    ? await Promise.all([
        payload.find({
          collection: "product-offers" as never,
          depth: 0,
          limit: 5000,
          overrideAccess: true,
          select: {
            currency: true,
            price: true,
            promotionPrice: true,
            saleStatus: true,
            validFrom: true,
            validTo: true,
            variant: true,
            vatIncluded: true,
          },
          where: { variant: { in: variantIDs } },
        }),
        payload.find({
          collection: "product-inventory" as never,
          depth: 0,
          limit: 5000,
          overrideAccess: true,
          select: {
            quantity: true,
            stockStatus: true,
            variant: true,
          },
          where: { variant: { in: variantIDs } },
        }),
      ])
    : [{ docs: [] }, { docs: [] }];

  const offers = offersResult.docs as CatalogRecord[];
  const inventory = inventoryResult.docs as CatalogRecord[];

  for (const productID of productIDs) {
    const productVariants = variants.filter(
      (variant) => relationID(variant.product) === productID,
    );
    const variant = choosePrimaryVariant(productVariants);
    if (!variant) continue;

    const variantID = relationID(variant.id);
    const offer = chooseCurrentOffer(
      offers.filter((item) => relationID(item.variant) === variantID),
    );
    const inventoryState = inventoryProjection(
      inventory.filter((item) => relationID(item.variant) === variantID),
    );

    const regularPrice =
      typeof offer?.price === "number" && Number.isFinite(offer.price) && offer.price > 0
        ? offer.price
        : undefined;
    const promotionPrice =
      typeof offer?.promotionPrice === "number" &&
      Number.isFinite(offer.promotionPrice) &&
      offer.promotionPrice > 0
        ? offer.promotionPrice
        : undefined;
    const currency =
      typeof offer?.currency === "string" ? offer.currency : "VND";
    const effectivePrice = promotionPrice ?? regularPrice;

    result.set(String(productID), {
      compareAtPrice:
        promotionPrice !== undefined && regularPrice !== undefined
          ? formatMoney(regularPrice, currency)
          : undefined,
      currency,
      price:
        effectivePrice !== undefined
          ? formatMoney(effectivePrice, currency)
          : offer?.saleStatus === "contact"
            ? "Liên hệ"
            : undefined,
      priceValue: effectivePrice,
      promotionPriceValue: promotionPrice,
      quantity: inventoryState.quantity,
      sku: typeof variant.sku === "string" ? variant.sku : undefined,
      stockStatus: inventoryState.stockStatus,
      vatIncluded:
        typeof offer?.vatIncluded === "boolean" ? offer.vatIncluded : undefined,
      warranty:
        typeof variant.warranty === "string" ? variant.warranty : undefined,
    });
  }

  return result;
}

function attributeDisplayValue(row: CatalogRecord) {
  const unitLabels: Record<string, string> = {
    cpm: "cpm",
    dpi: "dpi",
    gb: "GB",
    ipm: "ipm",
    kg: "kg",
    mb: "MB",
    mm: "mm",
    pages_per_day: "trang/ngày",
    pages_per_month: "trang/tháng",
    percent: "%",
    ppm: "ppm",
    sheets: "tờ",
    v: "V",
    w: "W",
  };
  const type = row.dataType;
  if (type === "number" && typeof row.numberValue === "number") {
    const unit =
      typeof row.unit === "string" && row.unit !== "none"
        ? unitLabels[row.unit] || row.unit
        : "";
    return `${row.numberValue}${unit ? ` ${unit}` : ""}`;
  }
  if (type === "boolean" && typeof row.booleanValue === "boolean") {
    return row.booleanValue ? "Có" : "Không";
  }
  if (type === "enum" && typeof row.enumValue === "string") return row.enumValue;
  if (type === "enum_list" && Array.isArray(row.enumListValue)) {
    return row.enumListValue
      .map((item) =>
        item && typeof item === "object" && "value" in item
          ? String(item.value)
          : "",
      )
      .filter(Boolean)
      .join(", ");
  }
  return typeof row.textValue === "string" ? row.textValue : "";
}

export function canonicalAttributeSpecs(product: CatalogRecord) {
  if (!Array.isArray(product.attributes)) return [];
  return product.attributes
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as CatalogRecord;
      const definition =
        row.definition && typeof row.definition === "object"
          ? (row.definition as CatalogRecord)
          : undefined;
      const label =
        typeof definition?.label === "string"
          ? definition.label
          : typeof definition?.code === "string"
            ? definition.code
            : "";
      const value = attributeDisplayValue(row);
      return label && value ? { label, value } : null;
    })
    .filter((item): item is { label: string; value: string } => Boolean(item));
}
