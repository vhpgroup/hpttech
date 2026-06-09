import { loadEnvConfig } from "@next/env";
import type { Where } from "payload";

loadEnvConfig(process.cwd());

type ID = string | number;
type PayloadClient = Awaited<ReturnType<typeof import("../lib/payload.ts").getPayloadClient>>;
type Doc = Record<string, unknown> & { id?: ID };

type AttributeValue =
  | { code: string; value: boolean }
  | { code: string; value: number }
  | { code: string; value: string }
  | { code: string; value: string[] };

type ProductPlan = {
  advantages: string[];
  attributes: AttributeValue[];
  categoryName: string;
  categorySlug: string;
  keywords: string[];
  model: string;
  price?: number;
  productTypeCode: "printer" | "scanner";
  shortDescription: string;
  sku: string;
  sourceNote: string;
  stockQuantity: number;
  stockStatus: "in_stock" | "unknown";
  title: string;
  useCases: string[];
  warranty: string;
};

const plansByExistingSlug: Record<string, ProductPlan> = {
  "may-in-canon-LBP223dw": {
    advantages: ["In hai mat tu dong", "Co USB, LAN va WiFi", "Phu hop van phong nho"],
    attributes: [
      { code: "printer_technology", value: "laser" },
      { code: "printer_print_speed", value: 33 },
      { code: "printer_color", value: false },
      { code: "printer_auto_duplex", value: true },
      { code: "printer_connectivity", value: ["usb", "lan", "wifi"] },
      { code: "printer_max_paper_size", value: "a4" },
    ],
    categoryName: "Máy in",
    categorySlug: "may-in",
    keywords: ["Canon LBP 223dw", "may in laser den trang", "may in van phong"],
    model: "LBP 223dw",
    price: 3900000,
    productTypeCode: "printer",
    shortDescription: "Máy in laser đen trắng A4, tốc độ 33 ppm, in hai mặt tự động, có USB/LAN/WiFi.",
    sku: "CANON-LBP223DW",
    sourceNote: "Migrated from legacy product id 1.",
    stockQuantity: 1,
    stockStatus: "in_stock",
    title: "Máy in Canon LBP 223dw",
    useCases: ["In tài liệu văn phòng", "In hợp đồng và hồ sơ hành chính"],
    warranty: "12 tháng",
  },
  "epson-l3250": {
    advantages: ["May in phun mau binh muc", "Co WiFi", "Phu hop van phong va ho gia dinh"],
    attributes: [
      { code: "printer_technology", value: "inkjet" },
      { code: "printer_print_speed", value: 10 },
      { code: "printer_color", value: true },
      { code: "printer_auto_duplex", value: false },
      { code: "printer_connectivity", value: ["usb", "wifi"] },
      { code: "printer_max_paper_size", value: "a4" },
    ],
    categoryName: "Máy in",
    categorySlug: "may-in",
    keywords: ["Epson L3250", "may in phun mau", "may in WiFi"],
    model: "L3250",
    productTypeCode: "printer",
    shortDescription: "Máy in phun màu Epson L3250, kết nối WiFi, phù hợp nhu cầu in màu cơ bản.",
    sku: "EPSON-L3250",
    sourceNote: "Migrated from legacy product id 2.",
    stockQuantity: 0,
    stockStatus: "unknown",
    title: "Epson L3250",
    useCases: ["In mau van phong", "In tai lieu hoc tap", "In tai lieu marketing co ban"],
    warranty: "Liên hệ xác nhận",
  },
  "canon-lbp-223dw": {
    advantages: ["Ban ghi bo sung cho Canon LBP 223dw", "In laser den trang", "Can xac minh truoc khi publish"],
    attributes: [
      { code: "printer_technology", value: "laser" },
      { code: "printer_print_speed", value: 33 },
      { code: "printer_color", value: false },
      { code: "printer_auto_duplex", value: true },
      { code: "printer_connectivity", value: ["usb", "lan", "wifi"] },
      { code: "printer_max_paper_size", value: "a4" },
    ],
    categoryName: "Máy in",
    categorySlug: "may-in",
    keywords: ["Canon LBP 223dw", "may in laser", "ban ghi can kiem tra"],
    model: "LBP 223dw",
    productTypeCode: "printer",
    shortDescription: "Bản ghi nhập tay của Canon LBP 223dw, cần kiểm tra trùng lặp với sản phẩm đã publish.",
    sku: "CANON-LBP223DW-DRAFT",
    sourceNote: "Migrated from legacy product id 3; possible duplicate of canonical Canon LBP 223dw.",
    stockQuantity: 0,
    stockStatus: "unknown",
    title: "Canon LBP 223dw",
    useCases: ["Kiem tra du lieu trung lap", "Bo sung thong tin san pham may in"],
    warranty: "Liên hệ xác nhận",
  },
  "epson-ecotank-l3250-a4-wi-fi-all-in-one-ink-tank-printer": {
    advantages: ["Binh muc EcoTank", "Da chuc nang", "Co WiFi"],
    attributes: [
      { code: "printer_technology", value: "inkjet" },
      { code: "printer_print_speed", value: 10 },
      { code: "printer_color", value: true },
      { code: "printer_auto_duplex", value: false },
      { code: "printer_connectivity", value: ["usb", "wifi"] },
      { code: "printer_max_paper_size", value: "a4" },
    ],
    categoryName: "Máy in",
    categorySlug: "may-in",
    keywords: ["Epson EcoTank L3250", "all in one", "may in WiFi"],
    model: "L3250",
    productTypeCode: "printer",
    shortDescription: "Máy in phun màu đa chức năng Epson EcoTank L3250 A4, kết nối WiFi.",
    sku: "EPSON-ECOTANK-L3250",
    sourceNote: "Migrated from legacy product id 4.",
    stockQuantity: 0,
    stockStatus: "unknown",
    title: "Epson EcoTank L3250 A4 Wi-Fi All-in-One Ink Tank Printer",
    useCases: ["In mau", "In scan copy tai van phong nho", "In tai lieu hoc tap"],
    warranty: "Liên hệ xác nhận",
  },
  "epson-workforce-ds-970-a4-duplex-sheet-fed-document-scanner": {
    advantages: ["Toc do scan cao", "ADF 100 to", "Scan hai mat tu dong"],
    attributes: [
      { code: "scanner_scan_speed_simplex", value: 85 },
      { code: "scanner_scan_speed_duplex", value: 170 },
      { code: "scanner_adf_capacity", value: 100 },
      { code: "scanner_duplex", value: true },
      { code: "scanner_connectivity", value: ["usb"] },
      { code: "scanner_max_paper_size", value: "a4" },
      { code: "scanner_daily_duty", value: 9000 },
      { code: "scanner_optical_resolution", value: 600 },
    ],
    categoryName: "Máy scan",
    categorySlug: "may-scan",
    keywords: ["Epson DS-970", "may scan A4", "scan hai mat", "ADF 100"],
    model: "DS-970",
    productTypeCode: "scanner",
    shortDescription: "Máy scan tài liệu A4 Epson WorkForce DS-970, tốc độ 85 ppm, ADF 100 tờ, scan hai mặt.",
    sku: "EPSON-DS970",
    sourceNote: "Migrated from legacy product id 5; category corrected from May in to May scan.",
    stockQuantity: 0,
    stockStatus: "unknown",
    title: "Epson WorkForce DS-970 A4 Duplex Sheet-fed Document Scanner",
    useCases: ["Số hóa hồ sơ văn phòng", "Scan tài liệu khối lượng lớn", "Scan hồ sơ hành chính"],
    warranty: "Liên hệ xác nhận",
  },
};

