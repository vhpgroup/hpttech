import type { CollectionConfig } from "payload";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";

export const Banners: CollectionConfig = {
  slug: "banners",
  labels: {
    singular: "Banner",
    plural: "Banners",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["title", "active", "sortOrder"],
    group: "Trang chủ",
    useAsTitle: "title",
  },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    {
      name: "image",
      label: "Ảnh banner",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "title",
      label: "Tiêu đề",
      type: "text",
    },
    {
      name: "subtitle",
      label: "Mô tả ngắn",
      type: "textarea",
    },
    {
      name: "link",
      label: "Liên kết",
      type: "text",
    },
    {
      name: "sortOrder",
      label: "Thứ tự",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "active",
      label: "Đang hiển thị",
      type: "checkbox",
      defaultValue: true,
    },
  ],
};
