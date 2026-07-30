"use client";

import { Phone, Send } from "lucide-react";
import { useState } from "react";

type SubmitState = "idle" | "sending" | "sent" | "error";

/**
 * CTA báo giá dành riêng cho hub /san-pham — copy B2B tổng quát
 * (không hardcode "máy scan" như CtaQuote gốc).
 */
export function HubCta() {
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    company: "",
    contact: "",
    phone: "",
    email: "",
    note: "",
  });

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    setState("sending");
    setErrorMsg("");
    try {
      const response = await fetch("/api/quotes/submit", {
        body: JSON.stringify({
          customer: form,
          landingPath: "/san-pham",
          products: [{ title: "Tư vấn thiết bị & giải pháp doanh nghiệp", quantity: 1, priceLabel: "Liên hệ" }],
          source: "hub-san-pham",
          totals: { totalLabel: "Liên hệ" },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState("error");
        setErrorMsg(data.error || "Không gửi được yêu cầu. Vui lòng thử lại hoặc gọi hotline.");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setErrorMsg(
        "Không kết nối được hệ thống. Vui lòng gọi hotline 0967 286 889 để được tư vấn ngay.",
      );
    }
  }

  return (
    <section
      id="hub-cta"
      aria-label="Liên hệ báo giá"
      className="bg-primary-900 px-4 py-14 font-sans sm:px-6 lg:px-8"
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        {/* Left: copy */}
        <div className="text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-primary-200">
            Báo giá dự án
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
            Cần tư vấn thiết bị &amp; báo giá cho doanh nghiệp?
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-primary-100">
            Gửi nhu cầu (thiết bị, số lượng, khối lượng công việc) — HPT Tech tư vấn cấu hình,
            báo giá chi tiết, xuất hóa đơn VAT, giao và lắp đặt toàn quốc.
          </p>

          {/* Trust list */}
          <ul className="mt-6 space-y-2 text-sm text-primary-100">
            {[
              "Chính hãng 100% — đại lý ủy quyền",
              "Xuất hóa đơn VAT đầy đủ",
              "Giao hàng &amp; lắp đặt toàn quốc",
              "Hỗ trợ kỹ thuật tận nơi",
              "Bảo hành chính hãng",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-accent-400">✓</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>

          {/* Hotline */}
          <a
            href="tel:0967286889"
            className="mt-6 inline-flex items-center gap-2 text-base font-bold text-accent-300 hover:text-accent-200"
          >
            <Phone size={18} />
            0967 286 889
          </a>
        </div>

        {/* Right: form */}
        <div className="rounded-xl bg-white p-5 shadow-soft">
          {state === "sent" ? (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="mb-3 text-3xl">✓</span>
              <p className="text-base font-bold text-success">Đã gửi yêu cầu thành công!</p>
              <p className="mt-2 text-sm text-ink/70">
                Bộ phận kinh doanh HPT Tech sẽ liên hệ bạn sớm nhất.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="h-11 rounded-md border border-border px-3 text-sm text-ink outline-none focus:border-primary-600"
                placeholder="Công ty / Tổ chức"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
              />
              <input
                className="h-11 rounded-md border border-border px-3 text-sm text-ink outline-none focus:border-primary-600"
                placeholder="Người liên hệ"
                value={form.contact}
                onChange={(e) => update("contact", e.target.value)}
              />
              <input
                className="h-11 rounded-md border border-border px-3 text-sm text-ink outline-none focus:border-primary-600"
                placeholder="Số điện thoại"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <input
                className="h-11 rounded-md border border-border px-3 text-sm text-ink outline-none focus:border-primary-600"
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <textarea
                className="min-h-24 rounded-md border border-border px-3 py-2 text-sm text-ink outline-none focus:border-primary-600 sm:col-span-2"
                placeholder="Nhu cầu: thiết bị cần tư vấn, số lượng, khối lượng công việc..."
                value={form.note}
                onChange={(e) => update("note", e.target.value)}
              />
              <button
                type="button"
                disabled={state === "sending"}
                onClick={submit}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60 sm:col-span-2"
              >
                <Send size={16} />
                {state === "sending" ? "Đang gửi..." : "Gửi yêu cầu báo giá"}
              </button>
              {state === "error" && (
                <p className="rounded-md bg-warning/10 p-3 text-sm font-semibold text-warning sm:col-span-2">
                  {errorMsg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
