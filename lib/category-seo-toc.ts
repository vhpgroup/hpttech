import { formatSlug } from "@/lib/payload/utils/slugify";

// Logic THUẦN cho khối nội dung SEO danh mục: bóc heading khỏi Lexical, sinh
// anchor id, dựng cây mục lục "Xem nhanh", cắt bài theo mục.
//
// Cố ý KHÔNG import next/cache hay lib/payload ở đây: nhờ vậy verifier
// (npm run test:category-seo) nạp được module này trực tiếp qua tsx mà không
// phải khởi tạo payload.config (33 collections + kết nối Postgres).
// Tầng đọc dữ liệu nằm ở lib/category-seo-content.ts.

export type CategorySeoHeadingLevel = 2 | 3 | 4;

export type CategorySeoHeading = {
  id: string;
  text: string;
  level: CategorySeoHeadingLevel;
};

export type CategorySeoTocItem = CategorySeoHeading & {
  children: CategorySeoTocItem[];
};

export type CategorySeoFaq = {
  question: string;
  answer: string;
};

export type CategorySeoContent = {
  heading: string;
  tocTitle: string;
  showToc: boolean;
  body: unknown;
  faqs: CategorySeoFaq[];
  seo: {
    title?: string;
    description?: string;
    noIndex: boolean;
  };
};

const HEADING_TAGS: Record<string, CategorySeoHeadingLevel> = {
  h2: 2,
  h3: 3,
  h4: 4,
};

const ANCHOR_PREFIX = "muc";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Gom toàn bộ text con của một node Lexical thành chuỗi phẳng.
 * Dùng cho cả nhãn TOC và id anchor — bảo đảm 2 chỗ luôn khớp nhau.
 */
export function lexicalNodeText(node: unknown): string {
  if (!isRecord(node)) return "";

  if (typeof node.text === "string") return node.text;

  const children = Array.isArray(node.children) ? node.children : [];
  return children
    .map((child) => lexicalNodeText(child))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sinh id anchor ổn định từ text heading. Tiếng Việt được bỏ dấu qua formatSlug
 * (dùng chung với slug danh mục/bài viết để hành vi nhất quán toàn repo).
 *
 * Heading kiểu samnec thường có tiền tố số ("I. Những thông số cơ bản của tivi",
 * "1. Tivi Led") — tiền tố được GIỮ trong nhãn hiển thị nhưng CẮT khỏi anchor để
 * URL sạch và không đổi khi người viết chèn/xóa mục ở giữa làm lệch số thứ tự.
 */
export function anchorHeadingId(text: string, index: number): string {
  const withoutOrdinal = text.replace(
    /^\s*(?:[IVXLCDM]+|\d+)\s*[.)–-]\s*/i,
    "",
  );
  const slug = formatSlug(withoutOrdinal || text);
  return slug ? `${ANCHOR_PREFIX}-${slug}` : `${ANCHOR_PREFIX}-${index + 1}`;
}

/**
 * Bóc heading h2/h3/h4 ở TẦNG GỐC của bài, theo đúng thứ tự xuất hiện.
 * Id trùng nhau (2 heading cùng tên) được thêm hậu tố -2, -3… để anchor luôn unique.
 *
 * Chỉ quét tầng gốc là CÓ CHỦ Ý, không phải thiếu sót: splitLexicalByHeadings cũng
 * chỉ cắt ở tầng gốc, nên nếu hàm này đệ quy vào node lồng (heading trong ô bảng,
 * blockquote…) thì mục lục sẽ dài hơn số anchor thực render và LỆCH CẶP — mục lục
 * trỏ sang anchor của mục khác. Heading lồng không nhận được anchor thì cũng không
 * nên có mặt trong mục lục.
 */
export function extractLexicalHeadings(data: unknown): CategorySeoHeading[] {
  if (!isRecord(data)) return [];
  const root = isRecord(data.root) ? data.root : null;
  const children = root && Array.isArray(root.children) ? root.children : [];

  const headings: CategorySeoHeading[] = [];
  const used = new Map<string, number>();

  for (const node of children) {
    if (!isRecord(node) || node.type !== "heading" || typeof node.tag !== "string") continue;

    const level = HEADING_TAGS[node.tag];
    const text = lexicalNodeText(node);
    if (!level || !text) continue;

    const base = anchorHeadingId(text, headings.length);
    const seen = used.get(base) || 0;
    used.set(base, seen + 1);
    headings.push({
      id: seen ? `${base}-${seen + 1}` : base,
      text,
      level,
    });
  }

  return headings;
}

/**
 * Dựng cây TOC 2 tầng từ danh sách heading phẳng: h2 là mục gốc, h3/h4 lồng vào
 * h2 gần nhất. Heading h3 xuất hiện TRƯỚC h2 đầu tiên được nâng lên mục gốc để
 * không bị mất khỏi mục lục khi người viết đánh cấp sai.
 */
