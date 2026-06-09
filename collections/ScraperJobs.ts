import type { CollectionConfig } from "payload";

export const ScraperJobs: CollectionConfig = {
  slug: "scraper-jobs",
  labels: {
    singular: "Lich su cao san pham",
    plural: "Lich su cao san pham",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
  },
  admin: {
    defaultColumns: ["query", "brandDetected", "reviewStatus", "confidence", "productCreated", "createdAt"],
    group: "Danh muc san pham",
    useAsTitle: "query",
  },
  fields: [
    {
      name: "query",
      label: "Tu khoa san pham",
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
      label: "Trang thai review",
      type: "select",
      defaultValue: "ready_to_review",
      options: [
        { label: "Can review", value: "ready_to_review" },
        { label: "Can nhap them", value: "needs_human_input" },
        { label: "Da duyet", value: "approved" },
        { label: "Da publish", value: "published" },
        { label: "Loi", value: "failed" },
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
          label: "Noi dung",
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
