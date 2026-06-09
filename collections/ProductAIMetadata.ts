import type { CollectionConfig, Field } from "payload";
import { CATALOG_ADMIN_GROUP } from "../lib/catalog-schema.ts";

function textList(name: string, label: string): Field {
  return {
    name,
    label,
    type: "array",
    fields: [
      {
        name: "value",
        label: "Giá trị",
        type: "text",
        required: true,
      },
    ],
  };
}

export const ProductAIMetadata: CollectionConfig = {
  slug: "product-ai-metadata",
  labels: {
    singular: "Metadata AI",
    plural: "Metadata AI",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
  },
  admin: {
    defaultColumns: ["product", "verified", "aiGenerated", "updatedAt"],
    group: CATALOG_ADMIN_GROUP,
    useAsTitle: "product",
  },
  fields: [
    {
      name: "product",
      label: "Sản phẩm",
      type: "relationship",
      relationTo: "products",
      required: true,
      unique: true,
    },
    textList("useCases", "Tình huống sử dụng"),
    textList("keywords", "Từ khóa"),
    textList("advantages", "Ưu điểm"),
    textList("competitorModels", "Model cạnh tranh"),
    {
      name: "aiGenerated",
      label: "Có nội dung do AI tạo",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "verified",
      label: "Đã được con người xác minh",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "verifiedAt",
      label: "Thời điểm xác minh",
      type: "date",
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.verified),
      },
    },
    {
      name: "note",
      label: "Ghi chú kiểm duyệt",
      type: "textarea",
    },
  ],
};
