const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = process.argv[2] || process.cwd();
const port = Number(process.argv[3] || 8080);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

function sendJson(res, status, body) {
  send(res, status, JSON.stringify(body), "application/json; charset=utf-8");
}

async function handleChatApi(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json; charset=utf-8", Allow: "POST" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return true;
  }

  let raw = "";
  for await (const chunk of req) raw += chunk;

  let payload;
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    sendJson(res, 400, { error: "JSON không hợp lệ." });
    return true;
  }

  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 500, { error: "OPENAI_API_KEY chưa được cấu hình trên local server." });
    return true;
  }

  const {
    message = "",
    conversation = [],
    relevantProducts = [],
    page = "",
  } = payload;

  const productContext = Array.isArray(relevantProducts) && relevantProducts.length
    ? relevantProducts
        .map(
          (product, index) =>
            `${index + 1}. ${product.title} | Thương hiệu: ${product.brand} | Danh mục: ${product.category} | Giá: ${product.price} | Mô tả: ${product.detail} | Link: ${product.href}`
        )
        .join("\n")
    : "Không có sản phẩm liên quan rõ ràng trong dữ liệu cục bộ.";

  const input = [
    {
      role: "system",
      content: [
        "Bạn là chatbot tư vấn online của HPT Tech trên website bán hàng. Trả lời bằng tiếng Việt tự nhiên, thân thiện, ngắn gọn và dễ đọc.",
        "Phạm vi tư vấn chính: máy in, máy scan, vật tư máy in, thiết bị văn phòng, dịch vụ kỹ thuật, bảo trì, triển khai và giải pháp số hoá tài liệu cho doanh nghiệp.",
        "Không hỏi dồn dập. Mỗi lần chỉ hỏi tối đa 3 ý quan trọng nhất. Ưu tiên hỏi theo thứ tự: nhu cầu chính, khối lượng sử dụng, ngân sách/khu vực.",
        "Định dạng câu trả lời thành các dòng ngắn. Nếu cần hỏi thêm, dùng mẫu: \"Để tư vấn đúng hơn, bạn cho mình biết:\" rồi xuống dòng 1., 2., 3. Không viết một đoạn dài.",
        "Khi khách hỏi báo giá hoặc chọn thiết bị, chỉ hỏi các tiêu chí còn thiếu thật cần thiết: số lượng người dùng, khối lượng in/scan mỗi ngày, in màu hay trắng đen, khổ giấy A4/A3, cần WiFi/mạng LAN/ADF/scan 2 mặt, ngân sách và khu vực triển khai.",
        "Khi khách hỏi số hoá, hãy tư vấn theo quy trình: khảo sát hồ sơ, chọn máy scan phù hợp, chuẩn hoá OCR/lưu trữ/tìm kiếm, phân quyền, sao lưu và bàn giao vận hành. Nêu lợi ích thực tế như giảm thời gian tìm hồ sơ, giảm lưu kho giấy, dễ kiểm soát dữ liệu.",
        "Nếu có sản phẩm liên quan trong dữ liệu website, ưu tiên gợi ý 1-3 lựa chọn phù hợp, nêu lý do ngắn và giá nếu có. Không bịa tồn kho, khuyến mãi hoặc thông số chưa có.",
        "Nếu thông tin chưa đủ chắc chắn, nói rõ cần đội ngũ HPT Tech xác nhận thêm. Với nhu cầu mua hàng hoặc triển khai, mời khách để lại số điện thoại, công ty/khu vực hoặc liên hệ hotline 0876 645 432/Zalo/Facebook để nhận báo giá nhanh.",
        `Trang hiện tại của người dùng: ${page || "không rõ"}.`,
        `Sản phẩm liên quan từ dữ liệu website:\n${productContext}`,
      ].join("\n"),
    },
    ...(Array.isArray(conversation) ? conversation : [])
      .filter((item) => item && typeof item.content === "string" && item.content.trim())
      .map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content,
      })),
    { role: "user", content: String(message) },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input,
        max_output_tokens: 300,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      sendJson(res, response.status, { error: result?.error?.message || "OpenAI API request failed." });
      return true;
    }

    const reply =
      result.output_text ||
      result.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text ||
      "";

    if (!reply) {
      sendJson(res, 502, { error: "Không đọc được phản hồi từ OpenAI." });
      return true;
    }

    sendJson(res, 200, { reply });
    return true;
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Không thể kết nối OpenAI API." });
    return true;
  }
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const normalized = path.normalize(requested).replace(/^(\.\.[\\/])+/, "");
  return path.join(root, normalized);
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url || "/";
  if (urlPath.startsWith("/api/chat")) {
    await handleChatApi(req, res);
    return;
  }

  const filePath = safePath(req.url || "/");

  fs.stat(filePath, (statError, stats) => {
    if (!statError && stats.isDirectory()) {
      const indexPath = path.join(filePath, "index.html");
      fs.readFile(indexPath, (readError, content) => {
        if (readError) return send(res, 404, "Not found");
        send(res, 200, content, mimeTypes[".html"]);
      });
      return;
    }

    if (!statError && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      fs.readFile(filePath, (readError, content) => {
        if (readError) return send(res, 500, "Internal server error");
        send(res, 200, content, mimeTypes[ext] || "application/octet-stream");
      });
      return;
    }

    if (path.extname(filePath)) {
      return send(res, 404, "Not found");
    }

    const htmlPath = `${filePath}.html`;
    fs.readFile(htmlPath, (readError, content) => {
      if (readError) return send(res, 404, "Not found");
      send(res, 200, content, mimeTypes[".html"]);
    });
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static server running at http://127.0.0.1:${port}`);
});
