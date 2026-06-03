import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ChevronUp,
  FileDown,
  Globe2,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { PublicSiteSettings } from "@/lib/content-payload";
import { phoneHref, quoteMailHref } from "@/lib/site-settings";

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
    title: "Giải pháp",
    links: [
      { label: "Số hóa tài liệu", href: "/giai-phap" },
      { label: "Hạ tầng mạng LAN", href: "/giai-phap" },
      { label: "Camera giám sát", href: "/giai-phap" },
      { label: "Thiết bị trường học", href: "/giai-phap" },
      { label: "Thiết bị văn phòng", href: "/giai-phap" },
      { label: "Trung tâm dữ liệu", href: "/giai-phap" },
      { label: "Giải pháp doanh nghiệp", href: "/giai-phap" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Download Center", href: "/dich-vu" },
      { label: "Driver", href: "/dich-vu" },
      { label: "Catalogue", href: "/dich-vu" },
      { label: "Firmware", href: "/dich-vu" },
      { label: "Chính sách bảo hành", href: "/dich-vu" },
      { label: "Hướng dẫn mua hàng", href: "/dich-vu" },
      { label: "Yêu cầu báo giá", href: "/lien-he" },
      { label: "Câu hỏi thường gặp", href: "/dich-vu" },
    ],
  },
  {
    title: "Công ty",
    links: [
      { label: "Về HPT Tech", href: "/ve-hpt" },
      { label: "Dự án tiêu biểu", href: "/du-an" },
      { label: "Hồ sơ năng lực", href: "/ve-hpt" },
      { label: "Tin tức", href: "/tin-tuc" },
      { label: "Tuyển dụng", href: "/lien-he" },
      { label: "Liên hệ", href: "/lien-he" },
    ],
  },
];

const ctaHighlights = [
  { label: "Báo giá trong 24 giờ", icon: Sparkles },
  { label: "Tư vấn miễn phí", icon: Headphones },
  { label: "Giải pháp tối ưu chi phí", icon: ShieldCheck },
  { label: "Hỗ trợ triển khai toàn quốc", icon: BadgeCheck },
];

const partnerBadges = ["Dell", "HP", "Brother", "Synology", "Mikrotik"];

