import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Solutions: CollectionConfig = {
  slug: "solutions",
  labels: {
    singular: "Giải pháp",
    plural: "Giải pháp",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["name", "slug", "sortOrder"],
    group: "Nội dung",
    useAsTitle: "name",
  },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    {
      name: "name",
      label: "Tên giải pháp",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      label: "Đường dẫn",
      type: "text",
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [
          ({ data, value }) => value || (data?.name ? formatSlug(data.name) : value),
        ],
      },
    },
    {
      name: "icon",
      label: "Icon Lucide",
      type: "text",
      admin: {
        description: "Ví dụ: printer, scan-line, shield, blocks",
      },
    },
    {
      name: "summary",
      label: "Tóm tắt",
      type: "textarea",
    },
    {
      name: "content",
      label: "Nội dung",
      type: "richText",
    },
    {
      name: "relatedProducts",
      label: "Sản phẩm liên quan",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    {
      name: "image",
      label: "Ảnh minh họa",
      type: "upload",
      relationTo: "media",
    },
    seoField,
    {
      name: "sortOrder",
      label: "Thứ tự",
      type: "number",
      defaultValue: 0,
    },
  ],
};
