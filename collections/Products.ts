import { randomUUID } from "crypto";
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
} from "payload";
import { lexicalHTMLField } from "@payloadcms/richtext-lexical";
import {
  ATTRIBUTE_DATA_TYPE_OPTIONS,
  ATTRIBUTE_UNIT_OPTIONS,
  hasTypedAttributeValue,
  relationID,
  type AttributeDataType,
} from "../lib/catalog-schema.ts";
import { SOFTWARE_CATEGORY_NAME } from "../lib/product-category.ts";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";
import { preventProductDeleteWithVariants } from "../lib/payload/hooks/catalog-lifecycle.ts";

const specProfileOptions = [
  { label: "Máy scan", value: "scanner" },
  { label: "Máy in", value: "printer" },
  { label: "Photocopy", value: "photocopier" },
  { label: SOFTWARE_CATEGORY_NAME, value: "software" },
  { label: "Khác / nhập thủ công", value: "other" },
];

type ProductFormData = {
  category?: unknown;
  specProfile?: string;
};

type CanonicalAttributeRow = Record<string, unknown> & {
  definition?: unknown;
};

type CanonicalProductData = Record<string, unknown> & {
  attributes?: CanonicalAttributeRow[];
  brand?: unknown;
  category?: unknown;
  dataModel?: string;
  internalId?: string;
  model?: string;
  name?: string;
  productType?: unknown;
  scannerSpecs?: Record<string, unknown>;
  specProfile?: string;
  specs?: unknown;
  slug?: string;
  status?: string;
  title?: string;
};

const prepareCanonicalProduct: CollectionBeforeValidateHook = ({
  data,
  operation,
  originalDoc,
}) => {
  const product = (data || {}) as CanonicalProductData;
  const existingDataModel =
    originalDoc && typeof originalDoc === "object" && "dataModel" in originalDoc
      ? originalDoc.dataModel
      : undefined;
  const dataModel =
    product.dataModel ||
    (typeof existingDataModel === "string"
      ? existingDataModel
      : operation === "create"
        ? "canonical"
        : "legacy");
  if (dataModel !== "canonical") {
    return {
      ...product,
      dataModel,
    };
  }

  return {
    ...product,
    dataModel,
    internalId:
      product.internalId ||
      (originalDoc && typeof originalDoc === "object" && "internalId" in originalDoc
        ? originalDoc.internalId
        : undefined) ||
      `HPT-${randomUUID().slice(0, 8).toUpperCase()}`,
    title:
      product.name ||
      product.title ||
      (originalDoc && typeof originalDoc === "object" && "title" in originalDoc
        ? originalDoc.title
        : undefined),
    specs: product.specs,
  };
};

