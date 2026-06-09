import type { CollectionConfig } from "payload";
import { CATALOG_ADMIN_GROUP } from "../lib/catalog-schema.ts";
import {
  preventVariantDeleteWithCommercialData,
  validateSinglePrimaryVariant,
} from "../lib/payload/hooks/catalog-lifecycle.ts";
import {
  revalidateCollection,
  revalidateCollectionDelete,
} from "../lib/payload/hooks/revalidate.ts";

export const ProductVariants: CollectionConfig = {
  slug: "product-variants",
  labels: {
    singular: "SKU / Phiên bản",
    plural: "SKU / Phiên bản",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["sku", "variantName", "product", "status", "isPrimary"],
    group: CATALOG_ADMIN_GROUP,
    useAsTitle: "sku",
  },
  hooks: {
    beforeChange: [validateSinglePrimaryVariant],
    beforeDelete: [preventVariantDeleteWithCommercialData],
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    {
      name: "sku",
      label: "SKU nội bộ",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "product",
      label: "Sản phẩm",
      type: "relationship",
      relationTo: "products",
      required: true,
      index: true,
    },
    {
      name: "variantName",
      label: "Tên phiên bản",
      type: "text",
      required: true,
      admin: {
        description: "Ví dụ: Bản tiêu chuẩn, kèm ADF, màu trắng.",
      },
    },
    {
      name: "barcode",
      label: "GTIN / EAN / UPC",
      type: "text",
      unique: true,
    },
    {
      name: "warranty",
      label: "Bảo hành",
      type: "text",
    },
    {
      name: "isPrimary",
      label: "SKU mặc định",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Bản nháp", value: "draft" },
        { label: "Đang bán", value: "active" },
        { label: "Ngừng bán", value: "discontinued" },
      ],
      required: true,
    },
  ],
};
