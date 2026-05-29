import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const ratelimit = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "hpt-chat",
    })
  : null;

const MAX_MESSAGE_LEN = 2000;
const MAX_TURNS = 12;

const friendlyServiceError =
  "Hệ thống chat đang tạm thời gián đoạn. Quý khách vui lòng liên hệ hotline 0876 645 432 hoặc Zalo/Facebook để được hỗ trợ ngay.";

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
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: friendlyServiceError }, { status: 500 });
  }

  const allowed = process.env.ALLOWED_ORIGIN;
  if (allowed && process.env.NODE_ENV === "production") {
    const origin =
      request.headers.get("origin") || request.headers.get("referer") || "";
    if (!origin.startsWith(allowed)) {
      return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
    }
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Bạn thao tác hơi nhanh, vui lòng thử lại sau giây lát." },
        { status: 429 },
      );
    }
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

  if (String(message).length > MAX_MESSAGE_LEN) {
    return NextResponse.json({ error: "Nội dung quá dài." }, { status: 400 });
  }

  const safeConversation = (Array.isArray(conversation) ? conversation : [])
    .slice(-MAX_TURNS)
    .filter((item) => item && typeof item.content === "string" && item.content.trim())
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: String(item.content).slice(0, MAX_MESSAGE_LEN),
    }));

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
    "Nếu thông tin chưa đủ chắc chắn, nói rõ cần đội ngũ HPT Tech xác nhận thêm. Với nhu cầu mua hàng hoặc triển khai, mời khách để lại số điện thoại, công ty/khu vực hoặc liên hệ hotline 0876 645 432/Zalo/Facebook để nhận báo giá nhanh.",
    `Trang hiện tại của người dùng: ${page || "không rõ"}.`,
    `Sản phẩm liên quan từ dữ liệu website:\n${productContext}`,
  ].join("\n");

  const input = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...safeConversation,
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
