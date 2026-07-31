import type { CollectionConfig } from "payload";

function isR2Enabled() {
  return Boolean(
    process.env.R2_BUCKET &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_ENDPOINT,
  );
}

// Version theo updatedAt để PHÁ CACHE khi thay file mà vẫn GIỮ NGUYÊN tên file.
//
// Vì sao cần: Next.js Image Optimizer cache bản đã convert theo khoá (url, w, q), và
// route /api/r2-media trả Cache-Control: immutable, max-age=1 năm. Nếu URL không đổi,
// optimizer tiếp tục phục vụ bản cũ rất lâu dù file trên R2 đã được thay.
// Sự cố 31/07/2026: thay 453 ảnh để xoá watermark bên thứ ba, file gốc trên R2 đã sạch
// nhưng /san-pham vẫn hiện ảnh cũ (X-Nextjs-Cache: HIT) — 191 ảnh bị ảnh hưởng.
//
// Không đổi tên file vì các trang đã cache (trang chủ ISR) vẫn trỏ tên cũ; đổi tên sẽ
// làm URL đó 404 và ảnh vỡ cho tới khi trang tự revalidate.
function mediaVersion(updatedAt: unknown) {
  if (updatedAt instanceof Date) {
    return Number.isFinite(updatedAt.getTime())
      ? Math.floor(updatedAt.getTime() / 1000).toString(36)
      : undefined;
  }
  if (typeof updatedAt !== "string" || !updatedAt) return undefined;
  const ms = Date.parse(updatedAt);
  return Number.isFinite(ms) ? Math.floor(ms / 1000).toString(36) : undefined;
}

function r2MediaURL(filename: unknown, updatedAt?: unknown) {
  if (typeof filename !== "string" || !filename) return undefined;
  const base = `/api/r2-media/${encodeURIComponent(filename)}`;
  const version = mediaVersion(updatedAt);
  return version ? `${base}?v=${version}` : base;
}

function rewriteMediaDocURLs(doc: Record<string, unknown>) {
  if (!isR2Enabled()) return doc;

  const nextDoc = { ...doc };
  const url = r2MediaURL(doc.filename, doc.updatedAt);

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
        const sizeURL = r2MediaURL(sizeDoc.filename, doc.updatedAt);

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
