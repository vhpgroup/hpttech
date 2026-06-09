import type { CollectionConfig } from "payload";
import {
  ATTRIBUTE_DATA_TYPE_OPTIONS,
  ATTRIBUTE_UNIT_OPTIONS,
  CATALOG_ADMIN_GROUP,
  normalizeCatalogCode,
  validateCatalogCode,
} from "../lib/catalog-schema.ts";

export const AttributeDefinitions: CollectionConfig = {
  slug: "attribute-definitions",
  labels: {
    singular: "Định nghĩa thuộc tính",
    plural: "Định nghĩa thuộc tính",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["code", "label", "productType", "dataType", "required"],
    group: CATALOG_ADMIN_GROUP,
    useAsTitle: "label",
  },
  fields: [
    {
      name: "productType",
      label: "Loại sản phẩm",
      type: "relationship",
      relationTo: "product-types",
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "code",
          label: "Mã thuộc tính",
          type: "text",
          required: true,
          unique: true,
          validate: validateCatalogCode,
          hooks: {
            beforeValidate: [
              ({ value }) =>
                typeof value === "string" ? normalizeCatalogCode(value) : value,
            ],
          },
          admin: {
            width: "50%",
            description: "Mã ổn định cho máy đọc, ví dụ: scan_speed_simplex.",
          },
        },
        {
          name: "label",
          label: "Tên hiển thị",
          type: "text",
          required: true,
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
          name: "dataType",
          label: "Kiểu dữ liệu",
          type: "select",
          options: ATTRIBUTE_DATA_TYPE_OPTIONS.map((option) => ({ ...option })),
          required: true,
          admin: {
            width: "50%",
          },
        },
        {
          name: "unit",
          label: "Đơn vị chuẩn",
          type: "select",
          defaultValue: "none",
          options: ATTRIBUTE_UNIT_OPTIONS.map((option) => ({ ...option })),
          required: true,
          admin: {
            width: "50%",
          },
        },
      ],
    },
    {
      name: "options",
      label: "Danh sách lựa chọn",
      type: "array",
      admin: {
        condition: (_, siblingData) =>
          siblingData?.dataType === "enum" || siblingData?.dataType === "enum_list",
        description: "Bắt buộc với kiểu enum và enum_list.",
      },
      fields: [
        {
          name: "value",
          label: "Giá trị",
          type: "text",
          required: true,
        },
        {
          name: "label",
          label: "Tên hiển thị",
          type: "text",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "required",
          label: "Bắt buộc khi publish",
          type: "checkbox",
          defaultValue: false,
          admin: { width: "25%" },
        },
        {
          name: "searchable",
          label: "Dùng cho tìm kiếm",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "25%" },
        },
        {
          name: "comparable",
          label: "Dùng để so sánh",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "25%" },
        },
        {
          name: "filterable",
          label: "Dùng làm bộ lọc",
          type: "checkbox",
          defaultValue: false,
          admin: { width: "25%" },
        },
      ],
    },
    {
      name: "sortOrder",
      label: "Thứ tự",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Đang dùng", value: "active" },
        { label: "Ngừng dùng", value: "inactive" },
      ],
      required: true,
    },
  ],
};
