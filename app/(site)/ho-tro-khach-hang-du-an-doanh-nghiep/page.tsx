import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Camera,
  CheckCircle2,
  FileCheck2,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  Network,
  Phone,
  ScanLine,
  School,
  Server,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import HelpSidebar from "@/components/help/HelpSidebar";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import {
  getEnterpriseServicesFromPayload,
  getEnterpriseSupportPageFromPayload,
} from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { phoneHref } from "@/lib/site-settings";

export const revalidate = 300;

const title = "Hỗ trợ khách hàng dự án và doanh nghiệp";
const companyName = "Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT";
const hotline = "0967286889";
const email = "bach.pv@hpttech.vn";
const address = "SB.04 Vinhomes Marina, P. An Biên, TP. Hải Phòng";
const directionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const metadata = pageMetadata({
  title,
  description:
    "HPT Tech tiếp nhận tư vấn, khảo sát, báo giá và triển khai thiết bị, giải pháp công nghệ cho dự án và doanh nghiệp.",
  path: "/ho-tro-khach-hang-du-an-doanh-nghiep",
});

const benefits = [
  {
    icon: MessageCircle,
    title: "Tư vấn chuyên sâu",
    description: "Giải pháp theo nhu cầu",
  },
  {
    icon: ShieldCheck,
    title: "Nguồn gốc rõ ràng",
    description: "Thông tin đầy đủ",
  },
  {
    icon: FileCheck2,
    title: "Triển khai chuyên nghiệp",
    description: "Phương án được xác nhận",
  },
  {
    icon: Headphones,
    title: "Trao đổi thuận tiện",
    description: "Hotline, Zalo, email",
  },
];

const defaultHeroImages = [
  {
    url: "/assets/ho-tro-du-an/1.jpg",
    alt: "Tư vấn chuyên sâu cho khách hàng dự án và doanh nghiệp",
  },
  {
    url: "/assets/ho-tro-du-an/2.png",
    alt: "Trao đổi thông tin sản phẩm và nguồn gốc rõ ràng",
  },
  {
    url: "/assets/ho-tro-du-an/3.png",
    alt: "Triển khai giải pháp công nghệ chuyên nghiệp",
  },
  {
    url: "/assets/ho-tro-du-an/4.png",
    alt: "Trao đổi thuận tiện qua hotline, Zalo và email",
  },
];

const solutionGroups = [
  {
    icon: Building2,
    title: "Thiết bị văn phòng",
    items: "Máy in, máy photocopy, thiết bị văn phòng và vật tư phù hợp nhu cầu sử dụng.",
  },
  {
    icon: ScanLine,
    title: "Máy scan và số hóa",
    items: "Máy scan tài liệu, giải pháp lưu trữ và số hóa quy trình nghiệp vụ.",
  },
  {
    icon: Camera,
    title: "Camera và hội nghị",
    items: "Camera giám sát, camera hội nghị và thiết bị kết nối làm việc từ xa.",
  },
  {
    icon: Network,
    title: "Thiết bị mạng",
    items: "Hạ tầng LAN, Wi-Fi, thiết bị mạng và phương án kết nối cho tổ chức.",
  },
  {
    icon: Server,
    title: "Máy chủ và lưu trữ",
    items: "Máy chủ, thiết bị lưu trữ và cấu hình phù hợp với quy mô hệ thống.",
  },
  {
    icon: ShieldCheck,
    title: "Phần mềm và bảo mật",
    items: "Phần mềm bản quyền, công cụ bảo mật và giải pháp phục vụ vận hành.",
  },
];

const processSteps = [
  "Tiếp nhận nhu cầu",
  "Khảo sát",
  "Đề xuất và báo giá",
  "Triển khai",
  "Bàn giao",
];

