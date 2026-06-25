import type { CollectionConfig, PayloadRequest } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

async function getCategoryPath(req: Pick<PayloadRequest, "payload">, category: unknown) {
  const categoryId = typeof category === "string" || typeof category === "number" ? String(category) : undefined;
  if (!categoryId) return "";

  const categoryDoc = await req.payload.findByID({
    collection: "post-categories",
    id: categoryId,
    depth: 0,
  });

  const childCategories = await req.payload.find({
    collection: "post-categories",
    depth: 0,
    limit: 1,
    where: {
      parent: {
        equals: categoryId,
      },
    },
  });

  if (childCategories.totalDocs > 0) {
    throw new Error("Bài viết phải chọn danh mục con cuối cùng, không chọn danh mục cha.");
  }

  return typeof categoryDoc.fullSlug === "string" ? categoryDoc.fullSlug : String(categoryDoc.slug || "");
}

async function createPostRedirect(args: {
  doc: Record<string, unknown>;
  operation: string;
  originalDoc?: Record<string, unknown>;
  req: Pick<PayloadRequest, "payload">;
}) {
  const { doc, operation, originalDoc, req } = args;
  if (operation !== "update") return;

  const from = typeof originalDoc?.fullPath === "string" ? originalDoc.fullPath : "";
  const to = typeof doc.fullPath === "string" ? doc.fullPath : "";
  if (!from || !to || from === to) return;

  try {
    const existing = await req.payload.find({
      collection: "news-redirects",
      depth: 0,
      limit: 1,
      where: {
        fromPath: {
          equals: from,
        },
      },
    });

    if (existing.totalDocs > 0) return;

    await req.payload.create({
      collection: "news-redirects",
      data: {
        fromPath: from,
        toPath: to,
        statusCode: "301",
        note: "Tự động tạo khi slug hoặc danh mục bài viết thay đổi.",
      },
    });
  } catch {
    // Redirect creation is helpful for SEO, but should not block saving the article.
  }
}

function isViewCountOnlyUpdate(args: {
  operation: string;
  doc?: Record<string, unknown>;
  previousDoc?: Record<string, unknown>;
}) {
  if (args.operation !== "update" || !args.doc || !args.previousDoc) return false;

  const nextEntries = Object.entries(args.doc).filter(([key]) => key !== "updatedAt" && key !== "createdAt");
  const prevEntries = Object.entries(args.previousDoc).filter(([key]) => key !== "updatedAt" && key !== "createdAt");

  if (nextEntries.length !== prevEntries.length) return false;

  const changedKeys = nextEntries
    .filter(([key, value]) => JSON.stringify(args.previousDoc?.[key]) !== JSON.stringify(value))
    .map(([key]) => key);

  return changedKeys.length === 1 && changedKeys[0] === "viewCount";
}

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: {
    singular: "Bài viết",
    plural: "Bài viết",
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
    defaultColumns: ["title", "category", "postType", "publishedAt", "viewCount", "status"],
    group: "Tin tức",
    useAsTitle: "title",
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (!data) return data;
        const slug = data.slug || (data.title ? formatSlug(String(data.title)) : undefined);
        const categoryPath = await getCategoryPath(req, data.category);

        return {
          ...data,
          slug,
          fullPath: [categoryPath, slug].filter(Boolean).join("/"),
        };
      },
    ],
    afterChange: [
      async (args) => {
        await createPostRedirect(args as Parameters<typeof createPostRedirect>[0]);
        if (isViewCountOnlyUpdate(args)) return;
        await revalidateCollection(args);
      },
    ],
    afterDelete: [revalidateCollectionDelete],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "title",
      label: "Tiêu đề",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      label: "Đường dẫn bài viết",
      type: "text",
      required: true,
      index: true,
      hooks: {
        beforeValidate: [({ data, value }) => value || (data?.title ? formatSlug(data.title) : value)],
      },
    },
    {
      name: "fullPath",
      label: "Đường dẫn đầy đủ",
      type: "text",
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: "Ví dụ: thiet-bi-giai-phap-van-phong/may-in/may-in-hp-bi-ket-giay",
      },
    },
    {
      name: "thumbnail",
      label: "Ảnh đại diện",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "publishedAt",
      label: "Ngày đăng",
      type: "date",
      index: true,
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "author",
      label: "Tác giả",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "category",
      label: "Danh mục",
      type: "relationship",
      relationTo: "post-categories",
      required: true,
      index: true,
      admin: {
        description: "Chọn danh mục con cuối cùng. Danh mục hiển thị dạng Cha > Con.",
      },
    },
    {
      name: "tags",
      label: "Tags",
      type: "relationship",
      relationTo: "post-tags",
      hasMany: true,
    },
    {
      name: "postType",
      label: "Loại bài viết",
      type: "select",
      defaultValue: "news",
      required: true,
      index: true,
      options: [
        { label: "Tin tức", value: "news" },
        { label: "Hướng dẫn", value: "guide" },
        { label: "Case study", value: "case-study" },
        { label: "Thông báo", value: "announcement" },
        { label: "Tuyển dụng", value: "recruitment" },
      ],
    },
    {
      name: "featured",
      label: "Bài nổi bật",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "relatedProducts",
      label: "Sản phẩm liên quan",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    {
      name: "summary",
      label: "Tóm tắt",
      type: "textarea",
    },
    {
      name: "viewCount",
      label: "Lượt xem",
      type: "number",
      min: 0,
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Tự động tăng khi người dùng mở bài viết.",
      },
    },
    {
      name: "guideMeta",
      label: "Thông tin bài hướng dẫn",
      type: "group",
      admin: {
        condition: (_, siblingData) => siblingData?.postType === "guide",
      },
      fields: [
        {
          name: "difficulty",
          label: "Độ khó",
          type: "select",
          options: [
            { label: "Cơ bản", value: "basic" },
            { label: "Trung bình", value: "intermediate" },
            { label: "Nâng cao", value: "advanced" },
          ],
        },
        {
          name: "estimatedTime",
          label: "Thời gian ước tính",
          type: "text",
        },
        {
          name: "appliesTo",
          label: "Áp dụng cho",
          type: "text",
        },
      ],
    },
    {
      name: "caseStudyMeta",
      label: "Thông tin case study",
      type: "group",
      admin: {
        condition: (_, siblingData) => siblingData?.postType === "case-study",
      },
      fields: [
        { name: "industry", label: "Ngành", type: "text" },
        { name: "clientName", label: "Khách hàng", type: "text" },
        { name: "clientType", label: "Loại khách hàng", type: "text" },
        { name: "challenge", label: "Thách thức", type: "textarea" },
        { name: "solution", label: "Giải pháp", type: "textarea" },
        { name: "result", label: "Kết quả", type: "textarea" },
      ],
    },
    {
      name: "content",
      label: "Nội dung",
      type: "richText",
    },
    seoField,
    {
      name: "status",
      label: "Trạng thái đăng",
      type: "select",
      defaultValue: "draft",
      index: true,
      options: [
        { label: "Bản nháp", value: "draft" },
        { label: "Đã xuất bản", value: "published" },
        { label: "Lưu trữ", value: "archived" },
      ],
      required: true,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
