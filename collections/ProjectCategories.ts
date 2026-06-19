import type { CollectionConfig } from "payload";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const ProjectCategories: CollectionConfig = {
  slug: "project-categories",
  labels: {
    singular: "Danh mục dự án",
    plural: "Danh mục dự án",
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
      label: "Thứ tự",
      type: "number",
      defaultValue: 0,
    },
  ],
};
