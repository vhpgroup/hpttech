import { truncate } from "./text";
import type { ExtractedProductData, GeneratedProductContent } from "./types";

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type OpenAIGeneratedContent = {
  description?: unknown;
  summary?: unknown;
};

function stringifyGenerated(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(stringifyGenerated).filter(Boolean).join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => {
        const text = stringifyGenerated(entry);
        return text ? `${key}\n\n${text}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
  return "";
}

function parseJsonObject<T>(value: string): T | undefined {
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const json = fenced || trimmed.match(/\{[\s\S]*\}/)?.[0] || trimmed;

  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

function topSpecs(data: ExtractedProductData) {
  return data.specs
    .slice(0, 5)
    .map((spec) => `- ${spec.label}: ${spec.value}`)
    .join("\n");
}

export async function enrichProductContent(
  data: ExtractedProductData,
  brandName: string,
): Promise<GeneratedProductContent> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  if (apiKey) {
    const response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        body: JSON.stringify({
          messages: [
            {
              content: [
                "Viet noi dung san pham tieng Viet cho HPT Tech.",
                "Chi dua tren du lieu duoc cung cap, khong bia thong so ky thuat.",
                "Tra ve JSON hop le gom summary va description.",
                "summary dai 2-4 cau.",
                "description co cac muc: Tong quan, Diem noi bat, Phu hop cho nhu cau, Mua hang tai HPT Tech.",
                `Brand: ${brandName}`,
                `Data: ${JSON.stringify(data)}`,
              ].join("\n"),
              role: "user",
            },
          ],
          model,
          response_format: { type: "json_object" },
          temperature: 0.35,
        }),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(
          Number(process.env.OPENAI_SCRAPER_TIMEOUT_MS || 45_000),
        ),
      },
    ).catch(() => undefined);

    if (response?.ok) {
      const result = (await response.json()) as OpenAIResponse;
      const text = result.choices?.[0]?.message?.content;
      const generated = text
        ? parseJsonObject<OpenAIGeneratedContent>(text)
        : undefined;
      const summary = stringifyGenerated(generated?.summary);
      const description = stringifyGenerated(generated?.description);
      if (summary && description) {
        return {
          description,
          summary: truncate(summary, 420),
        };
      }
    }
  }

  const baseSummary =
    data.summary ||
    data.description ||
    `${data.title} là sản phẩm ${brandName} chính hãng, phù hợp cho nhu cầu vận hành văn phòng và doanh nghiệp.`;

  const summary = truncate(baseSummary, 360);
  const specs = topSpecs(data);
  const description = [
    `Tổng quan ${data.title}`,
    "",
    summary,
    "",
    "Điểm nổi bật",
    "",
    specs || "- Thông số kỹ thuật sẽ được nhân viên HPT Tech kiểm tra và bổ sung trước khi xuất bản.",
    "",
    "Phù hợp cho nhu cầu",
    "",
    `${data.title} phù hợp với khách hàng cần thiết bị ${brandName} chính hãng, có thông tin rõ ràng và được tư vấn triển khai theo nhu cầu thực tế.`,
    "",
    "Mua hàng tại HPT Tech",
    "",
    "HPT Tech hỗ trợ tư vấn cấu hình, báo giá, giao hàng và bảo hành theo chính sách của hãng. Nhân viên sẽ kiểm tra lại giá và tình trạng hàng trước khi xác nhận đơn.",
  ].join("\n");

  return { description, summary };
}
