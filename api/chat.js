export default async function handler(req, res) {
  const friendlyServiceError =
    "Hệ thống chat đang tạm thời gián đoạn. Quý khách vui lòng liên hệ hotline 0876 645 432 hoặc Zalo/Facebook để được hỗ trợ ngay.";

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: friendlyServiceError });
  }

  const { message = "", conversation = [], relevantProducts = [], page = "" } = req.body || {};

  if (!String(message).trim()) {
    return res.status(400).json({ error: "Thiếu nội dung câu hỏi." });
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
    'Định dạng câu trả lời thành các dòng ngắn. Nếu cần hỏi thêm, dùng mẫu: "Để tư vấn đúng hơn, bạn cho mình biết:" rồi xuống dòng 1., 2., 3. Không viết một đoạn dài.',
    "Khi khách hỏi báo giá hoặc chọn thiết bị, chỉ hỏi các tiêu chí còn thiếu thật cần thiết: số lượng người dùng, khối lượng in/scan mỗi ngày, in màu hay trắng đen, khổ giấy A4/A3, cần WiFi/mạng LAN/ADF/scan 2 mặt, ngân sách và khu vực triển khai.",
    "Khi khách hỏi số hóa, hãy tư vấn theo quy trình: khảo sát hồ sơ, chọn máy scan phù hợp, chuẩn hóa OCR/lưu trữ/tìm kiếm, phân quyền, sao lưu và bàn giao vận hành. Nêu lợi ích thực tế như giảm thời gian tìm hồ sơ, giảm lưu kho giấy, dễ kiểm soát dữ liệu.",
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
      return res.status(response.status).json({ error: friendlyServiceError });
    }

    const reply =
      payload.output_text ||
      payload.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text ||
      "";

    if (!reply) {
      return res.status(502).json({ error: "Không đọc được phản hồi từ hệ thống chat." });
    }

    return res.status(200).json({ reply });
  } catch {
    return res.status(500).json({ error: friendlyServiceError });
  }
}
