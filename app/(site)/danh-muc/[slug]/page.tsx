import { permanentRedirect } from "next/navigation";

// URL landing danh mục đã RÚT GỌN về /<slug> (kiểu An Phát) — route /danh-muc/<slug>
// giữ lại làm redirect 308 vĩnh viễn (bảo toàn link đã index/chia sẻ + query bộ lọc).
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyDanhMucRedirect({ params, searchParams }: PageProps) {
  const { slug: rawSlug } = await params;
  // Param đến dạng URL-encoded — decode trước khi re-encode để tránh double-encode
  // với slug/tên có dấu (vd /danh-muc/M%C3%A1y%20scan).
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    /* giữ nguyên nếu chuỗi encode hỏng */
  }
  const resolved = searchParams ? await searchParams : {};
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(resolved)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first) query.set(key, first);
  }
  const suffix = query.toString();
  permanentRedirect(`/${encodeURIComponent(slug)}${suffix ? `?${suffix}` : ""}`);
}
