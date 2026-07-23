import { permanentRedirect } from "next/navigation";

// URL landing danh mục đã RÚT GỌN về /<slug> (kiểu An Phát) — route /danh-muc/<slug>
// giữ lại làm redirect 308 vĩnh viễn (bảo toàn link đã index/chia sẻ + query bộ lọc).
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyDanhMucRedirect({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolved = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) query.set(key, first);
  }
  const suffix = query.toString();
  permanentRedirect(`/${encodeURIComponent(slug)}${suffix ? `?${suffix}` : ""}`);
}
