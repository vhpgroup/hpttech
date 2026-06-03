import { NextResponse } from "next/server";

const MAX_FIELD_LENGTH = 1000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  for (const [entryKey, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) rateLimitStore.delete(entryKey);
  }

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function clean(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  return String(value || "").trim().slice(0, maxLength);
}

function isLikelyPhone(value: string) {
  return /^[0-9+().\-\s]{8,24}$/.test(value);
}

export async function POST(request: Request) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json({ ok: false, error: "Bạn gửi hơi nhanh. Vui lòng thử lại sau ít phút." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const lead = {
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    service: clean(body.service, 120),
    message: clean(body.message, 1200),
    source: clean(body.source, 120),
  };

  if (!lead.name || !lead.phone || !lead.message) {
    return NextResponse.json({ ok: false, error: "Vui lòng nhập họ tên, số điện thoại và nội dung." }, { status: 400 });
  }

  if (!isLikelyPhone(lead.phone)) {
    return NextResponse.json({ ok: false, error: "Số điện thoại chưa đúng định dạng." }, { status: 400 });
  }

  const webhookURL = process.env.CONTACT_WEBHOOK_URL;
  if (!webhookURL) {
    return NextResponse.json(
      {
        ok: false,
        error: "Form chưa được cấu hình kênh nhận tự động. Vui lòng liên hệ hotline hoặc email để được hỗ trợ ngay.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(webhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CONTACT_WEBHOOK_SECRET
          ? { "x-contact-secret": process.env.CONTACT_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        ...lead,
        createdAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: "Kênh nhận yêu cầu đang gián đoạn. Vui lòng thử lại sau." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Không gửi được yêu cầu. Vui lòng thử lại sau." }, { status: 502 });
  }
}
