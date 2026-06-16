import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  ChevronUp,
  Globe2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import type { PublicSiteSettings } from "@/lib/content-payload";
import { helpLinks } from "@/lib/help-links";
import { phoneHref } from "@/lib/site-settings";

const HPT_LOGO_SRC = "/assets/logo/hptlogo.jpg";

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

type ContactItem = {
  label: string;
  value: string;
  href?: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
};

const footerColumns: FooterColumn[] = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Laptop", href: "/san-pham" },
      { label: "Máy scan", href: "/san-pham" },
      { label: "Máy in", href: "/san-pham" },
      { label: "NAS / Server", href: "/san-pham" },
      { label: "Camera giám sát", href: "/san-pham" },
      { label: "Thiết bị mạng", href: "/san-pham" },
      { label: "Máy chiếu", href: "/san-pham" },
      { label: "Phụ kiện CNTT", href: "/san-pham" },
    ],
  },
  {
    title: "Công ty",
    links: [
      { label: "Về HPT Tech", href: "/ve-hpt" },
      { label: "Dự án tiêu biểu", href: "/du-an" },
      { label: "Hồ sơ năng lực", href: "/ve-hpt" },
      { label: "Tin tức", href: "/tin-tuc" },
      { label: "Tuyển dụng", href: "/tuyen-dung" },
      { label: "Liên hệ", href: "/lien-he" },
    ],
  },
  {
    title: "Chính sách và hỗ trợ",
    links: helpLinks.map((link) => ({ ...link })),
  },
];

export default function Footer({ settings }: { settings: Required<PublicSiteSettings> }) {
  const phone = settings.hotline || settings.phone;
  const contactItems: ContactItem[] = [
    { label: "Địa chỉ", value: "SB04 Vinhomes Marina, phường An Biên, thành phố Hải Phòng.", icon: MapPin },
    { label: "Hotline", value: phone, href: phoneHref(phone), icon: Phone },
    { label: "Email", value: settings.email, href: `mailto:${settings.email}`, icon: Mail },
    { label: "Website", value: "hpttech.vn", href: "https://hpttech.vn", icon: Globe2 },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#03111f] text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer HPT Tech
      </h2>

      <div className="mx-auto grid max-w-[1500px] gap-9 px-8 py-14 md:grid-cols-2 lg:grid-cols-[1.2fr_0.72fr_0.72fr_1fr_1.05fr] lg:justify-between lg:px-10">
        <section className="lg:max-w-[360px]" aria-labelledby="footer-about-heading">
          <Link href="/" className="inline-flex rounded-xl bg-white px-4 py-3" aria-label="HPT Tech trang chủ">
            <Image
              src={HPT_LOGO_SRC}
              alt={settings.companyName}
              width={150}
              height={88}
              className="h-auto w-[150px] object-contain"
            />
          </Link>
          <p className="mt-8 text-base leading-8 text-slate-300">
            HPT Tech cung cấp thiết bị CNTT, thiết bị văn phòng, máy scan, máy in, NAS, camera, thiết bị mạng và giải pháp hạ tầng công nghệ cho doanh nghiệp, tổ chức và cơ quan nhà nước.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            <Stat value="10+" label="Năm kinh nghiệm" />
            <Stat value="1000+" label="Khách hàng tin tưởng" />
            <Stat value="100%" label="Hàng chính hãng" />
          </div>
        </section>

        {footerColumns.map((column) => (
          <FooterColumnBlock key={column.title} column={column} />
        ))}

        <section aria-labelledby="footer-contact-heading">
          <h3 id="footer-contact-heading" className="footer-heading">
            Liên hệ
          </h3>
          <ul className="mt-7 space-y-5">
            {contactItems.map(({ label, value, href, icon: Icon }) => (
              <li key={label} className="flex gap-4 text-sm leading-6 text-slate-300">
                <Icon className="mt-0.5 shrink-0 text-[#1b8cff]" size={18} aria-hidden="true" />
                <div>
                  <span className="sr-only">{label}: </span>
                  {href ? (
                    <a href={href} className="footer-link">
                      {value}
                    </a>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mx-auto max-w-[1500px] border-t border-white/10 px-8 py-8 lg:px-10">
        <div className="flex flex-col gap-6 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
          <p>© 2026 HPT Tech. All rights reserved.</p>
          <nav className="flex flex-wrap gap-6" aria-label="Liên kết pháp lý">
            <Link className="footer-link" href="/dieu-khoan-su-dung">
              Điều khoản sử dụng
            </Link>
            <Link className="footer-link" href="/sitemap.xml">
              Sitemap
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <SocialLink href={settings.facebook} label="Facebook" logoSrc="/assets/icons/facebook.svg" />
            <SocialLink href={settings.youtube || "/tin-tuc"} label="YouTube" logoSrc="/assets/icons/youtube.svg" />
            <SocialLink href="/lien-he" label="LinkedIn" logoSrc="/assets/icons/linkedin.svg" />
            <SocialLink href={settings.zalo} label="Zalo" logoSrc="/assets/icons/zalo.png" />
            <a
              href="#top"
              aria-label="Lên đầu trang"
              className="ml-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/35 text-white transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white/10"
            >
              <ChevronUp size={22} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <BadgeCheck className="text-[#1b8cff]" size={34} strokeWidth={1.8} />
      <strong className="mt-4 block text-2xl font-bold text-[#5ab0ff]">{value}</strong>
      <span className="mt-1 block text-sm leading-5 text-slate-300">{label}</span>
    </div>
  );
}

function FooterColumnBlock({ column }: { column: FooterColumn }) {
  return (
    <nav aria-labelledby={`footer-${column.title}`} className="min-w-0">
      <h3 id={`footer-${column.title}`} className="footer-heading">
        {column.title}
      </h3>
      <ul className="mt-7 space-y-4">
        {column.links.map((link) => (
          <li key={link.label}>
            <Link className="footer-link" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialLink({
  href,
  label,
  icon: Icon,
  logoSrc,
  text,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  logoSrc?: string;
  text?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-white transition hover:-translate-y-0.5 hover:bg-[#0b74ff]"
    >
      {logoSrc ? (
        <Image src={logoSrc} alt="" width={23} height={23} className="h-6 w-6 object-contain" aria-hidden="true" />
      ) : Icon ? (
        <Icon size={19} aria-hidden="true" />
      ) : (
        <span className="text-sm font-black">{text}</span>
      )}
    </a>
  );
}