const validateCanonicalProduct: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const product = {
    ...(originalDoc && typeof originalDoc === "object" ? originalDoc : {}),
    ...data,
  } as CanonicalProductData;
  if (product.dataModel !== "canonical" || product.status !== "published") return data;

  const missingFields = [
    ["internalId", product.internalId],
    ["productType", relationID(product.productType)],
    ["brand", relationID(product.brand)],
    ["model", product.model],
    ["name", product.name],
    ["slug", product.slug],
  ]
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (missingFields.length) {
    throw new Error(
      `Không thể publish sản phẩm chuẩn. Thiếu field: ${missingFields.join(", ")}.`,
    );
  }

  const productTypeID = relationID(product.productType);
  const definitionResult = await req.payload.find({
    collection: "attribute-definitions" as never,
    depth: 0,
    limit: 500,
    where: {
      and: [
        { productType: { equals: productTypeID } },
        { status: { equals: "active" } },
      ],
    },
  });

  const definitions = definitionResult.docs as Array<Record<string, unknown>>;
  const definitionsByID = new Map(
    definitions.map((definition) => [String(definition.id), definition]),
  );
  const suppliedDefinitionIDs = new Set<string>();

  for (const row of product.attributes || []) {
    const definitionID = relationID(row.definition);
    if (!definitionID) throw new Error("Mỗi thuộc tính sản phẩm phải chọn một định nghĩa.");

    const definition = definitionsByID.get(String(definitionID));
    if (!definition) {
      throw new Error("Thuộc tính không thuộc loại sản phẩm đã chọn hoặc đã ngừng dùng.");
    }
    if (suppliedDefinitionIDs.has(String(definitionID))) {
      throw new Error(`Thuộc tính ${String(definition.label || definition.code)} bị nhập trùng.`);
    }

    const dataType = definition.dataType as AttributeDataType;
    if (row.dataType !== dataType) {
      throw new Error(
        `Thuộc tính ${String(definition.label || definition.code)} phải có kiểu ${dataType}.`,
      );
    }
    if (row.unit !== definition.unit) {
      throw new Error(
        `Thuộc tính ${String(definition.label || definition.code)} phải dùng đơn vị ${String(definition.unit)}.`,
      );
    }
    if (!hasTypedAttributeValue(row, dataType)) {
      throw new Error(
        `Thuộc tính ${String(definition.label || definition.code)} chưa có giá trị hợp lệ.`,
      );
    }

    if (dataType === "enum" || dataType === "enum_list") {
      const allowedValues = new Set(
        Array.isArray(definition.options)
          ? definition.options
              .map((option) =>
                option && typeof option === "object" && "value" in option
                  ? String(option.value)
                  : "",
              )
              .filter(Boolean)
          : [],
      );
      const selectedValues =
        dataType === "enum"
          ? [String(row.enumValue || "")]
          : Array.isArray(row.enumListValue)
            ? row.enumListValue.map((item) =>
                item && typeof item === "object" && "value" in item
                  ? String(item.value)
                  : "",
              )
            : [];
      const invalidValues = selectedValues.filter(
        (value) => !value || !allowedValues.has(value),
      );
      if (invalidValues.length) {
        throw new Error(
          `Thuộc tính ${String(definition.label || definition.code)} có lựa chọn không hợp lệ: ${invalidValues.join(", ")}.`,
        );
      }
    }
    suppliedDefinitionIDs.add(String(definitionID));
  }

  const flexibleSpecProfile =
    product.specProfile === "scanner" ||
    product.specProfile === "printer" ||
    product.specProfile === "photocopier" ||
    specProfileFromCategory(product.category) === "scanner" ||
    specProfileFromCategory(product.category) === "printer" ||
    specProfileFromCategory(product.category) === "photocopier";
  if (flexibleSpecProfile) {
    return data;
  }

  const missingRequired = definitions
    .filter(
      (definition) =>
        definition.required === true &&
        !suppliedDefinitionIDs.has(String(definition.id)),
    )
    .map((definition) => String(definition.label || definition.code));

  if (missingRequired.length) {
    throw new Error(
      `Không thể publish. Thiếu thuộc tính bắt buộc: ${missingRequired.join(", ")}.`,
    );
  }

  return data;
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function categoryText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(categoryText).join(" ");
  if (typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  return [
    record.name,
    record.title,
    record.label,
    record.slug,
    record.value,
    record.relationTo,
    categoryText(record.doc),
  ]
    .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
    .map(String)
    .join(" ");
}

function specProfileFromCategory(category: unknown) {
  const text = normalizeText(categoryText(category));
  if (!text) return undefined;
  if (text.includes("scan")) return "scanner";
  if (text.includes("photo") || text.includes("copy")) return "photocopier";
  if (text.includes("may in") || text.includes("printer")) return "printer";
  return undefined;
}

function specCondition(profile: "scanner" | "printer" | "photocopier") {
  return (data: ProductFormData = {}, siblingData: ProductFormData = {}) => {
    const categoryProfile = specProfileFromCategory(data.category ?? siblingData.category);
    return categoryProfile ? categoryProfile === profile : siblingData?.specProfile === profile;
  };
}

function legacyOnly(data: Record<string, unknown> = {}) {
  return data.dataModel !== "canonical";
}

function row(fields: Field[]): Field {
  return {
    type: "row",
    fields,
  };
}

function textSpec(name: string, label: string, width = "50%", description?: string): Field {
  return {
    name,
    label,
    type: "text",
    admin: {
      width,
      description,
    },
  };
}

function numberSpec(name: string, label: string, width = "50%", description?: string): Field {
  return {
    name,
    label,
    type: "number",
    min: 0,
    admin: {
      width,
      description,
    },
  };
}

