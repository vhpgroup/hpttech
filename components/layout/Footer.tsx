import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  ChevronUp,
  FileText,
  Globe2,
  Mail,
  Phone,
} from "lucide-react";
import type { SVGProps } from "react";
import type { PublicSiteSettings } from "@/lib/content-payload";
import { helpLinks } from "@/lib/help-links";
import { phoneHref } from "@/lib/site-settings";

const HPT_LOGO_SRC = "/assets/logo/hptlogo.png";
const HPT_BCT_BADGE_SRC = "/assets/logo/bctn.png";
const HPT_LEGAL_NAME = "Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT";
const HPT_TAX_CODE = "0202253444";
const HPT_PUBLIC_PHONE = "0967286889";

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

type OfficeLocation = {
  city: string;
  address: string;
  phone?: string;
  isHeadOffice?: boolean;
};

type OfficeCardTheme = {
  edge: string;
  number: string;
  badge: string;
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

const officeLocations: OfficeLocation[] = [
  {
    city: "Hải Phòng",
    address: "SB04 Vinhomes Marina, phường An Biên, thành phố Hải Phòng.",
    isHeadOffice: true,
  },
  {
    city: "Hồ Chí Minh",
    address: "285 Trần Bình Trọng, Phường 4, Quận 5, TP. Hồ Chí Minh.",
  },
  {
    city: "Hà Nội",
    address: "Số 3, Ngõ 198, Đường Lê Trọng Tấn, Phường Phương Liệt, TP. Hà Nội.",
  },
  {
    city: "Cần Thơ",
    address: "69 Nguyễn Trãi, Phường Ninh Kiều, TP. Cần Thơ.",
  },
  {
    city: "Thanh Hóa",
    address: "Lô 32 Nơ 18 Nguyễn Thị Anh, P. Hạc Thành, TP. Thanh Hoá.",
    phone: "+84 964 636 679",
  },
  {
    city: "Kon Tum",
    address: "199 Đoàn Thị Điểm, phường Kon Tum, tỉnh Quảng Ngãi.",
    phone: "+84 982 701 117",
  },
];

const officeCardTheme: OfficeCardTheme = {
  edge: "bg-primary-600",
  number: "bg-primary-900 text-white",
  badge: "bg-primary-900 text-white",
};

const headOfficeCardTheme: OfficeCardTheme = {
  edge: "bg-accent-300",
  number: "bg-accent-300 text-primary-900",
  badge: "bg-primary-900 text-white",
};

export default function Footer({ settings }: { settings: Required<PublicSiteSettings> }) {
  const phone = HPT_PUBLIC_PHONE;
  const contactItems: ContactItem[] = [
    { label: "Công ty", value: HPT_LEGAL_NAME, icon: Building2 },
    { label: "Mã số thuế", value: HPT_TAX_CODE, icon: FileText },
    { label: "Hotline", value: phone, href: phoneHref(phone), icon: Phone },
    { label: "Email", value: settings.email, href: `mailto:${settings.email}`, icon: Mail },
    { label: "Website", value: "hpttech.vn", href: "https://hpttech.vn", icon: Globe2 },
  ];

  return (
    <>
      <OfficeLocationsSection />

      <footer
        className="relative overflow-hidden bg-[linear-gradient(180deg,#0d2744_0%,#11375f_48%,#184c80_100%)] text-white"
        aria-labelledby="footer-heading"
      >
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
          <p className="mt-8 text-base leading-8 text-slate-100/85">
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
              <li key={label} className="flex gap-4 text-sm leading-6 text-slate-100/80">
                <Icon className="mt-0.5 shrink-0 text-sky-300" size={18} aria-hidden="true" />
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

      <div className="mx-auto max-w-[1500px] border-t border-white/15 px-8 py-8 lg:px-10">
        <div className="flex flex-col gap-6 text-sm text-slate-100/70 lg:flex-row lg:items-center lg:justify-between">
          <p>© 2026 HPT Tech. All rights reserved.</p>
          <nav className="flex flex-wrap gap-6" aria-label="Liên kết pháp lý">
            <Link className="footer-link" href="/dieu-khoan-su-dung">
              Điều khoản sử dụng
            </Link>
            <Link className="footer-link" href="/sitemap.xml">
              Sitemap
            </Link>
          </nav>
          <a
            href="https://online.gov.vn/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center rounded-2xl bg-white px-3 py-2 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_-26px_rgba(15,23,42,0.68)]"
            aria-label="Đã thông báo Bộ Công Thương"
          >
            <Image
              src={HPT_BCT_BADGE_SRC}
              alt="Đã thông báo Bộ Công Thương"
              width={138}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </a>
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
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <BadgeCheck className="text-sky-300" size={34} strokeWidth={1.8} />
      <strong className="mt-4 block text-2xl font-bold text-white">{value}</strong>
      <span className="mt-1 block text-sm leading-5 text-slate-100/75">{label}</span>
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

function OfficeLocationsSection() {
  return (
    <section className="relative overflow-hidden border-y border-border bg-surface px-8 py-8 lg:px-10" aria-labelledby="office-locations-heading">
      <div className="mx-auto max-w-[1500px] overflow-hidden rounded-lg bg-white p-6 shadow-[0_20px_52px_-36px_rgba(15,23,42,0.45)]">
        <div className="home-category-bar">
          <FluentBuilding aria-hidden="true" className="drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]" />
          <h2 id="office-locations-heading">Hệ thống văn phòng</h2>
          <div className="home-category-tabs" aria-label="Thông tin hệ thống văn phòng">
            <button type="button" className="active">
              06 văn phòng toàn quốc
            </button>
          </div>
        </div>

        <div className="grid gap-6 pt-7 md:grid-cols-2 xl:grid-cols-3">
          {officeLocations.map((office, index) => (
            <OfficeCard key={office.city} office={office} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function OfficeCard({ office, index }: { office: OfficeLocation; index: number }) {
  const ordinal = String(index + 1).padStart(2, "0");
  const theme = office.isHeadOffice ? headOfficeCardTheme : officeCardTheme;

  return (
    <article className="relative overflow-hidden rounded-lg border border-border bg-white text-ink shadow-sm">
      <span className={`absolute inset-y-0 left-0 w-1 ${theme.edge}`} aria-hidden="true" />
      <div className="flex min-h-[72px] items-center justify-between gap-4 border-b border-border bg-primary-50/35 py-4 pl-7 pr-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${theme.number} text-sm font-black shadow-sm`}>
            {ordinal}
          </span>
          <h4 className="text-base font-black uppercase leading-tight text-primary-900">
            Văn phòng {office.city}
          </h4>
        </div>
        {office.isHeadOffice ? (
          <span className={`shrink-0 rounded-md px-3 py-1 text-[11px] font-black uppercase ${theme.badge}`}>
            Trụ sở chính
          </span>
        ) : null}
      </div>

      <div className="space-y-4 px-7 py-6 text-base leading-7 text-primary-900">
        <div className="flex gap-4">
          <FluentMapPin aria-hidden="true" />
          <div>
            <span className="font-semibold text-slate-700">Địa chỉ: </span>
            <span>{office.address}</span>
          </div>
        </div>

        {office.isHeadOffice ? (
          <div className="flex gap-4">
            <FluentPhone aria-hidden="true" />
            <a href={phoneHref(HPT_PUBLIC_PHONE)} className="transition hover:text-danger">
              <span className="font-semibold text-slate-700">Hotline: </span>
              <span className="font-black">{formatPhoneForDisplay(HPT_PUBLIC_PHONE)}</span>
            </a>
          </div>
        ) : null}

        {office.phone ? (
          <div className="flex gap-4">
            <FluentPhone aria-hidden="true" />
            <a href={phoneHref(office.phone)} className="transition hover:text-danger">
              <span className="font-semibold text-slate-700">Điện thoại: </span>
              <span className="font-black">{office.phone}</span>
            </a>
          </div>
        ) : null}

        <div className="flex gap-4">
          <FluentClock aria-hidden="true" />
          <div>
            <span className="font-semibold text-slate-700">Giờ làm việc: </span>
            <span>Thứ 2 - Thứ 6: 8h - 17h30 | Thứ 7: 8h - 12h</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function formatPhoneForDisplay(phone: string) {
  return phone.replace(/^(\d{4})(\d{3})(\d{3})$/, "$1 $2 $3");
}

function iconStyle(style: SVGProps<SVGSVGElement>["style"], size = "1.75rem") {
  return { width: size, height: size, ...style };
}

function FluentMapPin({ style, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-0.5 shrink-0 drop-shadow-sm"
      {...props}
      style={iconStyle(style)}
    >
      <defs>
        <linearGradient id="footer-map-pin-body" x1="6" y1="2" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f87171" />
          <stop offset="0.55" stopColor="#dc2626" />
          <stop offset="1" stopColor="#7f1d1d" />
        </linearGradient>
        <radialGradient id="footer-map-pin-highlight" cx="12" cy="9" r="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.7" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="footer-map-pin-dot" cx="16" cy="13" r="4.5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#e5e7eb" />
        </radialGradient>
      </defs>
      <ellipse cx="16" cy="28.5" rx="5" ry="1.3" fill="#000" opacity="0.18" />
      <path
        d="M16 2.5c-5.8 0-10.5 4.5-10.5 10.2 0 7.6 9.1 15.3 10 16 .3.2.7.2 1 0 .9-.7 10-8.4 10-16C26.5 7 21.8 2.5 16 2.5Z"
        fill="url(#footer-map-pin-body)"
      />
      <path
        d="M16 2.5c-5.8 0-10.5 4.5-10.5 10.2 0 7.6 9.1 15.3 10 16 .3.2.7.2 1 0 .9-.7 10-8.4 10-16C26.5 7 21.8 2.5 16 2.5Z"
        fill="url(#footer-map-pin-highlight)"
      />
      <circle cx="16" cy="13" r="4" fill="url(#footer-map-pin-dot)" />
    </svg>
  );
}

function FluentPhone({ style, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-0.5 shrink-0 drop-shadow-sm"
      {...props}
      style={iconStyle(style)}
    >
      <defs>
        <linearGradient id="footer-phone-body" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="0.55" stopColor="#10b981" />
          <stop offset="1" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="footer-phone-highlight" x1="6" y1="6" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.55" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="28.5" rx="10" ry="1.4" fill="#000" opacity="0.15" />
      <path
        d="M11.6 4.3c-1.2-1.2-3.2-1-4.3.3L5.5 6.5c-1.1 1.3-1.3 3.1-.6 4.7 3 6.7 8.2 11.9 14.9 14.9 1.6.7 3.4.5 4.7-.6l1.9-1.8c1.3-1.1 1.5-3.1.3-4.3l-3-3c-1-1-2.5-1.1-3.6-.3l-1.6 1.1c-.3.2-.7.2-1-.1L13 12c-.3-.3-.3-.7-.1-1l1.1-1.6c.8-1.1.7-2.6-.3-3.6l-3-3Z"
        fill="url(#footer-phone-body)"
      />
      <path
        d="M11.6 4.3c-1.2-1.2-3.2-1-4.3.3L5.5 6.5c-1.1 1.3-1.3 3.1-.6 4.7 3 6.7 8.2 11.9 14.9 14.9 1.6.7 3.4.5 4.7-.6l1.9-1.8c1.3-1.1 1.5-3.1.3-4.3l-3-3c-1-1-2.5-1.1-3.6-.3l-1.6 1.1c-.3.2-.7.2-1-.1L13 12c-.3-.3-.3-.7-.1-1l1.1-1.6c.8-1.1.7-2.6-.3-3.6l-3-3Z"
        fill="url(#footer-phone-highlight)"
      />
    </svg>
  );
}

function FluentClock({ style, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mt-0.5 shrink-0 drop-shadow-sm"
      {...props}
      style={iconStyle(style)}
    >
      <defs>
        <linearGradient id="footer-clock-body" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="0.55" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="footer-clock-face" cx="16" cy="15" r="10" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset="1" stopColor="#fde68a" />
        </radialGradient>
        <radialGradient id="footer-clock-highlight" cx="12" cy="10" r="7" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="white" stopOpacity="0.7" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="16" cy="28.5" rx="10" ry="1.4" fill="#000" opacity="0.18" />
      <circle cx="16" cy="16" r="13" fill="url(#footer-clock-body)" />
      <circle cx="16" cy="16" r="10" fill="url(#footer-clock-face)" />
      <circle cx="16" cy="16" r="13" fill="url(#footer-clock-highlight)" />
      <path d="M16 10v6l4 2.5" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="1.2" fill="#78350f" />
    </svg>
  );
}

function FluentBuilding({ style, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      {...props}
      style={iconStyle(style, "1.8rem")}
    >
      <defs>
        <linearGradient id="footer-building-body" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e0e7ff" />
          <stop offset="0.5" stopColor="#93c5fd" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="footer-building-side" x1="20" y1="4" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#0a2472" />
        </linearGradient>
      </defs>
      <path d="M5 6c0-1.1.9-2 2-2h11a2 2 0 0 1 2 2v22H5V6Z" fill="url(#footer-building-body)" />
      <path d="M20 12h5a2 2 0 0 1 2 2v14h-7V12Z" fill="url(#footer-building-side)" />
      <g fill="#fbbf24">
        <rect x="8" y="7.5" width="3" height="3" rx="0.5" />
        <rect x="14" y="7.5" width="3" height="3" rx="0.5" />
        <rect x="8" y="12.5" width="3" height="3" rx="0.5" />
        <rect x="14" y="12.5" width="3" height="3" rx="0.5" />
        <rect x="8" y="17.5" width="3" height="3" rx="0.5" />
        <rect x="14" y="17.5" width="3" height="3" rx="0.5" />
      </g>
      <g fill="#fef3c7" opacity="0.85">
        <rect x="22" y="15" width="3" height="3" rx="0.5" />
        <rect x="22" y="20" width="3" height="3" rx="0.5" />
      </g>
      <path d="M11 24h5v4h-5z" fill="#0a2472" />
    </svg>
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
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.14] text-white transition hover:-translate-y-0.5 hover:bg-[#0b74ff]"
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
