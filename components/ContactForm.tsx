"use client";

import { FormEvent, useState } from "react";

export default function ContactForm({ icon }: { icon: React.ReactNode }) {
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Họ tên
          <input required className="h-11 rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-600" placeholder="Nhập họ tên" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Số điện thoại
          <input required className="h-11 rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-600" placeholder="0876..." type="tel" />
        </label>
      </div>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
        Nhu cầu
        <select className="h-11 rounded-md border border-slate-200 px-3 font-normal outline-none focus:border-blue-600">
          <option>Báo giá sản phẩm</option>
          <option>Tư vấn giải pháp</option>
          <option>Hỗ trợ kỹ thuật</option>
          <option>Khác</option>
        </select>
      </label>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
        Nội dung
        <textarea required className="min-h-32 rounded-md border border-slate-200 p-3 font-normal outline-none focus:border-blue-600" placeholder="Mô tả sản phẩm, số lượng, khu vực triển khai..." />
      </label>
      <button className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800" type="submit">
        {icon}
        Gửi yêu cầu
      </button>
      {sent ? (
        <p className="mt-4 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
          Đã ghi nhận yêu cầu trên giao diện. Bước sau sẽ nối endpoint gửi email/CRM thật.
        </p>
      ) : null}
    </form>
  );
}
