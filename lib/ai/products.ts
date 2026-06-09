import type { Payload, Where } from "payload";
import type { CatalogProduct } from "@/lib/catalog";
import {
  loadCanonicalCommercialProjections,
  type CanonicalCommercialProjection,
} from "@/lib/catalog-projection";
import {
  normalizeCatalogCode,
  relationID,
  type AttributeDataType,
} from "@/lib/catalog-schema";
import { getPayloadClient } from "@/lib/payload";

type CatalogRecord = Record<string, unknown> & {
  id?: string | number;
};

export type ProductAIPrimitive = string | number | boolean | string[];

export type ProductAISpec = {
  code: string;
  comparable: boolean;
  dataType: AttributeDataType;
  displayValue: string;
  filterable: boolean;
  label: string;
  rawValue?: string;
  required: boolean;
  searchable: boolean;
  unit?: string;
  value: ProductAIPrimitive;
};

export type ProductAIProfile = {
  advantages: string[];
  aiGenerated: boolean;
  brand?: string;
  brandSlug?: string;
  category?: string;
  categorySlug?: string;
  competitorModels: string[];
  currency?: string;
  descriptionText?: string;
  href?: string;
  id: string;
  image?: string;
  internalId?: string;
  keywords: string[];
  metadataVerified: boolean;
  model?: string;
  mpn?: string;
  name: string;
  price?: string;
  priceValue?: number;
  productType: string;
  productTypeName?: string;
  searchableText: string;
  sku?: string;
  slug?: string;
  sourceType?: string;
  sourceUrl?: string;
  sourceVerified: boolean;
  specs: ProductAISpec[];
  stockQuantity?: number;
  stockStatus: string;
  summary?: string;
  useCases: string[];
  vatIncluded?: boolean;
  warranty?: string;
};

export type ProductAIProfileMapperOptions = {
  commercial?: CanonicalCommercialProjection;
  metadata?: CatalogRecord | null;
};

export type ProductAIProfileQuery = {
  limit?: number;
  productIDs?: Array<string | number>;
  status?: "all" | "archived" | "draft" | "published";
};

const UNIT_LABELS: Record<string, string> = {
  cpm: "cpm",
  dpi: "dpi",
  gb: "GB",
  ipm: "ipm",
  kg: "kg",
  mb: "MB",
  mm: "mm",
  pages_per_day: "pages/day",
  pages_per_month: "pages/month",
  percent: "%",
  ppm: "ppm",
  sheets: "sheets",
  v: "V",
  w: "W",
};

type LegacySpecDefinition = readonly [
  field: string,
  code: string,
  label: string,
  dataType: "boolean" | "number" | "text",
  unit: string,
];

const LEGACY_SPEC_GROUPS: ReadonlyArray<{
  field: string;
  specs: ReadonlyArray<LegacySpecDefinition>;
}> = [
  {
    field: "scannerSpecs",
    specs: [
      ["scanSpeedSimplexPpm", "scanner_scan_speed_simplex", "Scan speed simplex", "number", "ppm"],
      ["scanSpeedDuplexIpm", "scanner_scan_speed_duplex", "Scan speed duplex", "number", "ipm"],
      ["adfCapacitySheets", "scanner_adf_capacity", "ADF capacity", "number", "sheets"],
      ["adfSheets", "scanner_adf_sheets", "ADF sheets", "number", "sheets"],
      ["maxPaperSize", "scanner_max_paper_size", "Max paper size", "text", "none"],
      ["dailyDuty", "scanner_daily_duty", "Daily duty", "number", "pages_per_day"],
      ["connectivity", "scanner_connectivity", "Connectivity", "text", "none"],
      ["scanResolution", "scanner_scan_resolution", "Scan resolution", "text", "none"],
      ["duplexScanText", "scanner_duplex", "Duplex scan", "text", "none"],
      ["ocrText", "scanner_ocr", "OCR", "text", "none"],
    ],
  },
  {
    field: "printerSpecs",
    specs: [
      ["printTechnology", "printer_technology", "Print technology", "text", "none"],
      ["printSpeedPpm", "printer_print_speed", "Print speed", "number", "ppm"],
      ["printSpeed", "printer_print_speed_text", "Print speed", "text", "none"],
      ["maxPaperSize", "printer_max_paper_size", "Max paper size", "text", "none"],
      ["connectivity", "printer_connectivity", "Connectivity", "text", "none"],
      ["monthlyDuty", "printer_monthly_duty", "Monthly duty", "number", "pages_per_month"],
      ["recommendedMonthlyVolume", "printer_recommended_monthly_volume", "Recommended monthly volume", "number", "pages_per_month"],
      ["autoDuplexPrintText", "printer_auto_duplex", "Auto duplex print", "text", "none"],
      ["colorPrintText", "printer_color", "Color print", "text", "none"],
    ],
  },
  {
    field: "photocopierSpecs",
    specs: [
      ["copySpeedCpm", "photocopier_copy_speed", "Copy speed", "number", "cpm"],
      ["copySpeed", "photocopier_copy_speed_text", "Copy speed", "text", "none"],
      ["scanSpeedPpm", "photocopier_scan_speed", "Scan speed", "number", "ppm"],
      ["maxPaperSize", "photocopier_max_paper_size", "Max paper size", "text", "none"],
      ["connectivity", "photocopier_connectivity", "Connectivity", "text", "none"],
      ["monthlyDuty", "photocopier_monthly_duty", "Monthly duty", "text", "none"],
      ["adfCapacity", "photocopier_adf_capacity", "ADF capacity", "text", "none"],
      ["autoDuplexPrintText", "photocopier_auto_duplex", "Auto duplex", "text", "none"],
      ["colorPrintText", "photocopier_color", "Color", "text", "none"],
    ],
  },
] as const;