async function findOne(
  payload: PayloadClient,
  collection: string,
  where: Where,
) {
  const result = await payload.find({
    collection: collection as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where,
  });
  return result.docs[0] as Doc | undefined;
}

async function upsert(
  payload: PayloadClient,
  collection: string,
  where: Where,
  data: Record<string, unknown>,
) {
  const existing = await findOne(payload, collection, where);
  return existing?.id !== undefined
    ? payload.update({
        collection: collection as never,
        id: existing.id,
        data,
        overrideAccess: true,
      })
    : payload.create({
        collection: collection as never,
        data,
        overrideAccess: true,
      });
}

async function upsertInventory(
  payload: PayloadClient,
  variantID: ID,
  data: Record<string, unknown>,
) {
  const existing = await findOne(payload, "product-inventory", {
    or: [
      {
        and: [
          { variant: { equals: variantID } },
          { warehouseName: { equals: "Kho chính" } },
        ],
      },
      {
        and: [
          { variant: { equals: variantID } },
          { warehouseName: { equals: "Kho chinh" } },
        ],
      },
    ],
  });

  return existing?.id !== undefined
    ? payload.update({
        collection: "product-inventory" as never,
        id: existing.id,
        data,
        overrideAccess: true,
      })
    : payload.create({
        collection: "product-inventory" as never,
        data,
        overrideAccess: true,
      });
}

async function ensureCategory(payload: PayloadClient, slug: string, name: string) {
  return upsert(
    payload,
    "categories",
    { slug: { equals: slug } },
    {
      name,
      slug,
      sortOrder: slug === "may-scan" ? 1 : 0,
    },
  );
}

