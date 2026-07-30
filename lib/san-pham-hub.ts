/**
 * lib/san-pham-hub.ts
 * Data loader cho trang hub /san-pham (không tham số).
 *
 * Hợp đồng dữ liệu: xem SPEC_SANPHAM_HUB.md mục 4.
 * Phạm vi: file này KHÔNG sửa bất kỳ file nào khác.
 */

import { unstable_cache } from "next/cache";

import type { CatalogProduct } from "@/lib/catalog";
import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";
import {
  loadCanonicalCommercialProjections,
  type CanonicalCommercialProjection,
} from "@/lib/catalog-projection";
import { toHomeCardProduct } from "@/lib/home-category-sections";
import { getProductSearchPageFromPayload } from "@/lib/catalog-payload";
import { getPublishedLandingPages, type LandingPageDoc } from "@/lib/landing-pages";

// ---------------------------------------------------------------------------
// Types (hợp đồng — KHÔNG đổi tên, Frontend import chính xác những tên này)
// ---------------------------------------------------------------------------

/** 1 nhóm sản phẩm hiển thị thành 1 section trên hub. */
export type SanPhamHubGroup = {
  /** id ổn định của khu (khớp thứ tự render/anchor). VD: "may-scan". */
  id: string;
  /** Tiêu đề khu hiển thị. VD: "Máy scan". */
  title: string;
  /** Mô tả ngắn 1 dòng (tuỳ chọn) — tông B2B. */
  subtitle?: string;
  /** Slug danh mục gốc — dùng dựng link "Xem tất cả". */
  categorySlug: string;
  /** Link "Xem tất cả" của khu. QUY TẮC: trỏ landing rút gọn "/<categorySlug>"
   *  (đồng bộ mega-menu + carousel trang chủ, KHÔNG dùng /san-pham?category=). */
  viewAllHref: string;
  /** Tổng số SP published trong nhóm (để hiển thị "1.831 sản phẩm" nếu muốn). */
  totalCount: number;
  /** Danh sách SP để render card (đã rút gọn field, xem spec mục 4.3). 8–12 item. */
  products: CatalogProduct[];
};

/** 1 chip hãng cho brand strip. */
export type SanPhamHubBrand = {
  name: string;
  slug: string;
  /** Link tới listing/landing của hãng. QUY TẮC: "/san-pham?brand=<name>"
   *  (giữ đúng cơ chế filter brand hiện có — brand match theo name HOẶC slug). */
  href: string;
  productCount: number;
};

/** 1 link tới landing pSEO (giải pháp theo nhu cầu/ngành/hãng). */
export type SanPhamHubSolutionLink = {
  title: string;
  /** pathname THẬT từ collection landing-pages, VD "/giai-phap/may-scan/nhu-cau/hai-mat". */
  href: string;
  /** Phân loại để nhóm hiển thị: "brand" | "need" | "industry". */
  facetType: "brand" | "need" | "industry";
};

/** Toàn bộ dữ liệu hub. */
export type SanPhamHubData = {
  /** Các section nhóm sản phẩm, đã sắp thứ tự hiển thị. Chỉ chứa nhóm CÓ sản phẩm. */
  groups: SanPhamHubGroup[];
  /** Chip hãng nổi bật (top theo số SP), 10–15 item. */
  brands: SanPhamHubBrand[];
  /** Link giải pháp pSEO (hiện chủ yếu nhóm máy scan). Có thể rỗng → FE ẩn khối. */
  solutionLinks: SanPhamHubSolutionLink[];
  /** Tổng SP published toàn catalog (hiển thị ở hero, vd "hơn 6.000 sản phẩm"). */
  totalProducts: number;
};

// ---------------------------------------------------------------------------
// Hằng số cấu hình
// ---------------------------------------------------------------------------

/** Số SP lấy cho mỗi nhóm hub (spec: 8–12). */
const HUB_LIMIT_PER_GROUP = 12;
/** Số chip hãng tối đa (spec: 10–15). */
const HUB_BRANDS_MAX = 12;
/** Số solution link tối đa (spec: 12–16). */
const HUB_SOLUTION_LINKS_MAX = 16;

type HubGroupSourceProductType = { type: "productType"; code: string };
type HubGroupSourceCategory = { type: "category"; slug: string };
type HubGroupSource = HubGroupSourceProductType | HubGroupSourceCategory;

type HubGroupDef = {
  id: string;
  title: string;
  subtitle?: string;
  /** Slug danh mục gốc để dựng viewAllHref = "/<categorySlug>". */
  categorySlug: string;
  source: HubGroupSource;
};

