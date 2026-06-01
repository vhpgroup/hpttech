import type { Field } from "payload";

export const seoField: Field = {
  name: "seo",
  label: "SEO",
  type: "group",
  admin: {
    description: "Thông tin SEO dùng cho trang public và danh mục.",
  },
  fields: [
    {
      name: "title",
      label: "Tiêu đề SEO",
      type: "text",
    },
    {
      name: "description",
      label: "Mô tả SEO",
      type: "textarea",
    },
    {
      name: "image",
      label: "Ảnh SEO",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "canonical",
      label: "Canonical URL",
      type: "text",
    },
    {
      name: "noIndex",
      label: "Không lập chỉ mục",
      type: "checkbox",
      defaultValue: false,
    },
  ],
};
