import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Certifications: CollectionConfig = {
  slug: "certifications",
  labels: {
    singular: "Chứng nhận ủy quyền",
    plural: "Chứng nhận ủy quyền",
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
    defaultColumns: ["brand", "kindLabel", "validTo", "sortOrder", "status"],
    group: "Nội dung",
    useAsTitle: "brand",
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        return {
          ...data,
          slug: data.slug || (data.brand ? formatSlug(String(data.brand)) : undefined),
        };
      },
    ],
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "brand",
      label: "Thương hiệu",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      label: "Đường dẫn",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        description: "Để trống sẽ tự sinh từ tên thương hiệu. Ví dụ: microtek.",
      },
      hooks: {
        beforeValidate: [
          ({ data, value }) => value || (data?.brand ? formatSlug(String(data.brand)) : value),
        ],
      },
    },
    {
      name: "kind",
      label: "Loại ủy quyền",
      type: "select",
      required: true,
      defaultValue: "uy-quyen",
      options: [
        { label: "Nhà phân phối độc quyền", value: "doc-quyen" },
        { label: "Đối tác chính thức", value: "doi-tac" },
        { label: "Nhà phân phối ủy quyền", value: "uy-quyen" },
      ],
    },
    {
      name: "kindLabel",
      label: "Nhãn loại hiển thị",
      type: "text",
      required: true,
      admin: {
        description: 'Ví dụ: "Nhà phân phối độc quyền".',
      },
    },
    {
      name: "image",
      label: "Ảnh giấy chứng nhận",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "logo",
      label: "Logo thương hiệu",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "scope",
      label: "Phạm vi sản phẩm",
      type: "text",
    },
    {
      name: "territory",
      label: "Khu vực",
      type: "text",
      defaultValue: "Việt Nam",
    },
    {
      name: "validFrom",
      label: "Hiệu lực từ",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "validTo",
      label: "Hiệu lực đến",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "issuer",
      label: "Đơn vị cấp",
      type: "text",
    },
    {
      name: "certNo",
      label: "Số chứng nhận",
      type: "text",
    },
    {
      name: "summary",
      label: "Tóm tắt",
      type: "textarea",
      admin: {
        description: "Dùng cho card và meta description.",
      },
    },
    {
      name: "content",
      label: "Nội dung chi tiết",
      type: "richText",
    },
    {
      name: "gallery",
      label: "Hình ảnh bổ sung",
      type: "array",
      labels: {
        singular: "Ảnh",
        plural: "Ảnh",
      },
      fields: [
        {
          name: "image",
          label: "Ảnh",
          type: "upload",
          relationTo: "media",
          required: true,
        },
      ],
    },
    {
      name: "featured",
      label: "Nổi bật",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "sortOrder",
      label: "Thứ tự hiển thị",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    seoField,
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      defaultValue: "draft",
      index: true,
      admin: {
        position: "sidebar",
      },
      options: [
        { label: "Bản nháp", value: "draft" },
        { label: "Đã xuất bản", value: "published" },
        { label: "Lưu trữ", value: "archived" },
      ],
    },
  ],
};
