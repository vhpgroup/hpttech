"use client";

import { FormEvent, useState } from "react";

export default function ContactForm({ icon, fallbackEmail }: { icon: React.ReactNode; fallbackEmail: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);
    setError("");
    setSent(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          service: formData.get("service"),
          message: formData.get("message"),
          source: "contact-page",
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error || "Không gửi được yêu cầu. Vui lòng thử lại sau.");
        return;
      }

      form.reset();
      setSent(true);
    } catch {
      setError("Không kết nối được hệ thống gửi form. Vui lòng liên hệ trực tiếp qua hotline hoặc email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Họ tên
          <input name="name" required className="h-11 rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-600" placeholder="Nhập họ tên" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Số điện thoại
          <input name="phone" required className="h-11 rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-600" placeholder="0876..." type="tel" />
        </label>
      </div>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
        Nhu cầu
        <select name="service" className="h-11 rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-600">
          <option>Báo giá sản phẩm</option>
          <option>Tư vấn giải pháp</option>
          <option>Hỗ trợ kỹ thuật</option>
          <option>Khác</option>
        </select>
      </label>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
        Nội dung
        <textarea name="message" required className="min-h-32 rounded-md border border-slate-200 p-3 font-normal outline-none focus:border-blue-600" placeholder="Mô tả sản phẩm, số lượng, khu vực triển khai..." />
      </label>
      <button className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60" type="submit" disabled={loading}>
        {icon}
        {loading ? "Đang gửi..." : "Gửi yêu cầu"}
      </button>
      {sent ? (
        <p className="mt-4 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
          Đã gửi yêu cầu. HPT Tech sẽ phản hồi trong thời gian sớm nhất.
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm font-medium text-amber-800">
          {error} <a className="underline" href={`mailto:${fallbackEmail}`}>Gửi email trực tiếp</a>
        </p>
      ) : null}
    </form>
  );
}
