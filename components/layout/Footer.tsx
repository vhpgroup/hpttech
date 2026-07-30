import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronUp, Mail, MapPin, Phone } from "lucide-react";
import type { PublicSiteSettings } from "@/lib/content-payload";
import { phoneHref } from "@/lib/site-settings";

const HPT_LOGO_SRC = "/assets/logo/hptlogo.png";
const HPT_BCT_BADGE_SRC = "/assets/logo/bctn.png";
const HPT_LEGAL_NAME = "Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT";
const HPT_TAX_CODE = "0202253444";
const HPT_PUBLIC_PHONE = "+84 967 286 889";
const HPT_HEADQUARTERS = "Trụ sở: SB04 Vinhomes Marina, phường An Biên, TP. Hải Phòng";
const HPT_OFFICE_CITIES = "Hải Phòng · Hà Nội · TP. Hồ Chí Minh · Cần Thơ · Thanh Hóa · Quảng Ngãi";

// Icon 3D phong cách Fluent, tự host trên Payload Media R2 (same-origin, không cần remotePatterns).
// Bộ icon-danh-muc-* / icon-cam-ket-* có sẵn từ PR #50/#51; bộ icon-footer-* upload 30/07 (media id 13923–13938).
const R2 = "/api/r2-media";

type FooterLink = {
  label: string;
  href: string;
  iconSrc: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

// Mọi href dưới đây đều là trang thật đã verify HTTP 200 trên production (30/07/2026).
const footerColumns: FooterColumn[] = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Máy tính & Laptop", href: "/laptop-may-tinh-xach-tay", iconSrc: `${R2}/icon-danh-muc-laptop-van-phong.png` },
      { label: "Máy scan & Số hóa", href: "/may-scan", iconSrc: `${R2}/icon-danh-muc-may-scan.png` },
      { label: "Máy in & Vật tư", href: "/may-in", iconSrc: `${R2}/icon-danh-muc-may-in.png` },
      { label: "Server & Storage", href: "/may-chu-server", iconSrc: `${R2}/icon-danh-muc-pc-may-chu.png` },
      { label: "Thiết bị mạng", href: "/thiet-bi-mang", iconSrc: `${R2}/icon-danh-muc-thiet-bi-mang.png` },
      { label: "Firewall & Bảo mật", href: "/thiet-bi-firewall", iconSrc: `${R2}/icon-footer-bao-mat.png` },
      { label: "Camera giám sát", href: "/camera-giam-sat", iconSrc: `${R2}/icon-danh-muc-camera-an-ninh.png` },
      { label: "Máy photocopy", href: "/may-photocopy", iconSrc: `${R2}/icon-danh-muc-photocopy.png` },
    ],
  },
  {
    title: "Giải pháp",
    links: [
      { label: "Giải pháp số hóa tài liệu", href: "/giai-phap", iconSrc: `${R2}/icon-danh-muc-so-hoa.png` },
      { label: "Giải pháp hạ tầng CNTT", href: "/dich-vu", iconSrc: `${R2}/icon-danh-muc-dich-vu.png` },
      { label: "Giải pháp an ninh mạng", href: "/thiet-bi-firewall", iconSrc: `${R2}/icon-footer-bao-mat.png` },
      { label: "Giải pháp cho cơ quan nhà nước", href: "/du-an", iconSrc: `${R2}/icon-footer-co-quan-nha-nuoc.png` },
      {
        label: "Giải pháp cho doanh nghiệp",
        href: "/ho-tro-khach-hang-du-an-doanh-nghiep",
        iconSrc: `${R2}/icon-footer-doanh-nghiep.png`,
      },
    ],
  },
  {
    title: "Về HPT",
    links: [
      { label: "Về HPT Tech", href: "/ve-hpt", iconSrc: `${R2}/icon-footer-ve-hpt.png` },
      { label: "Dự án tiêu biểu", href: "/du-an", iconSrc: `${R2}/icon-footer-du-an.png` },
      { label: "Hồ sơ năng lực", href: "/ve-hpt#linh-vuc", iconSrc: `${R2}/icon-footer-ho-so-nang-luc.png` },
      { label: "Đối tác & Thương hiệu", href: "/thuong-hieu", iconSrc: `${R2}/icon-footer-doi-tac.png` },
      { label: "Tin tức", href: "/tin-tuc", iconSrc: `${R2}/icon-footer-tin-tuc.png` },
      { label: "Tuyển dụng", href: "/tuyen-dung", iconSrc: `${R2}/icon-footer-tuyen-dung.png` },
      { label: "Liên hệ", href: "/lien-he", iconSrc: `${R2}/icon-footer-lien-he.png` },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Hướng dẫn mua hàng", href: "/huong-dan-mua-hang", iconSrc: `${R2}/icon-footer-mua-hang.png` },
      { label: "Hướng dẫn đặt hàng Flash Sale", href: "/huong-dan-dat-hang-flash-sale", iconSrc: `${R2}/icon-footer-flash-sale.png` },
      { label: "Chính sách bảo hành đổi trả", href: "/chinh-sach-bao-hanh-doi-tra", iconSrc: `${R2}/icon-footer-bao-hanh.png` },
      { label: "Chính sách giao hàng", href: "/chinh-sach-giao-hang", iconSrc: `${R2}/icon-cam-ket-giao-hang.png` },
      { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat", iconSrc: `${R2}/icon-footer-khoa-bao-mat.png` },
      { label: "Chính sách mua trả góp", href: "/chinh-sach-mua-tra-gop", iconSrc: `${R2}/icon-footer-tra-gop.png` },
      {
        label: "Hỗ trợ khách hàng dự án",
        href: "/ho-tro-khach-hang-du-an-doanh-nghiep",
        iconSrc: `${R2}/icon-cam-ket-ho-tro.png`,
      },
    ],
  },
];

