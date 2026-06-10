import type { GlobalConfig } from "payload";
import { revalidateGlobal } from "../lib/payload/hooks/revalidate.ts";

export const EnterpriseSupportPage: GlobalConfig = {
  slug: "enterprise-support-page",
  label: "Trang hỗ trợ doanh nghiệp",
  access: {
    read: () => true,
  },
  admin: {
    group: "Nội dung website",
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
  fields: [
    {
      name: "heroImages",
      label: "Ảnh minh họa đầu trang",
      type: "array",
      maxRows: 4,
      admin: {
        description:
          "Tải tối đa 4 ảnh. Khi chưa có ảnh, website hiển thị icon mặc định.",
      },
      fields: [
        {
          name: "image",
          label: "Ảnh",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "alt",
          label: "Mô tả ảnh",
          type: "text",
        },
      ],
    },
  ],
};
