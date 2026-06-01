"use client";

import { FormEvent, useState } from "react";
import { Mail, MapPin, PhoneCall, Send } from "lucide-react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <main className="subpage-main">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Tư vấn nhanh</p>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Liên hệ HPT Tech</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Gửi nhu cầu báo giá, tư vấn thiết bị hoặc triển khai giải pháp. Form hiện xử lý client-side, sẵn sàng nối email/CRM/API ở bước sau.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
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
            <Send size={16} />
            Gửi yêu cầu
          </button>
          {sent ? (
            <p className="mt-4 rounded-md bg-green-50 p-3 text-sm font-medium text-green-700">
              Đã ghi nhận yêu cầu trên giao diện. Bước sau sẽ nối endpoint gửi email/CRM thật.
            </p>
          ) : null}
        </form>

        <aside className="grid gap-4">
          <ContactCard icon={<PhoneCall size={22} />} title="Hotline" value="0876 645 432" href="tel:0876645432" />
          <ContactCard icon={<Mail size={22} />} title="Email" value="lienhe@hpttech.vn" href="mailto:lienhe@hpttech.vn" />
          <ContactCard icon={<MapPin size={22} />} title="Khu vực hỗ trợ" value="Tư vấn và triển khai cho doanh nghiệp" />
        </aside>
      </section>
    </main>
  );
}

function ContactCard({
  icon,
  title,
  value,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
      <span className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-blue-700">{icon}</span>
      <div>
        <h2 className="font-semibold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-600">{value}</p>
      </div>
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
}