const stats = [
  { value: "20+", label: "Năm kinh nghiệm", iconSrc: `${R2}/icon-footer-kinh-nghiem.png` },
  { value: "500+", label: "Dự án & đơn hàng", iconSrc: `${R2}/icon-footer-du-an.png` },
  { value: "100%", label: "Hàng chính hãng", iconSrc: `${R2}/icon-cam-ket-chinh-hang.png` },
  { value: "Hỗ trợ", label: "Tư vấn & kỹ thuật 24/7", iconSrc: `${R2}/icon-cam-ket-ho-tro.png` },
];

export default function Footer({ settings }: { settings: Required<PublicSiteSettings> }) {
  const phone = HPT_PUBLIC_PHONE;
  const socialLinks = [
    { href: settings.facebook, label: "Facebook", logoSrc: "/assets/icons/facebook.svg" },
    { href: settings.youtube, label: "YouTube", logoSrc: "/assets/icons/youtube.svg" },
    { href: settings.zalo, label: "Zalo", logoSrc: "/assets/icons/zalo.png" },
  ].filter((item) => Boolean(item.href) && item.href.startsWith("http"));

  return (
    <footer
      className="relative overflow-hidden bg-[linear-gradient(180deg,#0d2744_0%,#11375f_48%,#184c80_100%)] text-white"
      aria-labelledby="footer-heading"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer HPT Tech
      </h2>

      <div className="mx-auto grid max-w-[1500px] gap-10 px-8 py-14 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1.05fr_0.95fr_1.05fr] lg:gap-8 lg:px-10">
        <section className="lg:max-w-[340px]" aria-labelledby="footer-about-heading">
          <Link href="/" className="inline-flex rounded-xl bg-white px-4 py-3" aria-label="HPT Tech trang chủ">
            <Image
              src={HPT_LOGO_SRC}
              alt={settings.companyName}
              width={132}
              height={78}
              className="h-auto w-[132px] object-contain"
            />
          </Link>
          <p className="mt-6 text-[15px] leading-7 text-slate-100/85">
            HPT Tech – Nhà cung cấp thiết bị và giải pháp công nghệ thông tin cho doanh nghiệp, tổ
            chức và cơ quan nhà nước.
          </p>

          <div className="mt-7 grid grid-cols-4 gap-3">
            {stats.map(({ value, label, iconSrc }) => (
              <div key={label}>
                <Image src={iconSrc} alt="" aria-hidden="true" width={30} height={30} loading="lazy" className="h-[30px] w-[30px] object-contain" />
                <strong className="mt-2 block text-lg font-bold leading-6 text-white">{value}</strong>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-100/70">{label}</span>
              </div>
            ))}
          </div>

          <h3 className="footer-heading mt-8">Trụ sở &amp; Văn phòng</h3>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-slate-100/85">
            <li className="flex gap-3">
              <MapPin className="mt-1 shrink-0 text-sky-300" size={16} aria-hidden="true" />
              <span>{HPT_HEADQUARTERS}</span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-1 shrink-0 text-sky-300" size={16} aria-hidden="true" />
              <a href={phoneHref(phone)} className="footer-link">
                0967 286 889
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-1 shrink-0 text-sky-300" size={16} aria-hidden="true" />
              <a href={`mailto:${settings.email}`} className="footer-link">
                {settings.email}
              </a>
            </li>
          </ul>

          <h3 className="footer-heading mt-6">Hệ thống văn phòng</h3>
          <p className="mt-3 text-sm leading-6 text-slate-100/80">{HPT_OFFICE_CITIES}</p>
          <Link
            href="/he-thong-showroom"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-sky-300/60 px-4 py-2 text-sm font-medium text-sky-100 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white/10"
          >
            Xem chi tiết hệ thống văn phòng
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>

        {footerColumns.map((column) => (
          <FooterColumnBlock key={column.title} column={column} />
        ))}
      </div>

      <div className="mx-auto max-w-[1500px] border-t border-white/15 px-8 py-7 lg:px-10">
        <div className="flex flex-col gap-6 text-sm text-slate-100/70 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p>© 2026 HPT Tech. All rights reserved.</p>
            <p className="mt-1 text-xs text-slate-100/55">
              {HPT_LEGAL_NAME} · MST: {HPT_TAX_CODE}
            </p>
          </div>
          <nav className="flex flex-wrap gap-6" aria-label="Liên kết pháp lý">
            <Link className="footer-link" href="/dieu-khoan-su-dung">
              Điều khoản sử dụng
            </Link>
            <Link className="footer-link" href="/chinh-sach-bao-mat">
              Chính sách bảo mật
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
            {socialLinks.map((item) => (
              <SocialLink key={item.label} {...item} />
            ))}
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

function FooterColumnBlock({ column }: { column: FooterColumn }) {
  return (
    <nav aria-labelledby={`footer-${column.title}`} className="min-w-0">
      <h3 id={`footer-${column.title}`} className="footer-heading">
        {column.title}
      </h3>
      <ul className="mt-6 space-y-3.5">
        {column.links.map((link) => (
          <li key={link.label}>
            <Link className="footer-link group flex items-center gap-3" href={link.href}>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.1] transition group-hover:bg-white/[0.22]">
                <Image
                  src={link.iconSrc}
                  alt=""
                  aria-hidden="true"
                  width={24}
                  height={24}
                  loading="lazy"
                  className="h-6 w-6 object-contain transition group-hover:scale-110"
                />
              </span>
              <span className="leading-5">{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialLink({ href, label, logoSrc }: { href: string; label: string; logoSrc: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_-12px_rgba(255,255,255,0.7)]"
    >
      <Image src={logoSrc} alt="" width={23} height={23} className="h-6 w-6 object-contain" aria-hidden="true" />
    </a>
  );
}
