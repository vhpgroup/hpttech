"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import type { CatalogProduct } from "@/lib/catalog";

type CtaQuoteProps = {
  industry?: string;
  landingPath?: string;
  products: CatalogProduct[];
  title: string;
};

type SubmitState = "idle" | "sending" | "sent" | "error";

export function CtaQuote({ industry, landingPath, products, title }: CtaQuoteProps) {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [customer, setCustomer] = useState({
    company: "",
    contact: "",
    phone: "",
    email: "",
    note: "",
  });

  const updateCustomer = (key: keyof typeof customer, value: string) => {
    setCustomer((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    setState("sending");
    setError("");

    const quoteProducts = products.length
      ? products.slice(0, 3).map((product) => ({ product, quantity: 1 }))
      : [{ title: title || "Tư vấn giải pháp máy scan", quantity: 1, priceLabel: "Liên hệ" }];

    try {
      const response = await fetch("/api/quotes/submit", {
        body: JSON.stringify({
          customer,
          facetSlug: industry,
          industry,
          landingPath,
          products: quoteProducts,
          source: "pseo-may-scan",
          totals: { totalLabel: "Liên hệ" },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setState("error");
        setError(data.error || "Không gửi được yêu cầu. Vui lòng thử lại hoặc gọi hotline.");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setError("Không kết nối được hệ thống. Vui lòng gọi hotline 0967286889 để được tư vấn ngay.");
    }
  };

  return (
    <section className="bg-primary-700 px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-100">Báo giá dự án</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight">Cần tư vấn cấu hình máy scan phù hợp?</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-primary-50">
            HPT Tech hỗ trợ chọn model chính hãng, lên cấu hình theo khối lượng hồ sơ, xuất hóa đơn VAT và giao toàn quốc.
          </p>
        </div>

        <div className="grid gap-3 rounded-lg bg-white p-4 text-ink shadow-soft sm:grid-cols-2">
          <input
            className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary-600"
            placeholder="Công ty"
            value={customer.company}
            onChange={(event) => updateCustomer("company", event.target.value)}
          />
          <input
            className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary-600"
            placeholder="Người liên hệ"
            value={customer.contact}
            onChange={(event) => updateCustomer("contact", event.target.value)}
          />
          <input
            className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary-600"
            placeholder="Số điện thoại"
            value={customer.phone}
            onChange={(event) => updateCustomer("phone", event.target.value)}
          />
          <input
            className="h-11 rounded-md border border-border px-3 text-sm outline-none focus:border-primary-600"
            placeholder="Email"
            value={customer.email}
            onChange={(event) => updateCustomer("email", event.target.value)}
          />
          <textarea
            className="min-h-24 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary-600 sm:col-span-2"
            placeholder="Nhu cầu scan, số lượng máy, khối lượng tài liệu..."
            value={customer.note}
            onChange={(event) => updateCustomer("note", event.target.value)}
          />
          <button
            type="button"
            disabled={state === "sending"}
            onClick={submit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary-600 px-4 text-sm font-bold text-white transition hover:bg-primary-700 disabled:opacity-60 sm:col-span-2"
          >
            <Send size={17} />
            {state === "sending" ? "Đang gửi..." : "Gửi yêu cầu báo giá"}
          </button>
          {state === "sent" ? (
            <p className="rounded-md bg-success/10 p-3 text-sm font-semibold text-success sm:col-span-2">
              Đã gửi yêu cầu. Bộ phận kinh doanh HPT Tech sẽ liên hệ sớm.
            </p>
          ) : null}
          {state === "error" ? (
            <p className="rounded-md bg-warning/10 p-3 text-sm font-semibold text-warning sm:col-span-2">{error}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