export default async function EnterpriseSupportPage() {
  const [services, supportPage] = await Promise.all([
    getEnterpriseServicesFromPayload(),
    getEnterpriseSupportPageFromPayload(),
  ]);
  const heroFallbackIcons = [Building2, ScanLine, Network, Camera];

  return (
    <main className="subpage-main bg-[#eef0f4]">
      <div className="px-4 pb-12 sm:px-6 lg:px-0">
        <SubpageHeader
          className="mb-7"
          title={title}
          breadcrumbs={[
            { label: "Trang chủ", href: "/" },
            { label: title },
          ]}
        />

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <HelpSidebar activePath="/ho-tro-khach-hang-du-an-doanh-nghiep" />

          <article className="min-w-0 overflow-hidden border border-slate-200 bg-white text-[16px] leading-7 text-slate-800">
            <section className="relative flex min-h-[520px] flex-col justify-start overflow-hidden border-b border-primary-100 bg-gradient-to-br from-white via-primary-50 to-slate-100 px-6 pb-10 pt-3 sm:px-8 lg:min-h-[610px] lg:px-10 lg:pt-3">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[36px] border-primary-100/60" />
              <div className="relative">
                <div className="flex items-center gap-5">
                  <Image
                    src="/assets/logo/hptlogo.png"
                    alt="HPT Technology"
                    width={150}
                    height={84}
                    className="h-auto w-[120px] object-contain sm:w-[150px]"
                    priority
                  />
                  <div className="h-16 w-px bg-slate-300" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-700">
                      HPT Technology
                    </p>
                    <h1 className="mt-1 max-w-2xl text-2xl font-black uppercase leading-tight text-primary-900 sm:text-3xl">
                      Phòng dự án và khách hàng doanh nghiệp
                    </h1>
                  </div>
                </div>
                <p className="mt-5 max-w-4xl text-slate-600">
                  HPT Tech tư vấn, cung cấp thiết bị và giải pháp công nghệ cho nhu cầu dự án,
                  văn phòng và hệ thống doanh nghiệp. Phương án cụ thể được trao đổi sau khi tiếp
                  nhận yêu cầu và điều kiện triển khai thực tế.
                </p>
              </div>

              <div className="relative mt-6 border border-primary-100 bg-white/70 p-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {heroFallbackIcons.map((Icon, index) => {
                      const image = supportPage.heroImages[index] || defaultHeroImages[index];
                      return (
                    <div
                      key={index}
                      className="relative grid aspect-[4/3] place-items-center overflow-hidden border border-primary-200 bg-primary-50 text-primary-700"
                    >
                      {image.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt || `Ảnh minh họa ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 50vw, 180px"
                          className="object-cover"
                        />
                      ) : (
                        <Icon size={38} strokeWidth={1.6} />
                      )}
                    </div>
                      );
                  })}
                </div>
              </div>

              <div className="relative mt-6 grid gap-px overflow-hidden border border-primary-100 bg-primary-100 sm:grid-cols-2 xl:grid-cols-4">
                {benefits.map(({ icon: Icon, title: itemTitle, description }) => (
                  <div key={itemTitle} className="flex items-center gap-3 bg-white px-4 py-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary-200 text-primary-700">
                      <Icon size={20} />
                    </span>
                    <div>
                      <h2 className="text-sm font-black uppercase leading-5 text-primary-900">
                        {itemTitle}
                      </h2>
                      <p className="text-xs leading-5 text-slate-500">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                <section className="overflow-hidden border border-slate-200 bg-white">
                  <SectionBar title="Nhận báo giá ngay" />
                  <div className="space-y-3 p-5">
                    <p className="border-b border-slate-100 pb-4 text-sm font-black uppercase leading-6 text-primary-900">
                      {companyName}
                    </p>
                    <ContactRow
                      icon={Phone}
                      label="Hotline"
                      value={hotline}
                      href={phoneHref(hotline)}
                    />
                    <ContactRow
                      icon={Mail}
                      label="Email"
                      value={email}
                      href={`mailto:${email}`}
                    />
                    <ContactRow
                      icon={MapPin}
                      label="Địa chỉ"
                      value={address}
                      href={directionsHref}
                      external
                    />
                  </div>
                  <div className="border-t border-primary-100 bg-primary-50 p-5">
                    <p className="text-sm font-bold text-primary-900">Thông tin nên chuẩn bị</p>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                      {[
                        "Mô tả nhu cầu hoặc danh sách thiết bị.",
                        "Số lượng và ngân sách dự kiến.",
                        "Địa điểm, thời gian triển khai.",
                      ].map((item) => (
                        <li key={item} className="flex gap-2">
                          <CheckCircle2 className="mt-1 shrink-0 text-primary-600" size={16} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>

                <section className="overflow-hidden border border-slate-200 bg-white">
                  <SectionBar title="Nhóm thiết bị và giải pháp cung cấp" />
                  <div className="divide-y divide-slate-200 px-5">
                    {solutionGroups.map(({ icon: Icon, title: itemTitle, items }) => (
                      <div
                        key={itemTitle}
                        className="grid gap-3 py-4 sm:grid-cols-[190px_minmax(0,1fr)] sm:items-center"
                      >
                        <div className="flex items-center gap-3 font-black uppercase leading-5 text-primary-900">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700">
                            <Icon size={21} />
                          </span>
                          <h3 className="text-sm">{itemTitle}</h3>
                        </div>
                        <p className="text-sm leading-6 text-slate-600">{items}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="mt-7 overflow-hidden border border-slate-200">
                <SectionBar title="Cung cấp giải pháp và dịch vụ" dark />
                <div className="grid sm:grid-cols-2 xl:grid-cols-4">
                  {services.map((service, index) => {
                    const Icon = serviceIcon(service.icon);
                    return (
                    <Link
                      key={service.slug}
                      href={`/ho-tro-khach-hang-du-an-doanh-nghiep/${service.slug}`}
                      className={`p-5 ${
                        index % 4 !== 3 ? "xl:border-r xl:border-slate-200" : ""
                      } ${index < 4 ? "border-b border-slate-200" : ""} group block transition hover:bg-primary-50`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-900 text-white">
                          <Icon size={20} />
                        </span>
                        <h3 className="text-sm font-black uppercase leading-5 text-primary-900">
                          {service.title}
                        </h3>
                      </div>
                      <div className="relative mt-4 grid h-24 place-items-center overflow-hidden bg-gradient-to-br from-primary-50 to-slate-100 text-primary-700">
                        {service.image?.url ? (
                          <Image
                            src={service.image.url}
                            alt={service.image.alt || service.title}
                            fill
                            sizes="(max-width: 640px) 100vw, 260px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <Icon size={42} strokeWidth={1.4} />
                        )}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{service.summary}</p>
                      <span className="mt-3 inline-block text-sm font-bold text-primary-700">
                        Xem nội dung
                      </span>
                    </Link>
                    );
                  })}
                </div>
              </section>

              <section className="mt-7 border border-slate-200 bg-slate-50 p-5 sm:p-6">
                <h2 className="text-center text-lg font-black uppercase text-primary-900">
                  Quy trình làm việc
                </h2>
                <ol className="mt-5 grid gap-3 md:grid-cols-5">
                  {processSteps.map((step, index) => (
                    <li key={step} className="relative bg-white p-4 text-center shadow-sm">
                      <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-primary-700 text-sm font-black text-white">
                        {index + 1}
                      </span>
                      <p className="mt-3 text-sm font-bold leading-5 text-slate-800">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <section className="grid gap-px bg-primary-300 sm:grid-cols-3">
              {[
                {
                  icon: Building2,
                  title: "Tư vấn theo nhu cầu thực tế",
                },
                {
                  icon: ShieldCheck,
                  title: "Sản phẩm có nguồn gốc rõ ràng",
                },
                {
                  icon: FileCheck2,
                  title: "Xác nhận phương án và chi phí",
                },
              ].map(({ icon: Icon, title: itemTitle }) => (
                <div
                  key={itemTitle}
                  className="flex items-center justify-center gap-3 bg-primary-900 px-5 py-5 text-white"
                >
                  <Icon size={25} />
                  <p className="text-sm font-black uppercase leading-5">{itemTitle}</p>
                </div>
              ))}
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}

function serviceIcon(icon: string) {
  const icons = {
    scan: ScanLine,
    file: FileCheck2,
    network: Network,
    camera: Camera,
    wrench: Wrench,
    building: Building2,
    school: School,
    server: Server,
  };
  return icons[icon as keyof typeof icons] || Building2;
}

function SectionBar({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <h2
      className={`px-5 py-3 text-center text-base font-black uppercase tracking-wide text-white ${
        dark ? "bg-primary-900" : "bg-primary-500"
      }`}
    >
      {title}
    </h2>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  external = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-start gap-3 border-b border-slate-100 pb-3 transition last:border-0 last:pb-0 hover:text-primary-700"
    >
      <Icon className="mt-1 shrink-0 text-primary-700" size={19} />
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
        <span className="mt-1 block break-words text-sm font-bold leading-6">{value}</span>
      </span>
    </a>
  );
}
