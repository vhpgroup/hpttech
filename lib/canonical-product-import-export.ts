import type { Payload, Where } from "payload";
import ExcelJS from "exceljs";
import { getPayloadClient } from "@/lib/payload";
import { relationID } from "@/lib/catalog-schema";
import { formatSlug } from "@/lib/payload/utils/slugify";
import { parseCSV, type ProductExportProfile } from "@/lib/product-import-export";

type RecordRow = Record<string, string>;
type Doc = Record<string, unknown> & { id?: string | number };
type ID = string | number;

const BASE_COLUMNS = [
  "internalId",
  "productTypeCode",
  "productName",
  "model",
  "mpn",
  "brandSlug",
  "brandName",
  "categorySlug",
  "categoryName",
  "slug",
  "productStatus",
  "sourceType",
  "sourceUrl",
  "sku",
  "variantName",
  "isPrimary",
  "barcode",
  "warranty",
  "variantStatus",
  "price",
  "currency",
  "vatRate",
  "vatIncluded",
  "promotionPrice",
  "saleStatus",
  "warehouseName",
  "quantity",
  "stockStatus",
] as const;

const REQUIRED_IMPORT_COLUMNS = new Set<string>([
  "productTypeCode",
  "productName",
  "model",
  "brandName",
  "categoryName",
  "sku",
]);

const LABELS: Record<(typeof BASE_COLUMNS)[number], string> = {
  internalId: "Mã Product nội bộ",
  productTypeCode: "Loại sản phẩm",
  productName: "Tên Product",
  model: "Model",
  mpn: "MPN",
  brandSlug: "Mã thương hiệu",
  brandName: "Tên thương hiệu",
  categorySlug: "Mã danh mục",
  categoryName: "Tên danh mục",
  slug: "Đường dẫn",
  productStatus: "Trạng thái Product",
  sourceType: "Nguồn dữ liệu",
  sourceUrl: "URL nguồn",
  sku: "SKU",
  variantName: "Tên phiên bản",
  isPrimary: "SKU mặc định",
  barcode: "Barcode",
  warranty: "Bảo hành",
  variantStatus: "Trạng thái SKU",
  price: "Giá",
  currency: "Tiền tệ",
  vatRate: "VAT (%)",
  vatIncluded: "Giá gồm VAT",
  promotionPrice: "Giá khuyến mãi",
  saleStatus: "Trạng thái bán",
  warehouseName: "Kho",
  quantity: "Số lượng",
  stockStatus: "Trạng thái kho",
};

type SpecColumn = {
  code: string;
  dataType: "boolean" | "enum" | "enum_list" | "number" | "text";
  example: string;
  label: string;
  profile: Exclude<ProductExportProfile, "all">;
};

