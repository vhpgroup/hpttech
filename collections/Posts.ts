import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: {
    singular: "Bài viết",
    plural: "Bài viết",
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return {
        status: {
          equals: "published",
        },
      };
    },
  },
  admin: {
    defaultColumns: ["title", "category", "publishedAt", "status"],
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
    {
      name: "title",
      label: "Tiêu đề",
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
          ({ data, value }) => value || (data?.title ? formatSlug(data.title) : value),
        ],
      },
    },
    {
      name: "thumbnail",
      label: "Ảnh đại diện",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "publishedAt",
      label: "Ngày đăng",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "author",
      label: "Tác giả",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "category",
      label: "Danh mục",
      type: "relationship",
      relationTo: "post-categories",
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
    seoField,
    {
      name: "status",
      label: "Trạng thái đăng",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Bản nháp", value: "draft" },
        { label: "Đã xuất bản", value: "published" },
        { label: "Lưu trữ", value: "archived" },
      ],
      required: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
