import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Tệp media",
    plural: "Media",
  },
  access: {
    read: () => true,
  },
  admin: {
    group: "Tài nguyên",
    useAsTitle: "alt",
  },
  upload: {
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      label: "Văn bản thay thế",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      label: "Chú thích",
      type: "text",
    },
    {
      name: "folder",
      label: "Thư mục",
      type: "text",
      admin: {
        description: "Tên thư mục logic, không phải đường dẫn trên máy chủ.",
      },
    },
    {
      name: "tags",
      label: "Tags",
      type: "text",
      admin: {
        description: "Ví dụ: banner, product, logo",
      },
    },
  ],
};
