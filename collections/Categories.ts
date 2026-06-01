import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: "Danh mục",
    plural: "Danh mục",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["name", "slug", "parent", "sortOrder"],
    group: "Danh mục sản phẩm",
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      label: "Tên danh mục",
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
      name: "parent",
      label: "Danh mục cha",
      type: "relationship",
      relationTo: "categories",
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
    },
    {
      name: "image",
      label: "Hình ảnh",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "sortOrder",
      label: "Thứ tự sắp xếp",
      type: "number",
      defaultValue: 0,
    },
    seoField,
  ],
};
