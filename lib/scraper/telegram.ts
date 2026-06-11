import type { BatchResult, BatchSummary } from "./types";

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: true,
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

export async function notifyProductResult(result: BatchResult) {
  const confidence =
    typeof result.confidence === "number"
      ? ` (${Math.round(result.confidence * 100)}%)`
      : "";
  const detail =
    result.error || result.warnings[0] || result.adminUrl || "Khong co ghi chu.";
  return sendTelegramMessage(
    `[${result.status.toUpperCase()}] ${result.productName}${confidence}\n${detail}`,
  );
}

export async function notifySummary(summary: BatchSummary, reportPath: string) {
  const seconds = Math.round(summary.durationMs / 1000);
  return sendTelegramMessage(
    [
      "Ket qua bulk product scraper",
      `Tong: ${summary.total}`,
      `Draft: ${summary.draft}`,
      `Search-only: ${summary.searched}`,
      `That bai: ${summary.failed}`,
      `Thoi gian: ${seconds}s`,
      `Bao cao: ${reportPath}`,
    ].join("\n"),
  );
}
