import Image from "next/image";
import { Mail, MessageCircle, PhoneCall } from "lucide-react";

type ConsultationBoxProps = {
  phone: string;
  email: string;
  zaloHref: string;
};

export default function ConsultationBox({ phone, email, zaloHref }: ConsultationBoxProps) {
  return (
    <section className="rounded-lg border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
      <h2 className="text-base font-bold text-slate-950">Cần tư vấn thêm?</h2>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
          <Image src="/assets/consultants/HPT.webp" alt="Chuyên viên HPT Tech" fill className="object-cover" sizes="48px" />
        </div>
        <p className="text-sm leading-5 text-slate-700">
          Đội ngũ HPT Tech hỗ trợ chọn thiết bị theo số lượng hồ sơ, phòng ban và ngân sách triển khai.
        </p>
      </div>
      <div className="mt-4 grid gap-2">
        <a
          href={zaloHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-blue-700 bg-white text-sm font-bold text-blue-700 transition hover:bg-blue-50"
        >
          <MessageCircle size={17} />
          Chat Zalo với chuyên viên
        </a>
        <a
          href={`tel:${phone.replace(/[^\d+]/g, "")}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-blue-700 bg-white text-sm font-bold text-blue-700 transition hover:bg-blue-50"
        >
          <PhoneCall size={17} />
          Gọi ngay: {phone}
        </a>
        <a
          href={`mailto:${email}?subject=${encodeURIComponent("Yêu cầu tư vấn AI Search HPT Tech")}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          <Mail size={17} />
          Gửi yêu cầu tư vấn
        </a>
      </div>
    </section>
  );
}