const SPEC_COLUMNS: SpecColumn[] = [
  { profile: "scanner", code: "scanner_scan_speed_simplex", label: "Tốc độ scan một mặt (ppm)", dataType: "number", example: "40" },
  { profile: "scanner", code: "scanner_scan_speed_duplex", label: "Tốc độ scan hai mặt (ipm)", dataType: "number", example: "80" },
  { profile: "scanner", code: "scanner_adf_capacity", label: "Sức chứa ADF (tờ)", dataType: "number", example: "80" },
  { profile: "scanner", code: "scanner_duplex", label: "Scan hai mặt tự động", dataType: "boolean", example: "Có" },
  { profile: "scanner", code: "scanner_connectivity", label: "Kết nối máy scan", dataType: "enum_list", example: "USB, LAN" },
  { profile: "scanner", code: "scanner_max_paper_size", label: "Khổ giấy tối đa máy scan", dataType: "enum", example: "A4" },
  { profile: "scanner", code: "scanner_daily_duty", label: "Công suất mỗi ngày (trang)", dataType: "number", example: "4000" },
  { profile: "scanner", code: "scanner_optical_resolution", label: "Độ phân giải scan (dpi)", dataType: "number", example: "600" },
  { profile: "printer", code: "printer_technology", label: "Công nghệ in", dataType: "enum", example: "Laser" },
  { profile: "printer", code: "printer_print_speed", label: "Tốc độ in (ppm)", dataType: "number", example: "40" },
  { profile: "printer", code: "printer_color", label: "In màu", dataType: "boolean", example: "Không" },
  { profile: "printer", code: "printer_auto_duplex", label: "In hai mặt tự động", dataType: "boolean", example: "Có" },
  { profile: "printer", code: "printer_connectivity", label: "Kết nối máy in", dataType: "enum_list", example: "USB, LAN, WiFi" },
  { profile: "printer", code: "printer_max_paper_size", label: "Khổ giấy tối đa máy in", dataType: "enum", example: "A4" },
  { profile: "printer", code: "printer_monthly_duty", label: "Công suất mỗi tháng (trang)", dataType: "number", example: "80000" },
  { profile: "photocopier", code: "photocopier_copy_speed", label: "Tốc độ photocopy (cpm)", dataType: "number", example: "35" },
  { profile: "photocopier", code: "photocopier_color", label: "Photocopy màu", dataType: "boolean", example: "Không" },
  { profile: "photocopier", code: "photocopier_auto_duplex", label: "Photocopy hai mặt tự động", dataType: "boolean", example: "Có" },
  { profile: "photocopier", code: "photocopier_adf_capacity", label: "Sức chứa ADF photocopy (tờ)", dataType: "number", example: "100" },
  { profile: "photocopier", code: "photocopier_max_paper_size", label: "Khổ giấy tối đa photocopy", dataType: "enum", example: "A3" },
  { profile: "photocopier", code: "photocopier_connectivity", label: "Kết nối photocopy", dataType: "enum_list", example: "LAN, USB" },
  { profile: "photocopier", code: "photocopier_monthly_duty", label: "Công suất photocopy/tháng", dataType: "number", example: "100000" },
];

const COLUMN_BY_LABEL = new Map(
  [
    ...Object.entries(LABELS),
    ...SPEC_COLUMNS.map((spec) => [`attribute.${spec.code}`, spec.label]),
    ["attributesJSON", "Thuộc tính JSON"],
  ].map(([key, label]) => [label.toLowerCase(), key]),
);

type AttributeImport = {
  code: string;
  value: boolean | number | string | string[];
};