function recordValue(value: unknown): CatalogRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as CatalogRecord)
    : undefined;
}

function textField(doc: CatalogRecord | undefined, key: string) {
  const value = doc?.[key];
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function numberField(doc: CatalogRecord | undefined, key: string) {
  const value = doc?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanField(doc: CatalogRecord | undefined, key: string) {
  return typeof doc?.[key] === "boolean" ? doc[key] === true : undefined;
}

function relationText(value: unknown, key: string) {
  const doc = recordValue(value);
  return textField(doc, key);
}

function stripHTML(value?: string) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      return textField(recordValue(item), "value") || "";
    })
    .filter(Boolean);
}

function mediaURL(value: unknown) {
  if (Array.isArray(value)) return mediaURL(value[0]);
  return textField(recordValue(value), "url");
}

function enumListValue(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      return textField(recordValue(item), "value") || "";
    })
    .filter(Boolean);
}

function typedValue(row: CatalogRecord, dataType: AttributeDataType): ProductAIPrimitive | undefined {
  if (dataType === "number") return numberField(row, "numberValue");
  if (dataType === "boolean") return booleanField(row, "booleanValue");
  if (dataType === "enum") return textField(row, "enumValue");
  if (dataType === "enum_list") {
    const values = enumListValue(row.enumListValue);
    return values.length ? values : undefined;
  }
  return textField(row, "textValue");
}

function displayValue(value: ProductAIPrimitive, unit?: string) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "yes" : "no";
  const label = unit && unit !== "none" ? UNIT_LABELS[unit] || unit : "";
  return `${value}${label ? ` ${label}` : ""}`;
}

function specFromAttribute(row: CatalogRecord): ProductAISpec | undefined {
  const definition = recordValue(row.definition);
  const dataType = textField(row, "dataType") as AttributeDataType | undefined;
  if (!dataType) return undefined;

  const value = typedValue(row, dataType);
  if (value === undefined) return undefined;

  const relation = relationID(row.definition);
  const label =
    textField(definition, "label") ||
    textField(definition, "code") ||
    (relation !== undefined ? `Attribute ${relation}` : undefined);
  if (!label) return undefined;

  const unit = textField(row, "unit") || textField(definition, "unit") || "none";
  const code =
    textField(definition, "code") ||
    (relation !== undefined ? `attribute_${relation}` : normalizeCatalogCode(label));

  return {
    code,
    comparable: booleanField(definition, "comparable") ?? false,
    dataType,
    displayValue: displayValue(value, unit),
    filterable: booleanField(definition, "filterable") ?? false,
    label,
    rawValue: textField(row, "rawValue"),
    required: booleanField(definition, "required") ?? false,
    searchable: booleanField(definition, "searchable") ?? true,
    unit,
    value,
  };
}

function manualSpec(label: string, value: ProductAIPrimitive, code?: string, unit = "none"): ProductAISpec {
  return {
    code: code || normalizeCatalogCode(label),
    comparable: true,
    dataType: typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "text",
    displayValue: displayValue(value, unit),
    filterable: false,
    label,
    required: false,
    searchable: true,
    unit,
    value,
  };
}

