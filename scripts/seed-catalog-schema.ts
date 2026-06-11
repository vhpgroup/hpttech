import { loadEnvConfig } from "@next/env";
import type { Where } from "payload";
import { lexicalParagraphs } from "../lib/scraper/text.ts";

loadEnvConfig(process.cwd());

type ID = string | number;
type PayloadClient = Awaited<ReturnType<typeof import("../lib/payload.ts").getPayloadClient>>;

type AttributeSeed = {
  code: string;
  label: string;
  dataType: "number" | "text" | "boolean" | "enum" | "enum_list";
  unit:
    | "none"
    | "ppm"
    | "ipm"
    | "cpm"
    | "sheets"
    | "pages_per_day"
    | "pages_per_month"
    | "dpi";
  required?: boolean;
  filterable?: boolean;
  options?: Array<{ label: string; value: string }>;
};

const schemas: Record<
  "scanner" | "printer" | "photocopier",
  { name: string; description: string; attributes: AttributeSeed[] }
> = {
  scanner: {
    name: "Máy scan",
    description: "Thiết bị số hóa tài liệu, ảnh và hồ sơ.",
    attributes: [
      { code: "scanner_origin", label: "Xuất xứ", dataType: "text", unit: "none" },
      { code: "scanner_type", label: "Loại máy scan", dataType: "text", unit: "none", filterable: true },
      { code: "scanner_functions", label: "Chức năng", dataType: "text", unit: "none" },
      { code: "scanner_scan_speed_simplex", label: "Tốc độ scan một mặt", dataType: "number", unit: "ppm", filterable: true },
      { code: "scanner_scan_speed_duplex", label: "Tốc độ scan hai mặt", dataType: "number", unit: "ipm", filterable: true },
      { code: "scanner_scan_modes", label: "Chế độ quét", dataType: "text", unit: "none" },
      { code: "scanner_color_depth", label: "Độ sâu màu", dataType: "text", unit: "none" },
      { code: "scanner_adf_capacity", label: "Sức chứa ADF", dataType: "number", unit: "sheets", filterable: true },
      { code: "scanner_duplex", label: "Scan hai mặt tự động", dataType: "boolean", unit: "none", filterable: true },
      { code: "scanner_color_scan", label: "Scan màu", dataType: "boolean", unit: "none", filterable: true },
      { code: "scanner_ocr", label: "OCR", dataType: "boolean", unit: "none", filterable: true },
      { code: "scanner_plastic_card_scan", label: "Scan thẻ nhựa", dataType: "boolean", unit: "none" },
      { code: "scanner_passport_scan", label: "Scan hộ chiếu", dataType: "boolean", unit: "none" },
      {
        code: "scanner_connectivity",
        label: "Kết nối",
        dataType: "enum_list",
        unit: "none",
        filterable: true,
        options: [
          { label: "USB", value: "usb" },
          { label: "LAN", value: "lan" },
          { label: "WiFi", value: "wifi" },
        ],
      },
      {
        code: "scanner_max_paper_size",
        label: "Khổ giấy tối đa",
        dataType: "enum",
        unit: "none",
        filterable: true,
        options: [
          { label: "A4", value: "a4" },
          { label: "A3", value: "a3" },
          { label: "Legal", value: "legal" },
        ],
      },
      { code: "scanner_min_paper_size", label: "Khổ giấy tối thiểu", dataType: "text", unit: "none" },
      { code: "scanner_daily_duty", label: "Công suất khuyến nghị mỗi ngày", dataType: "number", unit: "pages_per_day" },
      { code: "scanner_optical_resolution", label: "Độ phân giải quang học", dataType: "number", unit: "dpi" },
      { code: "scanner_supported_os", label: "Hệ điều hành hỗ trợ", dataType: "text", unit: "none" },
      { code: "scanner_dimensions_weight", label: "Kích thước / Trọng lượng", dataType: "text", unit: "none" },
    ],
  },
  printer: {
    name: "Máy in",
    description: "Máy in đơn năng hoặc đa chức năng.",
    attributes: [
      {
        code: "printer_technology",
        label: "Công nghệ in",
        dataType: "enum",
        unit: "none",
        required: true,
        filterable: true,
        options: [
          { label: "Laser", value: "laser" },
          { label: "Phun mực", value: "inkjet" },
          { label: "LED", value: "led" },
        ],
      },
      { code: "printer_print_speed", label: "Tốc độ in", dataType: "number", unit: "ppm", required: true, filterable: true },
      { code: "printer_color", label: "In màu", dataType: "boolean", unit: "none", filterable: true },
      { code: "printer_auto_duplex", label: "In hai mặt tự động", dataType: "boolean", unit: "none", filterable: true },
      {
        code: "printer_connectivity",
        label: "Kết nối",
        dataType: "enum_list",
        unit: "none",
        required: true,
        filterable: true,
        options: [
          { label: "USB", value: "usb" },
          { label: "LAN", value: "lan" },
          { label: "WiFi", value: "wifi" },
        ],
      },
      {
        code: "printer_max_paper_size",
        label: "Khổ giấy tối đa",
        dataType: "enum",
        unit: "none",
        required: true,
        filterable: true,
        options: [
          { label: "A4", value: "a4" },
          { label: "A3", value: "a3" },
        ],
      },
      { code: "printer_monthly_duty", label: "Công suất tối đa mỗi tháng", dataType: "number", unit: "pages_per_month" },
    ],
  },
  photocopier: {
    name: "Máy photocopy",
    description: "Thiết bị photocopy và xử lý tài liệu văn phòng.",
    attributes: [
      { code: "photocopier_copy_speed", label: "Tốc độ sao chụp", dataType: "number", unit: "cpm", required: true, filterable: true },
      { code: "photocopier_color", label: "Sao chụp màu", dataType: "boolean", unit: "none", filterable: true },
      { code: "photocopier_auto_duplex", label: "Hai mặt tự động", dataType: "boolean", unit: "none", filterable: true },
      { code: "photocopier_adf_capacity", label: "Sức chứa ADF", dataType: "number", unit: "sheets", filterable: true },
      {
        code: "photocopier_max_paper_size",
        label: "Khổ giấy tối đa",
        dataType: "enum",
        unit: "none",
        required: true,
        filterable: true,
        options: [
          { label: "A4", value: "a4" },
          { label: "A3", value: "a3" },
        ],
      },
      {
        code: "photocopier_connectivity",
        label: "Kết nối",
        dataType: "enum_list",
        unit: "none",
        required: true,
        filterable: true,
        options: [
          { label: "USB", value: "usb" },
          { label: "LAN", value: "lan" },
          { label: "WiFi", value: "wifi" },
        ],
      },
      { code: "photocopier_monthly_duty", label: "Công suất tối đa mỗi tháng", dataType: "number", unit: "pages_per_month" },
    ],
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
    where,
  });
  return result.docs[0] as { id: ID } | undefined;
}

