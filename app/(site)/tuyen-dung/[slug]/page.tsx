import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { PayloadRichText } from "@/components/rich-text/PayloadRichText";

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
        <Link href="/" className="transition hover:text-primary-600">Trang chủ</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <Link href="/tuyen-dung" className="transition hover:text-primary-600">Tuyển dụng</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <span className="line-clamp-1">{job.title}</span>
      </nav>

      <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {job.image ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
            <Image src={job.image} alt={job.title} fill priority sizes="(max-width: 1199px) 100vw, 1200px" className="object-contain" />
          </div>
        ) : null}
        <div className="max-w-3xl p-6 sm:p-8">
          <span className="inline-flex w-fit rounded bg-primary-600 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white">
            Vị trí tuyển dụng
          </span>
          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">{job.title}</h1>
          {job.summary ? <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600">{job.summary}</p> : null}
          {job.date ? (
            <p className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
              <CalendarDays size={16} />
              Đăng ngày {job.date}
            </p>
          ) : null}
          <a href="#ung-tuyen" className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-700">
            Ứng tuyển ngay
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Link href="/tuyen-dung" className="inline-flex items-center gap-2 text-sm font-bold text-primary-600">
            <ArrowLeft size={16} />
            Tất cả vị trí
          </Link>

          {job.content ? (
            <PayloadRichText data={job.content} className="mt-7 [&_h1]:text-primary-900 [&_h2]:text-primary-900 [&_h3]:text-primary-900" />
          ) : job.summary ? (
            <section className="mt-7">
              <h2 className="text-xl font-black uppercase text-primary-900">Thông tin vị trí</h2>
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
            <h2 className="text-xl font-black uppercase text-primary-900">Việc làm liên quan</h2>
            <Link href="/tuyen-dung" className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600">
              Xem tất cả <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedJobs.map((item) => (
              <Link key={item.slug} href={`/tuyen-dung/${item.slug}`} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-md">
                <span className="grid size-10 place-items-center rounded-full bg-primary-50 text-primary-600"><BriefcaseBusiness size={19} /></span>
                <h3 className="mt-4 line-clamp-2 text-sm font-bold leading-6 text-slate-900 group-hover:text-primary-600">{item.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
