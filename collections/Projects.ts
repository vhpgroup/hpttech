import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: {
    singular: "Dự án",
    plural: "Dự án",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["name", "category", "client", "industry", "completedAt"],
    group: "Nội dung",
    useAsTitle: "name",
  },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    { name: "name", label: "Tên dự án", type: "text", required: true },
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
    { name: "client", label: "Khách hàng", type: "text" },
    {
      name: "category",
      label: "Danh mục dự án",
      type: "relationship",
      relationTo: "project-categories",
    },
    { name: "industry", label: "Lĩnh vực", type: "text" },
    { name: "completedAt", label: "Ngày hoàn thành", type: "date" },
    { name: "summary", label: "Tóm tắt", type: "textarea" },
    { name: "content", label: "Nội dung", type: "richText" },
    { name: "gallery", label: "Thư viện ảnh", type: "upload", relationTo: "media", hasMany: true },
    {
      name: "products",
      label: "Sản phẩm sử dụng",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    seoField,
  ],
};