/**
 * Danh sách nhóm hub theo thứ tự render (spec mục 4.4).
 * Ba nhóm chủ lực (scan/in/photocopy) lên trước để giữ định vị thương hiệu HPT Tech.
 */
const HUB_GROUP_DEFS: HubGroupDef[] = [
  {
    id: "may-scan",
    title: "Máy scan",
    subtitle: "Giải pháp số hóa tài liệu chuyên nghiệp cho doanh nghiệp",
    categorySlug: "may-scan",
    source: { type: "productType", code: "scanner" },
  },
  {
    id: "may-in",
    title: "Máy in",
    subtitle: "Máy in laser, phun màu, đa năng chính hãng",
    categorySlug: "may-in",
    source: { type: "productType", code: "printer" },
  },
  {
    id: "may-photocopy",
    title: "Máy photocopy",
    subtitle: "Máy photocopy văn phòng, đa chức năng A3/A4",
    categorySlug: "may-photocopy",
    source: { type: "productType", code: "photocopier" },
  },
  {
    id: "muc-in-phu-kien",
    title: "Mực in & Phụ kiện",
    subtitle: "Mực toner, cartridge, drum chính hãng đầy đủ",
    categorySlug: "muc-in-phu-kien",
    source: { type: "category", slug: "muc-in-phu-kien" },
  },
  {
    id: "may-tinh-dong-bo-may-chu",
    title: "Máy tính đồng bộ - Máy chủ",
    subtitle: "PC, AIO, mini PC, workstation, server chính hãng",
    categorySlug: "may-tinh-dong-bo-may-chu",
    source: { type: "category", slug: "may-tinh-dong-bo-may-chu" },
  },
  {
    id: "laptop",
    title: "Laptop",
    subtitle: "Laptop văn phòng và gaming đồ họa chính hãng",
    categorySlug: "laptop-gaming-do-hoa",
    source: { type: "category", slug: "laptop-gaming-do-hoa" },
  },
  {
    id: "thiet-bi-mang",
    title: "Thiết bị mạng",
    subtitle: "Router, switch, card mạng và phụ kiện chính hãng",
    categorySlug: "thiet-bi-mang",
    source: { type: "category", slug: "thiet-bi-mang" },
  },
  {
    id: "phan-mem-ban-quyen",
    title: "Phần mềm bản quyền",
    subtitle: "Windows, Office, bảo mật và phần mềm doanh nghiệp",
    categorySlug: "phan-mem-ban-quyen",
    source: { type: "category", slug: "phan-mem-ban-quyen" },
  },
  {
    id: "thiet-bi-hinh-anh",
    title: "Thiết bị hình ảnh",
    subtitle: "Máy ảnh, ống kính, máy quay, gimbal, studio",
    categorySlug: "thiet-bi-hinh-anh",
    source: { type: "category", slug: "thiet-bi-hinh-anh" },
  },
];

// ---------------------------------------------------------------------------
// Helpers: map Payload doc → CatalogProduct (chỉ field cần cho card)
// ---------------------------------------------------------------------------

type PayloadDoc = Record<string, unknown>;

function textOf(doc: PayloadDoc, key: string): string {
  const value = doc[key];
  return typeof value === "string" ? value : "";
}

