import type { ComponentProps } from "react";
import { RichText } from "@payloadcms/richtext-lexical/react";

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

export function PayloadRichText({ className, data }: PayloadRichTextProps) {
  if (!data || typeof data !== "object") return null;

  return (
    <RichText
      data={data as ComponentProps<typeof RichText>["data"]}
      className={[baseClassName, className].filter(Boolean).join(" ")}
    />
  );
}
