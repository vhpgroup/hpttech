import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import {
  getProjectBySlugFromPayload,
  getProjectsFromPayload,
  type PublicProject,
} from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { ProductQuickInfoTrigger } from "@/components/home/HomeCategoryCarouselsClient";
import { PayloadRichText } from "@/components/rich-text/PayloadRichText";

export const revalidate = 300;

type ProjectDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function slugify(value: string) {
  return value
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function projectCategoryLabel(project: PublicProject) {
  return project.category?.name?.trim() || project.industry?.trim() || "";
}

function projectCategorySlug(project: PublicProject) {
  return project.category?.slug || slugify(projectCategoryLabel(project));
}

function RelatedProjectCard({ project }: { project: PublicProject }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-md">
      <Link href={`/du-an/${project.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-slate-100">
        {project.image ? (
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(max-width: 767px) 100vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid h-full place-items-center bg-gradient-to-br from-primary-50 to-slate-200 text-primary-300">
            <BriefcaseBusiness size={36} />
          </span>
        )}
      </Link>
      <div className="p-4">
        {projectCategoryLabel(project) ? (
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-primary-600">
            {projectCategoryLabel(project)}
          </p>
        ) : null}
        <h3 className="mt-2 line-clamp-2 text-base font-bold leading-6 text-slate-900">
          <Link href={`/du-an/${project.slug}`} className="hover:text-primary-600">
            {project.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlugFromPayload(slug);

  if (!project) {
    return pageMetadata({
      title: "Dự án",
      description: "Thông tin dự án HPT Tech.",
      path: `/du-an/${slug}`,
    });
  }

  return pageMetadata({
    title: project.title,
    description: project.summary || "Dự án công nghệ được HPT Tech triển khai.",
    path: `/du-an/${project.slug}`,
    image: project.image,
    type: "article",
  });
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const [project, projects] = await Promise.all([
    getProjectBySlugFromPayload(slug),
    getProjectsFromPayload(),
  ]);
  if (!project) notFound();

  const projectCategory = projectCategoryLabel(project);
  const completedAt = formatDate(project.completedAt);
  const relatedProjects = projects
    .filter((item) => item.slug !== project.slug && projectCategory && projectCategoryLabel(item) === projectCategory)
    .slice(0, 4);

  return (
    <main className="subpage-main bg-slate-50/70 pb-20">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="transition hover:text-primary-600">Trang chủ</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <Link href="/du-an" className="transition hover:text-primary-600">Dự án</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <span className="line-clamp-1">{project.title}</span>
      </nav>

      <article className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {project.image ? (
          <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
            <Image
              src={project.image}
              alt={project.title}
              fill
              priority
              sizes="(max-width: 1199px) 100vw, 1200px"
              className="object-contain"
            />
          </div>
        ) : null}

        {(project.client || projectCategory || project.industry || completedAt) ? (
          <section className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-6 sm:grid-cols-3 sm:p-8">
            {project.client ? (
              <div className="flex items-start gap-3">
                <Building2 size={19} className="mt-0.5 text-primary-600" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Khách hàng</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{project.client}</p>
                </div>
              </div>
            ) : null}
            {projectCategory ? (
              <div className="flex items-start gap-3">
                <BriefcaseBusiness size={19} className="mt-0.5 text-primary-600" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Danh mục dự án</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{projectCategory}</p>
                </div>
              </div>
            ) : null}
            {completedAt ? (
              <div className="flex items-start gap-3">
                <CalendarDays size={19} className="mt-0.5 text-primary-600" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Hoàn thành</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{completedAt}</p>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="p-6 sm:p-8">
          {project.content ? (
            <PayloadRichText data={project.content} className="[&_h1]:text-primary-900 [&_h2]:text-primary-900 [&_h3]:text-primary-900" />
          ) : project.summary ? (
            <div className="max-w-4xl text-base leading-8 text-slate-700">
              <p>{project.summary}</p>
            </div>
          ) : null}

          {project.gallery && project.gallery.length > 1 ? (
            <section className="mt-10">
              <h2 className="text-xl font-black uppercase text-primary-900">Hình ảnh dự án</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {project.gallery.map((image, index) => image.url ? (
                  <div key={`${image.url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                    <Image
                      src={image.url}
                      alt={image.alt || `${project.title} - ảnh ${index + 1}`}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      className="object-cover transition duration-300 hover:scale-[1.03]"
                    />
                  </div>
                ) : null)}
              </div>
            </section>
          ) : null}

          {project.products?.length ? (
            <section className="mt-10">
              <h2 className="text-xl font-black uppercase text-primary-900">Sản phẩm đã sử dụng</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {project.products.map((product) => (
                  <ProductQuickInfoTrigger
                    key={product.slug}
                    product={{ ...product, href: `/san-pham/${product.slug}` }}
                  >
                    <Link href={`/san-pham/${product.slug}`} className="group block h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-md">
                      <div className="relative aspect-square bg-slate-50">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            sizes="25vw"
                            className="object-contain p-4 transition group-hover:scale-[1.03]"
                          />
                        ) : null}
                      </div>
                      <h3 className="p-4 text-sm font-bold leading-6 text-slate-900 group-hover:text-primary-600">{product.title}</h3>
                    </Link>
                  </ProductQuickInfoTrigger>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>

      {relatedProjects.length ? (
        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black uppercase text-primary-900">Dự án liên quan</h2>
            <Link href={`/du-an?danh-muc=${projectCategorySlug(project)}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-primary-600">
              Xem cùng danh mục <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProjects.map((item) => <RelatedProjectCard key={item.slug} project={item} />)}
          </div>
        </section>
      ) : null}

      <section className="mt-10 overflow-hidden rounded-2xl bg-primary-900 px-6 py-8 text-white sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-primary-300">Tư vấn triển khai</p>
            <h2 className="mt-2 text-2xl font-black">Bạn cần triển khai giải pháp tương tự?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Trao đổi nhu cầu với HPT Tech để nhận phương án phù hợp với quy mô và hạ tầng hiện tại.
            </p>
          </div>
          <Link href="/lien-he" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-primary-900 transition hover:bg-primary-50">
            Liên hệ tư vấn
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