export default function Footer({ settings }: { settings: Required<PublicSiteSettings> }) {
  const phone = settings.hotline || settings.phone;
  const contactItems: ContactItem[] = [
    { label: "Địa chỉ", value: settings.address, icon: MapPin },
    { label: "Hotline", value: phone, href: phoneHref(phone), icon: Phone },
    { label: "Điện thoại", value: settings.phone, href: phoneHref(settings.phone), icon: Phone },
    { label: "Email", value: settings.email, href: `mailto:${settings.email}`, icon: Mail },
    { label: "Website", value: "hpttech.vn", href: "https://hpttech.vn", icon: Globe2 },
    { label: "Zalo OA", value: "HPT Tech", href: settings.zalo, icon: MessageCircle },
    { label: "Facebook", value: "HPT Tech", href: settings.facebook, icon: Globe2 },
    { label: "LinkedIn", value: "HPT Tech", href: "/lien-he", icon: Building2 },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#03111f] text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer HPT Tech
      </h2>

      <section className="mx-auto max-w-[1360px] px-8 pt-12 lg:px-10" aria-labelledby="footer-cta-heading">
        <div className="relative overflow-hidden rounded-[28px] border border-[#1d7cff]/70 bg-[linear-gradient(135deg,rgba(0,92,255,0.22),rgba(2,11,27,0.92)_45%,rgba(0,92,255,0.18))] p-8 shadow-[0_24px_90px_rgba(0,87,255,0.24)] backdrop-blur-xl footer-reveal lg:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(20,124,255,0.24),transparent_36%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(96,165,250,0.9),transparent)]" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div className="flex gap-7">
              <div className="hidden h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0b66ff] shadow-[0_18px_44px_rgba(255,255,255,0.12)] sm:flex">
                <FileDown size={38} strokeWidth={1.8} />
              </div>
              <div>
                <h3 id="footer-cta-heading" className="max-w-3xl text-3xl font-bold leading-tight tracking-normal text-white lg:text-4xl">
                  Cần báo giá thiết bị CNTT cho dự án của bạn?
                </h3>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
                  Đội ngũ HPT Tech sẵn sàng tư vấn giải pháp và báo giá nhanh chóng cho doanh nghiệp, trường học và cơ quan.
                </p>
                <ul className="mt-7 grid gap-4 text-sm font-semibold text-sky-200 sm:grid-cols-2 xl:grid-cols-4">
                  {ctaHighlights.map(({ label, icon: Icon }) => (
                    <li key={label} className="flex items-center gap-3">
                      <Icon className="text-[#38bdf8]" size={20} />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4">
              <a
                href={quoteMailHref(settings.email)}
                className="group inline-flex h-16 items-center justify-center gap-3 rounded-xl bg-[#0b74ff] px-6 text-lg font-bold text-white shadow-[0_18px_38px_rgba(11,116,255,0.28)] transition hover:bg-[#0066e6] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              >
                <Send className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={23} />
                Nhận báo giá ngay
              </a>
              <a
                href={phoneHref(phone)}
                className="inline-flex h-16 items-center justify-center gap-3 rounded-xl border border-white/70 bg-white/5 px-6 text-lg font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              >
                <Phone size={22} />
                Gọi tư vấn
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1360px] gap-10 px-8 py-16 lg:grid-cols-[1.7fr_repeat(5,1fr)] lg:px-10">
        <section className="lg:max-w-[420px]" aria-labelledby="footer-about-heading">
          <Link href="/" className="inline-flex items-end gap-2 text-[46px] font-black leading-none tracking-tight text-[#1681ff]" aria-label="HPT Tech trang chủ">
            HPT
            <span className="mb-1 text-2xl font-light text-white">TECH</span>
          </Link>
          <p className="mt-8 text-base leading-8 text-slate-300">
            HPT Tech cung cấp thiết bị CNTT, thiết bị văn phòng, máy scan, máy in, NAS, camera, thiết bị mạng và giải pháp hạ tầng công nghệ cho doanh nghiệp, tổ chức và cơ quan nhà nước.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            <Stat value="10+" label="Năm kinh nghiệm" />
            <Stat value="1000+" label="Khách hàng tin tưởng" />
            <Stat value="100%" label="Hàng chính hãng" />
          </div>

          <div className="mt-9">
            <h3 id="footer-about-heading" className="text-sm font-semibold text-white">
              Chứng nhận & Đối tác
            </h3>
            <div className="mt-4 flex flex-wrap gap-3">
              {partnerBadges.map((partner) => (
                <span
                  key={partner}
                  className="inline-flex h-11 items-center rounded-xl border border-white/14 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-sky-400/70 hover:text-white"
                >
                  {partner}
                </span>
              ))}
              <Link
                href="/thuong-hieu"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/14 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 transition hover:border-sky-400/70 hover:text-white"
              >
                Xem thêm
                <ArrowRight size={15} />
              </Link>
            </div>
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

      <div className="mx-auto max-w-[1360px] border-t border-white/10 px-8 py-8 lg:px-10">
        <div className="flex flex-col gap-6 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
          <p>© 2026 HPT Tech. All rights reserved.</p>
          <nav className="flex flex-wrap gap-6" aria-label="Liên kết pháp lý">
            <Link className="footer-link" href="/chinh-sach-bao-mat">
              Chính sách bảo mật
            </Link>
            <Link className="footer-link" href="/dieu-khoan-su-dung">
              Điều khoản sử dụng
            </Link>
            <Link className="footer-link" href="/sitemap.xml">
              Sitemap
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <SocialLink href={settings.facebook} label="Facebook" text="f" />
            <SocialLink href={settings.youtube || "/tin-tuc"} label="YouTube" text="YT" />
            <SocialLink href="/lien-he" label="LinkedIn" text="in" />
            <SocialLink href={settings.zalo} label="Zalo" text="Z" />
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
  text,
}: {
  href: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  text?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] text-white transition hover:-translate-y-0.5 hover:bg-[#0b74ff]"
    >
      {Icon ? <Icon size={19} aria-hidden="true" /> : <span className="text-sm font-black">{text}</span>}
    </a>
  );
}
