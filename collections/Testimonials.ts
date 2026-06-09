import type { CollectionConfig } from "payload";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  labels: {
    singular: "Nhận xét khách hàng",
    plural: "Nhận xét khách hàng",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["clientName", "company", "rating"],
    group: "Nội dung",
    useAsTitle: "clientName",
  },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    { name: "clientName", label: "Tên khách hàng", type: "text", required: true },
    { name: "company", label: "Công ty", type: "text" },
    { name: "content", label: "Nội dung", type: "textarea" },
    { name: "rating", label: "Đánh giá", type: "number", min: 1, max: 5 },
    { name: "logo", label: "Logo", type: "upload", relationTo: "media" },
  ],
};
