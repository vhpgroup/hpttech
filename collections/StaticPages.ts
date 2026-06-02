import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const StaticPages: CollectionConfig = {
  slug: "static-pages",
  labels: {
    singular: "Trang tĩnh",
    plural: "Trang tĩnh",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["title", "slug", "status"],
    group: "Nội dung",
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
    { name: "title", label: "Tiêu đề", type: "text", required: true },
    {
      name: "slug",
      label: "Đường dẫn",
      type: "text",
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [
          ({ data, value }) => value || (data?.title ? formatSlug(data.title) : value),
        ],
      },
    },
    { name: "eyebrow", label: "Nhãn phụ", type: "text" },
    { name: "summary", label: "Mô tả ngắn", type: "textarea" },
    { name: "content", label: "Nội dung", type: "richText" },
    seoField,
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Bản nháp", value: "draft" },
        { label: "Đã xuất bản", value: "published" },
        { label: "Lưu trữ", value: "archived" },
      ],
      required: true,
    },
  ],
};
