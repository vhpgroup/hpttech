import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  Network,
  PhoneCall,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { PublicCertification } from "@/lib/content-payload";
import type { normalizeSiteSettings } from "@/lib/site-settings";
import { phoneHref } from "@/lib/site-settings";

type Props = {
  certifications: PublicCertification[];
  settings: ReturnType<typeof normalizeSiteSettings>;
};

const kindBadgeClass: Record<string, string> = {
  "doc-quyen": "bg-warning",
  "doi-tac": "bg-primary-600",
  "uy-quyen": "bg-success",
};

const trustChips = ["Chính hãng 100%", "Bảo hành chính hãng", "Xuất hóa đơn VAT", "Giao toàn quốc"];
const distributedBrands = [
  "Fujitsu",
  "Kodak",
  "ROWE",
  "CZUR",
  "Microtek",
  "Panasonic",
  "TP-Link",
  "Joyusing",
  "TTR",
  "Canon",
  "Epson",
  "Brother",
];

const commitments = [
  {
    icon: BadgeCheck,
    title: "Hàng chính hãng 100%",
    desc: "Đầy đủ CO/CQ, nhập chính ngạch, truy xuất xuất xứ từ hãng.",
  },
  {
    icon: ShieldCheck,
    title: "Bảo hành chuẩn hãng",
    desc: "Bảo hành theo chính sách hãng, hỗ trợ đổi mới trong thời gian quy định.",
  },
  {
    icon: Network,
    title: "Linh kiện & kỹ thuật",
    desc: "Sẵn vật tư, phụ kiện và đội kỹ thuật triển khai, bảo trì tận nơi.",
  },
  {
    icon: CircleDollarSign,
    title: "Giá dự án & VAT",
    desc: "Báo giá tốt theo số lượng, dự án và xuất hóa đơn VAT đầy đủ.",
  },
  {
    icon: Truck,
    title: "Giao hàng toàn quốc",
    desc: "Giao và lắp đặt trên toàn quốc, đồng hành lâu dài với doanh nghiệp.",
  },
];

