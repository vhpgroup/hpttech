import type { CollectionConfig } from "payload";
import { CATALOG_ADMIN_GROUP } from "../lib/catalog-schema.ts";
import { validateUniqueWarehouseInventory } from "../lib/payload/hooks/catalog-lifecycle.ts";
import {
  revalidateCollection,
  revalidateCollectionDelete,
} from "../lib/payload/hooks/revalidate.ts";

export const ProductInventory: CollectionConfig = {
  slug: "product-inventory",
  labels: {
    singular: "Tồn kho",
    plural: "Tồn kho",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
  },
  admin: {
    defaultColumns: ["variant", "warehouseName", "quantity", "stockStatus", "updatedAt"],
    group: CATALOG_ADMIN_GROUP,
  },
  hooks: {
    beforeChange: [validateUniqueWarehouseInventory],
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    {
      name: "variant",
      label: "SKU / Phiên bản",
      type: "relationship",
      relationTo: "product-variants",
      required: true,
      index: true,
    },
    {
      name: "warehouseName",
      label: "Tên kho",
      type: "text",
      defaultValue: "Kho chính",
      required: true,
    },
    {
      name: "quantity",
      label: "Số lượng khả dụng",
      type: "number",
      min: 0,
      defaultValue: 0,
      required: true,
      validate: (value: unknown) =>
        typeof value !== "number" || Number.isInteger(value)
          ? true
          : "Số lượng tồn kho phải là số nguyên.",
    },
    {
      name: "stockStatus",
      label: "Trạng thái kho",
      type: "select",
      defaultValue: "unknown",
      options: [
        { label: "Chưa xác minh", value: "unknown" },
        { label: "Còn hàng", value: "in_stock" },
        { label: "Hết hàng", value: "out_of_stock" },
        { label: "Đặt trước", value: "preorder" },
      ],
      required: true,
    },
    {
      name: "updatedAt",
      label: "Thời điểm kiểm kho",
      type: "date",
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: "note",
      label: "Ghi chú",
      type: "textarea",
    },
  ],
};
