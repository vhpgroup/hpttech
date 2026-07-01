import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

const FACET_SEGMENT = {
  industry: "nganh",
  need: "nhu-cau",
  brand: "hang",
} as const;

async function postRevalidate(payload: Record<string, unknown>) {
  const baseURL = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!baseURL || !secret) return;

  const url = baseURL.startsWith("http") ? baseURL : `https://${baseURL}`;

  try {
    await fetch(`${url}/api/revalidate`, {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      method: "POST",
    });
  } catch (error) {
    console.warn("[landing-pages] revalidate request failed", error);
  }
}

type LandingData = Record<string, unknown> & {
  brandRef?: unknown;
  facetSlug?: string;
  facetType?: keyof typeof FACET_SEGMENT;
  industryRef?: unknown;
  needRef?: unknown;
  pageType?: string;
  pathname?: string;
  productGroup?: string;
  slug?: string;
  title?: string;
};

function relationID(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: string | number }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return undefined;
}

function selectedRef(data: LandingData) {
  if (data.facetType === "industry") return { collection: "industries", value: data.industryRef };
  if (data.facetType === "need") return { collection: "scan-needs", value: data.needRef };
  if (data.facetType === "brand") return { collection: "brands", value: data.brandRef };
  return undefined;
}

const revalidateLanding: CollectionAfterChangeHook = async ({ doc, collection }) => {
  const paths = [
    typeof doc?.pathname === "string" ? doc.pathname : undefined,
    "/giai-phap",
    "/giai-phap/may-scan",
    "/sitemap/landing",
    "/sitemap.xml",
  ].filter((path): path is string => Boolean(path));
  await postRevalidate({ collection: collection.slug, paths, slug: doc?.slug });
};

const revalidateLandingDelete: CollectionAfterDeleteHook = async ({ doc, collection }) => {
  const paths = [
    typeof doc?.pathname === "string" ? doc.pathname : undefined,
    "/giai-phap",
    "/giai-phap/may-scan",
    "/sitemap/landing",
    "/sitemap.xml",
  ].filter((path): path is string => Boolean(path));
  await postRevalidate({ collection: collection.slug, deleted: true, paths, slug: doc?.slug });
};

