import type { CollectionConfig } from "payload";

export const NewsRedirects: CollectionConfig = {
  slug: "news-redirects",
  labels: {
    singular: "Redirect tin tức",
    plural: "Redirect tin tức",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["fromPath", "toPath", "statusCode", "updatedAt"],
    group: "Tin tức",
    useAsTitle: "fromPath",
  },
  fields: [
    {
      name: "fromPath",
      label: "Đường dẫn cũ",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Không bao gồm /tin-tuc/. Ví dụ: thiet-bi/may-in/bai-cu",
      },
    },
    {
      name: "toPath",
      label: "Đường dẫn mới",
      type: "text",
      required: true,
      admin: {
        description: "Không bao gồm /tin-tuc/. Ví dụ: thiet-bi/may-in/bai-moi",
      },
    },
    {
      name: "statusCode",
      label: "Mã redirect",
      type: "select",
      defaultValue: "301",
      required: true,
      options: [
        { label: "301 permanent", value: "301" },
        { label: "302 temporary", value: "302" },
      ],
    },
    {
      name: "note",
      label: "Ghi chú",
      type: "textarea",
    },
  ],
};