function hiddenTextSpec(name: string): Field {
  return {
    name,
    label: name,
    type: "text",
    admin: {
      hidden: true,
    },
  };
}

function hiddenNumberSpec(name: string): Field {
  return {
    name,
    label: name,
    type: "number",
    min: 0,
    admin: {
      hidden: true,
    },
  };
}

function hiddenCheckboxSpec(name: string): Field {
  return {
    name,
    label: name,
    type: "checkbox",
    defaultValue: false,
    admin: {
      hidden: true,
    },
  };
}

const scannerSpecsField: Field = {
  name: "scannerSpecs",
  label: "Bộ thông số Máy scan",
  type: "group",
  admin: {
    condition: specCondition("scanner"),
    description: "Các trường chuẩn dành riêng cho máy scan. Nhân viên nhập theo datasheet để AI Search lọc đúng tốc độ, ADF, kết nối và nhu cầu sử dụng.",
  },
  fields: [
    row([
      textSpec("scannerType", "Loại máy scan", "50%", "Ví dụ: ADF, Flatbed, ADF + Flatbed, Sheet-fed."),
      textSpec("functions", "Chức năng", "50%", "Ví dụ: scan 2 mặt, scan màu, OCR, scan thẻ."),
    ]),
    row([
      numberSpec("scanSpeedSimplexPpm", "Tốc độ scan", "50%", "Nhập số tờ/phút hoặc ppm. Ví dụ: 40."),
      numberSpec("scanSpeedDuplexIpm", "Tốc độ scan 2 mặt", "50%", "Nhập số ảnh/phút hoặc ipm. Ví dụ: 80."),
    ]),
    row([
      textSpec("scanModes", "Chế độ quét", "50%", "Ví dụ: màu, xám, đen trắng, tự động 2 mặt."),
      textSpec("scanResolution", "Độ phân giải quang học", "50%", "Ví dụ: 600 x 600 dpi."),
    ]),
    row([
      textSpec("displayScreen", "Màn hình hiển thị", "50%", "Ví dụ: LED, LCD, màn hình cảm ứng."),
      textSpec("scanTechnology", "Công nghệ quét", "50%", "Ví dụ: CMOS, CIS, CCD."),
    ]),
    row([
      numberSpec("adfSheets", "ADF", "50%", "Sức chứa khay nạp tự động, ví dụ: 80."),
      numberSpec("adfCapacitySheets", "Sức chứa ADF", "50%", "Nếu khác với ADF, nhập số tờ tối đa."),
    ]),
    row([
      textSpec("maxPaperSize", "Khổ giấy tối đa", "50%", "Ví dụ: A4, Legal, A3."),
      textSpec("minPaperSize", "Khổ giấy tối thiểu", "50%"),
    ]),
    row([
      numberSpec("dailyDuty", "Công suất/ngày", "50%", "Ví dụ: 4000."),
      textSpec("passportScanText", "Scan hộ chiếu", "50%", "Ví dụ: Có, Không, hỗ trợ scan hộ chiếu."),
    ]),
    row([
      textSpec("duplexScanText", "Scan hai mặt", "50%", "Ví dụ: Có, Không, tự động hai mặt."),
      textSpec("colorScanText", "Scan màu", "50%", "Ví dụ: Có, Không, màu/xám/đen trắng."),
    ]),
    row([
      textSpec("ocrText", "OCR", "50%", "Ví dụ: Có, Không, OCR tiếng Việt/tiếng Anh."),
      textSpec("plasticCardScanText", "Scan thẻ nhựa", "50%", "Ví dụ: Có, Không, thẻ ID/card nhựa."),
    ]),
    row([
      textSpec("connectivity", "Kết nối", "50%", "Ví dụ: USB 3.0, LAN, WiFi."),
      textSpec("supportedOs", "Hệ điều hành hỗ trợ", "50%", "Ví dụ: Windows, macOS, Linux."),
    ]),
    row([
      textSpec("dimensions", "Kích thước", "50%", "Ví dụ: 454 x 331 x 129 mm."),
      textSpec("weight", "Trọng lượng", "50%", "Ví dụ: 4.3 kg."),
    ]),
    hiddenTextSpec("dimensionsWeight"),
    hiddenCheckboxSpec("passportScan"),
    hiddenCheckboxSpec("duplexScan"),
    hiddenCheckboxSpec("colorScan"),
    hiddenCheckboxSpec("ocr"),
    hiddenCheckboxSpec("plasticCardScan"),
  ],
};

