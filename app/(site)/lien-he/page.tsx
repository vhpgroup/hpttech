import Image from "next/image";
import { Building2, ExternalLink, Mail, MapPin, PhoneCall, Send } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings, phoneHref } from "@/lib/site-settings";

export const revalidate = 300;

const PAYMENT_INFO = {
  bankName: "Techcombank – Chi nhánh Hải Phòng",
  accountName: "CÔNG TY TNHH XD VÀ TB CN HPT",
  accountNumber: "92923939",
  taxCode: "0202253444",
  legalRepresentative: "Ông Phạm Văn Bách",
  legalRepresentativeTitle: "Giám đốc điều hành",
} as const;

export const metadata = pageMetadata({
  title: "Liên hệ",
  description:
    "Liên hệ HPT Tech để nhận tư vấn thiết bị văn phòng, báo giá máy in, máy scan và giải pháp số hóa.",
  path: "/lien-he",
});

export default async function ContactPage() {
  const settings = normalizeSiteSettings(await getSiteSettingsFromPayload());
  const phone = settings.hotline || settings.phone;

  return (
    <main className="subpage-main">
      <SubpageHeader
        eyebrow="Liên hệ HPT Tech"
        title="Liên hệ"
        description="Kết nối với HPT Tech để nhận tư vấn thiết bị văn phòng, báo giá máy in, máy scan và giải pháp số hóa."
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Liên hệ" },
        ]}
      />

      {settings.googleMapsEmbedUrl ? (
        <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Bản đồ</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">{settings.googleMapsTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{settings.address}</p>
            </div>
            {settings.googleMapsDirectionsUrl ? (
              <a
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
                href={settings.googleMapsDirectionsUrl}
                target="_blank"
                rel="noreferrer"
              >
                Chỉ đường
                <ExternalLink size={16} />
              </a>
            ) : null}
          </div>
          <iframe
            className="h-[300px] w-full border-0 sm:h-[360px] lg:h-[420px]"
            src={settings.googleMapsEmbedUrl}
            title={settings.googleMapsTitle}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <ContactForm icon={<Send size={16} />} fallbackEmail={settings.email} />

        <aside className="grid gap-4">
          <ContactCard icon={<PhoneCall size={22} />} title="Hotline" value={phone} href={phoneHref(phone)} />
          <ContactCard icon={<Mail size={22} />} title="Email" value={settings.email} href={`mailto:${settings.email}`} />
          <ContactCard icon={<MapPin size={22} />} title="Khu vực hỗ trợ" value={settings.address} />
          <PaymentInfoCard />
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

function PaymentInfoCard() {
  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#0f4fd6] to-[#2368f2] px-5 py-4 text-white">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-white/14 ring-1 ring-white/20">
          <Building2 size={20} />
        </span>
        <div>
          <h2 className="text-base font-bold sm:text-lg">Thông tin thanh toán</h2>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <dl className="space-y-3 text-sm text-slate-700">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <dt className="inline font-semibold text-slate-900">Số tài khoản: </dt>
            <dd className="inline text-xl font-extrabold tracking-[0.08em] text-blue-700">{PAYMENT_INFO.accountNumber}</dd>
          </div>
          <div className="border-b border-slate-100 pb-3">
            <dt className="inline font-semibold text-slate-900">Chủ tài khoản: </dt>
            <dd className="inline text-slate-950">{PAYMENT_INFO.accountName}</dd>
          </div>
          <div className="border-b border-slate-100 pb-3">
            <dt className="inline font-semibold text-slate-900">Ngân hàng: </dt>
            <dd className="inline text-slate-950">{PAYMENT_INFO.bankName}</dd>
          </div>
          <div className="border-b border-slate-100 pb-3">
            <dt className="inline font-semibold text-slate-900">Mã số thuế: </dt>
            <dd className="inline text-slate-950">{PAYMENT_INFO.taxCode}</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-slate-900">Đại diện pháp luật: </dt>
            <dd className="inline text-slate-950">{PAYMENT_INFO.legalRepresentative}</dd>
            <p className="mt-1 text-slate-600">Chức vụ: {PAYMENT_INFO.legalRepresentativeTitle}</p>
          </div>
        </dl>
      </div>

      <div className="flex items-center justify-center gap-6 border-t border-slate-100 bg-slate-50 px-5 py-4">
        <Image
          src="/assets/bank/techcombank_logo_svg.svg"
          alt="Techcombank"
          width={140}
          height={28}
          className="h-7 w-auto object-contain"
        />
        <Image
          src="/assets/bank/napas.png"
          alt="Napas"
          width={104}
          height={28}
          className="h-7 w-auto object-contain"
        />
      </div>
    </section>
  );
}
