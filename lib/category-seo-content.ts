import { unstable_cache } from "next/cache";
import { normalizeCategorySeoContent, type CategorySeoContent } from "@/lib/category-seo-toc";
import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";

// Tầng ĐỌC DỮ LIỆU cho khối nội dung SEO của landing danh mục /<slug>
// (mô hình samnec.com.vn/tivi). Logic thuần (bóc heading, dựng mục lục, cắt bài)
// nằm ở lib/category-seo-toc.ts để verifier kiểm được mà không cần DB.

export type {
  CategorySeoContent,
  CategorySeoFaq,
  CategorySeoHeading,
  CategorySeoHeadingLevel,
  CategorySeoSection,
  CategorySeoTocItem,
} from "@/lib/category-seo-toc";

export {
  anchorHeadingId,
  buildCategorySeoToc,
  extractLexicalHeadings,
  lexicalNodeText,
  normalizeCategorySeoContent,
  splitLexicalByHeadings,
} from "@/lib/category-seo-toc";

async function loadCategorySeoContent(slug: string): Promise<CategorySeoContent | null> {
  if (!slug) return null;

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "categories",
      depth: 1,
      limit: 1,
      where: {
        slug: {
          equals: slug,
        },
      },
    });

    const doc = res.docs[0];
    if (!doc) return null;

    const name = typeof doc.name === "string" ? doc.name : slug;
    return normalizeCategorySeoContent(
      (doc as Record<string, unknown>).seoContent,
      `Tìm hiểu về ${name}`,
    );
  } catch (error) {
    handlePayloadReadError("category-seo-content", error);
    return null;
  }
}

// Cache dùng chung tag "categories:list" với getCachedCategoriesFlatFromPayload
// → sửa danh mục trong admin là khối SEO được làm mới cùng lúc với cây danh mục,
// không lệch nhau một nhịp revalidate.
const getCachedCategorySeoContent = unstable_cache(
  loadCategorySeoContent,
  ["category-seo-content"],
  { revalidate: 300, tags: ["categories:list"] },
);

export function getCategorySeoContentFromPayload(slug: string) {
  return getCachedCategorySeoContent(slug);
}
