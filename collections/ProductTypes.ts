import type { CollectionConfig } from "payload";
import {
  CATALOG_ADMIN_GROUP,
  PRODUCT_TYPE_OPTIONS,
} from "../lib/catalog-schema.ts";

export const ProductTypes: CollectionConfig = {
  slug: "product-types",
  labels: {
    singular: "Loại sản phẩm",
    plural: "Loại sản phẩm",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["code", "name", "status", "schemaVersion"],
    group: CATALOG_ADMIN_GROUP,
    useAsTitle: "name",
  },
  fields: [
    {
      name: "code",
      label: "Mã loại sản phẩm",
      type: "select",
      options: PRODUCT_TYPE_OPTIONS.map((option) => ({ ...option })),
      required: true,
      unique: true,
    },
    {
      name: "name",
      label: "Tên loại sản phẩm",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
    },
    {
      name: "schemaVersion",
      label: "Phiên bản schema",
      type: "number",
      min: 1,
      defaultValue: 1,
      required: true,
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