const printerSpecsField: Field = {
  name: "printerSpecs",
  label: "Bộ thông số Máy in",
  type: "group",
  admin: {
    condition: specCondition("printer"),
    description: "Các trường chuẩn dành riêng cho máy in. Nhập dạng text theo datasheet để tránh sai đơn vị hoặc thiếu ghi chú kỹ thuật.",
  },
  fields: [
    row([
      textSpec("printerType", "Loại máy in", "50%", "Ví dụ: laser trắng đen, laser màu, phun màu, đa năng."),
      textSpec("functions", "Chức năng", "50%", "Ví dụ: in, copy, scan, fax."),
    ]),
    row([
      textSpec("printTechnology", "Công nghệ in", "50%", "Ví dụ: Laser, Inkjet, LED."),
      textSpec("printSpeed", "Tốc độ in", "50%", "Ví dụ: 40 trang/phút, 40 ppm."),
    ]),
    row([
      textSpec("printResolution", "Độ phân giải in", "50%", "Ví dụ: 1200 x 1200 dpi."),
      textSpec("maxPaperSize", "Khổ giấy tối đa", "50%", "Ví dụ: A4, A3."),
    ]),
    row([
      textSpec("colorPrintText", "In màu", "50%", "Ví dụ: Có, Không, In màu laser."),
      textSpec("autoDuplexPrintText", "In đảo mặt tự động", "50%", "Ví dụ: Có, Không, Duplex tự động."),
    ]),
    row([
      textSpec("standardPaperTray", "Khay giấy tiêu chuẩn", "50%", "Ví dụ: 250 tờ."),
      textSpec("maxPaperTray", "Khay giấy tối đa", "50%", "Ví dụ: 900 tờ."),
    ]),
    row([
      textSpec("memoryRam", "Bộ nhớ RAM", "50%", "Ví dụ: 256MB, 1GB."),
      textSpec("connectivity", "Kết nối", "50%", "Ví dụ: USB, LAN, WiFi."),
    ]),
    row([
      textSpec("supportedOs", "Hệ điều hành hỗ trợ", "50%"),
      textSpec("recommendedMonthlyVolumeText", "Công suất khuyến nghị/tháng", "50%", "Ví dụ: 750 - 4.000 trang/tháng."),
    ]),
    row([
      textSpec("maxMonthlyDuty", "Công suất tối đa/tháng", "50%", "Ví dụ: 80.000 trang/tháng."),
      textSpec("dimensions", "Kích thước", "50%", "Ví dụ: 356 x 360 x 183 mm."),
    ]),
    row([
      textSpec("weight", "Trọng lượng", "50%", "Ví dụ: 7,2 kg."),
    ]),
    hiddenNumberSpec("printSpeedPpm"),
    hiddenCheckboxSpec("colorPrint"),
    hiddenCheckboxSpec("autoDuplexPrint"),
    hiddenNumberSpec("standardPaperTraySheets"),
    hiddenNumberSpec("maxPaperTraySheets"),
    hiddenNumberSpec("monthlyDuty"),
    hiddenNumberSpec("recommendedMonthlyVolume"),
    hiddenTextSpec("dimensionsWeight"),
    hiddenTextSpec("inkType"),
  ],
};

