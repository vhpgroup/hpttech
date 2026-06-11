import type { BatchResult, BatchSummary } from "./types";

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const threadId =
    process.env.TELEGRAM_PRODUCT_THREAD_ID ||
    process.env.TELEGRAM_MESSAGE_THREAD_ID;
  const messageThreadId = threadId ? Number(threadId) : undefined;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: true,
      ...(Number.isInteger(messageThreadId)
        ? { message_thread_id: messageThreadId }
        : {}),
      text,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(
      Number(process.env.TELEGRAM_TIMEOUT_MS || 10_000),
    ),
  }).catch(() => undefined);

  return Boolean(response?.ok);
}

function confidenceText(value?: number) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "Không có";
}

function firstItems(values: string[], limit: number) {
  const items = values.filter(Boolean).slice(0, limit);
  const remaining = values.length - items.length;
  return remaining > 0 ? [...items, `và ${remaining} mục khác`] : items;
}

function statusText(status: BatchResult["status"]) {
  if (status === "published") return "ĐÃ XUẤT BẢN";
  if (status === "draft") return "BẢN NHÁP";
  if (status === "searched") return "ĐÃ TÌM THẤY";
  return "THẤT BẠI";
}

export async function notifyProductResult(result: BatchResult) {
  if (result.status === "failed") {
    return sendTelegramMessage(
      [
        `[THẤT BẠI] ${result.productName}`,
        `Lỗi: ${result.error || "Không rõ lỗi."}`,
      ].join("\n"),
    );
  }

  const report = result.productReport;
  const warnings = firstItems(result.warnings, 4);
  const lines = [
    `[${statusText(result.status)}] ${result.productName}`,
    `Độ tin cậy: ${confidenceText(result.confidence)}`,
    result.adminUrl ? `Trang quản trị: ${result.adminUrl}` : "",
    report?.productUrl ? `Trang sản phẩm: ${report.productUrl}` : "",
    result.sourceUrls[0]
      ? `Nguồn: ${report?.sourceDomain || result.sourceUrls[0]}`
      : "",
    `Ảnh R2: ${
      report?.imageStatus === "ok"
        ? `Đã lưu (${report.imageCount || 0} ảnh)`
        : "Chưa có ảnh"
    }`,
    `Thông số lấy được: ${report?.specCount ?? 0}`,
    report?.warranty ? `Bảo hành: ${report.warranty}` : "",
    report?.rating !== undefined || report?.viewCount !== undefined
      ? `Đánh giá/Lượt xem: ${report?.rating ?? "Không có"} sao / ${report?.viewCount ?? "Không có"} lượt`
      : "",
    report?.sellingPointCount !== undefined
      ? `Điểm nổi bật: ${report.sellingPointCount}`
      : "",
    warnings.length ? `Cảnh báo: ${warnings.join(" | ")}` : "",
  ].filter(Boolean);

  return sendTelegramMessage(lines.join("\n"));
}

export async function notifySummary(summary: BatchSummary, reportPath: string) {
  const seconds = Math.round(summary.durationMs / 1000);
  return sendTelegramMessage(
    [
      "Báo cáo crawl sản phẩm",
      `Tổng số: ${summary.total}`,
      `Đã xuất bản: ${summary.published}`,
      `Bản nháp: ${summary.draft}`,
      `Chỉ tìm kiếm: ${summary.searched}`,
      `Thất bại: ${summary.failed}`,
      `Thời gian chạy: ${seconds} giây`,
      `File Excel: ${reportPath}`,
    ].join("\n"),
  );
}