function csvEscape(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function columnsForProfile(profile: ProductExportProfile) {
  const specs =
    profile === "all"
      ? SPEC_COLUMNS
      : SPEC_COLUMNS.filter((spec) => spec.profile === profile);
  return [...BASE_COLUMNS, ...specs.map((spec) => `attribute.${spec.code}`)];
}

function templateColumnsForProfile(profile: ProductExportProfile) {
  const specs =
    profile === "all"
      ? SPEC_COLUMNS
      : SPEC_COLUMNS.filter((spec) => spec.profile === profile);
  return [...BASE_COLUMNS, ...specs.map((spec) => `attribute.${spec.code}`)];
}

function labelForColumn(column: string) {
  if (column in LABELS) return LABELS[column as keyof typeof LABELS];
  return SPEC_COLUMNS.find((spec) => `attribute.${spec.code}` === column)?.label || column;
}

function recordsToCSV(
  records: RecordRow[],
  profile: ProductExportProfile,
  template = false,
) {
  const columns = template
    ? templateColumnsForProfile(profile)
    : columnsForProfile(profile);
  const rows = [
    columns.map((column) => csvEscape(labelForColumn(column))).join(","),
    ...records.map((record) =>
      columns.map((column) => csvEscape(record[column])).join(","),
    ),
  ];
  return `\uFEFF${rows.join("\r\n")}`;
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnWidth(column: string) {
  if (column === "productName") return 280;
  if (column === "brandName" || column === "categoryName" || column === "variantName") return 180;
  if (column === "sourceUrl") return 260;
  if (column === "internalId" || column === "sku" || column === "model" || column === "mpn") return 150;
  if (column.includes("connectivity")) return 190;
  if (column.includes("resolution") || column.includes("Speed") || column.includes("speed")) return 155;
  if (column.includes("attribute.")) return 170;
  return 135;
}

function columnRequirement(column: string) {
  if (REQUIRED_IMPORT_COLUMNS.has(column)) return "Bắt buộc";
  if (column.startsWith("attribute.")) return "Thông số";
  return "Tùy chọn";
}

function columnHelp(column: string) {
  const spec = SPEC_COLUMNS.find((item) => `attribute.${item.code}` === column);
  if (spec) {
    if (spec.dataType === "boolean") return "Có / Không";
    if (spec.dataType === "enum_list") return "Có thể nhập nhiều giá trị, cách nhau bằng dấu phẩy";
    if (spec.dataType === "number") return "Chỉ nhập số";
    return "Nhập theo giá trị gợi ý";
  }
  const hints: Record<string, string> = {
    productTypeCode: "scanner / printer / photocopier",
    productStatus: "draft / published / archived",
    sourceType: "import / manual / scraper / api",
    isPrimary: "Có / Không",
    variantStatus: "active / draft / discontinued",
    currency: "VND",
    vatIncluded: "Có / Không",
    saleStatus: "active / contact / paused / discontinued",
    stockStatus: "unknown / in_stock / out_of_stock / preorder",
  };
  return hints[column] || "";
}

function dropdownOptions(column: string) {
  const spec = SPEC_COLUMNS.find((item) => `attribute.${item.code}` === column);
  if (spec) {
    if (spec.dataType === "boolean") return ["Có", "Không"];
    if (spec.code.includes("connectivity")) return ["USB", "LAN", "WiFi"];
    if (spec.code.includes("max_paper_size")) return spec.profile === "photocopier" ? ["A4", "A3"] : ["A4", "A3", "Legal"];
    if (spec.code === "printer_technology") return ["Laser", "Phun mực", "LED"];
    return undefined;
  }
  const options: Record<string, string[]> = {
    productTypeCode: ["scanner", "printer", "photocopier"],
    productStatus: ["draft", "published", "archived"],
    sourceType: ["import", "manual", "scraper", "api"],
    isPrimary: ["Có", "Không"],
    variantStatus: ["active", "draft", "discontinued"],
    currency: ["VND"],
    vatIncluded: ["Có", "Không"],
    saleStatus: ["active", "contact", "paused", "discontinued"],
    stockStatus: ["unknown", "in_stock", "out_of_stock", "preorder"],
  };
  return options[column];
}

async function recordsToExcel(
  records: RecordRow[],
  profile: ProductExportProfile,
  template = false,
) {
  const columns = template
    ? templateColumnsForProfile(profile)
    : columnsForProfile(profile);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HPT Tech";
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet(template ? "Mẫu import" : "Sản phẩm");
  worksheet.views = [{ state: "frozen", ySplit: template ? 3 : 1 }];

  columns.forEach((column, index) => {
    worksheet.getColumn(index + 1).width = Math.max(12, Math.ceil(columnWidth(column) / 8));
  });

  if (template) {
    const note = worksheet.addRow([
      "HPT Tech - Mẫu import sản phẩm. Cột có dấu * là bắt buộc. Không đổi tên/xóa dòng tiêu đề màu xanh.",
    ]);
    worksheet.mergeCells(1, 1, 1, columns.length);
    note.height = 24;
    note.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
    note.getCell(1).font = { bold: true, color: { argb: "FF1E3A8A" } };

    const machineHeader = worksheet.addRow(columns);
    machineHeader.hidden = true;
  }

  const headerRow = worksheet.addRow(
    columns.map((column) => {
      const help = columnHelp(column);
      return [
        `${labelForColumn(column)}${REQUIRED_IMPORT_COLUMNS.has(column) ? " *" : ""}`,
        columnRequirement(column),
        help,
      ].filter(Boolean).join("\n");
    }),
  );
  headerRow.height = 54;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F5A86" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF17486D" } },
      left: { style: "thin", color: { argb: "FF17486D" } },
      right: { style: "thin", color: { argb: "FF17486D" } },
      top: { style: "thin", color: { argb: "FF17486D" } },
    };
  });

  for (const [index, record] of records.entries()) {
    const row = worksheet.addRow(columns.map((column) => record[column] || ""));
    row.eachCell((cell) => {
      cell.numFmt = "@";
      cell.alignment = { vertical: "top", wrapText: true };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF6BB4D3" } },
        left: { style: "thin", color: { argb: "FF6BB4D3" } },
        right: { style: "thin", color: { argb: "FF6BB4D3" } },
        top: { style: "thin", color: { argb: "FF6BB4D3" } },
      };
      if (index % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC7EEFB" } };
      }
    });
  }

  if (template) {
    const firstInputRow = headerRow.number + 1;
    const lastInputRow = 300;
    columns.forEach((column, columnIndex) => {
      const options = dropdownOptions(column);
      if (!options?.length) return;
      for (let rowNumber = firstInputRow; rowNumber <= lastInputRow; rowNumber += 1) {
        worksheet.getCell(rowNumber, columnIndex + 1).dataValidation = {
          allowBlank: !REQUIRED_IMPORT_COLUMNS.has(column),
          formulae: [`"${options.join(",")}"`],
          showErrorMessage: true,
          type: "list",
        };
      }
    });
  }

  worksheet.autoFilter = {
    from: { column: 1, row: headerRow.number },
    to: { column: columns.length, row: headerRow.number },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function normalizeParsedRecord(record: RecordRow) {
  const normalized: RecordRow = {};
  for (const [key, value] of Object.entries(record)) {
    normalized[COLUMN_BY_LABEL.get(key.toLowerCase()) || key] = value;
  }
  return normalized;
}

function text(row: RecordRow, key: string) {
  return row[key]?.trim() || undefined;
}

function numberValue(row: RecordRow, key: string) {
  const value = text(row, key);
  if (!value) return undefined;
  const parsed = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function booleanValue(row: RecordRow, key: string, fallback = false) {
  const value = text(row, key);
  if (!value) return fallback;
  return ["1", "true", "yes", "co", "có", "x"].includes(value.toLowerCase());
}

function normalizedChoice(
  value: string | undefined,
  choices: Record<string, string>,
  fallback: string,
) {
  if (!value) return fallback;
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return choices[normalized] || value.trim().toLowerCase();
}

async function findOne(
  payload: Payload,
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
  payload: Payload,
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

async function resolveTaxonomy(
  payload: Payload,
  collection: "brands" | "categories",
  slug?: string,
  name?: string,
) {
  const normalizedSlug = slug || (name ? formatSlug(name) : undefined);
  if (!normalizedSlug && !name) return undefined;
  const existing = await findOne(payload, collection, {
    or: [
      ...(normalizedSlug ? [{ slug: { equals: normalizedSlug } }] : []),
      ...(name ? [{ name: { equals: name } }] : []),
    ],
  });
  if (existing?.id !== undefined) return existing.id;
  const created = await payload.create({
    collection,
    data: {
      name: name || normalizedSlug,
      slug: normalizedSlug,
    },
    overrideAccess: true,
  });
  return created.id;
}

function parseAttributes(value?: string): AttributeImport[] {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("Thuộc tính JSON phải là một mảng.");
  return parsed.map((item) => {
    if (
      !item ||
      typeof item !== "object" ||
      !("code" in item) ||
      !("value" in item) ||
      typeof item.code !== "string"
    ) {
      throw new Error("Mỗi thuộc tính phải có code và value.");
    }
    return {
      code: item.code,
      value: item.value as AttributeImport["value"],
    };
  });
}

function parseHumanBoolean(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (["1", "true", "yes", "co", "x"].includes(normalized)) return true;
  if (["0", "false", "no", "khong"].includes(normalized)) return false;
  throw new Error(`Giá trị Có/Không không hợp lệ: ${value}.`);
}

function parseStaffAttributes(row: RecordRow) {
  const attributes: AttributeImport[] = [];
  for (const spec of SPEC_COLUMNS) {
    const raw = text(row, `attribute.${spec.code}`);
    if (!raw) continue;
    let value: AttributeImport["value"];
    if (spec.dataType === "number") {
      const parsed = Number(raw.replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(parsed)) {
        throw new Error(`${spec.label} phải là số.`);
      }
      value = parsed;
    } else if (spec.dataType === "boolean") {
      value = parseHumanBoolean(raw);
    } else if (spec.dataType === "enum_list") {
      value = raw
        .split(/[,;|]/)
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      value = raw;
    }
    attributes.push({ code: spec.code, value });
  }
  return attributes;
}

function normalizeEnumValue(definition: Doc, value: string) {
  const normalized = value.trim().toLowerCase();
  if (!Array.isArray(definition.options)) return value.trim().toLowerCase();
  const option = definition.options.find((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as Doc;
    return [record.value, record.label].some(
      (candidate) =>
        typeof candidate === "string" &&
        candidate.trim().toLowerCase() === normalized,
    );
  }) as Doc | undefined;
  return option && typeof option.value === "string"
    ? option.value
    : value.trim().toLowerCase();
}

async function mapAttributes(
  payload: Payload,
  productTypeID: ID,
  imported: AttributeImport[],
) {
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
  const definitions = result.docs as Doc[];
  const byCode = new Map(
    definitions.map((definition) => [String(definition.code), definition]),
  );

  return imported.map(({ code, value }) => {
    const definition = byCode.get(code);
    if (!definition?.id) throw new Error(`Không tìm thấy Attribute Definition: ${code}.`);
    const dataType = String(definition.dataType);
    const base = {
      dataType,
      definition: definition.id,
      unit: String(definition.unit || "none"),
    };
    if (dataType === "number") {
      if (typeof value !== "number") throw new Error(`${code} phải là number.`);
      return { ...base, numberValue: value };
    }
    if (dataType === "boolean") {
      if (typeof value !== "boolean") throw new Error(`${code} phải là boolean.`);
      return { ...base, booleanValue: value };
    }
    if (dataType === "enum_list") {
      if (!Array.isArray(value)) throw new Error(`${code} phải là string[].`);
      return {
        ...base,
        enumListValue: value.map((item) => ({
          value: normalizeEnumValue(definition, String(item)),
        })),
      };
    }
    if (typeof value !== "string") throw new Error(`${code} phải là string.`);
    return dataType === "enum"
      ? { ...base, enumValue: normalizeEnumValue(definition, value) }
      : { ...base, textValue: value };
  });
}

export type CanonicalImportResult = {
  created: number;
  errors: Array<{ message: string; row: number; sku?: string }>;
  skipped: number;
  updated: number;
};

export async function importCanonicalProductsRows(parsedRows: RecordRow[]) {
  const payload = await getPayloadClient();
  const rows = parsedRows.map(normalizeParsedRecord);
  const result: CanonicalImportResult = {
    created: 0,
    errors: [],
    skipped: 0,
    updated: 0,
  };

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const sku = text(row, "sku");
    try {
      const productTypeCode = text(row, "productTypeCode");
      const productName = text(row, "productName");
      const model = text(row, "model");
      if (!productTypeCode || !productName || !model || !sku) {
        throw new Error("Thiếu productTypeCode, productName, model hoặc sku.");
      }

      const productType = await findOne(payload, "product-types", {
        code: { equals: productTypeCode },
      });
      if (!productType?.id) {
        throw new Error(`Chưa có Product Type: ${productTypeCode}.`);
      }
      const [brand, category] = await Promise.all([
        resolveTaxonomy(
          payload,
          "brands",
          text(row, "brandSlug"),
          text(row, "brandName"),
        ),
        resolveTaxonomy(
          payload,
          "categories",
          text(row, "categorySlug"),
          text(row, "categoryName"),
        ),
      ]);
      if (!brand || !category) throw new Error("Thiếu brand hoặc category.");

      const staffAttributes = parseStaffAttributes(row);
      const compatibilityAttributes = parseAttributes(text(row, "attributesJSON"));
      const attributes = await mapAttributes(
        payload,
        productType.id,
        staffAttributes.length ? staffAttributes : compatibilityAttributes,
      );
      const internalId = text(row, "internalId");
      const slug = text(row, "slug") || formatSlug(productName);
      const existingVariant = await findOne(payload, "product-variants", {
        sku: { equals: sku },
      });
      const existingProductFromSKU =
        existingVariant && relationID(existingVariant.product) !== undefined
          ? await findOne(payload, "products", {
              id: { equals: relationID(existingVariant.product) },
            })
          : undefined;
      const existingProduct =
        (internalId
          ? await findOne(payload, "products", {
              internalId: { equals: internalId },
            })
          : undefined) ||
        existingProductFromSKU ||
        (await findOne(payload, "products", { slug: { equals: slug } }));
      const finalStatus = normalizedChoice(
        text(row, "productStatus"),
        {
          "ban nhap": "draft",
          draft: "draft",
          "da xuat ban": "published",
          published: "published",
          "luu tru": "archived",
          archived: "archived",
        },
        docText(existingProduct, "status") || "draft",
      );
      const productData = {
        attributes,
        brand,
        category,
        dataModel: "canonical",
        internalId,
        model,
        mpn: text(row, "mpn"),
        name: productName,
        productType: productType.id,
        slug,
        source: {
          type: text(row, "sourceType") || "import",
          url: text(row, "sourceUrl"),
          verified: false,
        },
        status: "draft",
        title: productName,
      };
      const product =
        existingProduct?.id !== undefined
          ? await payload.update({
              collection: "products",
              id: existingProduct.id,
              data: productData,
              overrideAccess: true,
            })
          : await payload.create({
              collection: "products",
              data: productData,
              overrideAccess: true,
            });

      const variant = await upsert(
        payload,
        "product-variants",
        { sku: { equals: sku } },
        {
          barcode: text(row, "barcode"),
          isPrimary: booleanValue(row, "isPrimary", true),
          product: product.id,
          sku,
          status: normalizedChoice(
            text(row, "variantStatus"),
            {
              active: "active",
              "ban nhap": "draft",
              draft: "draft",
              "dang ban": "active",
              "ngung ban": "discontinued",
              discontinued: "discontinued",
            },
            "active",
          ),
          variantName: text(row, "variantName") || "Phiên bản tiêu chuẩn",
          warranty: text(row, "warranty"),
        },
      );

      await upsert(
        payload,
        "product-offers",
        { variant: { equals: variant.id } },
        {
          currency: text(row, "currency") || "VND",
          price: numberValue(row, "price") || 0,
          promotionPrice: numberValue(row, "promotionPrice"),
          saleStatus: normalizedChoice(
            text(row, "saleStatus"),
            {
              active: "active",
              contact: "contact",
              "dang ban": "active",
              "lien he": "contact",
              paused: "paused",
              "tam dung": "paused",
              "ngung ban": "discontinued",
              discontinued: "discontinued",
            },
            "contact",
          ),
          variant: variant.id,
          vatIncluded: booleanValue(row, "vatIncluded", true),
          vatRate: numberValue(row, "vatRate") ?? 10,
        },
      );

      const warehouseName = text(row, "warehouseName") || "Kho chính";
      await upsert(
        payload,
        "product-inventory",
        {
          and: [
            { variant: { equals: variant.id } },
            { warehouseName: { equals: warehouseName } },
          ],
        },
        {
          quantity: numberValue(row, "quantity") ?? 0,
          stockStatus: normalizedChoice(
            text(row, "stockStatus"),
            {
              "chua xac minh": "unknown",
              unknown: "unknown",
              "con hang": "in_stock",
              in_stock: "in_stock",
              "het hang": "out_of_stock",
              out_of_stock: "out_of_stock",
              "dat truoc": "preorder",
              preorder: "preorder",
            },
            "unknown",
          ),
          updatedAt: new Date().toISOString(),
          variant: variant.id,
          warehouseName,
        },
      );

      if (finalStatus !== "draft") {
        await payload.update({
          collection: "products",
          id: product.id,
          data: { status: finalStatus },
          overrideAccess: true,
        });
      }

      if (existingProduct) result.updated += 1;
      else result.created += 1;
    } catch (error) {
      result.skipped += 1;
      result.errors.push({
        message: error instanceof Error ? error.message : String(error),
        row: rowNumber,
        sku,
      });
    }
  }
  return result;
}

export async function importCanonicalProductsCSV(csv: string) {
  return importCanonicalProductsRows(parseCSV(csv));
}

function docText(doc: Doc | undefined, key: string) {
  const value = doc?.[key];
  return value === undefined || value === null ? "" : String(value);
}

function relationDoc(value: unknown) {
  return value && typeof value === "object"
    ? (value as Doc)
    : undefined;
}

function enumDisplayValue(definition: Doc | undefined, value: unknown) {
  if (typeof value !== "string") return "";
  if (!Array.isArray(definition?.options)) return value;
  const option = definition.options.find(
    (item) =>
      item &&
      typeof item === "object" &&
      "value" in item &&
      item.value === value,
  );
  return option && typeof option === "object" && "label" in option
    ? String(option.label)
    : value;
}

function exportedAttributeColumns(product: Doc) {
  const result: RecordRow = {};
  if (!Array.isArray(product.attributes)) return result;
  for (const item of product.attributes) {
    if (!item || typeof item !== "object") continue;
    const row = item as Doc;
    const definition = relationDoc(row.definition);
    const code = docText(definition, "code");
    if (!code) continue;
    const key = `attribute.${code}`;
    if (row.dataType === "number") result[key] = docText(row, "numberValue");
    else if (row.dataType === "boolean") {
      result[key] = row.booleanValue === true ? "Có" : "Không";
    } else if (row.dataType === "enum") {
      result[key] = enumDisplayValue(definition, row.enumValue);
    } else if (row.dataType === "enum_list") {
      result[key] = Array.isArray(row.enumListValue)
        ? row.enumListValue
            .map((value) =>
              enumDisplayValue(definition, relationDoc(value)?.value),
            )
            .filter(Boolean)
            .join(", ")
        : "";
    } else {
      result[key] = docText(row, "textValue");
    }
  }
  return result;
}

async function canonicalExportRecords(
  profile: ProductExportProfile = "all",
) {
  const payload = await getPayloadClient();
  const productsResult = await payload.find({
    collection: "products",
    depth: 2,
    limit: 5000,
    overrideAccess: true,
    sort: "title",
  });
  const products = (productsResult.docs as Doc[]).filter((product) => {
    if (product.dataModel !== "canonical") return false;
    if (profile === "all") return true;
    return docText(relationDoc(product.productType), "code") === profile;
  });
  const productIDs = products
    .map((product) => relationID(product.id))
    .filter((id): id is ID => id !== undefined);
  const variantsResult = await payload.find({
    collection: "product-variants" as never,
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    where: { product: { in: productIDs } },
  });
  const variants = variantsResult.docs as Doc[];
  const variantIDs = variants
    .map((variant) => relationID(variant.id))
    .filter((id): id is ID => id !== undefined);
  const [offersResult, inventoryResult] = await Promise.all([
    payload.find({
      collection: "product-offers" as never,
      depth: 0,
      limit: 5000,
      overrideAccess: true,
      where: { variant: { in: variantIDs } },
    }),
    payload.find({
      collection: "product-inventory" as never,
      depth: 0,
      limit: 5000,
      overrideAccess: true,
      where: { variant: { in: variantIDs } },
    }),
  ]);
  const offers = offersResult.docs as Doc[];
  const inventory = inventoryResult.docs as Doc[];
  const rows: RecordRow[] = [];

  for (const product of products) {
    const productID = relationID(product.id);
    const productVariants = variants.filter(
      (variant) => relationID(variant.product) === productID,
    );
    for (const variant of productVariants.length ? productVariants : [undefined]) {
      const variantID = relationID(variant?.id);
      const offer = offers.find((item) => relationID(item.variant) === variantID);
      const inventoryRows = inventory.filter(
        (item) => relationID(item.variant) === variantID,
      );
      const exportInventories = inventoryRows.length ? inventoryRows : [undefined];
      for (const stock of exportInventories) {
        rows.push({
          ...exportedAttributeColumns(product),
          barcode: docText(variant, "barcode"),
          brandName: docText(relationDoc(product.brand), "name"),
          brandSlug: docText(relationDoc(product.brand), "slug"),
          categoryName: docText(relationDoc(product.category), "name"),
          categorySlug: docText(relationDoc(product.category), "slug"),
          currency: docText(offer, "currency"),
          internalId: docText(product, "internalId"),
          isPrimary: docText(variant, "isPrimary"),
          model: docText(product, "model"),
          mpn: docText(product, "mpn"),
          price: docText(offer, "price"),
          productName: docText(product, "name") || docText(product, "title"),
          productStatus: docText(product, "status"),
          productTypeCode: docText(relationDoc(product.productType), "code"),
          promotionPrice: docText(offer, "promotionPrice"),
          quantity: docText(stock, "quantity"),
          saleStatus: docText(offer, "saleStatus"),
          sku: docText(variant, "sku"),
          slug: docText(product, "slug"),
          sourceType: docText(relationDoc(product.source), "type"),
          sourceUrl: docText(relationDoc(product.source), "url"),
          stockStatus: docText(stock, "stockStatus"),
          variantName: docText(variant, "variantName"),
          variantStatus: docText(variant, "status"),
          vatIncluded: docText(offer, "vatIncluded"),
          vatRate: docText(offer, "vatRate"),
          warehouseName: docText(stock, "warehouseName"),
          warranty: docText(variant, "warranty"),
        });
      }
    }
  }
  return rows;
}

export async function exportCanonicalProductsCSV(
  profile: ProductExportProfile = "all",
) {
  return recordsToCSV(await canonicalExportRecords(profile), profile);
}

export async function exportCanonicalProductsExcel(
  profile: ProductExportProfile = "all",
) {
  return recordsToExcel(await canonicalExportRecords(profile), profile);
}

function canonicalTemplateRecords(
  profile: ProductExportProfile = "scanner",
) {
  const code = profile === "all" ? "scanner" : profile;
  const specValues = Object.fromEntries(
    SPEC_COLUMNS.filter((spec) => spec.profile === code).map((spec) => [
      `attribute.${spec.code}`,
      spec.example,
    ]),
  );
  return [
    {
      ...specValues,
      brandName: "Brother",
      brandSlug: "brother",
      categoryName:
        code === "printer"
          ? "Máy in"
          : code === "photocopier"
            ? "Máy photocopy"
            : "Máy scan",
      categorySlug:
        code === "printer"
          ? "may-in"
          : code === "photocopier"
            ? "may-photocopy"
            : "may-scan",
      currency: "VND",
      internalId: "HPT-SAMPLE-001",
      isPrimary: "Có",
      model: "MODEL-001",
      price: "10000000",
      productName: "Sản phẩm mẫu",
      productStatus: "Bản nháp",
      productTypeCode: code,
      quantity: "0",
      saleStatus: "Liên hệ",
      sku: "SKU-SAMPLE-001",
      sourceType: "import",
      stockStatus: "Chưa xác minh",
      variantName: "Phiên bản tiêu chuẩn",
      variantStatus: "Đang bán",
      vatIncluded: "Có",
      vatRate: "10",
      warehouseName: "Kho chính",
    },
  ];
}

export function canonicalProductTemplateCSV(
  profile: ProductExportProfile = "scanner",
) {
  return recordsToCSV(canonicalTemplateRecords(profile), profile, true);
}

export async function canonicalProductTemplateExcel(
  profile: ProductExportProfile = "scanner",
) {
  return recordsToExcel(canonicalTemplateRecords(profile), profile, true);
}
