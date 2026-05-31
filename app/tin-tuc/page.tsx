import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { getPosts } from "@/lib/catalog";
import Breadcrumb from "@/components/layout/Breadcrumb";

export default function NewsPage() {
  const posts = getPosts();

  return (
    <main className="subpage-main">
      <Breadcrumb items={[{ label: "Tin tức" }]} />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {posts.map((post) => (
          <article key={post.slug} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
            <Link href={`/tin-tuc/${post.slug}`}>
              <img className="h-44 w-full object-cover" src={post.image} alt={post.title} />
            </Link>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <CalendarDays size={14} />
                {post.date}
              </div>
              <h2 className="mt-3 line-clamp-3 min-h-20 text-base font-bold leading-7 text-slate-950">
                <Link href={`/tin-tuc/${post.slug}`}>{post.title}</Link>
              </h2>
              <Link className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900" href={`/tin-tuc/${post.slug}`}>
                Đọc tiếp
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