export function BrandCertificationsPage({ certifications, settings }: Props) {
  const phone = settings.hotline || settings.phone;
  const stats = [
    { value: `${certifications.length}+`, label: "Thương hiệu ủy quyền", note: "Cập nhật liên tục" },
    { value: "100%", label: "Hàng chính hãng", note: "Đầy đủ CO/CQ" },
    { value: "VAT", label: "Hóa đơn đầy đủ", note: "Giá tốt doanh nghiệp" },
    { value: "63", label: "Tỉnh thành phủ sóng", note: "Giao và lắp đặt tận nơi" },
  ];

  return (
    <main className="brand-certifications-page bg-surface text-ink">
      <section className="bg-primary-900 text-white">
        <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-10 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-primary-100">
            <Link href="/" className="transition hover:text-white">
              Trang chủ
            </Link>
            <span aria-hidden="true">/</span>
            <span>Thương hiệu & Chứng nhận</span>
          </nav>
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-primary-200">
            Thương hiệu & đối tác ủy quyền
          </p>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl">
            Đối tác ủy quyền chính hãng của các thương hiệu hàng đầu
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-primary-50 md:text-lg">
            HPT Tech là nhà phân phối và đối tác ủy quyền chính thức của nhiều thương hiệu thiết bị văn phòng,
            máy scan và giải pháp số hóa. Mỗi giấy chứng nhận là cam kết hàng chính hãng 100%, bảo hành chuẩn hãng
            và hóa đơn VAT đầy đủ.
          </p>
          <ul className="mt-7 flex flex-wrap gap-3">
            {trustChips.map((chip) => (
              <li key={chip} className="inline-flex items-center gap-2 rounded-full border border-primary-300 bg-primary-800 px-4 py-2 text-sm font-semibold">
                <BadgeCheck size={16} className="text-accent-300" />
                {chip}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/lien-he" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 text-sm font-bold text-white shadow-soft transition hover:bg-accent-600">
              Nhận tư vấn & báo giá
              <ArrowRight size={18} />
            </Link>
            {phone ? (
              <a href={phoneHref(phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-primary-200 px-6 text-sm font-bold text-white transition hover:bg-primary-800">
                <PhoneCall size={17} />
                Gọi ngay: {phone}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="-mt-10 grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-white shadow-soft md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border-b border-r border-border px-6 py-6 last:border-r-0 md:border-b-0">
              <strong className="block text-3xl font-extrabold leading-none text-primary-600">{stat.value}</strong>
              <span className="mt-2 block text-sm font-bold text-ink">{stat.label}</span>
              <small className="mt-1 block text-xs text-ink/60">{stat.note}</small>
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-[1280px] px-6 pt-14 md:px-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary-600">Hồ sơ năng lực</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-primary-800 md:text-3xl">
            Giấy chứng nhận ủy quyền chính hãng
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-ink/70">
            Các chứng nhận do chính hãng cấp trực tiếp cho Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT.
            Bấm vào từng mục để xem chi tiết.
          </p>
        </div>
        {certifications.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {certifications.map((cert) => (
              <Link
                key={cert.slug}
                href={cert.href}
                className={`group flex flex-col overflow-hidden rounded-lg border border-border bg-white shadow-soft transition hover:-translate-y-1 ${cert.orientation === "landscape" ? "md:col-span-2" : ""}`}
              >
                <div className="relative flex justify-center bg-surface p-6">
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white ${kindBadgeClass[cert.kind] || "bg-primary-600"}`}>
                    {cert.kindLabel}
                  </span>
                  {cert.image ? (
                    <Image
                      src={cert.image}
                      alt={cert.imageAlt || `Giấy chứng nhận ${cert.brand}`}
                      width={cert.orientation === "landscape" ? 900 : 460}
                      height={cert.orientation === "landscape" ? 640 : 650}
                      className="h-auto max-h-[340px] w-auto rounded-lg bg-white shadow-soft"
                    />
                  ) : null}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-extrabold text-primary-800">{cert.brand}</h3>
                  <dl className="mt-4 space-y-2.5 text-sm">
                    {cert.scope ? <CertRow k="Phạm vi" v={cert.scope} /> : null}
                    {cert.territory ? <CertRow k="Khu vực" v={cert.territory} /> : null}
                    {cert.validity ? <CertRow k="Hiệu lực" v={cert.validity} strong /> : null}
                    {cert.issuer ? <CertRow k="Đơn vị cấp" v={cert.issuer} /> : null}
                  </dl>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 group-hover:text-primary-800">
                    Xem chi tiết chứng nhận
                    <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-white p-8 text-center text-ink/60">
            Chưa có chứng nhận nào được đăng. Vui lòng thêm trong trang quản trị.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pt-14 md:px-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary-600">Cam kết HPT Tech</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-primary-800 md:text-3xl">
            Quyền lợi khi mua hàng chính hãng tại HPT
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {commitments.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="rounded-lg border border-border bg-white p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/65">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pt-14 md:px-10">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary-600">Hệ sinh thái thương hiệu</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-primary-800 md:text-3xl">
            Các thương hiệu HPT phân phối
          </h2>
        </div>
        <ul className="flex flex-wrap gap-3 rounded-lg border border-border bg-white p-6">
          {distributedBrands.map((brand) => (
            <li key={brand} className="rounded-lg bg-surface px-4 py-2 text-[15px] font-bold text-ink/75">
              {brand}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-14 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 rounded-lg bg-primary-700 px-8 py-10 text-white shadow-soft md:flex-row md:items-center md:px-14">
          <div>
            <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight md:text-3xl">
              Cần tư vấn thiết bị chính hãng cho doanh nghiệp?
            </h2>
            <p className="mt-2 text-primary-50">
              Đội ngũ HPT Tech hỗ trợ chọn cấu hình, báo giá dự án và xuất hóa đơn VAT nhanh chóng.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/lien-he" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-primary-700">
              Liên hệ tư vấn
              <ArrowRight size={16} />
            </Link>
            {phone ? (
              <a href={phoneHref(phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-900 px-6 text-sm font-bold text-white">
                <PhoneCall size={16} />
                {phone}
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function CertRow({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="font-semibold text-ink/45">{k}</dt>
      <dd className={strong ? "font-bold text-primary-700" : "font-medium text-ink/75"}>{v}</dd>
    </div>
  );
}