const photocopierSpecsField: Field = {
  name: "photocopierSpecs",
  label: "Bộ thông số Photocopy",
  type: "group",
  admin: {
    condition: specCondition("photocopier"),
    description: "Các trường chuẩn dành riêng cho máy photocopy. Nhập dạng text theo datasheet để tránh sai đơn vị hoặc thiếu ghi chú kỹ thuật.",
  },
  fields: [
    row([
      textSpec("copierType", "Loại máy", "50%", "Ví dụ: photocopy A3, A4, màu, đen trắng."),
      textSpec("functions", "Chức năng", "50%", "Ví dụ: copy, in, scan, fax."),
    ]),
    row([
      textSpec("copySpeed", "Tốc độ copy", "50%", "Ví dụ: 35 bản/phút."),
      textSpec("printSpeed", "Tốc độ in", "50%", "Ví dụ: 35 trang/phút."),
    ]),
    row([
      textSpec("scanSpeed", "Tốc độ scan", "50%", "Ví dụ: 80 ảnh/phút."),
      textSpec("maxPaperSize", "Khổ giấy tối đa", "50%", "Ví dụ: A3, A4."),
    ]),
    row([
      textSpec("copyResolution", "Độ phân giải copy", "50%", "Ví dụ: 600 x 600 dpi."),
      textSpec("printResolution", "Độ phân giải in", "50%"),
    ]),
    row([
      textSpec("scanResolution", "Độ phân giải scan", "50%"),
      textSpec("colorPrintText", "In màu", "50%", "Ví dụ: Có, Không."),
    ]),
    row([
      textSpec("autoDuplexPrintText", "In hai mặt tự động", "50%", "Ví dụ: Có, Không, Duplex tự động."),
      textSpec("adfText", "ADF", "50%", "Ví dụ: Có, Không, DADF/RADF."),
    ]),
    row([
      textSpec("adfCapacity", "Sức chứa ADF", "50%", "Ví dụ: 100 tờ."),
      textSpec("memoryRam", "Bộ nhớ RAM", "50%"),
    ]),
    row([
      textSpec("connectivity", "Kết nối", "50%", "Ví dụ: LAN, USB, WiFi."),
      textSpec("monthlyDuty", "Công suất/tháng", "50%", "Ví dụ: 100.000 bản/tháng."),
    ]),
    textSpec("dimensionsWeight", "Kích thước / Trọng lượng", "100%"),
    hiddenNumberSpec("copySpeedCpm"),
    hiddenNumberSpec("scanSpeedPpm"),
    hiddenCheckboxSpec("colorPrint"),
    hiddenCheckboxSpec("colorScan"),
    hiddenCheckboxSpec("autoDuplexPrint"),
    hiddenCheckboxSpec("hasAdf"),
    hiddenNumberSpec("adfSheets"),
    hiddenNumberSpec("standardPaperTraySheets"),
    hiddenNumberSpec("maxPaperTraySheets"),
  ],
};

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Sản phẩm",
    plural: "Sản phẩm",
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      } as const;
    },
  },
  admin: {
    defaultColumns: [
      "title",
      "internalId",
      "model",
      "productType",
      "brand",
      "status",
    ],
    group: "Danh mục sản phẩm",
    useAsTitle: "title",
  },
  hooks: {
    beforeValidate: [prepareCanonicalProduct],
    beforeChange: [validateCanonicalProduct],
    beforeDelete: [preventProductDeleteWithVariants],
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Catalog chuẩn",
          fields: [
            {
              name: "dataModel",
              label: "Mô hình dữ liệu",
              type: "select",
              options: [
                { label: "Catalog chuẩn", value: "canonical" },
                { label: "Legacy - chờ migration", value: "legacy" },
              ],
              required: true,
              admin: {
                description:
                  "Sản phẩm cũ giữ legacy đến khi migration. Sản phẩm mới phải dùng Catalog chuẩn.",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "internalId",
                  label: "Mã catalog nội bộ",
                  type: "text",
                  unique: true,
                  index: true,
                  admin: {
                    width: "50%",
                    description:
                      "Định danh ổn định của Product, tự sinh khi tạo mới. Không dùng tên sản phẩm.",
                  },
                },
                {
                  name: "productType",
                  label: "Loại sản phẩm",
                  type: "relationship",
                  relationTo: "product-types",
                  index: true,
                  admin: { width: "50%" },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "name",
                  label: "Tên catalog",
                  type: "text",
                  admin: {
                    width: "50%",
                    description:
                      "Tên chính thức của model. Field này đồng bộ sang Tên sản phẩm legacy.",
                  },
                },
                {
                  name: "mpn",
                  label: "MPN của hãng",
                  type: "text",
                  index: true,
                  admin: {
                    width: "50%",
                    description: "Manufacturer Part Number, chỉ nhập mã do hãng công bố.",
                  },
                },
              ],
            },
            {
              name: "source",
              label: "Nguồn dữ liệu",
              type: "group",
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "type",
                      label: "Loại nguồn",
                      type: "select",
                      defaultValue: "manual",
                      options: [
                        { label: "Nhập tay", value: "manual" },
                        { label: "Website hãng", value: "manufacturer" },
                        { label: "Scraper", value: "scraper" },
                        { label: "Import Excel", value: "import" },
                      ],
                      required: true,
                      admin: { width: "50%" },
                    },
                    {
                      name: "verified",
                      label: "Đã xác minh",
                      type: "checkbox",
                      defaultValue: false,
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "url",
                  label: "URL nguồn",
                  type: "text",
                },
                {
                  name: "verifiedAt",
                  label: "Thời điểm xác minh",
                  type: "date",
                  admin: {
                    condition: (_, siblingData) => Boolean(siblingData?.verified),
                  },
                },
              ],
            },
            {
              name: "shortDescription",
              label: "Mô tả ngắn chuẩn",
              type: "textarea",
              admin: {
                description:
                  "Nội dung ngắn có cấu trúc cho catalog, báo giá và các kênh tích hợp.",
              },
            },
          ],
        },
        {
          label: "Thuộc tính chuẩn",
          fields: [
            {
              name: "attributes",
              label: "Giá trị thuộc tính",
              type: "array",
              admin: {
                description:
                  "Chọn định nghĩa thuộc tính và nhập đúng cột giá trị theo kiểu dữ liệu.",
              },
              fields: [
                {
                  name: "definition",
                  label: "Định nghĩa thuộc tính",
                  type: "relationship",
                  relationTo: "attribute-definitions",
                  required: true,
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "dataType",
                      label: "Kiểu dữ liệu",
                      type: "select",
                      options: ATTRIBUTE_DATA_TYPE_OPTIONS.map((option) => ({
                        ...option,
                      })),
                      required: true,
                      admin: { width: "50%" },
                    },
                    {
                      name: "unit",
                      label: "Đơn vị",
                      type: "select",
                      defaultValue: "none",
                      options: ATTRIBUTE_UNIT_OPTIONS.map((option) => ({
                        ...option,
                      })),
                      required: true,
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "numberValue",
                  label: "Giá trị số",
                  type: "number",
                  admin: {
                    condition: (_, siblingData) => siblingData?.dataType === "number",
                  },
                },
                {
                  name: "textValue",
                  label: "Giá trị văn bản",
                  type: "text",
                  admin: {
                    condition: (_, siblingData) => siblingData?.dataType === "text",
                  },
                },
                {
                  name: "booleanValue",
                  label: "Giá trị Có / Không",
                  type: "checkbox",
                  admin: {
                    condition: (_, siblingData) => siblingData?.dataType === "boolean",
                  },
                },
                {
                  name: "enumValue",
                  label: "Giá trị lựa chọn",
                  type: "text",
                  admin: {
                    condition: (_, siblingData) => siblingData?.dataType === "enum",
                    description: "Nhập value đã định nghĩa trong Attribute Definition.",
                  },
                },
                {
                  name: "enumListValue",
                  label: "Danh sách lựa chọn",
                  type: "array",
                  admin: {
                    condition: (_, siblingData) =>
                      siblingData?.dataType === "enum_list",
                  },
                  fields: [
                    {
                      name: "value",
                      label: "Giá trị",
                      type: "text",
                      required: true,
                    },
                  ],
                },
                {
                  name: "rawValue",
                  label: "Giá trị gốc",
                  type: "text",
                  admin: {
                    description:
                      "Tùy chọn. Lưu chuỗi từ datasheet để truy vết, không dùng để filter.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Thông tin chung",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  label: "Tên sản phẩm",
                  type: "text",
                  required: true,
                  admin: {
                    width: "50%",
                  },
                },
                {
                  name: "sku",
                  label: "Mã sản phẩm (SKU)",
                  type: "text",
                  admin: {
                    condition: legacyOnly,
                    width: "25%",
                    description: "Ví dụ: HL-L2366DW",
                  },
                },
                {
                  name: "model",
                  label: "Model",
                  type: "text",
                  admin: {
                    width: "25%",
                    description: "Ví dụ: ADS-4300N, DS-790WN, LaserJet 4003dn.",
                  },
                },
              ],
            },
            {
              name: "slug",
              label: "Đường dẫn",
              type: "text",
              required: true,
              unique: true,
              admin: {
                description: "Đường dẫn thân thiện dùng trên website.",
              },
              hooks: {
                beforeValidate: [
                  ({ data, value }) =>
                    value ||
                    (data?.name
                      ? formatSlug(data.name)
                      : data?.title
                        ? formatSlug(data.title)
                        : value),
                ],
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "brand",
                  label: "Thương hiệu",
                  type: "relationship",
                  relationTo: "brands",
                  required: true,
                  index: true,
                  admin: {
                    width: "50%",
                  },
                },
                {
                  name: "stockStatus",
                  label: "Tình trạng hàng",
                  type: "select",
                  defaultValue: "in_stock",
                  options: [
                    {
                      label: "Còn hàng",
                      value: "in_stock",
                    },
                    {
                      label: "Hết hàng",
                      value: "out_of_stock",
                    },
                    {
                      label: "Đặt trước",
                      value: "preorder",
                    },
                  ],
                  admin: {
                    condition: legacyOnly,
                    width: "50%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "price",
                  label: "Giá bán",
                  type: "text",
                  admin: {
                    condition: legacyOnly,
                    width: "50%",
                    description: "Nhập theo định dạng hiển thị, ví dụ: 3.900.000đ.",
                  },
                },
                {
                  name: "compareAtPrice",
                  label: "Giá niêm yết",
                  type: "text",
                  admin: {
                    condition: legacyOnly,
                    width: "50%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "vatIncluded",
                  label: "Giá đã gồm VAT",
                  type: "checkbox",
                  defaultValue: true,
                  admin: {
                    condition: legacyOnly,
                    width: "33%",
                  },
                },
                {
                  name: "rating",
                  label: "Điểm đánh giá",
                  type: "number",
                  min: 0,
                  max: 5,
                  admin: {
                    width: "33%",
                    description: "Từ 0 đến 5 sao.",
                  },
                },
                {
                  name: "reviewCount",
                  label: "Số đánh giá",
                  type: "number",
                  min: 0,
                  defaultValue: 0,
                  admin: {
                    width: "34%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "viewCount",
                  label: "Lượt xem",
                  type: "number",
                  min: 0,
                  admin: {
                    width: "33%",
                  },
                },
                {
                  name: "discountBadge",
                  label: "Nhãn giảm giá",
                  type: "text",
                  admin: {
                    width: "33%",
                    description: "Ví dụ: Giảm 15%, Quà tặng, Hot deal.",
                  },
                },
                {
                  name: "promoText",
                  label: "Nội dung khuyến mãi",
                  type: "text",
                  admin: {
                    width: "34%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "promoStart",
                  label: "Ngày bắt đầu khuyến mãi",
                  type: "date",
                  admin: {
                    date: {
                      pickerAppearance: "dayOnly",
                    },
                    width: "50%",
                  },
                },
                {
                  name: "promoEnd",
                  label: "Ngày kết thúc khuyến mãi",
                  type: "date",
                  admin: {
                    date: {
                      pickerAppearance: "dayOnly",
                    },
                    width: "50%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "warranty",
                  label: "Bảo hành",
                  type: "text",
                  admin: {
                    condition: legacyOnly,
                    width: "50%",
                    description: "Ví dụ: 12 tháng.",
                  },
                },
                {
                  name: "origin",
                  label: "Xuất xứ",
                  type: "text",
                  admin: {
                    width: "50%",
                  },
                },
              ],
            },
            {
              name: "summary",
              label: "Mô tả ngắn",
              type: "richText",
              admin: {
                description: "Hiển thị ở danh sách và phần đầu trang sản phẩm.",
              },
            },
            lexicalHTMLField({
              htmlFieldName: "summaryHTML",
              lexicalFieldName: "summary",
            }),
            {
              name: "sellingPoints",
              label: "Điểm nổi bật",
              type: "array",
              admin: {
                description: "Các gạch đầu dòng nổi bật hiển thị ở khối đầu trang sản phẩm.",
              },
              fields: [
                {
                  name: "text",
                  label: "Nội dung",
                  type: "text",
                  required: true,
                },
              ],
            },
            {
              name: "tag",
              label: "Nhãn nổi bật",
              type: "select",
              options: [
                { label: "Mới", value: "Mới" },
                { label: "Bán chạy", value: "Bán chạy" },
                { label: "Cao cấp", value: "Cao cấp" },
                { label: "Khuyến mãi", value: "Khuyến mãi" },
              ],
            },
            {
              name: "relatedProducts",
              label: "Sản phẩm liên quan",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
            },
            {
              name: "description",
              label: "Nội dung bài viết",
              type: "richText",
              admin: {
                description: "Nội dung chính hiển thị ở trang chi tiết sản phẩm.",
              },
            },
            lexicalHTMLField({
              htmlFieldName: "descriptionHTML",
              lexicalFieldName: "description",
            }),
            {
              name: "usageGuide",
              label: "Hướng dẫn sử dụng",
              type: "richText",
              admin: {
                description: "Hướng dẫn lắp đặt, vận hành hoặc lưu ý khi sử dụng sản phẩm.",
              },
            },
            lexicalHTMLField({
              htmlFieldName: "usageGuideHTML",
              lexicalFieldName: "usageGuide",
            }),
          ],
        },
        {
          label: "Thông số kỹ thuật",
          fields: [
            {
              name: "specProfile",
              label: "Bộ thông số kỹ thuật",
              type: "select",
              defaultValue: "other",
              options: specProfileOptions,
              admin: {
                description:
                  "CMS sẽ ưu tiên tự hiện bộ field theo Danh mục đã chọn ở sidebar. Nếu danh mục chưa nhận diện được, chọn thủ công tại đây.",
              },
            },
            scannerSpecsField,
            printerSpecsField,
            photocopierSpecsField,
            {
              name: "specs",
              label: "Thông số kỹ thuật từ nguồn",
              type: "array",
              admin: {
                description:
                  "Lưu nguyên các thông số lấy được từ trang nguồn, không bắt buộc theo bộ cột cố định.",
              },
              fields: [
                {
                  name: "label",
                  label: "Tên thông số",
                  type: "text",
                  required: true,
                  admin: {
                    width: "40%",
                  },
                },
                {
                  name: "value",
                  label: "Giá trị",
                  type: "text",
                  required: true,
                  admin: {
                    width: "60%",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Hình ảnh & Tài liệu",
          fields: [
            {
              name: "datasheets",
              label: "Tài liệu kỹ thuật",
              type: "upload",
              relationTo: "media",
              hasMany: true,
              admin: {
                description: "Dùng cho PDF catalogue, datasheet hoặc tài liệu hướng dẫn.",
              },
            },
          ],
        },
        {
          label: "SEO",
          fields: [seoField],
        },
        {
          label: "Nâng cao",
          fields: [
            {
              name: "sortOrder",
              label: "Thứ tự ưu tiên",
              type: "number",
              defaultValue: 0,
              admin: {
                description: "Số nhỏ hơn được ưu tiên hiển thị trước khi cần sắp xếp thủ công.",
              },
            },
            {
              name: "internalNote",
              label: "Ghi chú nội bộ",
              type: "textarea",
              admin: {
                description: "Chỉ dùng trong CMS, không hiển thị ngoài website.",
              },
            },
          ],
        },
      ],
    },
    {
      name: "category",
      label: "Danh mục",
      type: "relationship",
      relationTo: "categories",
      required: true,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "images",
      label: "Ảnh sản phẩm",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "Khuyến nghị ảnh vuông 1200x1200px.",
      },
    },
    {
      name: "featured",
      label: "Nổi bật",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "status",
      label: "Trạng thái đăng",
      type: "select",
      defaultValue: "draft",
      index: true,
      options: [
        {
          label: "Bản nháp",
          value: "draft",
        },
        {
          label: "Đã xuất bản",
          value: "published",
        },
        {
          label: "Lưu trữ",
          value: "archived",
        },
      ],
      required: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
