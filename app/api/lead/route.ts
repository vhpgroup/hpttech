import { NextResponse } from "next/server";

const PHONE_RE = /^(0|\+84)[0-9]{8,10}$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 120);
  const phone = String(body.phone || "").trim().replace(/\s+/g, "");
  const service = String(body.service || "").trim().slice(0, 120);
  const message = String(body.message || "").trim().slice(0, 2000);
  const page = String(body.page || "").trim().slice(0, 200);

  if (!name) return NextResponse.json({ error: "Thiếu tên." }, { status: 400 });
  if (!PHONE_RE.test(phone)) {
    return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (apiKey && to) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: "HPT Tech Lead <onboarding@resend.dev>",
          to: [to],
          subject: `Lead moi: ${name} - ${phone}`,
          text: `Ten: ${name}\nSDT: ${phone}\nDich vu: ${service}\nTrang: ${page}\nNoi dung: ${message}`,
        }),
      });
    } catch {}
  }

  return NextResponse.json({ ok: true });
}
