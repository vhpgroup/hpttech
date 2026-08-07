import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronUp } from "lucide-react";
import type { PublicSiteSettings } from "@/lib/content-payload";
import { phoneHref } from "@/lib/site-settings";

const HPT_LOGO_SRC = "/assets/logo/hptlogo.png";
const HPT_BCT_BADGE_SRC = "/assets/logo/bctn.png";
const HPT_LEGAL_NAME = "Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT";
const HPT_TAX_CODE = "0202253444";
const HPT_PUBLIC_PHONE = "+84 967 286 889";
const HPT_HEADQUARTERS = "Trụ sở: SB04 Vinhomes Marina, phường An Biên, TP. Hải Phòng";
const HPT_BRANCH_HCM = "Chi nhánh Hồ Chí Minh: 156/3/1 Đường Vườn Lài, Khu phố 2, phường An Phú Đông, TP. Hồ Chí Minh";
const HPT_OFFICE_CITIES = "Hải Phòng · Hà Nội · TP. Hồ Chí Minh · Cần Thơ · Thanh Hóa · Quảng Ngãi";

// Icon 3D phong cách Fluent, tự host trên Payload Media R2 (same-origin, không cần remotePatterns).
// 30/07: cả 4 cột link bỏ icon (user chốt chữ trơn đồng bộ) — R2 chỉ còn dùng cho stats + khối liên hệ.
// Không xoá icon nào trên R2: sidebar/mega-menu vẫn dùng bộ icon-danh-muc-*.
const R2 = "/api/r2-media";

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

