import type { CollectionConfig } from "payload";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Downloads: CollectionConfig = {
  slug: "downloads",
  labels: {
    singular: "Tài liệu tải về",
    plural: "Tài liệu tải về",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["title", "category", "brand", "version", "status"],
    group: "Download Center",
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      label: "Tên tài liệu",
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
        beforeValidate: [({ data, value }) => value || (data?.title ? formatSlug(data.title) : value)],
      },
    },
    {
      name: "category",
      label: "Loại tài liệu",
      type: "relationship",
      relationTo: "download-categories",
      required: true,
    },
    {
      name: "brand",
      label: "Thương hiệu",
      type: "relationship",
      relationTo: "brands",
    },
    {
      name: "products",
      label: "Sản phẩm liên quan",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    {
      name: "model",
      label: "Model",
      type: "text",
    },
    {
      name: "version",
      label: "Phiên bản",
      type: "text",
    },
    {
      name: "file",
      label: "File tải về",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "externalUrl",
      label: "Link tải ngoài",
      type: "text",
      admin: {
        description: "Dùng khi file nằm trên website hãng sản xuất.",
      },
    },
    {
      name: "publishedAt",
      label: "Ngày cập nhật",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "summary",
      label: "Mô tả ngắn",
      type: "textarea",
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      defaultValue: "published",
      required: true,
      options: [
        { label: "Bản nháp", value: "draft" },
        { label: "Đã xuất bản", value: "published" },
        { label: "Lưu trữ", value: "archived" },
      ],
    },
  ],
};
