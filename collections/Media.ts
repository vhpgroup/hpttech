import type { CollectionConfig } from "payload";

function isR2Enabled() {
  return Boolean(
    process.env.R2_BUCKET &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_ENDPOINT,
  );
}

function r2MediaURL(filename: unknown) {
  return typeof filename === "string" && filename
    ? `/api/r2-media/${encodeURIComponent(filename)}`
    : undefined;
}

function rewriteMediaDocURLs(doc: Record<string, unknown>) {
  if (!isR2Enabled()) return doc;

  const nextDoc = { ...doc };
  const url = r2MediaURL(doc.filename);

  if (url) {
    nextDoc.url = url;
    nextDoc.thumbnailURL = url;
  }

  if (doc.sizes && typeof doc.sizes === "object" && !Array.isArray(doc.sizes)) {
    nextDoc.sizes = Object.fromEntries(
      Object.entries(doc.sizes).map(([key, value]) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return [key, value];
        }

        const sizeDoc = value as Record<string, unknown>;
        const sizeURL = r2MediaURL(sizeDoc.filename);

        return [
          key,
          sizeURL
            ? {
                ...sizeDoc,
                url: sizeURL,
              }
            : value,
        ];
      }),
    );
  }

  return nextDoc;
}

export const Media: CollectionConfig = {
  slug: "media",
  labels: {
    singular: "Tệp media",
    plural: "Media",
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterRead: [({ doc }) => (doc ? rewriteMediaDocURLs(doc as Record<string, unknown>) : doc)],
  },
  admin: {
    group: "Tài nguyên",
    useAsTitle: "alt",
  },
  upload: {
    mimeTypes: [
      "image/*",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  fields: [
    {
      name: "alt",
      label: "Văn bản thay thế",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      label: "Chú thích",
      type: "text",
    },
    {
      name: "folder",
      label: "Thư mục",
      type: "text",
      admin: {
        description: "Tên thư mục logic, không phải đường dẫn trên máy chủ.",
      },
    },
    {
      name: "tags",
      label: "Tags",
      type: "text",
      admin: {
        description: "Ví dụ: banner, product, logo",
      },
    },
  ],
};