function specsFromLegacyGroups(product: CatalogRecord) {
  const specs: ProductAISpec[] = [];

  for (const group of LEGACY_SPEC_GROUPS) {
    const data = recordValue(product[group.field]);
    if (!data) continue;

    for (const [field, code, label, dataType, unit] of group.specs) {
      const value =
        dataType === "number"
          ? numberField(data, field)
          : dataType === "boolean"
            ? booleanField(data, field)
            : textField(data, field);
      if (value !== undefined && value !== "") {
        specs.push(manualSpec(label, value, code, unit));
      }
    }
  }

  return specs;
}

function specsFromManualRows(product: CatalogRecord) {
  if (!Array.isArray(product.specs)) return [];
  return product.specs
    .map((item) => {
      const row = recordValue(item);
      const label = textField(row, "label");
      const value = textField(row, "value");
      return label && value ? manualSpec(label, value) : undefined;
    })
    .filter((item): item is ProductAISpec => Boolean(item));
}

export function specsFromProduct(product: CatalogRecord) {
  const canonicalSpecs = Array.isArray(product.attributes)
    ? product.attributes
        .map((item) => (recordValue(item) ? specFromAttribute(recordValue(item) as CatalogRecord) : undefined))
        .filter((item): item is ProductAISpec => Boolean(item))
    : [];
  const specs = [
    ...canonicalSpecs,
    ...specsFromLegacyGroups(product),
    ...specsFromManualRows(product),
  ];
  const seen = new Set<string>();

  return specs.filter((spec) => {
    const key = spec.code || normalizeCatalogCode(spec.label);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function searchableText(parts: Array<unknown>) {
  return parts
    .flatMap((part) => {
      if (!part) return [];
      if (Array.isArray(part)) return part;
      return [part];
    })
    .map((part) => String(part).trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function metadataForProfile(metadata?: CatalogRecord | null) {
  return {
    advantages: textList(metadata?.advantages),
    aiGenerated: booleanField(metadata || undefined, "aiGenerated") ?? false,
    competitorModels: textList(metadata?.competitorModels),
    keywords: textList(metadata?.keywords),
    metadataVerified: booleanField(metadata || undefined, "verified") ?? false,
    useCases: textList(metadata?.useCases),
  };
}

export function toProductAIProfile(
  product: CatalogRecord,
  options: ProductAIProfileMapperOptions = {},
): ProductAIProfile {
  const metadata = metadataForProfile(options.metadata);
  const commercial = options.commercial;
  const source = recordValue(product.source);
  const id = relationID(product.id) || textField(product, "internalId") || textField(product, "slug") || textField(product, "title") || textField(product, "name");
  const name = textField(product, "name") || textField(product, "title") || "";
  const slug = textField(product, "slug");
  const specs = specsFromProduct(product);
  const summary =
    textField(product, "shortDescription") ||
    stripHTML(textField(product, "summaryHTML")) ||
    textField(product, "summary");
  const descriptionText =
    stripHTML(textField(product, "descriptionHTML")) ||
    textField(product, "description") ||
    summary;
  const stockStatus =
    commercial?.stockStatus ||
    textField(product, "stockStatus") ||
    "unknown";

  const profileBase = {
    ...metadata,
    brand: relationText(product.brand, "name") || textField(product, "brand"),
    brandSlug: relationText(product.brand, "slug"),
    category: relationText(product.category, "name") || textField(product, "category"),
    categorySlug: relationText(product.category, "slug"),
    currency: commercial?.currency,
    descriptionText,
    href: slug ? `/san-pham/${slug}` : undefined,
    id: String(id || name || "unknown-product"),
    image: mediaURL(product.images),
    internalId: textField(product, "internalId"),
    model: textField(product, "model"),
    mpn: textField(product, "mpn"),
    name,
    price: commercial?.price || textField(product, "price"),
    priceValue: commercial?.priceValue,
    productType: relationText(product.productType, "code") || textField(product, "productType") || "other",
    productTypeName: relationText(product.productType, "name"),
    sku: commercial?.sku || textField(product, "sku"),
    slug,
    sourceType: textField(source, "type"),
    sourceUrl: textField(source, "url"),
    sourceVerified: booleanField(source, "verified") ?? false,
    specs,
    stockQuantity: commercial?.quantity,
    stockStatus,
    summary,
    vatIncluded: commercial?.vatIncluded,
    warranty: commercial?.warranty || textField(product, "warranty"),
  };

  return {
    ...profileBase,
    searchableText: searchableText([
      profileBase.name,
      profileBase.brand,
      profileBase.model,
      profileBase.mpn,
      profileBase.category,
      profileBase.productType,
      profileBase.summary,
      profileBase.descriptionText,
      profileBase.sku,
      profileBase.useCases,
      profileBase.keywords,
      profileBase.advantages,
      specs.flatMap((spec) => [spec.code, spec.label, spec.displayValue, spec.rawValue]),
    ]),
  };
}

function metadataByProductID(metadataDocs: CatalogRecord[]) {
  const result = new Map<string, CatalogRecord>();
  for (const metadata of metadataDocs) {
    const productID = relationID(metadata.product);
    if (productID !== undefined) result.set(String(productID), metadata);
  }
  return result;
}

async function loadAIMetadata(payload: Payload, productIDs: Array<string | number>) {
  if (!productIDs.length) return new Map<string, CatalogRecord>();
  const result = await payload.find({
    collection: "product-ai-metadata" as never,
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    where: {
      product: {
        in: productIDs,
      },
    },
  });
  return metadataByProductID(result.docs as CatalogRecord[]);
}

export async function getProductAIProfilesFromPayload(
  query: ProductAIProfileQuery = {},
) {
  const payload = await getPayloadClient();
  const limit = query.limit ?? 1000;
  const where: Where | undefined = query.productIDs?.length
    ? {
        id: {
          in: query.productIDs,
        },
      }
    : query.status && query.status !== "all"
      ? {
          status: {
            equals: query.status,
          },
        }
      : query.status === "all"
        ? undefined
        : {
            status: {
              equals: "published",
            },
          };

  const productsResult = await payload.find({
    collection: "products",
    depth: 2,
    limit,
    overrideAccess: true,
    ...(where ? { where } : {}),
  });
  const products = productsResult.docs as CatalogRecord[];
  const productIDs = products
    .map((product) => relationID(product.id))
    .filter((id): id is string | number => id !== undefined);
  const [commercial, metadata] = await Promise.all([
    loadCanonicalCommercialProjections(payload, productIDs),
    loadAIMetadata(payload, productIDs),
  ]);

  return products.map((product) =>
    toProductAIProfile(product, {
      commercial:
        product.id !== undefined
          ? commercial.get(String(product.id))
          : undefined,
      metadata:
        product.id !== undefined
          ? metadata.get(String(product.id))
          : undefined,
    }),
  );
}

export async function getProductAIProfileBySlugFromPayload(slug: string) {
  const payload = await getPayloadClient();
  const productsResult = await payload.find({
    collection: "products",
    depth: 2,
    limit: 1,
    overrideAccess: true,
    where: {
      slug: {
        equals: slug,
      },
    },
  });
  const product = productsResult.docs[0] as CatalogRecord | undefined;
  if (!product) return null;
  const productID = relationID(product.id);
  const [commercial, metadata] = await Promise.all([
    productID !== undefined
      ? loadCanonicalCommercialProjections(payload, [productID])
      : Promise.resolve(new Map<string, CanonicalCommercialProjection>()),
    productID !== undefined
      ? loadAIMetadata(payload, [productID])
      : Promise.resolve(new Map<string, CatalogRecord>()),
  ]);

  return toProductAIProfile(product, {
    commercial: productID !== undefined ? commercial.get(String(productID)) : undefined,
    metadata: productID !== undefined ? metadata.get(String(productID)) : undefined,
  });
}

export function productAIProfileFromCatalogProduct(product: CatalogProduct) {
  const specs = (product.specs || []).map((spec) =>
    manualSpec(spec.label, spec.value),
  );
  const profile = toProductAIProfile(
    {
      ...product,
      attributes: [],
      images: product.images?.length ? product.images : product.image ? [{ url: product.image }] : [],
      name: product.title,
      productType: product.productType || "other",
      shortDescription: product.detail,
      specs,
    },
    {
      commercial: {
        compareAtPrice: product.compareAtPrice,
        price: product.price,
        priceValue: product.priceValue,
        quantity: product.stockQuantity,
        sku: product.sku,
        stockStatus: product.stockStatus,
        vatIncluded: product.vatIncluded,
        warranty: product.warranty,
      },
    },
  );
  return {
    ...profile,
    specs,
  };
}
