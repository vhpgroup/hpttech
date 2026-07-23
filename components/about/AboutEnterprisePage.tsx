import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  GraduationCap,
  Headphones,
  MapPinned,
  MessageSquareText,
  Network,
  PhoneCall,
  Search,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import type { PublicAboutPage } from "@/lib/content-payload";
import type { normalizeSiteSettings } from "@/lib/site-settings";
import { phoneHref } from "@/lib/site-settings";

type AboutEnterprisePageProps = {
  content: PublicAboutPage;
  settings: ReturnType<typeof normalizeSiteSettings>;
};

const capabilityAccent = [
  { bg: "bg-primary-600", text: "text-primary-600", soft: "bg-primary-50" },
  { bg: "bg-[#12a663]", text: "text-[#12a663]", soft: "bg-[#edfdf5]" },
  { bg: "bg-accent-500", text: "text-accent-500", soft: "bg-accent-50" },
];

const statIcons = [CalendarCheck, Users, Award, MapPinned];
const processIcons = [Search, MessageSquareText, FileCheck2, Wrench, GraduationCap, Headphones];
const advantageIcons = [FileCheck2, ShieldCheck, MapPinned, Network, CircleDollarSign];
const fallbackCapabilityImages = [
  "/assets/commercial-blocks/office.jpg",
  "/assets/commercial-blocks/service.jpg",
  "/assets/commercial-blocks/solution.jpg",
];
const fallbackCaseImages = [
  "/assets/commercial-blocks/solution.jpg",
  "/assets/commercial-blocks/office.jpg",
  "/assets/commercial-blocks/service.jpg",
  "/assets/commercial-blocks/scanner.jpg",
];

const partnerLogoMap: Record<string, string> = {
  hp: "/assets/brands/hp.svg",
  dell: "/assets/brands/dell.svg",
  lenovo: "/assets/brands/lenovo.svg",
  hpe: "/assets/brands/hpe.svg",
  brother: "/assets/brands/brother.svg",
  canon: "/assets/brands/canon.svg",
  epson: "/assets/brands/epson.svg",
  "konica minolta": "/assets/brands/minolta.svg",
  microtek: "/assets/brands/microtek.svg",
  oki: "/assets/brands/oki.svg",
};

