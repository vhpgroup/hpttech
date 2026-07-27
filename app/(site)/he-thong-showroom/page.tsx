import Image from "next/image";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings, phoneHref } from "@/lib/site-settings";

// Trang tĩnh, dữ liệu đổi chậm — revalidate 1h là đủ.
export const revalidate = 3600;

// Ảnh + icon 3D tự host trên media R2 của site (upload qua /api/media).
const R2 = "/api/r2-media/";

// Giờ làm việc chung toàn hệ thống.
const HOURS = "8:00 – 17:30";
const DAYS = "Thứ 2 – Thứ 7";

// Danh sách cơ sở — THÊM CHI NHÁNH MỚI TẠI ĐÂY (giữ đúng cấu trúc).
// Chỉ liệt kê địa chỉ THẬT đã công bố của HPT. `mapSrc` nhúng theo tọa độ
// chính xác; `image` là ảnh thật (jpg) hoặc minh họa mặt tiền (png) khi chưa
// có ảnh. Bố cục các section tự đảo trái/phải xen kẽ theo thứ tự mảng.
type Store = {
  id: string;
  chip: string;
  label: string;
  heading: string;
  address: string;
  image: string;
  imageW: number;
  imageH: number;
  imageAlt: string;
  barTitle: string;
  barSub: string;
  mapSrc: string;
  directions: string;
};