function numberOf(doc: PayloadDoc, key: string): number | undefined {
  const value = doc[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function relationName(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "name" in value && typeof (value as Record<string, unknown>).name === "string") {
    return (value as Record<string, unknown>).name as string;
  }
  return undefined;
}

function relationCode(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  return typeof obj.code === "string" ? obj.code : undefined;
}

function mediaURL(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  return typeof obj.url === "string" ? obj.url : undefined;
}

/** Hiển thị giá từ projection (ProductOffers) — không bao giờ render field `price` thô. */
function displayPriceFromProjection(
  commercial: CanonicalCommercialProjection | undefined,
): string | undefined {
  return commercial?.price;
}

/**
 * Map 1 Payload product doc → CatalogProduct tối thiểu cho card hub.
 * Giá LẤY TỪ commercial projection (ProductOffers), KHÔNG field `price` thô.
 */
function toHubCardProduct(
  doc: PayloadDoc,
  commercial: CanonicalCommercialProjection | undefined,
): CatalogProduct {
  const images = Array.isArray(doc.images)
    ? (doc.images as unknown[])
        .map((img) => ({
          id: (img && typeof img === "object" && "id" in img)
            ? (img as Record<string, unknown>).id as string | number | undefined
            : undefined,
          url: mediaURL(img),
          alt: (img && typeof img === "object" && "alt" in img)
            ? String((img as Record<string, unknown>).alt ?? "")
            : "",
        }))
        .filter((img): img is { id: string | number | undefined; url: string; alt: string } =>
          Boolean(img.url),
        )
    : [];

  const slug = textOf(doc, "slug");
  return {
    id: typeof doc.id === "string" || typeof doc.id === "number" ? doc.id : undefined,
    title: textOf(doc, "name") || textOf(doc, "title"),
    slug,
    sku: commercial?.sku || textOf(doc, "sku") || undefined,
    productType: relationCode(doc.productType),
    brand: relationName(doc.brand),
    category: relationName(doc.category),
    price: displayPriceFromProjection(commercial),
    priceValue: commercial?.priceValue,
    compareAtPrice: commercial?.compareAtPrice || textOf(doc, "compareAtPrice") || undefined,
    rating: numberOf(doc, "rating"),
    reviewCount: numberOf(doc, "reviewCount"),
    vatIncluded: commercial?.vatIncluded,
    discountBadge: textOf(doc, "discountBadge") || undefined,
    promoText: textOf(doc, "promoText") || undefined,
    stockStatus: commercial?.stockStatus || textOf(doc, "stockStatus") || undefined,
    images,
    image: images[0]?.url,
    href: slug ? `/san-pham/${slug}` : undefined,
    tag: textOf(doc, "tag") || (doc.featured === true ? "Nổi bật" : undefined) || undefined,
  };
}

/**
 * Chuyển tên hãng thành slug dùng trong URL (tương tự slugify trong lib/catalog.ts).
 * Tách riêng để tránh import vòng tròn.
 */
function slugifyBrandName(name: string): string {
  // Xóa diacritics: normalize NFD rồi lọc combining marks (U+0300..U+036F)
  const withoutMarks = name
    .normalize("NFD")
    .split("")
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join("");
  return withoutMarks
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** select tối thiểu đủ render card (tái khai vì PRODUCT_LIST_SELECT là private trong catalog-payload). */
const HUB_PRODUCT_SELECT = {
  id: true,
  name: true,
  title: true,
  slug: true,
  sku: true,
  productType: true,
  brand: true,
  category: true,
  price: true,
  compareAtPrice: true,
  rating: true,
  reviewCount: true,
  vatIncluded: true,
  discountBadge: true,
  promoText: true,
  stockStatus: true,
  images: true,
  tag: true,
  featured: true,
} as const;

// ---------------------------------------------------------------------------
// Query: nhóm theo productType.code (Cách C — scanner/printer/photocopier)
// ---------------------------------------------------------------------------

async function fetchGroupByProductType(
  groupId: string,
  code: string,
): Promise<{ products: CatalogProduct[]; totalCount: number }> {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: HUB_LIMIT_PER_GROUP,
      select: HUB_PRODUCT_SELECT,
      // SP mới nhất (ngày tạo) lên đầu — tránh batch-update đẩy SP cũ.
      sort: "-createdAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
          { "productType.code": { equals: code } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadDoc[];
    const totalCount = res.totalDocs ?? 0;
    if (!docs.length) return { products: [], totalCount };

    const ids = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, ids);

    const products = docs
      .map((doc) =>
        toHubCardProduct(
          doc,
          doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
        ),
      )
      .filter((product) => product.title && product.slug)
      .map(toHomeCardProduct);

    return { products, totalCount };
  } catch (error) {
    handlePayloadReadError(`san-pham-hub:${groupId}`, error);
    return { products: [], totalCount: 0 };
  }
}

// ---------------------------------------------------------------------------
// Query: nhóm theo category slug (Cách A — tái dùng getProductSearchPageFromPayload)
// ---------------------------------------------------------------------------

async function fetchGroupByCategory(
  groupId: string,
  categorySlug: string,
): Promise<{ products: CatalogProduct[]; totalCount: number }> {
  try {
    const result = await getProductSearchPageFromPayload({
      category: categorySlug,
      limit: HUB_LIMIT_PER_GROUP,
      sort: "newest",
    });
    const products = result.products
      .filter((product) => product.title && product.slug)
      .map(toHomeCardProduct);
    return { products, totalCount: result.totalProducts };
  } catch (error) {
    handlePayloadReadError(`san-pham-hub:${groupId}`, error);
    return { products: [], totalCount: 0 };
  }
}

// ---------------------------------------------------------------------------
// Query: tổng SP published toàn catalog
// ---------------------------------------------------------------------------

async function fetchTotalPublishedCount(): Promise<number> {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 0,
      limit: 0,
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });
    return res.totalDocs ?? 0;
  } catch (error) {
    handlePayloadReadError("san-pham-hub:total-count", error);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Query: top brands từ facets
// ---------------------------------------------------------------------------

async function fetchTopBrands(): Promise<SanPhamHubBrand[]> {
  try {
    // Lấy facets toàn catalog — limit=1 để nhanh, chỉ cần facets.brands
    const result = await getProductSearchPageFromPayload({ limit: 1 });
    const facetBrands = result.facets?.brands ?? [];
    return facetBrands
      .slice(0, HUB_BRANDS_MAX)
      .map((facet) => ({
        name: facet.label,
        slug: slugifyBrandName(facet.value),
        href: `/san-pham?brand=${encodeURIComponent(facet.label)}`,
        productCount: facet.count,
      }));
  } catch (error) {
    handlePayloadReadError("san-pham-hub:brands", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Query: solution links từ collection landing-pages
// ---------------------------------------------------------------------------

async function fetchSolutionLinks(): Promise<SanPhamHubSolutionLink[]> {
  try {
    const pages: LandingPageDoc[] = await getPublishedLandingPages();
    const result: SanPhamHubSolutionLink[] = [];

    for (const page of pages) {
      if (result.length >= HUB_SOLUTION_LINKS_MAX) break;
      // Chỉ lấy page có đủ pathname + title + facetType hợp lệ
      if (!page.pathname || !page.title || !page.facetType) continue;
      result.push({
        title: page.title,
        href: page.pathname,
        facetType: page.facetType,
      });
    }
    return result;
  } catch (error) {
    handlePayloadReadError("san-pham-hub:solution-links", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Hàm loader chính (export — không tham số → cache key tĩnh, tránh bẫy PR #5)
// ---------------------------------------------------------------------------

/**
 * Load toàn bộ dữ liệu cho trang hub /san-pham.
 * Mỗi nhóm sản phẩm được query RIÊNG, chạy song song (Promise.all).
 * 1 nhóm lỗi KHÔNG làm hỏng cả hub — fallback products=[].
 */
export async function loadSanPhamHubData(): Promise<SanPhamHubData> {
  try {
    // Tất cả query chạy song song: nhóm SP, tổng count, brands, solution links
    const [groupResults, totalProducts, brands, solutionLinks] = await Promise.all([
      // Mỗi nhóm 1 query riêng — không pool chung (bài học sự cố 14/07)
      Promise.all(
        HUB_GROUP_DEFS.map((def) =>
          def.source.type === "productType"
            ? fetchGroupByProductType(def.id, def.source.code)
            : fetchGroupByCategory(def.id, def.source.slug),
        ),
      ),
      fetchTotalPublishedCount(),
      fetchTopBrands(),
      fetchSolutionLinks(),
    ]);

    // Ghép kết quả nhóm; chỉ giữ nhóm CÓ sản phẩm, đúng thứ tự HUB_GROUP_DEFS
    const groups: SanPhamHubGroup[] = HUB_GROUP_DEFS.map((def, index) => {
      const { products, totalCount } = groupResults[index];
      return {
        id: def.id,
        title: def.title,
        subtitle: def.subtitle,
        categorySlug: def.categorySlug,
        viewAllHref: `/${def.categorySlug}`,
        totalCount,
        products,
      };
    }).filter((group) => group.products.length > 0);

    return { groups, brands, solutionLinks, totalProducts };
  } catch (error) {
    handlePayloadReadError("san-pham-hub", error);
    // Fallback an toàn tuyệt đối — FE guard mảng rỗng (spec mục 6.7)
    return { groups: [], brands: [], solutionLinks: [], totalProducts: 0 };
  }
}

/**
 * Phiên bản có cache của `loadSanPhamHubData`.
 * Route hub gọi hàm này: `const hub = await getSanPhamHubData();`
 *
 * Cache key tĩnh ["san-pham-hub"] — không tham số, tránh bẫy cache-key 3 tầng (PR #5).
 * Tag "products:list" đồng bộ với /api/revalidate → tự làm mới hub khi sản phẩm đổi.
 */
export const getSanPhamHubData = unstable_cache(
  loadSanPhamHubData,
  ["san-pham-hub"],
  { revalidate: 300, tags: ["products:list"] },
);