function text(doc: Doc | undefined, key: string) {
  const value = doc?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEnumValue(definition: Doc, value: string) {
  const normalized = value.trim().toLowerCase();
  if (!Array.isArray(definition.options)) return normalized;
  const option = definition.options.find((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as Doc;
    return [record.value, record.label].some(
      (candidate) =>
        typeof candidate === "string" &&
        candidate.trim().toLowerCase() === normalized,
    );
  }) as Doc | undefined;
  return typeof option?.value === "string" ? option.value : normalized;
}

async function loadDefinitions(payload: PayloadClient, productTypeID: ID) {
  const result = await payload.find({
    collection: "attribute-definitions" as never,
    depth: 0,
    limit: 500,
    overrideAccess: true,
    where: {
      and: [
        { productType: { equals: productTypeID } },
        { status: { equals: "active" } },
      ],
    },
  });
  return new Map((result.docs as Doc[]).map((definition) => [text(definition, "code"), definition]));
}

function mapAttributes(definitions: Map<string, Doc>, values: AttributeValue[]) {
  return values.map((attribute) => {
    const definition = definitions.get(attribute.code);
    if (!definition?.id) throw new Error(`Missing Attribute Definition: ${attribute.code}`);
    const dataType = text(definition, "dataType");
    const base = {
      dataType,
      definition: definition.id,
      unit: text(definition, "unit") || "none",
    };

    if (dataType === "number") {
      if (typeof attribute.value !== "number") throw new Error(`${attribute.code} must be number.`);
      return { ...base, numberValue: attribute.value, rawValue: String(attribute.value) };
    }
    if (dataType === "boolean") {
      if (typeof attribute.value !== "boolean") throw new Error(`${attribute.code} must be boolean.`);
      return { ...base, booleanValue: attribute.value, rawValue: attribute.value ? "true" : "false" };
    }
    if (dataType === "enum_list") {
      if (!Array.isArray(attribute.value)) throw new Error(`${attribute.code} must be string[].`);
      return {
        ...base,
        enumListValue: attribute.value.map((item) => ({
          value: normalizeEnumValue(definition, item),
        })),
        rawValue: attribute.value.join(", "),
      };
    }
    if (typeof attribute.value !== "string") throw new Error(`${attribute.code} must be string.`);
    if (dataType === "enum") {
      return {
        ...base,
        enumValue: normalizeEnumValue(definition, attribute.value),
        rawValue: attribute.value,
      };
    }
    return { ...base, textValue: attribute.value, rawValue: attribute.value };
  });
}

function rows(values: string[]) {
  return values.map((value) => ({ value }));
}

async function migrateOne(payload: PayloadClient, product: Doc, plan: ProductPlan) {
  const productType = await findOne(payload, "product-types", {
    code: { equals: plan.productTypeCode },
  });
  if (!productType?.id) throw new Error(`Missing Product Type: ${plan.productTypeCode}`);

  const category = await ensureCategory(payload, plan.categorySlug, plan.categoryName);
  const definitions = await loadDefinitions(payload, productType.id);
  const attributes = mapAttributes(definitions, plan.attributes);
  const finalStatus = text(product, "status") === "published" ? "published" : "draft";

  const updatedProduct = await payload.update({
    collection: "products",
    id: product.id as ID,
    data: {
      attributes,
      category: category.id,
      dataModel: "canonical",
      internalId: text(product, "internalId") || `HPT-LEGACY-${String(product.id).padStart(4, "0")}`,
      internalNote: [text(product, "internalNote"), plan.sourceNote].filter(Boolean).join("\n"),
      model: plan.model,
      name: plan.title,
      productType: productType.id,
      shortDescription: plan.shortDescription,
      sku: plan.sku,
      source: {
        type: "manual",
        verified: false,
      },
      specProfile: plan.productTypeCode,
      status: finalStatus,
      title: plan.title,
      warranty: plan.warranty,
    },
    overrideAccess: true,
  });

  const variant = await upsert(
    payload,
    "product-variants",
    { sku: { equals: plan.sku } },
    {
      isPrimary: true,
      product: updatedProduct.id,
      sku: plan.sku,
      status: finalStatus === "published" ? "active" : "draft",
      variantName: "Phiên bản tiêu chuẩn",
      warranty: plan.warranty,
    },
  );

  await upsert(
    payload,
    "product-offers",
    { variant: { equals: variant.id } },
    {
      currency: "VND",
      price: plan.price || 0,
      saleStatus: plan.price ? "active" : "contact",
      variant: variant.id,
      vatIncluded: true,
      vatRate: 10,
    },
  );

  await upsertInventory(
    payload,
    variant.id as ID,
    {
      quantity: plan.stockQuantity,
      stockStatus: plan.stockStatus,
      updatedAt: new Date().toISOString(),
      variant: variant.id,
      warehouseName: "Kho chính",
    },
  );

  await upsert(
    payload,
    "product-ai-metadata",
    { product: { equals: updatedProduct.id } },
    {
      advantages: rows(plan.advantages),
      aiGenerated: false,
      competitorModels: [],
      keywords: rows(plan.keywords),
      note: plan.sourceNote,
      product: updatedProduct.id,
      useCases: rows(plan.useCases),
      verified: false,
    },
  );

  return {
    id: updatedProduct.id,
    slug: text(updatedProduct as Doc, "slug"),
    status: finalStatus,
    sku: plan.sku,
    title: plan.title,
  };
}

async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "products",
    depth: 0,
    limit: 100,
    overrideAccess: true,
    sort: "id",
  });

  const migrated = [];
  const skipped = [];

  for (const product of result.docs as Doc[]) {
    const slug = text(product, "slug");
    const plan = plansByExistingSlug[slug];
    if (!plan) {
      skipped.push({ id: product.id, slug, reason: "no migration plan" });
      continue;
    }
    migrated.push(await migrateOne(payload, product, plan));
  }

  console.log(
    JSON.stringify(
      {
        migrated,
        skipped,
      },
      null,
      2,
    ),
  );
  await payload.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
