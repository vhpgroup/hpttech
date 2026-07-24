import Image from "next/image";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings, phoneHref } from "@/lib/site-settings";

// Trang tĩnh, dữ liệu đổi chậm — revalidate 1h là đủ.
export const revalidate = 3600;

// Icon 3D dùng chung bộ với header/sidebar (đã host trên R2).
const R2_ICON = "/api/r2-media/";

// Danh sách cơ sở — THÊM CHI NHÁNH MỚI TẠI ĐÂY (giữ đúng cấu trúc).
// Chỉ liệt kê địa chỉ THẬT đã công bố của HPT.
const STORES = [
  {
    name: "Trụ sở & Showroom Hải Phòng",
    address: "SB04 Vinhomes Marina, phường An Biên, thành phố Hải Phòng",
    hours: "8:00 – 17:30",
    note: "Trưng bày & trải nghiệm: máy scan, máy in, thiết bị văn phòng, giải pháp số hóa. Đội ngũ kỹ thuật hỗ trợ tận nơi tại Hải Phòng trong 24h.",
    mapQuery: "Vinhomes Marina, An Biên, Hải Phòng",
  },
];

export function generateMetadata() {
  return pageMetadata({
    title: "Hệ thống Showroom",
    description:
      "Hệ thống showroom HPT Tech — địa chỉ, giờ mở cửa và bản đồ chỉ đường. Trưng bày máy scan, máy in, thiết bị văn phòng và giải pháp số hóa cho doanh nghiệp.",
    path: "/he-thong-showroom",
  });
}

export default async function ShowroomPage() {
  const settings = await getSiteSettingsFromPayload().then(normalizeSiteSettings);
  const phone = settings.hotline || settings.phone;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "HPT Tech — Showroom Hải Phòng",
    address: {
      "@type": "PostalAddress",
      streetAddress: "SB04 Vinhomes Marina, phường An Biên",
      addressLocality: "Hải Phòng",
      addressCountry: "VN",
    },
    telephone: phone,
    email: settings.email,
    openingHours: "Mo-Sa 08:00-17:30",
    url: absoluteURL("/he-thong-showroom"),
  };

  return (
    <main className="subpage-main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <SubpageHeader
        eyebrow="HPT Tech"
        title="Hệ thống Showroom"
        description="Ghé thăm showroom để trải nghiệm trực tiếp thiết bị và nhận tư vấn từ đội ngũ kỹ thuật. Quý khách vui lòng liên hệ hotline trước khi đến để được phục vụ tốt nhất."
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Hệ thống Showroom" },
        ]}
      />

      <section className="mt-8 grid gap-6">
        {STORES.map((store) => (
          <article
            key={store.name}
            className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src={`${R2_ICON}icon-header-showroom.png`}
                  alt=""
                  aria-hidden="true"
                  width={44}
                  height={44}
                />
                <h2 className="text-lg font-extrabold text-slate-950">{store.name}</h2>
              </div>

              <div className="grid gap-3 text-sm leading-6 text-slate-700">
                <p className="flex items-start gap-2.5">
                  <Image
                    src={`${R2_ICON}icon-danh-muc-so-hoa.png`}
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
                    src={`${R2_ICON}icon-topbar-gio-lam-viec.png`}
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className="mt-0.5"
                  />
                  <span>
                    <strong className="text-slate-950">Giờ mở cửa:</strong> {store.hours} (Thứ 2 – Thứ 7)
                  </span>
                </p>
                <p className="flex items-start gap-2.5">
                  <Image
                    src={`${R2_ICON}icon-header-hotline.png`}
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
                <p className="text-slate-600">{store.note}</p>
              </div>

              <div className="mt-auto flex flex-wrap gap-3">
                <a
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white transition hover:bg-primary-700"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.address}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chỉ đường
                </a>
                <a
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-5 text-sm font-bold text-primary-700 transition hover:bg-primary-100"
                  href={phoneHref(phone)}
                >
                  Gọi {phone}
                </a>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <iframe
                title={`Bản đồ ${store.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(store.mapQuery)}&output=embed`}
                className="h-72 w-full lg:h-full lg:min-h-80"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-600">
        <strong className="text-slate-950">Cần hỗ trợ ngoài khu vực Hải Phòng?</strong> HPT Tech giao hàng
        và lắp đặt trên toàn quốc — liên hệ hotline{" "}
        <a className="font-bold text-primary-700" href={phoneHref(phone)}>
          {phone}
        </a>{" "}
        hoặc email{" "}
        <a className="font-bold text-primary-700" href={`mailto:${settings.email}`}>
          {settings.email}
        </a>{" "}
        để được tư vấn cấu hình và báo giá.
      </section>
    </main>
  );
}