const STORES: Store[] = [
  {
    id: "hai-phong",
    chip: "Hải Phòng (Trụ sở)",
    label: "Trụ sở & Showroom Hải Phòng",
    heading: "VINHOMES MARINA",
    address: "SB04 Vinhomes Marina, phường An Biên, thành phố Hải Phòng",
    image: `${R2}showroom-hai-phong.jpg`,
    imageW: 644,
    imageH: 481,
    imageAlt: "Mặt tiền trụ sở & showroom HPT Tech tại SB04 Vinhomes Marina, Hải Phòng",
    barTitle: "SB04 VINHOMES MARINA",
    barSub: "Phường An Biên, TP. Hải Phòng",
    // Pin doanh nghiệp "HPT Tech" trên Google Maps (embed do HPT cung cấp).
    mapSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3729.256153855568!2d106.6875276859689!3d20.821360245318722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a7155698f3c69%3A0x95aed3909eec7d29!2sHPT%20Tech!5e0!3m2!1sen!2s!4v1784883601930!5m2!1sen!2s",
    directions: "https://www.google.com/maps/search/?api=1&query=20.8213602,106.6875277",
  },
  {
    id: "ho-chi-minh",
    chip: "Hồ Chí Minh",
    label: "Showroom Hồ Chí Minh",
    heading: "285 TRẦN BÌNH TRỌNG",
    address: "285 Trần Bình Trọng, Phường 4, Quận 5, TP. Hồ Chí Minh",
    image: `${R2}showroom-ho-chi-minh.jpg`,
    imageW: 1200,
    imageH: 896,
    imageAlt: "Không gian showroom HPT Tech — 285 Trần Bình Trọng, TP. Hồ Chí Minh",
    barTitle: "285 TRẦN BÌNH TRỌNG",
    barSub: "Phường 4, Quận 5, TP. Hồ Chí Minh",
    mapSrc: "https://maps.google.com/maps?q=10.7613673,106.6793788&hl=vi&z=17&output=embed",
    directions: "https://www.google.com/maps/search/?api=1&query=10.7613673,106.6793788",
  },
  {
    id: "ha-noi",
    chip: "Hà Nội",
    label: "Showroom Hà Nội",
    heading: "NGÕ 198 LÊ TRỌNG TẤN",
    address: "Số 3, Ngõ 198, Lê Trọng Tấn, Phường Phương Liệt, TP. Hà Nội",
    image: `${R2}showroom-ha-noi.jpg`,
    imageW: 1200,
    imageH: 896,
    imageAlt: "Showroom HPT Tech — Số 3, Ngõ 198 Lê Trọng Tấn, Hà Nội",
    barTitle: "SỐ 3, NGÕ 198 LÊ TRỌNG TẤN",
    barSub: "Phường Phương Liệt, TP. Hà Nội",
    mapSrc: "https://maps.google.com/maps?q=20.9936017,105.8307945&hl=vi&z=18&output=embed",
    directions: "https://www.google.com/maps/search/?api=1&query=20.9936017,105.8307945",
  },
  {
    id: "can-tho",
    chip: "Cần Thơ",
    label: "Showroom Cần Thơ",
    heading: "69 NGUYỄN TRÃI",
    address: "69 Nguyễn Trãi, Phường Ninh Kiều, TP. Cần Thơ",
    image: `${R2}showroom-can-tho.jpg`,
    imageW: 1600,
    imageH: 1067,
    imageAlt: "Không gian showroom HPT Tech tại Cần Thơ — 69 Nguyễn Trãi, Ninh Kiều",
    barTitle: "69 NGUYỄN TRÃI",
    barSub: "Phường Ninh Kiều, TP. Cần Thơ",
    mapSrc: "https://maps.google.com/maps?q=10.0399637,105.7852092&hl=vi&z=17&output=embed",
    directions: "https://www.google.com/maps/search/?api=1&query=10.0399637,105.7852092",
  },
  {
    id: "thanh-hoa",
    chip: "Thanh Hóa",
    label: "Showroom Thanh Hóa",
    heading: "NGUYỄN THỊ ANH",
    address: "Lô 32 Nơ 18 Nguyễn Thị Anh, Phường Hạc Thành, Thanh Hóa",
    image: `${R2}showroom-thanh-hoa.jpg`,
    imageW: 1600,
    imageH: 1067,
    imageAlt: "Không gian showroom HPT Tech tại Thanh Hóa — Nguyễn Thị Anh, Hạc Thành",
    barTitle: "NGUYỄN THỊ ANH",
    barSub: "Lô 32 Nơ 18, Phường Hạc Thành, Thanh Hóa",
    mapSrc: "https://maps.google.com/maps?q=19.7758149,105.7775896&hl=vi&z=18&output=embed",
    directions: "https://www.google.com/maps/search/?api=1&query=19.7758149,105.7775896",
  },
  {
    id: "quang-ngai",
    chip: "Quảng Ngãi",
    label: "Showroom Quảng Ngãi",
    heading: "199 ĐOÀN THỊ ĐIỂM",
    address: "199 Đoàn Thị Điểm, Phường Kon Tum, Quảng Ngãi",
    image: `${R2}showroom-quang-ngai.jpg`,
    imageW: 1600,
    imageH: 1067,
    imageAlt: "Không gian showroom HPT Tech tại Quảng Ngãi — 199 Đoàn Thị Điểm",
    barTitle: "199 ĐOÀN THỊ ĐIỂM",
    barSub: "Phường Kon Tum, Quảng Ngãi",
    mapSrc: "https://maps.google.com/maps?q=14.3499089,108.0018309&hl=vi&z=17&output=embed",
    directions: "https://www.google.com/maps/search/?api=1&query=14.3499089,108.0018309",
  },
];

export function generateMetadata() {
  return pageMetadata({
    title: "Hệ thống Showroom",
    description:
      "Hệ thống 6 showroom HPT Tech tại Hải Phòng, Hồ Chí Minh, Hà Nội, Cần Thơ, Thanh Hóa và Quảng Ngãi — địa chỉ, giờ mở cửa và bản đồ chỉ đường. Trưng bày máy scan, máy in, thiết bị văn phòng và giải pháp số hóa.",
    path: "/he-thong-showroom",
  });
}

