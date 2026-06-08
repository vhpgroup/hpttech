import type { CollectionConfig } from "payload";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const PostTags: CollectionConfig = {
  slug: "post-tags",
  labels: {
    singular: "Tag bài viết",
    plural: "Tags bài viết",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["name", "slug", "sortOrder"],
    group: "Tin tức",
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      label: "Tên tag",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "slug",
      label: "Đường dẫn",
      type: "text",
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [({ data, value }) => value || (data?.name ? formatSlug(data.name) : value)],
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
