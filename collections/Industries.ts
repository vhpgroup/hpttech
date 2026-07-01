import type { CollectionConfig } from "payload";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Industries: CollectionConfig = {
  slug: "industries",
  labels: {
    singular: "Ngành pSEO",
    plural: "Ngành pSEO",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["name", "slug", "accentKey", "sortOrder"],
    group: "Nội dung website",
    useAsTitle: "name",
  },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    {
      name: "name",
      label: "Tên ngành",
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
          ({ data, value }) => value || (data?.name ? formatSlug(data.name) : value),
        ],
      },
    },
    {
      name: "icon",
      label: "Icon Lucide",
      type: "text",
      admin: {
        description: "Ví dụ: building-2, shield, hospital, school.",
      },
    },
    {
      name: "accentKey",
      label: "Mã màu nhấn",
      type: "text",
      admin: {
        description: "Khớp data-industry, ví dụ: cong-an, thue, benh-vien.",
      },
    },
    {
      name: "sortOrder",
      label: "Thứ tự sắp xếp",
      type: "number",
      defaultValue: 0,
    },
  ],
};
