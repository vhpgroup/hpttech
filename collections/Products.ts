import type { CollectionConfig, Field } from "payload";
import { lexicalHTMLField } from "@payloadcms/richtext-lexical";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

const specProfileOptions = [
  { label: "Máy scan", value: "scanner" },
  { label: "Máy in", value: "printer" },
  { label: "Photocopy", value: "photocopier" },
  { label: "Khác / nhập thủ công", value: "other" },
];

type ProductFormData = {
  category?: unknown;
  specProfile?: string;
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
    textSpec("dimensionsWeight", "Kích thước / Trọng lượng", "100%"),
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
        status: {
          equals: "published",
        },
      };
    },
  },
  admin: {
    defaultColumns: ["title", "model", "sku", "brand", "category", "price", "status", "featured"],
    group: "Danh mục sản phẩm",
    useAsTitle: "title",
  },
  hooks: {
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
                  ({ data, value }) => value || (data?.title ? formatSlug(data.title) : value),
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
                    width: "50%",
                    description: "Nhập theo định dạng hiển thị, ví dụ: 3.900.000đ.",
                  },
                },
                {
                  name: "compareAtPrice",
                  label: "Giá niêm yết",
                  type: "text",
                  admin: {
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
              label: "Thông số kỹ thuật bổ sung",
              type: "array",
              admin: {
                description:
                  "Dùng cho thông số ngoài bộ field chuẩn hoặc sản phẩm loại khác. Với máy scan, máy in, photocopy, hãy nhập bộ field chuẩn phía trên trước.",
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
