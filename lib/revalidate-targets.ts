// Bản đồ THUẦN từ một thay đổi trong Payload sang danh sách tag/path cần làm mới.
//
// Cố ý KHÔNG import next/cache hay payload ở đây: nhờ vậy verifier
// (npm run test:revalidate-targets) nạp được module này trực tiếp mà không phải
// khởi tạo payload.config hay chạy trong request scope của Next.
//
// Hai nơi dùng chung file này — đừng nhân bản bản đồ:
//   - app/api/revalidate/route.ts   (endpoint cho tiến trình NGOÀI, vd script cron/sync giá)
//   - lib/payload/hooks/revalidate.ts (hook afterChange, làm mới ngay trong tiến trình)

export type RevalidateRequest = {
  collection?: string;
  global?: string;
  slug?: string;
  path?: string;
  paths?: string[];
  slugs?: string[];
  deleted?: boolean;
};

export type RevalidateTargets = {
  tags: string[];
  paths: string[];
};

const collectionPaths: Record<string, string[]> = {
  banners: ["/"],
  solutions: ["/", "/giai-phap", "/dich-vu"],
  products: ["/", "/san-pham", "/compare", "/google-merchant.xml"],
  categories: ["/", "/san-pham"],
  "post-categories": ["/tin-tuc", "/sitemap.xml", "/sitemap/static"],
  posts: ["/", "/tin-tuc"],
  certifications: ["/thuong-hieu", "/sitemap.xml", "/sitemap/static"],
  projects: ["/du-an"],
  faq: ["/dich-vu"],
  "static-pages": [],
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringArray(value: unknown, requireNonEmpty = false): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => {
    if (typeof item !== "string") return false;
    return requireNonEmpty ? item.trim().length > 0 : true;
  });
}

/**
 * Chuẩn hóa body JSON tùy ý (từ endpoint) về đúng shape RevalidateRequest.
 * Giữ nguyên hành vi lọc trước đây: `paths` nhận mọi chuỗi, `slugs` bỏ chuỗi rỗng.
 */
export function parseRevalidateRequest(body: unknown): RevalidateRequest {
  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  return {
    collection: asString(raw.collection),
    global: asString(raw.global),
    slug: asString(raw.slug),
    path: asString(raw.path),
    paths: asStringArray(raw.paths),
    slugs: asStringArray(raw.slugs, true),
    deleted: raw.deleted === true,
  };
}

/**
 * Dựng danh sách tag + path cần làm mới cho một thay đổi.
 *
 * Thứ tự thêm vào được giữ y hệt bản cũ trong route handler để response
 * (và log) không đổi hình dạng.
 */
export function buildRevalidateTargets(input: RevalidateRequest): RevalidateTargets {
  const { collection, global, slug, path } = input;
  const bodyPaths = input.paths ?? [];
  const bodySlugs = input.slugs ?? [];

  const tags = new Set<string>();
  const paths = new Set<string>(["/"]);

  for (const item of bodyPaths) paths.add(item);
  if (collection) {
    for (const item of collectionPaths[collection] || []) paths.add(item);
  }

  if (collection === "products") {
    tags.add("products:list");
    // slug (đơn) từ hook afterChange; slugs (mảng) từ sync bảng giá hàng loạt
    // — làm mới tag product:{slug} để trang chi tiết thấy giá mới ngay,
    // không chờ ISR.
    const productSlugs = new Set<string>(bodySlugs);
    if (slug) productSlugs.add(slug);
    for (const productSlug of productSlugs) {
      tags.add(`product:${productSlug}`);
      paths.add(`/san-pham/${productSlug}`);
    }
  }

  if (collection === "product-offers" || collection === "product-variants" || collection === "product-inventory") {
    tags.add("products:list");
    paths.add("/san-pham");
    paths.add("/google-merchant.xml");
  }

  if (collection === "categories") {
    tags.add("categories:list");
    tags.add("products:list");
    if (slug) tags.add(`category:${slug}`);
  }

  if (collection === "posts") {
    tags.add("posts:list");
    if (slug) {
      tags.add(`post:${slug}`);
      paths.add(`/tin-tuc/${slug}`);
    }
    if (path) paths.add(`/tin-tuc/${path}`);
  }

  if (collection === "post-categories") {
    tags.add("post-categories:list");
    tags.add("posts:list");
    if (slug) tags.add(`category:${slug}`);
  }

  if (collection === "certifications") {
    tags.add("certifications");
    if (slug) {
      tags.add(`certification:${slug}`);
      paths.add(`/thuong-hieu/${slug}`);
    }
  }

  if (collection === "landing-pages") {
    tags.add("landing-pages:list");
    if (path) tags.add(`landing-page:${path}`);
    for (const item of bodyPaths) {
      if (item.startsWith("/giai-phap/")) tags.add(`landing-page:${item}`);
    }
  }

  if (collection === "static-pages" && slug) paths.add(`/${slug}`);
  if (global === "site-settings") paths.add("/");
  if (global === "about-page") paths.add("/ve-hpt");

  return { tags: Array.from(tags), paths: Array.from(paths) };
}
