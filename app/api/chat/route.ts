import { NextResponse } from "next/server";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { normalizeSiteSettings } from "@/lib/site-settings";

type ChatItem = {
  role?: string;
  content?: string;
};

type RelevantProduct = {
  title?: string;
  brand?: string;
  category?: string;
  price?: string;
  detail?: string;
  href?: string;
};

export async function POST(request: Request) {
  const settings = normalizeSiteSettings(await getSiteSettingsFromPayload());
  const friendlyServiceError =
    `Hệ thống chat đang tạm thời gián đoạn. Quý khách vui lòng liên hệ hotline ${settings.hotline} hoặc Zalo/Facebook để được hỗ trợ ngay.`;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: friendlyServiceError }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    message = "",
    conversation = [],
    relevantProducts = [],
    page = "",
  }: {
    message?: string;
    conversation?: ChatItem[];
    relevantProducts?: RelevantProduct[];
    page?: string;
  } = body || {};

  if (!String(message).trim()) {
    return NextResponse.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
  }

  const productContext =
    Array.isArray(relevantProducts) && relevantProducts.length
      ? relevantProducts
          .map(
            (product, index) =>
              `${index + 1}. ${product.title} | Thương hiệu: ${product.brand} | Danh mục: ${product.category} | Giá: ${product.price} | Mô tả: ${product.detail} | Link: ${product.href}`
          )
          .join("\n")
      : "Không có sản phẩm liên quan rõ ràng trong dữ liệu cục bộ.";

  const systemPrompt = [
    "Bạn là chatbot tư vấn online của HPT Tech trên website bán hàng. Trả lời bằng tiếng Việt tự nhiên, thân thiện, ngắn gọn và dễ đọc.",
    "Phạm vi tư vấn chính: máy in, máy scan, vật tư máy in, thiết bị văn phòng, dịch vụ kỹ thuật, bảo trì, triển khai và giải pháp số hóa tài liệu cho doanh nghiệp.",
    "Không hỏi dồn dập. Mỗi lần chỉ hỏi tối đa 3 ý quan trọng nhất. Ưu tiên hỏi theo thứ tự: nhu cầu chính, khối lượng sử dụng, ngân sách/khu vực.",
    "Nếu có sản phẩm liên quan trong dữ liệu website, ưu tiên gợi ý 1-3 lựa chọn phù hợp, nêu lý do ngắn và giá nếu có. Không bịa tồn kho, khuyến mãi hoặc thông số chưa có.",
    `Nếu thông tin chưa đủ chắc chắn, nói rõ cần đội ngũ ${settings.companyName} xác nhận thêm. Với nhu cầu mua hàng hoặc triển khai, mời khách để lại số điện thoại, công ty/khu vực hoặc liên hệ hotline ${settings.hotline}/Zalo/Facebook để nhận báo giá nhanh.`,
    `Trang hiện tại của người dùng: ${page || "không rõ"}.`,
    `Sản phẩm liên quan từ dữ liệu website:\n${productContext}`,
  ].join("\n");

  const input = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...conversation
      .filter((item) => item && typeof item.content === "string" && item.content.trim())
      .map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content,
      })),
    {
      role: "user",
      content: String(message),
    },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input,
        max_output_tokens: 300,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: friendlyServiceError }, { status: response.status });
    }

    const reply =
      payload.output_text ||
      payload.output?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content || []).find((item: { type?: string }) => item.type === "output_text")?.text ||
      "";

    if (!reply) {
      return NextResponse.json({ error: "Không đọc được phản hồi từ hệ thống chat." }, { status: 502 });
    }

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: friendlyServiceError }, { status: 500 });
  }
}
