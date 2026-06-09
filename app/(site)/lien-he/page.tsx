import { ExternalLink, Mail, MapPin, PhoneCall, Send } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings, phoneHref } from "@/lib/site-settings";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Liên hệ",
  description: "Liên hệ HPT Tech để nhận tư vấn thiết bị văn phòng, báo giá máy in, máy scan và giải pháp số hóa.",
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
