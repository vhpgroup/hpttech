import type { ComponentProps } from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getPayloadClient } from "@/lib/payload";

type PayloadRichTextProps = {
  className?: string;
  data: unknown;
};

const baseClassName = [
  "payload-rich-text",
  "max-w-none text-base leading-8 text-slate-700",
  "[&_a]:font-semibold [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-4",
  "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:bg-blue-50/50 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:italic",
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.95em] [&_code]:text-slate-800",
  "[&_figure]:my-8 [&_figure]:overflow-hidden [&_figure]:rounded-lg [&_figure]:border [&_figure]:border-slate-200 [&_figure]:bg-slate-50",
  "[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-slate-950",
  "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-9 [&_h2]:text-slate-950",
  "[&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:leading-8 [&_h3]:text-slate-950",
  "[&_h4]:mb-2 [&_h4]:mt-6 [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-slate-950",
  "[&_hr]:my-8 [&_hr]:border-slate-200",
  "[&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full",
  "[&_li]:my-1.5 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6",
  "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:text-sm",
  "[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
  "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold",
].join(" ");

type RichTextRecord = Record<string, unknown>;
type MediaLookup = Map<string, RichTextRecord>;

function isRecord(value: unknown): value is RichTextRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function uploadID(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function collectUploadIDs(value: unknown, ids = new Set<string>()) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectUploadIDs(item, ids));
    return ids;
  }

  if (!isRecord(value)) return ids;

  if (value.type === "upload") {
    const id = uploadID(value.value);
    if (id) ids.add(id);
  }

  Object.values(value).forEach((item) => collectUploadIDs(item, ids));
  return ids;
}

async function getMediaLookup(ids: string[]): Promise<MediaLookup> {
  if (!ids.length) return new Map();

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "media",
      depth: 0,
      limit: ids.length,
      where: {
        id: {
          in: ids,
        },
      },
    });

    return new Map(
      res.docs.map((doc) => [String(doc.id), doc as unknown as RichTextRecord]),
    );
  } catch (error) {
    console.warn("[rich-text] Cannot populate embedded media.", error);
    return new Map();
  }
}

function hasMediaURL(value: unknown) {
  return isRecord(value) && typeof value.url === "string" && value.url.length > 0;
}

function sanitizeRichTextData(value: unknown, mediaLookup: MediaLookup): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeRichTextData(item, mediaLookup))
      .filter((item) => item !== null);
  }

  if (!isRecord(value)) return value;

  if (value.type === "upload") {
    const id = uploadID(value.value);
    const media = id ? mediaLookup.get(id) : value.value;
    if (!hasMediaURL(media)) return null;

    return {
      ...value,
      value: media,
      fields: sanitizeRichTextData(value.fields, mediaLookup),
    };
  }

  const next = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, sanitizeRichTextData(item, mediaLookup)]),
  );

  if ((next.type === "link" || next.type === "autolink") && isRecord(next.fields)) {
    next.fields = {
      ...next.fields,
      url: typeof next.fields.url === "string" && next.fields.url ? next.fields.url : "#",
    };
  }

  return next;
}

export async function PayloadRichText({ className, data }: PayloadRichTextProps) {
  if (!data || typeof data !== "object") return null;

  const uploadIDs = Array.from(collectUploadIDs(data));
  const mediaLookup = await getMediaLookup(uploadIDs);
  const safeData = sanitizeRichTextData(data, mediaLookup);
  if (!safeData || typeof safeData !== "object") return null;

  return (
    <RichText
      data={safeData as ComponentProps<typeof RichText>["data"]}
      className={[baseClassName, className].filter(Boolean).join(" ")}
    />
  );
}
