import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { getSolutionsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Giải pháp doanh nghiệp",
  description: "Các giải pháp công nghệ, thiết bị văn phòng và số hóa tài liệu HPT Tech tư vấn, cung cấp và triển khai cho doanh nghiệp.",
  path: "/giai-phap",
});

export default async function SolutionsPage() {
  const solutions = await getSolutionsFromPayload();

  return (
    <main className="subpage-main">
      <SubpageHeader
        eyebrow="HPT Tech"
        title="Giải pháp doanh nghiệp"
        description="Các giải pháp công nghệ, thiết bị văn phòng và số hóa tài liệu HPT Tech tư vấn, cung cấp và triển khai cho doanh nghiệp."
        breadcrumbs={[
          { label: "Trang chủ", href: "/" },
          { label: "Giải pháp doanh nghiệp" },
        ]}
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        {solutions.map((solution) => (
          <article key={solution.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">{solution.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{solution.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