async function upsert(
  payload: PayloadClient,
  collection: string,
  where: Where,
  data: Record<string, unknown>,
) {
  const existing = await findOne(payload, collection, where);
  return existing
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

async function seedSchemas(payload: PayloadClient) {
  const productTypes = new Map<string, ID>();
  const definitions = new Map<string, ID>();

  for (const [code, schema] of Object.entries(schemas)) {
    const productType = await upsert(
      payload,
      "product-types",
      { code: { equals: code } },
      {
        code,
        description: schema.description,
        name: schema.name,
        schemaVersion: 1,
        status: "active",
      },
    );
    productTypes.set(code, productType.id);

    for (const [index, attribute] of schema.attributes.entries()) {
      const definition = await upsert(
        payload,
        "attribute-definitions",
        { code: { equals: attribute.code } },
        {
          ...attribute,
          comparable: true,
          options: attribute.options || [],
          productType: productType.id,
          required: attribute.required || false,
          searchable: true,
          sortOrder: index,
          status: "active",
        },
      );
      definitions.set(attribute.code, definition.id);
    }
  }

  return { definitions, productTypes };
}

async function seedRicohFi8170(
  payload: PayloadClient,
  productTypeID: ID,
  definitions: Map<string, ID>,
) {
  const brand = await upsert(
    payload,
    "brands",
    { slug: { equals: "ricoh" } },
    {
      name: "Ricoh",
      slug: "ricoh",
      website: "https://www.pfu.ricoh.com/global/scanners/fi/fi-8170/",
    },
  );

  const category = await upsert(
    payload,
    "categories",
    { slug: { equals: "may-scan" } },
    {
      name: "Máy scan",
      slug: "may-scan",
      sortOrder: 0,
    },
  );

  const attributes = [
    { definition: definitions.get("scanner_scan_speed_simplex"), dataType: "number", unit: "ppm", numberValue: 70, rawValue: "70 ppm" },
    { definition: definitions.get("scanner_scan_speed_duplex"), dataType: "number", unit: "ipm", numberValue: 140, rawValue: "140 ipm" },
    { definition: definitions.get("scanner_adf_capacity"), dataType: "number", unit: "sheets", numberValue: 100, rawValue: "100 sheets" },
    { definition: definitions.get("scanner_duplex"), dataType: "boolean", unit: "none", booleanValue: true },
    {
      definition: definitions.get("scanner_connectivity"),
      dataType: "enum_list",
      unit: "none",
      enumListValue: [{ value: "usb" }, { value: "lan" }],
      rawValue: "USB 3.2, Ethernet",
    },
    { definition: definitions.get("scanner_max_paper_size"), dataType: "enum", unit: "none", enumValue: "a4", rawValue: "A4 / Legal" },
    { definition: definitions.get("scanner_daily_duty"), dataType: "number", unit: "pages_per_day", numberValue: 10000, rawValue: "10,000 sheets/day" },
    { definition: definitions.get("scanner_optical_resolution"), dataType: "number", unit: "dpi", numberValue: 600, rawValue: "600 dpi" },
  ];

  const product = await upsert(
    payload,
    "products",
    { internalId: { equals: "HPT-RICOH-FI8170" } },
    {
      attributes,
      brand: brand.id,
      category: category.id,
      dataModel: "canonical",
      description: lexicalParagraphs(
        "RICOH fi-8170 là máy scan tài liệu A4 dành cho khối lượng công việc cao.\n\nDữ liệu mẫu này dùng để kiểm tra mô hình catalog chuẩn trong Payload CMS.",
      ),
      internalId: "HPT-RICOH-FI8170",
      model: "fi-8170",
      mpn: "PA03810-B051",
      name: "Máy scan RICOH fi-8170",
      productType: productTypeID,
      shortDescription: "Máy scan A4 tốc độ 70 ppm, ADF 100 tờ, kết nối USB và LAN.",
      slug: "may-scan-ricoh-fi-8170",
      source: {
        type: "manufacturer",
        url: "https://www.pfu.ricoh.com/global/scanners/fi/fi-8170/",
        verified: false,
      },
      specs: [
        { label: "Tốc độ", value: "70 ppm / 140 ipm" },
        { label: "ADF", value: "100 tờ" },
        { label: "Kết nối", value: "USB 3.2, Ethernet" },
      ],
      status: "published",
      stockStatus: "in_stock",
      summary: lexicalParagraphs(
        "Máy scan tài liệu A4 tốc độ cao cho doanh nghiệp và cơ quan.",
      ),
      title: "Máy scan RICOH fi-8170",
    },
  );

  const variant = await upsert(
    payload,
    "product-variants",
    { sku: { equals: "RICOH-FI8170" } },
    {
      isPrimary: true,
      product: product.id,
      sku: "RICOH-FI8170",
      status: "active",
      variantName: "Phiên bản tiêu chuẩn",
      warranty: "12 tháng",
    },
  );

  await upsert(
    payload,
    "product-offers",
    { variant: { equals: variant.id } },
    {
      currency: "VND",
      price: 0,
      saleStatus: "contact",
      variant: variant.id,
      vatIncluded: true,
      vatRate: 10,
    },
  );

  await upsert(
    payload,
    "product-inventory",
    {
      and: [
        { variant: { equals: variant.id } },
        { warehouseName: { equals: "Kho chính" } },
      ],
    },
    {
      quantity: 1,
      stockStatus: "in_stock",
      updatedAt: new Date().toISOString(),
      variant: variant.id,
      warehouseName: "Kho chính",
    },
  );

  await upsert(
    payload,
    "product-ai-metadata",
    { product: { equals: product.id } },
    {
      advantages: [
        { value: "Tốc độ scan cao" },
        { value: "ADF 100 tờ" },
        { value: "Phù hợp khối lượng tài liệu lớn" },
      ],
      aiGenerated: false,
      competitorModels: [],
      keywords: [
        { value: "máy scan A4" },
        { value: "scan 70 ppm" },
        { value: "scan hồ sơ doanh nghiệp" },
      ],
      product: product.id,
      useCases: [
        { value: "Số hóa hồ sơ doanh nghiệp" },
        { value: "Scan hồ sơ hành chính" },
        { value: "Scan tài liệu khối lượng lớn" },
      ],
      verified: false,
    },
  );
}

async function main() {
  const { getPayloadClient } = await import("../lib/payload.ts");
  const payload = await getPayloadClient();

  const { definitions, productTypes } = await seedSchemas(payload);
  const scannerTypeID = productTypes.get("scanner");
  if (!scannerTypeID) throw new Error("Không tạo được product type scanner.");

  await seedRicohFi8170(payload, scannerTypeID, definitions);
  console.log("Seeded catalog schemas and Ricoh fi-8170 sample.");
  await payload.destroy();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
