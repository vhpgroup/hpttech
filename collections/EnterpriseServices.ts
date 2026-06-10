import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const EnterpriseServices: CollectionConfig = {
  slug: "enterprise-services",
  labels: {
    singular: "Bài viết dịch vụ doanh nghiệp",
    plural: "Bài viết dịch vụ doanh nghiệp",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["title", "status", "sortOrder", "updatedAt"],
    group: "Nội dung website",
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
      name: "summary",
      label: "Mô tả ngắn",
      type: "textarea",
      required: true,
    },
    {
      name: "icon",
      label: "Tên icon",
      type: "select",
      defaultValue: "building",
      options: [
        { label: "Số hóa / Scan", value: "scan" },
        { label: "Tài liệu / OCR", value: "file" },
        { label: "Hạ tầng mạng", value: "network" },
        { label: "Camera", value: "camera" },
        { label: "Bảo trì", value: "wrench" },
        { label: "Triển khai", value: "building" },
        { label: "Trường học", value: "school" },
        { label: "Máy chủ / Lưu trữ", value: "server" },
      ],
    },
    {
      name: "image",
      label: "Ảnh đại diện",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "content",
      label: "Nội dung bài viết",
      type: "richText",
    },
    seoField,
    {
      name: "sortOrder",
      label: "Thứ tự hiển thị",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      defaultValue: "published",
      options: [
        { label: "Bản nháp", value: "draft" },
        { label: "Đã xuất bản", value: "published" },
        { label: "Lưu trữ", value: "archived" },
      ],
      required: true,
    },
  ],
};
