import { formatSlug } from "@/lib/payload/utils/slugify";
import { decodeHTML } from "entities";

export function cleanText(value?: string | null) {
  return decodeHTML(String(value || ""))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function productSlug(title: string) {
  return formatSlug(title);
}

export function firstSentence(value?: string) {
  const text = cleanText(value);
  if (!text) return "";
  const match = text.match(/^(.+?[.!?])(?:\s|$)/);
  return (match?.[1] || text).trim();
}

export function extractHighlightBulletPoints(value?: string) {
  const text = cleanText(value);
  const marker = text.match(/(?:điểm nổi bật|diem noi bat)\s*[:：]?/i);
  if (!marker || marker.index === undefined) return [];

  return text
    .slice(marker.index + marker[0].length)
    .trim()
    .split(/\s+-\s+/)
    .map((item) => item.replace(/^-\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 7);
}

export function lexicalParagraphs(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((paragraph) => cleanText(paragraph))
    .filter(Boolean);

  return {
    root: {
      children: paragraphs.map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: paragraph,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      })),
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}