export default async function ShowroomPage() {
  const settings = await getSiteSettingsFromPayload().then(normalizeSiteSettings);
  const phone = settings.hotline || settings.phone;

  const storesSchema = {
    "@context": "https://schema.org",
    "@graph": STORES.map((store) => ({
      "@type": "Store",
      name: `HPT Tech — ${store.label}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: store.address,
        addressCountry: "VN",
      },
      telephone: phone,
      email: settings.email,
      openingHours: "Mo-Sa 08:00-17:30",
      url: `${absoluteURL("/he-thong-showroom")}#${store.id}`,
    })),
  };

  return (
    <main className="pb-14 pt-3">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storesSchema) }}
      />

      {/* Căn giữa bằng div bọc: global CSS có `main { margin: 0 }` nên không
          đặt mx-auto trực tiếp trên <main> (bị đè do thứ tự ưu tiên layer). */}
      <div className="mx-auto w-[var(--shell-width)] overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        {/* HERO — minh họa + tiêu đề (overlay trên desktop, xếp dọc trên mobile) */}
        <section className="relative bg-[#e7f0fd]">
          <div className="px-4 pb-5 pt-7 text-center lg:absolute lg:inset-x-0 lg:top-[6%] lg:z-10 lg:p-0">
            <h1 className="text-2xl font-black tracking-tight text-[#0b2a63] sm:text-3xl lg:text-[38px]">
              HỆ THỐNG SHOWROOM HPT TECH
            </h1>
            <p className="mt-1.5 text-sm font-semibold text-[#3d5878] lg:text-[15.5px]">
              6 showroom trên toàn quốc — trải nghiệm thiết bị văn phòng &amp; giải pháp số hóa cho
              doanh nghiệp
            </p>
            <a
              href="#hai-phong"
              className="mt-3.5 inline-flex h-11 items-center rounded-lg bg-[#da2127] px-6 text-sm font-extrabold tracking-wider text-white shadow-[0_10px_24px_rgba(218,33,39,0.32)] transition hover:bg-[#c11d23]"
            >
              XEM NGAY
            </a>
          </div>
          <Image
            src={`${R2}showroom-hero.png`}
            alt="Minh họa hệ thống showroom HPT Tech"
            width={1920}
            height={815}
            priority
            className="block h-auto w-full"
          />
        </section>

        {/* CHIP ĐIỀU HƯỚNG 6 THÀNH PHỐ */}
        <nav
          aria-label="Danh sách showroom"
          className="flex flex-wrap justify-center gap-2.5 border-b border-slate-100 bg-white px-4 py-4"
        >
          {STORES.map((store, index) => (
            <a
              key={store.id}
              href={`#${store.id}`}
              className={
                index === 0
                  ? "inline-flex h-9 items-center rounded-full bg-primary-600 px-4 text-[13px] font-bold text-white transition hover:bg-primary-700"
                  : "inline-flex h-9 items-center rounded-full border border-primary-100 bg-primary-50 px-4 text-[13px] font-bold text-primary-700 transition hover:bg-primary-100"
              }
            >
              {store.chip}
            </a>
          ))}
        </nav>

        {/* 6 SECTION SHOWROOM — đảo trái/phải xen kẽ, nền trắng/xanh nhạt luân phiên */}
        {STORES.map((store, index) => {
          const alt = index % 2 === 1;
          return (
            <section
              key={store.id}
              id={store.id}
              className={`grid scroll-mt-44 gap-8 px-5 py-10 lg:gap-9 lg:px-11 ${
                alt
                  ? "bg-[#f2f6fd] lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
                  : "bg-white lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
              }`}
            >
              {/* flex-col + map flex-1: kéo cột info giãn cao bằng card ảnh bên cạnh */}
              <div className={`flex flex-col ${alt ? "lg:order-2" : ""}`}>
                <p className="text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-[#da2127]">
                  {store.label}
                </p>
                <h2 className="mt-1 text-2xl font-black text-[#0b2a63] sm:text-3xl lg:text-[34px]">
                  {store.heading}
                </h2>
                <div className="mb-4 mt-2 h-1 w-16 rounded-full bg-[#da2127]" />

                <div className="grid gap-2.5 text-sm leading-relaxed text-slate-700">
                  <p className="flex items-start gap-2.5">
                    <Image
                      src={`${R2}icon-header-showroom.png`}
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                      className="mt-0.5"
                    />
                    <span>
                      <strong className="text-slate-950">Địa chỉ:</strong> {store.address}
                    </span>
                  </p>
                  <p className="flex items-start gap-2.5">
                    <Image
                      src={`${R2}icon-topbar-gio-lam-viec.png`}
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                      className="mt-0.5"
                    />
                    <span>
                      <strong className="text-slate-950">Thời gian làm việc:</strong> {HOURS} | {DAYS}
                    </span>
                  </p>
                  <p className="flex items-start gap-2.5">
                    <Image
                      src={`${R2}icon-header-hotline.png`}
                      alt=""
                      aria-hidden="true"
                      width={20}
                      height={20}
                      className="mt-0.5"
                    />
                    <span>
                      <strong className="text-slate-950">Hotline:</strong> {phone} — {settings.email}
                    </span>
                  </p>
                </div>

                <div className="mb-5 mt-4 flex flex-wrap gap-3">
                  <a
                    className="inline-flex h-11 items-center rounded-[10px] bg-primary-600 px-5 text-[13.5px] font-bold text-white transition hover:bg-primary-700"
                    href={store.directions}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Chỉ đường
                  </a>
                  <a
                    className={`inline-flex h-11 items-center rounded-[10px] border border-primary-200 px-5 text-[13.5px] font-bold text-primary-700 transition hover:bg-primary-100 ${
                      alt ? "bg-white" : "bg-primary-50"
                    }`}
                    href={phoneHref(phone)}
                  >
                    Gọi {phone}
                  </a>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 lg:flex-1">
                  <iframe
                    title={`Bản đồ showroom ${store.chip}`}
                    src={store.mapSrc}
                    className="block h-64 w-full border-0 lg:h-full lg:min-h-64"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Card ảnh mặt tiền / không gian showroom — khung xanh + thanh địa chỉ */}
              <div
                className={`self-start overflow-hidden rounded-2xl bg-[#2563eb] p-2 pb-0 shadow-[0_16px_36px_rgba(23,58,138,0.22)] ${
                  alt ? "lg:order-1" : ""
                }`}
              >
                <div className="overflow-hidden rounded-t-lg">
                  <Image
                    src={store.image}
                    alt={store.imageAlt}
                    width={store.imageW}
                    height={store.imageH}
                    className="block h-auto w-full"
                  />
                </div>
                <div className="flex items-center gap-3.5 px-4 py-4 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-8 w-8 flex-none"
                    aria-hidden="true"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>
                    <b className="block text-lg font-black leading-snug sm:text-xl">
                      {store.barTitle}
                    </b>
                    <small className="mt-0.5 block text-[13px] text-white/85">{store.barSub}</small>
                  </span>
                </div>
              </div>
            </section>
          );
        })}

        {/* DẢI CTA — hỗ trợ toàn quốc */}
        <section className="flex flex-col items-start justify-between gap-5 bg-[#0f2557] px-5 py-6 lg:flex-row lg:items-center lg:px-11">
          <p className="max-w-3xl text-[14.5px] leading-relaxed text-white/90">
            <strong className="text-white">Cần hỗ trợ ngoài 6 khu vực trên?</strong> HPT Tech giao
            hàng và lắp đặt trên toàn quốc — đội ngũ kỹ thuật tư vấn cấu hình, báo giá và triển khai
            tận nơi cho doanh nghiệp.
          </p>
          <span className="flex flex-wrap gap-3">
            <a
              className="inline-flex h-11 items-center rounded-[10px] bg-[#da2127] px-5 text-[13.5px] font-extrabold text-white transition hover:bg-[#c11d23]"
              href={phoneHref(phone)}
            >
              Gọi {phone}
            </a>
            <a
              className="inline-flex h-11 items-center rounded-[10px] border border-white/40 px-5 text-[13.5px] font-bold text-white transition hover:bg-white/10"
              href={`mailto:${settings.email}`}
            >
              {settings.email}
            </a>
          </span>
        </section>
      </div>
    </main>
  );
}