export const LandingPages: CollectionConfig = {
  slug: "landing-pages",
  labels: {
    singular: "Landing pSEO",
    plural: "Landing pSEO",
  },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: "published" } }),
  },
  admin: {
    defaultColumns: ["title", "productGroup", "facetType", "pathname", "sortOrder"],
    group: "Nội dung website",
    useAsTitle: "title",
  },
  hooks: {
    afterChange: [revalidateLanding],
    afterDelete: [revalidateLandingDelete],
    beforeChange: [
      async ({ data, req }) => {
        const landing = data as LandingData;
        const ref = selectedRef(landing);
        const refID = ref ? relationID(ref.value) : undefined;

        if (!landing.facetType || !ref || !refID) {
          throw new Error("Landing pSEO phải chọn đúng ngành, nhu cầu hoặc thương hiệu theo loại facet.");
        }

        const target = (await req.payload.findByID({
          collection: ref.collection as never,
          id: refID,
          depth: 0,
        })) as { slug?: string; name?: string };

        if (!target?.slug) {
          throw new Error("Facet đã chọn chưa có slug hợp lệ.");
        }

        const segment = FACET_SEGMENT[landing.facetType];
        landing.facetSlug = target.slug;
        landing.slug = landing.slug || target.slug || (landing.title ? formatSlug(landing.title) : undefined);

        if (landing.pageType === "product-facet" && landing.productGroup && segment) {
          landing.pathname = `/giai-phap/${landing.productGroup}/${segment}/${target.slug}`;
        }

        return landing;
      },
    ],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "pageType",
      label: "Loại trang",
      type: "select",
      defaultValue: "product-facet",
      required: true,
      options: [
        { label: "Product facet", value: "product-facet" },
        { label: "Digitization", value: "digitization" },
        { label: "IT solution", value: "it-solution" },
        { label: "Segment hub", value: "segment-hub" },
      ],
    },
    {
      name: "productGroup",
      label: "Nhóm sản phẩm",
      type: "select",
      defaultValue: "may-scan",
      required: true,
      options: [
        { label: "Máy scan", value: "may-scan" },
        { label: "Máy in", value: "may-in" },
        { label: "Máy photocopy", value: "may-photocopy" },
      ],
    },
    {
      name: "facetType",
      label: "Loại facet",
      type: "select",
      required: true,
      options: [
        { label: "Ngành", value: "industry" },
        { label: "Nhu cầu", value: "need" },
        { label: "Thương hiệu", value: "brand" },
      ],
    },
    {
      name: "industryRef",
      label: "Ngành",
      type: "relationship",
      relationTo: "industries",
      admin: {
        condition: (_, siblingData) => siblingData?.facetType === "industry",
      },
    },
    {
      name: "needRef",
      label: "Nhu cầu",
      type: "relationship",
      relationTo: "scan-needs",
      admin: {
        condition: (_, siblingData) => siblingData?.facetType === "need",
      },
    },
    {
      name: "brandRef",
      label: "Thương hiệu",
      type: "relationship",
      relationTo: "brands",
      admin: {
        condition: (_, siblingData) => siblingData?.facetType === "brand",
      },
    },
    {
      name: "facetSlug",
      label: "Slug facet",
      type: "text",
      admin: {
        description: "Tự sinh từ taxonomy/thương hiệu đã chọn.",
        readOnly: true,
      },
    },
    {
      name: "title",
      label: "Tiêu đề",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      label: "Slug nội bộ",
      type: "text",
      required: true,
      hooks: {
        beforeValidate: [
          ({ data, value }) =>
            value || (data?.facetSlug ? data.facetSlug : data?.title ? formatSlug(data.title) : value),
        ],
      },
    },
    { name: "h1", label: "H1", type: "text" },
    { name: "intro", label: "Mở bài", type: "richText" },
    {
      name: "painPoints",
      label: "Vấn đề/điểm mạnh",
      type: "array",
      labels: { singular: "Ý", plural: "Các ý" },
      fields: [{ name: "text", label: "Nội dung", type: "text" }],
    },
    {
      name: "criteria",
      label: "Tiêu chí chọn máy",
      type: "array",
      fields: [
        { name: "need", label: "Nhu cầu", type: "text" },
        { name: "spec", label: "Thông số gợi ý", type: "text" },
      ],
    },
    {
      name: "workflow",
      label: "Quy trình triển khai",
      type: "array",
      fields: [
        { name: "step", label: "Bước", type: "text" },
        { name: "detail", label: "Chi tiết", type: "textarea" },
      ],
    },
    {
      name: "faqs",
      label: "Câu hỏi thường gặp",
      type: "array",
      fields: [
        { name: "question", label: "Câu hỏi", type: "text" },
        { name: "answer", label: "Trả lời", type: "textarea" },
      ],
    },
    {
      name: "recommendedProducts",
      label: "Sản phẩm đề xuất",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    {
      name: "productQuery",
      label: "Bộ lọc sản phẩm",
      type: "group",
      fields: [
        { name: "needsDuplex", label: "Cần scan hai mặt", type: "checkbox" },
        { name: "needsA3", label: "Cần khổ A3", type: "checkbox" },
        { name: "needsNetwork", label: "Cần kết nối mạng", type: "checkbox" },
        { name: "needsOcr", label: "Cần OCR", type: "checkbox" },
        { name: "needsCardScan", label: "Cần scan thẻ", type: "checkbox" },
        { name: "needsPassport", label: "Cần scan hộ chiếu", type: "checkbox" },
        { name: "prefersFlatbed", label: "Ưu tiên flatbed", type: "checkbox" },
        { name: "largeFormat", label: "Khổ lớn hơn A3", type: "checkbox" },
        { name: "wideFormat", label: "Khổ rộng/bản vẽ", type: "checkbox" },
        { name: "bookScanner", label: "Máy scan sách/overhead", type: "checkbox" },
        { name: "minDailyDuty", label: "Công suất/ngày tối thiểu", type: "number" },
        { name: "minScanSpeedPpm", label: "Tốc độ ppm tối thiểu", type: "number" },
        { name: "maxPaperSize", label: "Khổ giấy tối đa", type: "select", options: ["A4", "A3", "A2", "A1", "A0"] },
        { name: "brands", label: "Thương hiệu", type: "relationship", relationTo: "brands", hasMany: true },
      ],
    },
    {
      name: "relatedPages",
      label: "Landing liên quan",
      type: "relationship",
      relationTo: "landing-pages",
      hasMany: true,
    },
    {
      name: "pathname",
      label: "Đường dẫn public",
      type: "text",
      unique: true,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    seoField,
    {
      name: "sortOrder",
      label: "Thứ tự sắp xếp",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