export function buildCategorySeoToc(headings: CategorySeoHeading[]): CategorySeoTocItem[] {
  const toc: CategorySeoTocItem[] = [];

  for (const heading of headings) {
    const item: CategorySeoTocItem = { ...heading, children: [] };
    const parent = heading.level > 2 ? toc[toc.length - 1] : undefined;

    if (parent) parent.children.push(item);
    else toc.push(item);
  }

  return toc;
}

export type CategorySeoSection = {
  heading: CategorySeoHeading | null;
  /** Lexical root chỉ chứa các node THUỘC mục này (không gồm chính heading). */
  content: { root: { type: "root"; children: unknown[]; direction: null; format: ""; indent: 0; version: 1 } };
};

function emptyLexicalRoot(children: unknown[]): CategorySeoSection["content"] {
  return {
    root: {
      type: "root",
      children,
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

/**
 * Cắt body thành từng mục theo heading cấp cao nhất (h2/h3/h4 ở TẦNG GỐC).
 *
 * Vì sao cắt thay vì override converter heading của Lexical: cách này chỉ dựa vào
 * PayloadRichText sẵn có, nên anchor id được render THẬT ở server (Google thấy
 * ngay, không cần JS) mà không phải tự dựng lại toàn bộ pipeline sanitize media.
 * Đoạn nào không chứa upload thì PayloadRichText bỏ qua luôn truy vấn media
 * (collectUploadIDs rỗng → getMediaLookup trả về sớm), nên việc cắt gần như
 * không phát sinh query thêm.
 */
export function splitLexicalByHeadings(
  data: unknown,
  headings: CategorySeoHeading[],
): CategorySeoSection[] {
  if (!isRecord(data)) return [];
  const root = isRecord(data.root) ? data.root : null;
  const children = root && Array.isArray(root.children) ? root.children : [];
  if (!children.length) return [];

  const sections: CategorySeoSection[] = [];
  let current: CategorySeoSection = { heading: null, content: emptyLexicalRoot([]) };
  let headingIndex = 0;

  for (const node of children) {
    const isHeading =
      isRecord(node) && node.type === "heading" && typeof node.tag === "string" && Boolean(HEADING_TAGS[node.tag]);

    if (isHeading && lexicalNodeText(node)) {
      // Chốt mục đang mở lại (giữ cả mục intro rỗng-heading nếu có nội dung).
      if (current.heading || current.content.root.children.length) sections.push(current);
      current = {
        heading: headings[headingIndex] || null,
        content: emptyLexicalRoot([]),
      };
      headingIndex += 1;
      continue;
    }

    current.content.root.children.push(node);
  }

  if (current.heading || current.content.root.children.length) sections.push(current);
  return sections;
}

function normalizeFaqs(value: unknown): CategorySeoFaq[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((row) => {
    if (!isRecord(row)) return [];
    const question = typeof row.question === "string" ? row.question.trim() : "";
    const answer = typeof row.answer === "string" ? row.answer.trim() : "";
    return question && answer ? [{ question, answer }] : [];
  });
}

function hasLexicalContent(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const root = isRecord(value.root) ? value.root : null;
  if (!root || !Array.isArray(root.children)) return false;

  // Rich text rỗng vẫn là { root: { children: [ { paragraph rỗng } ] } } —
  // phải soi có text/upload thật, nếu không trang sẽ hiện khối trắng vô nghĩa.
  return root.children.some((child) => {
    if (!isRecord(child)) return false;
    if (child.type === "upload" || child.type === "horizontalrule") return true;
    return lexicalNodeText(child).length > 0;
  });
}

/**
 * Chuẩn hóa group `seoContent` của một danh mục. Trả null khi content chưa bật
 * hoặc chưa có nội dung thật → landing render y như trước, không có khối rỗng.
 */
export function normalizeCategorySeoContent(
  raw: unknown,
  fallbackHeading: string,
): CategorySeoContent | null {
  if (!isRecord(raw)) return null;
  if (raw.enabled === false) return null;

  const body = raw.body;
  const faqs = normalizeFaqs(raw.faqs);
  if (!hasLexicalContent(body) && !faqs.length) return null;

  const heading = typeof raw.heading === "string" && raw.heading.trim() ? raw.heading.trim() : fallbackHeading;
  const tocTitle = typeof raw.tocTitle === "string" && raw.tocTitle.trim() ? raw.tocTitle.trim() : "Xem nhanh";
  const seo = isRecord(raw.seo) ? raw.seo : {};

  return {
    heading,
    tocTitle,
    showToc: raw.showToc !== false,
    body,
    faqs,
    seo: {
      title: typeof seo.title === "string" && seo.title.trim() ? seo.title.trim() : undefined,
      description:
        typeof seo.description === "string" && seo.description.trim() ? seo.description.trim() : undefined,
      noIndex: seo.noIndex === true,
    },
  };
}