// Mọi href dưới đây đều là trang thật đã verify HTTP 200 trên production (30/07/2026).
const footerColumns: FooterColumn[] = [
  {
    // Mirror menu trục sidebar (HPT_DATA/CategoryPanel): chỉ các mục có slug category
    // thật ("link chuẩn") — cùng tên, cùng đích với sidebar. Các mục mồ côi
    // (slug rỗng: hội nghị, giáo dục, lưu trữ, dịch vụ, số hóa,
    // máy chiếu, UPS) KHÔNG đưa vào footer cho tới khi có category thật.
    title: "Sản phẩm",
    links: [
      { label: "Máy scan", href: "/may-scan" },
      { label: "Máy in", href: "/may-in" },
      { label: "Máy Photocopy", href: "/may-photocopy" },
      { label: "Laptop Gaming - Đồ Họa", href: "/laptop-gaming-do-hoa" },
      { label: "Laptop văn phòng", href: "/laptop" },
      { label: "Máy tính đồng bộ - Máy chủ", href: "/may-tinh-dong-bo-may-chu" },
      { label: "Thiết bị mạng", href: "/thiet-bi-mang" },
      { label: "Thiết bị văn phòng", href: "/thiet-bi-van-phong" },
      { label: "Camera & Giám sát", href: "/camera-giam-sat" },
      { label: "Phần mềm bản quyền", href: "/phan-mem-ban-quyen" },
      { label: "Thiết bị hình ảnh", href: "/thiet-bi-hinh-anh" },
      { label: "Mực in & Phụ kiện", href: "/muc-in-phu-kien" },
    ],
  },
  {
    title: "Giải pháp",
    links: [
      { label: "Giải pháp số hóa tài liệu", href: "/giai-phap" },
      { label: "Giải pháp hạ tầng CNTT", href: "/dich-vu" },
      { label: "Giải pháp an ninh mạng", href: "/thiet-bi-firewall" },
      { label: "Giải pháp cho cơ quan nhà nước", href: "/du-an" },
      { label: "Giải pháp cho doanh nghiệp", href: "/ho-tro-khach-hang-du-an-doanh-nghiep" },
    ],
  },
  {
    title: "Về HPT",
    links: [
      { label: "Về HPT Tech", href: "/ve-hpt" },
      { label: "Dự án tiêu biểu", href: "/du-an" },
      { label: "Hồ sơ năng lực", href: "/ve-hpt#linh-vuc" },
      { label: "Đối tác & Thương hiệu", href: "/thuong-hieu" },
      { label: "Tin tức", href: "/tin-tuc" },
      { label: "Tuyển dụng", href: "/tuyen-dung" },
      { label: "Liên hệ", href: "/lien-he" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Hướng dẫn mua hàng", href: "/huong-dan-mua-hang" },
      { label: "Chính sách bảo hành đổi trả", href: "/chinh-sach-bao-hanh-doi-tra" },
      { label: "Chính sách giao hàng", href: "/chinh-sach-giao-hang" },
      { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
      { label: "Chính sách mua trả góp", href: "/chinh-sach-mua-tra-gop" },
      { label: "Hỗ trợ khách hàng dự án", href: "/ho-tro-khach-hang-du-an-doanh-nghiep" },
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
  // Luôn hiện đủ 3 kênh. YouTube chưa có URL (user chốt 30/07: hiện icon, link để trống)
  // → SocialLink tự xử lý href rỗng thành "#"; điền URL vào Site Settings là link sống ngay.
  const socialLinks = [
    { href: settings.facebook, label: "Facebook", logoSrc: "/assets/icons/facebook.svg" },
    { href: settings.youtube, label: "YouTube", logoSrc: "/assets/icons/youtube.svg" },
    { href: settings.zalo, label: "Zalo", logoSrc: "/assets/icons/zalo.png" },
  ];

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

          <h3 className="footer-heading mt-8">Trụ sở &amp; Văn phòng HPT</h3>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-slate-100/85">
            {/* Khối pháp nhân: tên công ty + MST chung một mục (01/08, user chốt:
                đổi tiêu đề, bỏ email, thêm tên công ty + mã số thuế). */}
            <li className="flex gap-3">
              <Image src={`${R2}/icon-footer-doanh-nghiep.png`} alt="" aria-hidden="true" width={20} height={20} loading="lazy" className="mt-0.5 h-5 w-5 shrink-0 object-contain" />
              <span>
                <span className="font-medium text-white/95">{HPT_LEGAL_NAME}</span>
                <br />
                MST: {HPT_TAX_CODE}
              </span>
            </li>
            <li className="flex gap-3">
              <Image src={`${R2}/icon-footer-dia-chi.png`} alt="" aria-hidden="true" width={20} height={20} loading="lazy" className="mt-0.5 h-5 w-5 shrink-0 object-contain" />
              <span>{HPT_HEADQUARTERS}</span>
            </li>
            {/* 07/08: thứ tự user chốt — hai địa chỉ (trụ sở, chi nhánh) đi liền nhau,
                hotline nằm cuối khối. */}
            <li className="flex gap-3">
              <Image src={`${R2}/icon-footer-dia-chi.png`} alt="" aria-hidden="true" width={20} height={20} loading="lazy" className="mt-0.5 h-5 w-5 shrink-0 object-contain" />
              <span>{HPT_BRANCH_HCM}</span>
            </li>
            <li className="flex gap-3">
              <Image src={`${R2}/icon-footer-dien-thoai.png`} alt="" aria-hidden="true" width={20} height={20} loading="lazy" className="mt-0.5 h-5 w-5 shrink-0 object-contain" />
              <a href={phoneHref(phone)} className="footer-link">
                0967 286 889
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
            {/* Giữ flex items-center như bản đã duyệt (anchor block-level → gạch chân hover ::after chạy full-width như cũ) */}
            <Link className="footer-link flex items-center" href={link.href}>
              <span className="leading-5">{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SocialLink({ href, label, logoSrc }: { href: string; label: string; logoSrc: string }) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={isExternal ? href : "#"}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : { "aria-disabled": true })}
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_20px_-10px_rgba(2,6,23,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-10px_rgba(255,255,255,0.55)]"
    >
      <Image src={logoSrc} alt="" width={28} height={28} className="h-7 w-7 object-contain" aria-hidden="true" />
    </a>
  );
}
