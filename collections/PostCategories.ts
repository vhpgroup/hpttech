import type { CollectionConfig } from "payload";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const PostCategories: CollectionConfig = {
  slug: "post-categories",
  labels: {
    singular: "Danh mục bài viết",
    plural: "Danh mục bài viết",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["name", "slug", "sortOrder"],
    group: "Nội dung",
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
      name: "description",
      label: "Mô tả",
      type: "textarea",
    },
    {
      name: "sortOrder",
      label: "Thứ tự sắp xếp",
      type: "number",
      defaultValue: 0,
    },
  ],
};
