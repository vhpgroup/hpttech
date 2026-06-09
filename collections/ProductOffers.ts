import type { CollectionConfig } from "payload";
import {
  CATALOG_ADMIN_GROUP,
  CURRENCY_OPTIONS,
} from "../lib/catalog-schema.ts";
import {
  revalidateCollection,
  revalidateCollectionDelete,
} from "../lib/payload/hooks/revalidate.ts";

export const ProductOffers: CollectionConfig = {
  slug: "product-offers",
  labels: {
    singular: "Giá bán",
    plural: "Giá bán",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["variant", "price", "currency", "saleStatus", "validTo"],
    group: CATALOG_ADMIN_GROUP,
  },
  hooks: {
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
      unique: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "price",
          label: "Giá bán",
          type: "number",
          min: 0,
          required: true,
          admin: { width: "50%" },
        },
        {
          name: "currency",
          label: "Tiền tệ",
          type: "select",
          defaultValue: "VND",
          options: CURRENCY_OPTIONS.map((option) => ({ ...option })),
          required: true,
          admin: { width: "50%" },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "vatRate",
          label: "Thuế VAT (%)",
          type: "number",
          min: 0,
          max: 100,
          defaultValue: 10,
          required: true,
          admin: { width: "50%" },
        },
        {
          name: "vatIncluded",
          label: "Giá đã gồm VAT",
          type: "checkbox",
          defaultValue: true,
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "promotionPrice",
      label: "Giá khuyến mãi",
      type: "number",
      min: 0,
      validate: (
        value: unknown,
        { siblingData }: { siblingData?: Record<string, unknown> },
      ) => {
        if (typeof value !== "number") return true;
        return typeof siblingData?.price !== "number" || value <= siblingData.price
          ? true
          : "Giá khuyến mãi không được cao hơn giá bán.";
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "validFrom",
          label: "Hiệu lực từ",
          type: "date",
          admin: { width: "50%" },
        },
        {
          name: "validTo",
          label: "Hiệu lực đến",
          type: "date",
          admin: { width: "50%" },
        },
      ],
    },
    {
      name: "saleStatus",
      label: "Trạng thái bán",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Đang bán", value: "active" },
        { label: "Liên hệ", value: "contact" },
        { label: "Tạm dừng", value: "paused" },
        { label: "Ngừng bán", value: "discontinued" },
      ],
      required: true,
    },
  ],
};
