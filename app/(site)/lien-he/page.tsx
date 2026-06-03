import { Mail, MapPin, PhoneCall, Send } from "lucide-react";
import ContactForm from "@/components/ContactForm";
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
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">Tư vấn nhanh</p>
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Liên hệ HPT Tech</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Gửi nhu cầu báo giá, tư vấn thiết bị hoặc triển khai giải pháp. Hệ thống sẽ chuyển yêu cầu đến kênh nhận được cấu hình cho HPT Tech.
          </p>
        </div>
      </section>

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
