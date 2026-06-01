import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Brands: CollectionConfig = {
  slug: "brands",
  labels: {
    singular: "Thương hiệu",
    plural: "Thương hiệu",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["name", "slug", "website"],
    group: "Danh mục sản phẩm",
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      label: "Tên thương hiệu",
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
      name: "logo",
      label: "Logo",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
    },
    {
      name: "website",
      label: "Website",
      type: "text",
    },
    seoField,
  ],
};
