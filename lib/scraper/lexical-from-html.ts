import { cleanText } from "./text";

/**
 * Chuyển bài mô tả HTML của trang nguồn (An Phát #pro-desc) thành lexical state
 * GIÀU: heading / paragraph / list / ảnh (upload node) — vì descriptionHTML
 * được sinh từ lexical tại thời điểm đọc (lexicalHTMLField afterRead), nên đây
 * là con đường duy nhất để tab "Mô tả sản phẩm" hiển thị đúng định dạng + ảnh
 * như trang nguồn (yêu cầu 2026-07-09).
 *
 * Module PURE (không Payload/DB) để verifier chạy offline; việc tải ảnh lên
 * Media do caller (batch-importer) thực hiện rồi truyền map src -> media id.
 */

export type ArticleBlock =
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "image"; alt: string; src: string }
  | { kind: "listitem"; text: string }
  | { kind: "paragraph"; text: string };

// Ảnh An Phát dạng /media/product/250_ten-anh.jpg là bản thumbnail — bỏ prefix
// kích thước để lấy bản gốc (cùng quy ước với prioritizeAnphatImages).
export function resolveArticleImageSrc(src: string, baseUrl: string) {
  try {
    const resolved = new URL(src, baseUrl);
    resolved.pathname = resolved.pathname.replace(
      /^(.*\/media\/[^/]+\/)(?:\d+_)/i,
      "$1",
    );
    return resolved.toString();
  } catch {
    return undefined;
  }
}

function imageBlocksFrom(fragment: string, baseUrl: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  for (const tag of fragment.match(/<img\b[^>]*>/gi) || []) {
    const rawSrc =
      tag.match(/\bsrc=["']([^"']+)["']/i)?.[1] ||
      tag.match(/\bdata-src=["']([^"']+)["']/i)?.[1];
    if (!rawSrc || /placeholder|no[-_ ]?image|default[-_ ]?image/i.test(rawSrc)) {
      continue;
    }
    const src = resolveArticleImageSrc(rawSrc, baseUrl);
    if (!src) continue;
    const alt = cleanText(tag.match(/\balt=["']([^"']*)["']/i)?.[1] || "");
    blocks.push({ alt, kind: "image", src });
  }
  return blocks;
}

const BLOCK_PATTERN =
  /<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>|<li\b[^>]*>([\s\S]*?)<\/li>|<p\b[^>]*>([\s\S]*?)<\/p>|<img\b[^>]*>/gi;

export function parseArticleBlocks(html: string, baseUrl: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  for (const match of html.matchAll(BLOCK_PATTERN)) {
    const [full, headingLevel, headingBody, listBody, paragraphBody] = match;
    if (headingLevel) {
      // Ảnh lồng trong heading (hiếm) vẫn được giữ.
      blocks.push(...imageBlocksFrom(headingBody || "", baseUrl));
      const text = cleanText(headingBody);
      if (text) {
        blocks.push({
          kind: "heading",
          level: headingLevel === "2" ? 2 : 3,
          text,
        });
      }
      continue;
    }
    if (listBody !== undefined) {
      blocks.push(...imageBlocksFrom(listBody, baseUrl));
      const text = cleanText(listBody);
      if (text) blocks.push({ kind: "listitem", text });
      continue;
    }
    if (paragraphBody !== undefined) {
      // An Phát hay đặt ảnh trong <p><img></p> — tách ảnh ra block riêng.
      blocks.push(...imageBlocksFrom(paragraphBody, baseUrl));
      const text = cleanText(paragraphBody);
      if (text) blocks.push({ kind: "paragraph", text });
      continue;
    }
    // <img> đứng độc lập ngoài p/li/heading.
    blocks.push(...imageBlocksFrom(full, baseUrl));
  }
  return blocks;
}

function textNode(text: string) {
  return {
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

const blockBase = {
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
} as const;

export function lexicalFromArticleBlocks(
  blocks: ArticleBlock[],
  mediaIdBySrc: Map<string, string | number>,
) {
  const children: Array<Record<string, unknown>> = [];
  let pendingList: Array<Record<string, unknown>> = [];

  const flushList = () => {
    if (!pendingList.length) return;
    children.push({
      ...blockBase,
      children: pendingList,
      listType: "bullet",
      start: 1,
      tag: "ul",
      type: "list",
    });
    pendingList = [];
  };

  for (const block of blocks) {
    if (block.kind === "listitem") {
      pendingList.push({
        ...blockBase,
        children: [textNode(block.text)],
        type: "listitem",
        value: pendingList.length + 1,
      });
      continue;
    }
    flushList();
    if (block.kind === "heading") {
      children.push({
        ...blockBase,
        children: [textNode(block.text)],
        tag: `h${block.level}`,
        type: "heading",
      });
      continue;
    }
    if (block.kind === "image") {
      const mediaId = mediaIdBySrc.get(block.src);
      if (mediaId === undefined) continue;
      children.push({
        fields: null,
        format: "",
        relationTo: "media",
        type: "upload",
        value: mediaId,
        version: 3,
      });
      continue;
    }
    children.push({
      ...blockBase,
      children: [textNode(block.text)],
      type: "paragraph",
    });
  }
  flushList();

  // Quá ít nội dung -> để caller dùng fallback lexicalParagraphs.
  const meaningful = children.filter((node) => node.type !== "upload");
  if (meaningful.length < 2) return null;

  return {
    root: {
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}
