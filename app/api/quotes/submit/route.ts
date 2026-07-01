import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { appendQuoteToSheet } from "@/lib/quote-sheet";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type QuoteItemInput = {
  product?: Record<string, unknown>;
  title?: unknown;
  sku?: unknown;
  quantity?: unknown;
  priceLabel?: unknown;
};

type QuoteItem = {
  title: string;
  sku: string;
  quantity: number;
  priceLabel: string;
};

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(key: string) {
  const now = Date.now();
  for (const [entryKey, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) rateLimitStore.delete(entryKey);
  }

  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

function clean(value: unknown, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function num(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isLikelyPhone(value: string) {
  return /^[0-9+().\-\s]{8,24}$/.test(value);
}

function fallbackQuoteId() {
  return `BG-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
}

export async function POST(request: Request) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { ok: false, error: "Bạn gửi hơi nhanh. Vui lòng thử lại sau ít phút." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const customer = body.customer && typeof body.customer === "object" ? body.customer : {};
  const lead = {
    quoteId: clean(body.quoteId, 40) || fallbackQuoteId(),
    dateLabel: clean(body.dateLabel, 20) || new Intl.DateTimeFormat("vi-VN").format(new Date()),
    company: clean((customer as Record<string, unknown>).company, 200),
    taxCode: clean((customer as Record<string, unknown>).taxCode, 40),
    contact: clean((customer as Record<string, unknown>).contact, 120),
    phone: clean((customer as Record<string, unknown>).phone, 40),
    email: clean((customer as Record<string, unknown>).email, 160),
    address: clean((customer as Record<string, unknown>).address, 400),
    note: clean((customer as Record<string, unknown>).note, 1500),
    source: clean(body.source, 60) || "quote-builder",
  };

  const productInputs = (Array.isArray(body.products) ? body.products : []) as QuoteItemInput[];
  const items: QuoteItem[] = productInputs
    .map((item) => {
      const product = item?.product && typeof item.product === "object" ? item.product : {};
      const productRecord = product as Record<string, unknown>;
      return {
        title: clean(productRecord.title ?? item?.title, 300),
        sku: clean(productRecord.sku ?? item?.sku, 80),
        quantity: Math.max(1, Math.floor(num(item?.quantity)) || 1),
        priceLabel: clean(productRecord.price ?? item?.priceLabel, 60),
      };
    })
    .filter((item): item is QuoteItem => Boolean(item.title));

  if (!lead.phone || !items.length) {
    return NextResponse.json(
      { ok: false, error: "Cần ít nhất 1 sản phẩm và số điện thoại." },
      { status: 400 },
    );
  }

  if (!isLikelyPhone(lead.phone)) {
    return NextResponse.json(
      { ok: false, error: "Số điện thoại chưa đúng định dạng." },
      { status: 400 },
    );
  }

  const totals = body.totals && typeof body.totals === "object" ? body.totals : {};
  const totalRecord = totals as Record<string, unknown>;
  const totalLabel = clean(totalRecord.totalLabel, 60) || "Liên hệ";
  const productsLabel = items.map((item) => `${item.title} x${item.quantity}`).join("; ");

  try {
    const payload = await getPayloadClient();
    await payload.create({
      collection: "quote-requests",
      overrideAccess: true,
      data: {
        ...lead,
        items,
        totalLabel,
        subtotal: num(totalRecord.subtotal),
        vat: num(totalRecord.vat),
        status: "new",
      },
    });
  } catch (error) {
    console.error("quote-submit: lưu Payload lỗi", error);
    return NextResponse.json(
      { ok: false, error: "Không lưu được yêu cầu. Vui lòng thử lại." },
      { status: 500 },
    );
  }

  try {
    await appendQuoteToSheet({
      quoteId: lead.quoteId,
      dateLabel: lead.dateLabel,
      company: lead.company,
      taxCode: lead.taxCode,
      contact: lead.contact,
      phone: lead.phone,
      email: lead.email,
      productsLabel,
      totalLabel,
      note: lead.note,
    });
  } catch (error) {
    console.error("quote-submit: append Google Sheet lỗi (lead đã lưu Payload)", error);
  }

  const webhookURL = process.env.CONTACT_WEBHOOK_URL;
  if (webhookURL) {
    try {
      await fetch(webhookURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.CONTACT_WEBHOOK_SECRET
            ? { "x-contact-secret": process.env.CONTACT_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify({
          type: "quote-request",
          ...lead,
          items,
          totalLabel,
          createdAt: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(Number(process.env.CONTACT_WEBHOOK_TIMEOUT_MS) || 8000),
      });
    } catch (error) {
      console.error("quote-submit: webhook lỗi (bỏ qua)", error);
    }
  }

  return NextResponse.json({ ok: true, quoteId: lead.quoteId });
}
