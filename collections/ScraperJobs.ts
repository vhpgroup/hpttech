import type { CollectionConfig } from "payload";

export const ScraperJobs: CollectionConfig = {
  slug: "scraper-jobs",
  labels: {
    singular: "Lịch sử cào sản phẩm",
    plural: "Lịch sử cào sản phẩm",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
  },
  admin: {
    defaultColumns: ["query", "brandDetected", "reviewStatus", "confidence", "productCreated", "createdAt"],
    group: "Danh mục sản phẩm",
    useAsTitle: "query",
  },
  fields: [
    {
      name: "query",
      label: "Từ khóa sản phẩm",
      type: "text",
      required: true,
    },
    {
      name: "brandDetected",
      label: "Brand detected",
      type: "text",
    },
    {
      name: "sourceUrl",
      label: "Source URL",
      type: "text",
    },
    {
      name: "searchQuery",
      label: "Search query",
      type: "text",
    },
    {
      name: "reviewStatus",
      label: "Trạng thái review",
      type: "select",
      defaultValue: "ready_to_review",
      options: [
        { label: "Cần review", value: "ready_to_review" },
        { label: "Cần nhập thêm", value: "needs_human_input" },
        { label: "Đã duyệt", value: "approved" },
        { label: "Đã publish", value: "published" },
        { label: "Lỗi", value: "failed" },
      ],
    },
    {
      name: "confidence",
      label: "Confidence",
      type: "number",
      min: 0,
      max: 1,
    },
    {
      name: "warnings",
      label: "Warnings",
      type: "array",
      fields: [
        {
          name: "message",
          label: "Nội dung",
          type: "text",
        },
      ],
    },
    {
      name: "rawExtractedData",
      label: "Raw extracted data",
      type: "json",
    },
    {
      name: "generatedContent",
      label: "Generated content",
      type: "json",
    },
    {
      name: "seoPreview",
      label: "SEO preview",
      type: "json",
    },
    {
      name: "productCreated",
      label: "Product created",
      type: "relationship",
      relationTo: "products",
    },
    {
      name: "error",
      label: "Error",
      type: "textarea",
    },
  ],
};
