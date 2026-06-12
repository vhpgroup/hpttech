import type { ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@payloadcms/richtext-lexical/react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { ApplicationForm } from "@/components/recruitment/ApplicationForm";
import {
  getPostsFromPayload,
  getRecruitmentPostBySlugFromPayload,
} from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

type RecruitmentDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: RecruitmentDetailPageProps) {
  const { slug } = await params;
  const job = await getRecruitmentPostBySlugFromPayload(slug);

  return pageMetadata({
    title: job?.title || "Vị trí tuyển dụng",
    description: job?.summary || "Thông tin vị trí tuyển dụng tại HPT Tech.",
    path: `/tuyen-dung/${slug}`,
    image: job?.image,
    type: "article",
  });
}

export default async function RecruitmentDetailPage({ params }: RecruitmentDetailPageProps) {
  const { slug } = await params;
  const [job, posts] = await Promise.all([
    getRecruitmentPostBySlugFromPayload(slug),
    getPostsFromPayload(),
  ]);
  if (!job) notFound();

  const relatedJobs = posts
    .filter((post) => post.postType === "recruitment" && post.slug !== job.slug)
    .slice(0, 4);

  return (
    <main className="subpage-main bg-slate-50/70 pb-20">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-[#0A4BFF]">Trang chủ</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <Link href="/tuyen-dung" className="transition hover:text-[#0A4BFF]">Tuyển dụng</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <span className="line-clamp-1">{job.title}</span>
      </nav>

      <section className="relative mt-5 min-h-[360px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#06162f] via-[#0b3a78] to-[#0A4BFF] text-white">
        {job.image ? (
          <>
            <Image src={job.image} alt={job.title} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/20" />
          </>
        ) : null}
        <div className="relative flex min-h-[360px] max-w-3xl flex-col justify-center p-7 sm:p-10">
          <span className="inline-flex w-fit rounded bg-[#0A4BFF] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide">
            Vị trí tuyển dụng
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{job.title}</h1>
          {job.summary ? <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200">{job.summary}</p> : null}
          {job.date ? (
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-100">
              <CalendarDays size={16} />
              Đăng ngày {job.date}
            </p>
          ) : null}
          <a href="#ung-tuyen" className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#0A4BFF]">
            Ứng tuyển ngay
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Link href="/tuyen-dung" className="inline-flex items-center gap-2 text-sm font-bold text-[#0A4BFF]">
            <ArrowLeft size={16} />
            Tất cả vị trí
          </Link>

          {job.content ? (
            <RichText
              data={job.content as ComponentProps<typeof RichText>["data"]}
              className="prose prose-slate mt-7 max-w-none prose-headings:text-[#102b62] prose-a:text-[#0A4BFF]"
            />
          ) : job.summary ? (
            <section className="mt-7">
              <h2 className="text-xl font-black uppercase text-[#102b62]">Thông tin vị trí</h2>
              <p className="mt-4 text-base leading-8 text-slate-700">{job.summary}</p>
            </section>
          ) : null}
        </article>

        <aside id="ung-tuyen" className="scroll-mt-24 lg:sticky lg:top-4 lg:self-start">
          <ApplicationForm jobTitle={job.title} jobCode={job.slug} />
        </aside>
      </div>

      {relatedJobs.length ? (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black uppercase text-[#102b62]">Việc làm liên quan</h2>
            <Link href="/tuyen-dung" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0A4BFF]">
              Xem tất cả <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedJobs.map((item) => (
              <Link key={item.slug} href={`/tuyen-dung/${item.slug}`} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">
                <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-[#0A4BFF]"><BriefcaseBusiness size={19} /></span>
                <h3 className="mt-4 line-clamp-2 text-sm font-bold leading-6 text-slate-900 group-hover:text-[#0A4BFF]">{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
