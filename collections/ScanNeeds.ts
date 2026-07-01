import type { CollectionConfig } from "payload";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const ScanNeeds: CollectionConfig = {
  slug: "scan-needs",
  labels: {
    singular: "Nhu cầu scan",
    plural: "Nhu cầu scan",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["name", "slug", "sortOrder"],
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
      label: "Tên nhu cầu",
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
        description: "Ví dụ: id-card, network, file-search, archive.",
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