export function AboutEnterprisePage({ content, settings }: AboutEnterprisePageProps) {
  const phone = settings.hotline || settings.phone;
  const heroBackground = "/assets/banner/congty.jpg";

  return (
    <main className="about-page bg-surface text-ink">

      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image
            src={heroBackground}
            alt={content.hero.backgroundImage?.alt || content.hero.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#041222_0%,rgba(4,18,34,0.92)_32%,rgba(4,18,34,0.35)_68%,rgba(4,18,34,0.05)_100%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[440px] max-w-[1280px] content-center px-10 py-16">
          <div className="max-w-[650px] about-reveal">
            <p className="mb-6 text-sm font-bold uppercase tracking-wide text-primary-400">Giới thiệu HPT Tech</p>
            <h1 className="text-[48px] font-bold leading-[1.08] tracking-normal text-white">
              Đối tác công nghệ
              <span className="block text-primary-400">cho doanh nghiệp hiện đại</span>
            </h1>
            <p className="mt-6 max-w-[560px] text-[17px] leading-8 text-white/88">{content.hero.description}</p>
            <div className="mt-8 flex gap-4">
              <Link
                href={content.hero.primaryCta?.href || "/lien-he"}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary-600 px-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(20,92,255,0.32)] transition hover:bg-primary-600"
              >
                {content.hero.primaryCta?.label || "Nhận tư vấn giải pháp"}
                <ArrowRight size={17} />
              </Link>
              <Link
                href={content.hero.secondaryCta?.href || "/dich-vu"}
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/70 px-6 text-sm font-bold text-white transition hover:bg-white/10"
              >
                {content.hero.secondaryCta?.label || "Khám phá dịch vụ"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-9 max-w-[1280px] px-10">
        <section className="grid grid-cols-4 rounded-[14px] bg-white px-7 py-7 shadow-[0_18px_46px_rgba(15,23,42,0.16)] about-reveal">
          {content.stats.slice(0, 4).map((stat, index) => {
            const Icon = statIcons[index % statIcons.length];
            return (
              <article key={`${stat.value}-${stat.label}`} className="flex gap-5 border-r border-slate-200 px-4 last:border-r-0">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <Icon size={30} strokeWidth={1.8} />
                </div>
                <div>
                  <strong className="block text-[28px] font-bold leading-none text-primary-600">{stat.value}</strong>
                  <span className="mt-2 block text-sm font-bold text-slate-950">{stat.label}</span>
                  {stat.description ? <p className="mt-2 text-sm leading-5 text-slate-600">{stat.description}</p> : null}
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <section className="mx-auto max-w-[1280px] px-10 pt-5">
        <div className="grid gap-5 lg:grid-cols-3">
          {content.capabilities.slice(0, 3).map((capability, index) => {
            const accent = capabilityAccent[index % capabilityAccent.length];
            return (
              <article key={capability.title} className="rounded-[12px] bg-white p-7 shadow-[0_12px_36px_rgba(15,23,42,0.10)] about-reveal">
                <div className="flex items-start gap-5">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${accent.bg} text-lg font-bold text-white`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-[24px] font-bold leading-[1.15] tracking-normal text-slate-950">{capability.title}</h2>
                </div>
                {capability.description ? <p className="mt-6 text-[15px] leading-7 text-slate-600">{capability.description}</p> : null}
                <ul className="mt-5 space-y-3">
                  {capability.items.slice(0, 8).map((item) => (
                    <li key={item} className="flex gap-3 text-[14px] font-semibold leading-6 text-slate-800">
                      <CheckCircle2 className={`mt-1 shrink-0 ${accent.text}`} size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="relative mt-7 h-[136px] overflow-hidden rounded-[10px] bg-slate-100">
                  <Image
                    src={capability.image?.url || fallbackCapabilityImages[index % fallbackCapabilityImages.length]}
                    alt={capability.image?.alt || capability.title}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <AboutBand title={content.sections.processEyebrow}>
        <ol className="grid grid-cols-6 items-stretch rounded-[10px] bg-white px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          {content.process.slice(0, 6).map((step, index) => {
            const Icon = processIcons[index % processIcons.length];
            return (
              <li key={`${step.title}-${index}`} className="flex items-center gap-4 border-r border-slate-200 px-3 last:border-r-0">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <Icon size={22} />
                </span>
                <div>
                  <h3 className="text-sm font-bold leading-5 text-slate-950">{step.title}</h3>
                  {step.description ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{step.description}</p> : null}
                </div>
                {index < 5 ? <ArrowRight className="ml-auto shrink-0 text-slate-300" size={18} /> : null}
              </li>
            );
          })}
        </ol>
      </AboutBand>

      <AboutBand title={content.sections.partnersEyebrow}>
        <div className="grid grid-cols-8 items-center gap-4 rounded-[10px] bg-white px-9 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          {content.partners.slice(0, 8).map((partner) => {
            const fallbackLogo = partnerLogoMap[partner.name.toLowerCase()];
            return (
              <div key={partner.name} className="flex h-14 items-center justify-center">
                {partner.logo?.url || fallbackLogo ? (
                  <Image
                    src={partner.logo?.url || fallbackLogo}
                    alt={partner.logo?.alt || partner.name}
                    width={132}
                    height={48}
                    className="max-h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="text-lg font-bold text-slate-600">{partner.name}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary-600" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>
      </AboutBand>

      <AboutBand title={content.sections.advantagesEyebrow}>
        <div className="grid grid-cols-5 rounded-[10px] bg-white px-6 py-6 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          {content.advantages.slice(0, 5).map((advantage, index) => {
            const Icon = advantageIcons[index % advantageIcons.length];
            return (
              <article key={advantage.title} className="border-r border-slate-200 px-5 last:border-r-0">
                <Icon className="text-primary-600" size={31} strokeWidth={1.8} />
                <h3 className="mt-4 text-base font-bold leading-5 text-primary-900">{advantage.title}</h3>
                {advantage.description ? <p className="mt-4 text-sm leading-6 text-slate-600">{advantage.description}</p> : null}
              </article>
            );
          })}
        </div>
      </AboutBand>

      <AboutBand title={content.sections.caseStudiesEyebrow}>
        <div className="grid gap-5 lg:grid-cols-4">
          {content.caseStudies.slice(0, 4).map((study, index) => (
            <article key={`${study.segment}-${study.title}`} className="overflow-hidden rounded-[10px] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.10)] about-reveal">
              <div className="relative h-[120px] bg-slate-100">
                <Image
                  src={study.image?.url || fallbackCaseImages[index % fallbackCaseImages.length]}
                  alt={study.image?.alt || study.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <p className="text-sm font-bold text-primary-600">{study.segment}</p>
                <h3 className="mt-2 text-[16px] font-bold leading-6 text-slate-950">{study.title}</h3>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-5 text-center">
          <Link
            href="/du-an"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-bold text-primary-600 shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
          >
            Xem tất cả dự án
            <ArrowRight size={16} />
          </Link>
        </div>
      </AboutBand>

      <section className="mx-auto max-w-[1280px] px-10 pb-10">
        <div className="flex items-center justify-between rounded-[12px] bg-primary-600 px-14 py-9 text-white shadow-[0_18px_42px_rgba(20,92,255,0.24)]">
          <div>
            <h2 className="max-w-[620px] text-[30px] font-bold leading-tight tracking-normal">{content.cta.title}</h2>
            {content.cta.description ? <p className="mt-3 text-base text-white/86">{content.cta.description}</p> : null}
          </div>
          <div className="flex gap-5">
            <Link
              href={content.cta.primaryCta?.href || "/lien-he"}
              className="inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-md bg-white px-6 text-sm font-bold text-primary-600"
            >
              {content.cta.primaryCta?.label || "Liên hệ tư vấn"}
              <ArrowRight size={16} />
            </Link>
            <a
              href={content.cta.secondaryCta?.href || phoneHref(phone)}
              className="inline-flex h-12 min-w-[230px] items-center justify-center gap-2 rounded-md bg-primary-800 px-6 text-sm font-bold text-white"
            >
              <PhoneCall size={16} />
              Gọi ngay: {phone}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}


function AboutBand({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-[1280px] px-10 pt-7">
      <h2 className="mb-3 text-[17px] font-bold uppercase tracking-normal text-primary-900">{title}</h2>
      {children}
    </section>
  );
}
