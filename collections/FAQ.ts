import type { CollectionConfig } from "payload";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";

export const FAQ: CollectionConfig = {
  slug: "faq",
  labels: {
    singular: "FAQ",
    plural: "FAQ",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["question", "category", "sortOrder"],
    group: "Nội dung",
    useAsTitle: "question",
  },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    { name: "question", label: "Câu hỏi", type: "text", required: true },
    { name: "answer", label: "Trả lời", type: "richText" },
    { name: "category", label: "Nhóm", type: "text" },
    { name: "sortOrder", label: "Thứ tự", type: "number", defaultValue: 0 },
  ],
};
