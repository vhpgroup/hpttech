import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const PostCategories: CollectionConfig = {
  slug: "post-categories",
  labels: {
    singular: "Danh mục bài viết",
    plural: "Danh mục bài viết",
  },
  access: {
    read: () => true,
  },
  admin: {
    defaultColumns: ["fullTitle", "slug", "sortOrder"],
    group: "Tin tức",
    useAsTitle: "fullTitle",
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (!data) return data;
        const slug = data.slug || (data.name ? formatSlug(String(data.name)) : undefined);
        const parent = typeof data.parent === "string" || typeof data.parent === "number" ? data.parent : undefined;
        let parentTitle = "";
        let parentSlug = "";

        if (parent) {
          try {
            const parentDoc = await req.payload.findByID({
              collection: "post-categories",
              id: parent,
              depth: 0,
            });
            parentTitle = typeof parentDoc.fullTitle === "string" ? parentDoc.fullTitle : String(parentDoc.name || "");
            parentSlug = typeof parentDoc.fullSlug === "string" ? parentDoc.fullSlug : String(parentDoc.slug || "");
          } catch {
            parentTitle = "";
            parentSlug = "";
          }
        }

        return {
          ...data,
          slug,
          fullTitle: [parentTitle, data.name].filter(Boolean).join(" > "),
          fullSlug: [parentSlug, slug].filter(Boolean).join("/"),
        };
      },
    ],
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  fields: [
    {
      name: "name",
      label: "Tên danh mục",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      label: "Đường dẫn",
      type: "text",
      required: true,
      hooks: {
        beforeValidate: [({ data, value }) => value || (data?.name ? formatSlug(data.name) : value)],
      },
    },
    {
      name: "parent",
      label: "Danh mục cha",
      type: "relationship",
      relationTo: "post-categories",
      admin: {
        description: "Để trống nếu đây là danh mục cha cấp cao.",
      },
    },
    {
      name: "fullTitle",
      label: "Tên đầy đủ",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "fullSlug",
      label: "Đường dẫn đầy đủ",
      type: "text",
      unique: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "description",
      label: "Mô tả",
      type: "textarea",
    },
    {
      name: "coverImage",
      label: "Ảnh đại diện",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "sortOrder",
      label: "Thứ tự sắp xếp",
      type: "number",
      defaultValue: 0,
    },
    seoField,
  ],
};
