import fs from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { extractHighlightBulletPoints } from "@/lib/scraper/text";
import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";
import type { CatalogProduct } from "@/lib/catalog";
import { Pool } from "pg";
import {
  canonicalAttributeSpecs,
  loadCanonicalCommercialProjections,
  type CanonicalCommercialProjection,
} from "@/lib/catalog-projection";
import { HPT_DATA } from "@/lib/data";
import { canonicalizeCategoryName } from "@/lib/product-category";
import { homeDeviceTypeOf, isHomeDeviceType } from "@/lib/home-category-sections";

type PayloadProductDoc = Record<string, unknown>;
type PayloadCategoryDoc = Record<string, unknown>;

type RawProductHTML = {
  descriptionHTML?: string;
  shortDescription?: string;
  summaryHTML?: string;
};

const DEFAULT_HOME_PRODUCTS_LIMIT = 96;
const HOME_PRODUCTS_POOL_LIMIT = 500;
const DEFAULT_PRODUCT_LIST_LIMIT = 24;
const PRODUCT_LIST_SELECT = {
  id: true,
  internalId: true,
  name: true,
  title: true,
  slug: true,
  sku: true,
  model: true,
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
  shortDescription: true,
  summary: true,
  summaryHTML: true,
  warranty: true,
  origin: true,
  images: true,
  specs: true,
  tag: true,
  featured: true,
  viewCount: true,
} as const;

export type ProductListPageResult = {
  products: CatalogProduct[];
  page: number;
  limit: number;
  totalProducts: number;
  totalPages: number;
  facets?: ProductListFacets;
};

export type ProductCategoryNavItem = {
  name: string;
  slug: string;
  icon?: string;
  sortOrder: number;
  children: Array<{
    name: string;
    slug: string;
    sortOrder: number;
  }>;
};

export type ProductFacetOption = {
  label: string;
  value: string;
  count: number;
};

export type ProductListFacets = {
  categories: ProductFacetOption[];
  brands: ProductFacetOption[];
};

export type ProductSearchParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  sort?: "best" | "price-asc" | "price-desc" | "newest" | "popular";
  priceMin?: string;
  priceMax?: string;
  /** Lọc máy scan theo khổ giấy tối đa: A4 | A3 | A2 | A1 | A0 */
  size?: string;
  /** Lọc máy scan theo tốc độ/quy mô: soho | office | dept | production */
  speed?: string;
  /** Lọc máy scan theo tính năng: duplex | color | ocr | passport | card */
  feature?: string;
  /** Lọc máy in theo chức năng: don | da | fax */
  func?: string;
  /** Lọc máy in theo tốc độ/quy mô: p1 | p2 | p3 | p4 (ppm) */
  pspeed?: string;
  /** Lọc máy in theo tính năng: color | duplex | network */
  pfeat?: string;
  /** Lọc phần mềm theo hình thức bản quyền: vinhvien | thuebao */
  lic?: string;
  /** Lọc phần mềm theo đối tượng: canhan | doanhnghiep | giaoduc */
  aud?: string;
  /** Lọc mực in theo hãng máy sử dụng: hp | canon | brother | epson | ricoh | fujixerox | pantum */
  fb?: string;
  /** Lọc mực in theo màu: den | xanh | do | vang | bo */
  mau?: string;
  /** Lọc mực in theo nguồn gốc: chinhhang | tuongthich */
  orig?: string;
  /** Lọc PC/máy chủ theo CPU: i3 | i5 | i7 | i9 | ultra | xeon | ryzen */
  cpu?: string;
  /** Lọc PC/máy chủ theo RAM (GB): 8 | 16 | 32 (32 = từ 32GB trở lên) */
  ram?: string;
};

/** Khổ giấy hợp lệ cho bộ lọc scanner (khớp scannerSpecs.maxPaperSize). */
const SCANNER_SIZE_VALUES = new Set(["A4", "A3", "A2", "A1", "A0"]);

/**
 * Bậc tốc độ/quy mô → điều kiện SQL trên cột scanner_specs_scan_speed_simplex_ppm.
 * Giá trị được whitelist (không nội suy chuỗi người dùng vào SQL).
 */
const SCANNER_SPEED_SQL: Record<string, string> = {
  soho: "p.scanner_specs_scan_speed_simplex_ppm <= 30",
  office: "p.scanner_specs_scan_speed_simplex_ppm between 31 and 60",
  dept: "p.scanner_specs_scan_speed_simplex_ppm between 61 and 100",
  production: "p.scanner_specs_scan_speed_simplex_ppm > 100",
};

/** Tính năng → cột boolean tương ứng trong nhóm scannerSpecs (whitelist). */
const SCANNER_FEATURE_COLUMN: Record<string, string> = {
  duplex: "p.scanner_specs_duplex_scan",
  color: "p.scanner_specs_color_scan",
  ocr: "p.scanner_specs_ocr",
  passport: "p.scanner_specs_passport_scan",
  card: "p.scanner_specs_plastic_card_scan",
};

// Regex nhận diện văn bản (Postgres ~* , case-insensitive). Nội dung cố định, không nội suy input.
const PRINTER_MFP_REGEX = "copy|scan|đa năng|đa chức năng|mfp|all.?in.?one|sao chụp|quét|in/copy|print/copy";
const PRINTER_NETWORK_REGEX = "wifi|wi-fi|lan|ethernet|network|mạng|airprint|wireless|không dây";

/** Chức năng máy in → điều kiện SQL (dựa trên tên + printer_specs_functions). Whitelist. */
const PRINTER_FUNC_SQL: Record<string, string> = {
  da: `(coalesce(p.name,'') || ' ' || coalesce(p.printer_specs_functions,'')) ~* '${PRINTER_MFP_REGEX}'`,
  don: `(coalesce(p.name,'') || ' ' || coalesce(p.printer_specs_functions,'')) !~* '${PRINTER_MFP_REGEX}'`,
  fax: `(coalesce(p.name,'') || ' ' || coalesce(p.printer_specs_functions,'')) ~* 'fax'`,
};

/** Bậc tốc độ máy in (ppm) → điều kiện SQL trên cột printer_specs_print_speed_ppm. Whitelist. */
const PRINTER_SPEED_SQL: Record<string, string> = {
  p1: "p.printer_specs_print_speed_ppm <= 20",
  p2: "p.printer_specs_print_speed_ppm between 21 and 40",
  p3: "p.printer_specs_print_speed_ppm between 41 and 60",
  p4: "p.printer_specs_print_speed_ppm > 60",
};

/** Tính năng máy in → điều kiện SQL. Whitelist. */
const PRINTER_FEATURE_SQL: Record<string, string> = {
  color: "p.printer_specs_color_print = true",
  duplex: "p.printer_specs_auto_duplex_print = true",
  network: `(coalesce(p.name,'') || ' ' || coalesce(p.printer_specs_connectivity,'')) ~* '${PRINTER_NETWORK_REGEX}'`,
};

// Regex nhận diện phần mềm theo tên SP (Postgres ~*). Nội dung cố định, không nội suy input.
// Thuê bao: có dấu hiệu subscription/kỳ hạn. Vĩnh viễn: key/box perpetual VÀ không có dấu hiệu thuê bao.
const SOFTWARE_SUBSCRIPTION_REGEX =
  "subscri|annual|năm|tháng|1 ?(yr|year)| 1y |dịch vụ trực tuyến|dịch vụ truy cập";
const SOFTWARE_PERPETUAL_REGEX =
  "fpp|oem|oei|medialess|perpetual|retail|esd|ggwa|license pack| core| cal|dsp|- box";
const SOFTWARE_AUDIENCE_PERSONAL_REGEX = "personal|family|home|cá nhân|gia đình";
const SOFTWARE_AUDIENCE_BUSINESS_REGEX =
  "business|enterprise|teams|commercial|small office|copilot|server| cal| e[357] |volume|doanh nghiệp";
const SOFTWARE_AUDIENCE_EDUCATION_REGEX = "education|academic|giáo dục";

/** Hình thức bản quyền phần mềm → điều kiện SQL (whitelist). Thuê bao thắng khi tên chứa cả hai loại dấu hiệu. */
const SOFTWARE_LICENSE_SQL: Record<string, string> = {
  vinhvien: `(coalesce(p.name,'') ~* '${SOFTWARE_PERPETUAL_REGEX}' and coalesce(p.name,'') !~* '${SOFTWARE_SUBSCRIPTION_REGEX}')`,
  thuebao: `coalesce(p.name,'') ~* '${SOFTWARE_SUBSCRIPTION_REGEX}'`,
};

/** Đối tượng sử dụng phần mềm → điều kiện SQL (whitelist). */
const SOFTWARE_AUDIENCE_SQL: Record<string, string> = {
  canhan: `coalesce(p.name,'') ~* '${SOFTWARE_AUDIENCE_PERSONAL_REGEX}'`,
  doanhnghiep: `coalesce(p.name,'') ~* '${SOFTWARE_AUDIENCE_BUSINESS_REGEX}'`,
  giaoduc: `coalesce(p.name,'') ~* '${SOFTWARE_AUDIENCE_EDUCATION_REGEX}'`,
};

// Regex nhận diện mực in/vật tư theo tên SP (Postgres ~*, POSIX — không dùng lookahead).
// Nhận cả mã cartridge đặc trưng từng hãng (TN/DR/LC=Brother, CF/CE/Q/W=HP, PGI/CLI/NPG=Canon...).
const INK_FB_SQL: Record<string, string> = {
  hp: `coalesce(p.name,'') ~* 'hp|hewlett|laserjet|deskjet|neverstop|\\mcf ?\\d|\\mce ?\\d|\\mcb\\d{3}|\\mq\\d{4}|\\mw\\d{3,4}|\\m\\d{2,3}a\\M'`,
  canon: `coalesce(p.name,'') ~* 'canon|pixma|imagerunner|\\mcrg|\\mnpg|\\mgpr|\\mpgi|\\mcli|\\mpfi|\\mgi-?\\d|\\mlbp|\\mmf ?\\d'`,
  brother: `coalesce(p.name,'') ~* 'brother|\\mtn ?-?\\d|\\mdr ?-?\\d|\\mlc ?-?\\d|\\mbt ?-?\\d|\\msp01|\\mdcp|\\mhl-|\\mmfc'`,
  epson: `coalesce(p.name,'') ~* 'epson|ecotank|\\merc|\\mt\\d{3,4}|workforce|\\mlq ?-?\\d'`,
  ricoh: `coalesce(p.name,'') ~* 'ricoh|aficio|\\msp ?c?\\d{3}|\\mmp ?c?\\d{4}'`,
  fujixerox: `coalesce(p.name,'') ~* 'xerox|fujifilm|fuji xerox|apeos|docuprint|\\mct\\d{6}'`,
  pantum: `coalesce(p.name,'') ~* 'pantum|\\mtl ?-?\\d|\\mdl ?-?\\d|\\mpc ?-?2\\d{2}'`,
};

/** Màu mực → điều kiện SQL (whitelist). Toner đen thường không ghi màu nên bộ lọc "đen" chỉ bắt tên có ghi rõ. */
const INK_COLOR_SQL: Record<string, string> = {
  den: `coalesce(p.name,'') ~* 'đen|black|\\mbk\\M|pgbk'`,
  xanh: `coalesce(p.name,'') ~* 'cyan|xanh'`,
  do: `coalesce(p.name,'') ~* 'magenta|đỏ|hồng'`,
  vang: `coalesce(p.name,'') ~* 'yellow|vàng'`,
  bo: `coalesce(p.name,'') ~* 'combo|\\m[34] ?pk|bộ|multipack|value pack'`,
};

// Các brand nhãn mực tương thích trong CMS (Aicon, Orink... và nhãn phân khúc của shop).
const INK_COMPATIBLE_BRANDS = `'Aicon','Orink','Maetone','iziNet','XP','PT','LPT','XP Pro'`;

/** Nguồn gốc mực → điều kiện SQL (whitelist). */
const INK_ORIGIN_SQL: Record<string, string> = {
  chinhhang: `coalesce(p.name,'') ~* 'chính hãng'`,
  tuongthich: `(b.name in (${INK_COMPATIBLE_BRANDS}) or coalesce(p.name,'') ~* 'tương thích')`,
};

// Chuỗi gộp để nhận diện CPU cho PC đồng bộ / máy chủ (tên + spec đã flatten thành cột).
const PC_CPU_TEXT = `(coalesce(p.name,'') || ' ' || coalesce(p.desktop_specs_cpu,'') || ' ' || coalesce(p.server_specs_cpu,''))`;

/**
 * CPU → điều kiện SQL (whitelist).
 * Nhận cả chuẩn tên Intel mới không có "i" (Core 3/5/7 Processor 100U/210H/240H)
 * và ký hiệu Ultra rút gọn (U5/U7/U9-265, U7 155H).
 */
const PC_CPU_SQL: Record<string, string> = {
  i3: `${PC_CPU_TEXT} ~* 'core[^a-z0-9]{0,2}i?3\\M|i3[-/ ][0-9]'`,
  i5: `${PC_CPU_TEXT} ~* 'core[^a-z0-9]{0,2}i?5\\M|i5[-/ ][0-9]'`,
  i7: `${PC_CPU_TEXT} ~* 'core[^a-z0-9]{0,2}i?7\\M|i7[-/ ][0-9]'`,
  i9: `${PC_CPU_TEXT} ~* 'core[^a-z0-9]{0,2}i?9\\M|i9[-/ ][0-9]'`,
  ultra: `${PC_CPU_TEXT} ~* 'core ?ultra|ultra [579]|\\mu[579][- ]?[0-9]'`,
  xeon: `${PC_CPU_TEXT} ~* 'xeon'`,
  ryzen: `${PC_CPU_TEXT} ~* 'ryzen'`,
};

/** RAM (GB) → điều kiện SQL trên cột số desktop_specs_ram_gb / server_specs_ram_gb. Whitelist. */
const PC_RAM_SQL: Record<string, string> = {
  "8": "(p.desktop_specs_ram_gb = 8 or p.server_specs_ram_gb = 8)",
  "16": "(p.desktop_specs_ram_gb = 16 or p.server_specs_ram_gb = 16)",
  "32": "(p.desktop_specs_ram_gb >= 32 or p.server_specs_ram_gb >= 32)",
};

function normalizeSearchText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Ä‘/g, "d")
    .replace(/Ä/g, "D")
    .toLowerCase();
}

function normalizeCategoryNavKey(value?: string) {
  return normalizeSearchText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadLocalCatalogFixtures(): CatalogProduct[] {
  const fixturePath = process.env.LOCAL_CATALOG_FIXTURE_PATH;
  if (process.env.NODE_ENV === "production" || !fixturePath) return [];

  try {
    const absolutePath = path.resolve(process.cwd(), fixturePath);
    const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (product): product is CatalogProduct =>
        Boolean(
          product &&
            typeof product === "object" &&
            "title" in product &&
            typeof product.title === "string" &&
            "slug" in product &&
            typeof product.slug === "string",
        ),
    );
  } catch (error) {
    console.warn(`[catalog] Cannot load local fixture from ${fixturePath}.`, error);
    return [];
  }
}

const uploadDisplayWidths: Record<string, string> = {
  full: "100%",
  large: "75%",
  medium: "50%",
  small: "35%",
};



function toSnakeCase(key: string) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function textField(doc: PayloadProductDoc, key: string) {
  const value = doc[key] ?? doc[toSnakeCase(key)];
  return typeof value === "string" ? value : undefined;
}

function numberField(doc: PayloadProductDoc, key: string) {
  const value = doc[key] ?? doc[toSnakeCase(key)];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanField(doc: PayloadProductDoc, key: string) {
  const value = doc[key] ?? doc[toSnakeCase(key)];
  return typeof value === "boolean" ? value : undefined;
}

function categoryTextField(doc: PayloadCategoryDoc, key: string) {
  const value = doc[key];
  return typeof value === "string" ? value : undefined;
}

function categoryNumberField(doc: PayloadCategoryDoc, key: string) {
  const value = doc[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function categoryRelationId(value: unknown) {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: string | number }).id;
    if (typeof id === "string" || typeof id === "number") return String(id);
  }
  return undefined;
}

function stripHTML(value?: string) {
  return value
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHTML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHTML(value?: string) {
  if (!value) return undefined;
  return escapeHTML(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function collectUploadWidths(value: unknown) {
  const widths: string[] = [];

  function visit(node: unknown) {
    const obj = recordValue(node);
    if (!obj) return;

    if (obj.type === "upload") {
      const fields = recordValue(obj.fields);
      const displayWidth = typeof fields?.displayWidth === "string" ? fields.displayWidth : undefined;
      widths.push(uploadDisplayWidths[displayWidth || "full"] || uploadDisplayWidths.full);
    }

    if (Array.isArray(obj.children)) {
      obj.children.forEach(visit);
    }
  }

  visit(value);
  return widths;
}

function withImageStyle(tag: string, maxWidth: string) {
  const style = `display:block;margin-left:auto;margin-right:auto;max-width:${maxWidth};width:100%;height:auto;`;
  const styleMatch = tag.match(/\sstyle=(["'])(.*?)\1/i);

  if (styleMatch) {
    return tag.replace(styleMatch[0], ` style=${styleMatch[1]}${styleMatch[2]};${style}${styleMatch[1]}`);
  }

  return tag.replace("<img", `<img style="${style}"`);
}

function applyRichTextImageWidths(html: string, lexicalValue: unknown) {
  const widths = collectUploadWidths(lexicalValue);
  if (!widths.length) return html;

  let imageIndex = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const width = widths[imageIndex];
    imageIndex += 1;
    return width ? withImageStyle(tag, width) : tag;
  });
}

function htmlOrTextField(doc: PayloadProductDoc, htmlKey: string, textKey: string) {
  const html = textField(doc, htmlKey);
  if (html) return applyRichTextImageWidths(html, doc[textKey]);
  return textToHTML(textField(doc, textKey));
}

function databaseURL() {
  return (
    process.env.DATABASE_URI ||
    process.env.POSTGRES_URL ||
    (!process.env.VERCEL
      ? "postgres://payload:payload@127.0.0.1:5433/hpttech_payload"
      : undefined)
  );
}

let pgPool: Pool | undefined;

function getPgPool() {
  if (pgPool) return pgPool;
  const connectionString = databaseURL();
  if (!connectionString) return undefined;
  pgPool = new Pool({ connectionString, max: 5 });
  return pgPool;
}

async function loadRawProductHTML(id: string | number): Promise<RawProductHTML> {
  const pool = getPgPool();
  if (!pool) return {};

  try {
    const result = await pool.query<{
      description_html: string | null;
      short_description: string | null;
      summary_html: string | null;
    }>(
      `
        select
          coalesce(p.description_h_t_m_l, v.version_description_h_t_m_l) as description_html,
          coalesce(p.short_description, v.version_short_description) as short_description,
          coalesce(p.summary_h_t_m_l, v.version_summary_h_t_m_l) as summary_html
        from products p
        left join lateral (
          select version_description_h_t_m_l, version_short_description, version_summary_h_t_m_l
          from _products_v
          where parent_id = p.id
            and version__status = 'published'
          order by created_at desc
          limit 1
        ) v on true
        where p.id = $1
        limit 1
      `,
      [id],
    );
    const row = result.rows[0];
    return {
      descriptionHTML: row?.description_html || undefined,
      shortDescription: row?.short_description || undefined,
      summaryHTML: row?.summary_html || undefined,
    };
  } catch {
    return {};
  }
}

function relationName(value: unknown) {
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name;
  }
  return typeof value === "string" ? value : undefined;
}

function relationCategoryName(value: unknown) {
  const name = relationName(value);
  return name ? canonicalizeCategoryName(name) : undefined;
}

function relationCode(value: unknown) {
  if (value && typeof value === "object" && "code" in value && typeof value.code === "string") {
    return value.code;
  }
  return undefined;
}

function mediaURL(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  if ("filename" in value && typeof value.filename === "string") {
    const isLocalServer =
      process.env.NODE_ENV !== "production" ||
      /localhost|127\.0\.0\.1/i.test(process.env.NEXT_PUBLIC_SERVER_URL || "");
    if (isLocalServer) {
      return localMediaFileExists(value.filename)
        ? `/api/media/file/${encodeURIComponent(value.filename)}`
        : undefined;
    }
  }
  if ("url" in value && typeof value.url === "string") return value.url;
  if ("filename" in value && typeof value.filename === "string") {
    const generated = mediaPublicURL(value.filename);
    if (generated) return generated;
    return mediaProxyURL(value.filename);
  }
  return undefined;
}

function localMediaFileExists(filename: string) {
  const mediaRoot = path.resolve(process.cwd(), "media");
  const target = path.resolve(mediaRoot, filename);
  if (!target.startsWith(mediaRoot + path.sep)) return false;
  return fs.existsSync(target);
}

function mediaPublicURL(filename: string) {
  const base =
    process.env.R2_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    process.env.MEDIA_PUBLIC_URL;
  if (!base) return undefined;
  return `${base.replace(/\/$/, "")}/${encodeURIComponent(filename)}`;
}

function mediaProxyURL(filename: string) {
  if (process.env.NODE_ENV !== "production") {
    return `/api/media/file/${encodeURIComponent(filename)}`;
  }
  if (
    !process.env.R2_BUCKET ||
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.R2_ENDPOINT
  ) {
    return `/api/media/file/${encodeURIComponent(filename)}`;
  }
  return `/api/r2-media/${encodeURIComponent(filename)}`;
}

function mediaID(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  if ("id" in value && (typeof value.id === "string" || typeof value.id === "number")) return value.id;
  return undefined;
}

function normalizeDatasheets(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const url = typeof obj.url === "string" ? obj.url : undefined;
      if (!url) return null;
      return {
        id: mediaID(item),
        url,
        filename: typeof obj.filename === "string" ? obj.filename : undefined,
        mimeType: typeof obj.mimeType === "string" ? obj.mimeType : undefined,
      };
    })
    .filter(Boolean) as Array<{ id?: string | number; url: string; filename?: string; mimeType?: string }>;
}

function normalizeRelatedProducts(
  value: unknown,
  projections?: Map<string, CanonicalCommercialProjection>,
) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is PayloadProductDoc => Boolean(item) && typeof item === "object")
    .map((item) =>
      normalizeProduct(
        item,
        false,
        item.id !== undefined ? projections?.get(String(item.id)) : undefined,
        projections,
      ),
    )
    .filter((product) => product.title && product.slug);
}

function specValue(group: Record<string, unknown> | undefined, key: string) {
  const value = group?.[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    if (key === "dailyDuty") return `${value.toLocaleString("vi-VN")} trang/ngày`;
    return String(value);
  }
  return typeof value === "string" ? value.trim() : "";
}

function specsFromGroup(value: unknown, fields: Array<[string, string]>) {
  const group = recordValue(value);
  if (!group) return [];

  return fields
    .map(([key, label]) => ({ label, value: specValue(group, key) }))
    .filter((spec) => spec.value);
}

function normalizeSpecs(doc: PayloadProductDoc) {
  const canonicalSpecs = canonicalAttributeSpecs(doc);
  const specProfile = textField(doc, "specProfile");
  const manualSpecs = Array.isArray(doc.specs)
    ? doc.specs
        .filter((spec): spec is PayloadProductDoc => Boolean(spec) && typeof spec === "object")
        .map((spec) => ({ label: textField(spec, "label") || "", value: textField(spec, "value") || "" }))
        .filter((spec) => spec.label && spec.value)
    : [];

  const scannerSpecs = [
    ...[
      { label: "Thương hiệu", value: relationName(doc.brand) || "" },
      { label: "Bảo hành", value: textField(doc, "warranty") || "" },
    ].filter((spec) => spec.value),
    ...specsFromGroup(doc.scannerSpecs, [
    ["scannerType", "Loại máy scan"],
    ["functions", "Chức năng"],
    ["scanSpeedSimplexPpm", "Tốc độ scan"],
    ["scanSpeedDuplexIpm", "Tốc độ scan 2 mặt"],
    ["scanModes", "Chế độ quét"],
    ["scanResolution", "Độ phân giải"],
    ["displayScreen", "Màn hình hiển thị"],
    ["scanTechnology", "Công nghệ quét"],
    ["adfSheets", "ADF"],
    ["adfCapacitySheets", "Sức chứa ADF"],
    ["maxPaperSize", "Khổ giấy tối đa"],
    ["minPaperSize", "Khổ giấy tối thiểu"],
    ["dailyDuty", "Chu kỳ hoạt động"],
    ["passportScanText", "Scan hộ chiếu"],
    ["duplexScanText", "Scan hai mặt"],
    ["colorScanText", "Scan màu"],
    ["ocrText", "OCR"],
    ["plasticCardScanText", "Scan thẻ nhựa"],
    ["connectivity", "Kết nối"],
    ["supportedOs", "Hệ điều hành hỗ trợ"],
    ["dimensions", "Kích thước"],
    ["weight", "Trọng lượng"],
    ]),
  ];

  const printerSpecs = specsFromGroup(doc.printerSpecs, [
    ["printerType", "Loại máy in"],
    ["functions", "Chức năng"],
    ["printTechnology", "Công nghệ in"],
    ["printSpeed", "Tốc độ in"],
    ["printResolution", "Độ phân giải in"],
    ["maxPaperSize", "Khổ giấy tối đa"],
    ["colorPrintText", "In màu"],
    ["autoDuplexPrintText", "In đảo mặt tự động"],
    ["standardPaperTray", "Khay giấy tiêu chuẩn"],
    ["maxPaperTray", "Khay giấy tối đa"],
    ["memoryRam", "Bộ nhớ RAM"],
    ["connectivity", "Kết nối"],
    ["supportedOs", "Hệ điều hành hỗ trợ"],
    ["recommendedMonthlyVolumeText", "Công suất khuyến nghị/tháng"],
    ["maxMonthlyDuty", "Công suất tối đa/tháng"],
    ["dimensions", "Kích thước"],
    ["weight", "Trọng lượng"],
  ]);

  const photocopierSpecs = specsFromGroup(doc.photocopierSpecs, [
    ["copierType", "Loại máy"],
    ["functions", "Chức năng"],
    ["copySpeed", "Tốc độ copy"],
    ["printSpeed", "Tốc độ in"],
    ["scanSpeed", "Tốc độ scan"],
    ["maxPaperSize", "Khổ giấy tối đa"],
    ["copyResolution", "Độ phân giải copy"],
    ["printResolution", "Độ phân giải in"],
    ["scanResolution", "Độ phân giải scan"],
    ["colorPrintText", "In màu"],
    ["autoDuplexPrintText", "In hai mặt tự động"],
    ["adfText", "ADF"],
    ["adfCapacity", "Sức chứa ADF"],
    ["memoryRam", "Bộ nhớ RAM"],
    ["connectivity", "Kết nối"],
    ["monthlyDuty", "Công suất/tháng"],
    ["dimensionsWeight", "Kích thước / Trọng lượng"],
  ]);

  const combined =
    specProfile === "scanner"
      ? [...scannerSpecs, ...manualSpecs]
      : canonicalSpecs.length
        ? [...canonicalSpecs, ...manualSpecs]
        : [...scannerSpecs, ...printerSpecs, ...photocopierSpecs, ...manualSpecs];
  const seen = new Set<string>();
  return combined.filter((spec) => {
    const key = spec.label.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractSellingPoints(html?: string) {
  return extractHighlightBulletPoints(stripHTML(html));
}

function normalizeSellingPoints(value: unknown, html?: string) {
  const points = Array.isArray(value)
    ? value
        .map((item) =>
          item && typeof item === "object" && "text" in item && typeof item.text === "string"
            ? item.text.trim()
            : "",
        )
        .filter(Boolean)
    : [];
  return points.length ? points : extractSellingPoints(html);
}

function displayPrice(commercialPrice?: string, legacyPrice?: string) {
  const commercial = commercialPrice?.trim();
  const legacy = legacyPrice?.trim();
  const commercialIsContact = commercial
    ? commercial
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() === "lien he"
    : false;
  const selected = commercial && (!commercialIsContact || !legacy) ? commercial : legacy;
  if (!selected) return selected;
  const digits = selected.replace(/[^\d]/g, "");
  if (!digits || digits.length < 6) return selected;
  const amount = Number(digits);
  return Number.isFinite(amount) ? `${amount.toLocaleString("vi-VN")}đ` : selected;
}

function normalizeProduct(
  doc: PayloadProductDoc,
  includeRelated = true,
  commercial?: CanonicalCommercialProjection,
  projections?: Map<string, CanonicalCommercialProjection>,
): CatalogProduct {
  const images = Array.isArray(doc.images)
    ? doc.images
        .map((image: unknown) => ({
          id: mediaID(image),
          url: mediaURL(image),
        }))
        .filter((image: { url?: string }) => Boolean(image.url))
    : [];
  const id = doc.id;
  const descriptionHTML = htmlOrTextField(doc, "descriptionHTML", "description");

  return {
    id: typeof id === "string" || typeof id === "number" ? id : undefined,
    internalId: textField(doc, "internalId"),
    title: textField(doc, "name") || textField(doc, "title") || "",
    slug: textField(doc, "slug") || "",
    sku: commercial?.sku || textField(doc, "sku"),
    model: textField(doc, "model"),
    productType: relationCode(doc.productType),
    brand: relationName(doc.brand),
    category: relationCategoryName(doc.category),
    price: displayPrice(commercial?.price, textField(doc, "price")),
    priceValue: commercial?.priceValue,
    compareAtPrice: commercial?.compareAtPrice || textField(doc, "compareAtPrice"),
    rating: numberField(doc, "rating"),
    reviewCount: numberField(doc, "reviewCount"),
    viewCount: numberField(doc, "viewCount"),
    vatIncluded: commercial?.vatIncluded ?? booleanField(doc, "vatIncluded"),
    discountBadge: textField(doc, "discountBadge"),
    promoText: textField(doc, "promoText"),
    promoStart: textField(doc, "promoStart"),
    promoEnd: textField(doc, "promoEnd"),
    stockQuantity: commercial?.quantity,
    stockStatus: commercial?.stockStatus || textField(doc, "stockStatus"),
    detail:
      textField(doc, "shortDescription") ||
      stripHTML(htmlOrTextField(doc, "summaryHTML", "summary")),
    description: descriptionHTML,
    descriptionRichText: doc.description,
    usageGuide: htmlOrTextField(doc, "usageGuideHTML", "usageGuide"),
    usageGuideRichText: doc.usageGuide,
    warranty: commercial?.warranty || textField(doc, "warranty"),
    origin: textField(doc, "origin"),
    images,
    datasheets: normalizeDatasheets(doc.datasheets),
    image: images[0]?.url,
    sellingPoints: normalizeSellingPoints(doc.sellingPoints, descriptionHTML),
    specs: normalizeSpecs(doc),
    relatedProducts: includeRelated
      ? normalizeRelatedProducts(doc.relatedProducts, projections)
      : [],
    href: textField(doc, "slug") ? `/san-pham/${textField(doc, "slug")}` : undefined,
    tag: textField(doc, "tag") || (doc.featured ? "Nổi bật" : undefined),
  };
}

function toProductCardData(
  doc: PayloadProductDoc,
  commercial?: CanonicalCommercialProjection,
): CatalogProduct {
  const images = Array.isArray(doc.images)
    ? doc.images
        .map((image: unknown) => ({
          id: mediaID(image),
          url: mediaURL(image),
        }))
        .filter((image: { url?: string }) => Boolean(image.url))
    : [];
  const id = doc.id;
  const slug = textField(doc, "slug") || "";
  const shortDetail =
    textField(doc, "shortDescription") ||
    stripHTML(htmlOrTextField(doc, "summaryHTML", "summary"));

  return {
    id: typeof id === "string" || typeof id === "number" ? id : undefined,
    internalId: textField(doc, "internalId"),
    title: textField(doc, "name") || textField(doc, "title") || "",
    slug,
    sku: commercial?.sku || textField(doc, "sku"),
    model: textField(doc, "model"),
    productType: relationCode(doc.productType),
    brand: relationName(doc.brand),
    category: relationCategoryName(doc.category),
    price: displayPrice(commercial?.price, textField(doc, "price")),
    priceValue: commercial?.priceValue,
    compareAtPrice: commercial?.compareAtPrice || textField(doc, "compareAtPrice"),
    rating: numberField(doc, "rating"),
    reviewCount: numberField(doc, "reviewCount"),
    vatIncluded: commercial?.vatIncluded ?? booleanField(doc, "vatIncluded"),
    discountBadge: textField(doc, "discountBadge"),
    promoText: textField(doc, "promoText"),
    stockQuantity: commercial?.quantity,
    stockStatus: commercial?.stockStatus || textField(doc, "stockStatus"),
    detail: shortDetail,
    warranty: commercial?.warranty || textField(doc, "warranty"),
    images,
    image: images[0]?.url,
    specs: normalizeSpecs(doc).slice(0, 4),
    href: slug ? `/san-pham/${slug}` : undefined,
    tag: textField(doc, "tag") || (doc.featured ? "Ná»•i báº­t" : undefined),
  };
}

function toProductListData(
  doc: PayloadProductDoc,
  commercial?: CanonicalCommercialProjection,
): CatalogProduct {
  return {
    ...toProductCardData(doc, commercial),
    origin: textField(doc, "origin"),
    viewCount: numberField(doc, "viewCount"),
    specs: normalizeSpecs(doc),
  };
}

async function loadHomeProductsFromPayload(limit = DEFAULT_HOME_PRODUCTS_LIMIT): Promise<CatalogProduct[]> {
  const safeLimit = Math.max(1, Math.min(limit, 500));
  const localProducts = loadLocalCatalogFixtures().slice(0, safeLimit);

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: Math.max(safeLimit, HOME_PRODUCTS_POOL_LIMIT),
      sort: "-updatedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);
    const products = docs.map((doc) =>
      toProductCardData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );
    const selected = selectHomeProducts(products, safeLimit);
    const payloadSlugs = new Set(selected.map((product) => product.slug));

    return [...selected, ...localProducts.filter((product) => !payloadSlugs.has(product.slug))]
      .slice(0, safeLimit);
  } catch (error) {
    handlePayloadReadError("home-products", error);
    return localProducts;
  }
}

export const getHomeProductsFromPayload = unstable_cache(
  loadHomeProductsFromPayload,
  ["home-products"],
  { revalidate: 300, tags: ["products:list"] },
);

function selectHomeProducts(products: CatalogProduct[], limit: number) {
  const selected: CatalogProduct[] = [];
  const seen = new Set<string>();

  const addGroup = (group: CatalogProduct[], groupLimit: number) => {
    for (const product of group) {
      const key = product.slug || product.title;
      if (!key || seen.has(key)) continue;
      selected.push(product);
      seen.add(key);
      if (selected.length >= limit) return;
      groupLimit -= 1;
      if (groupLimit <= 0) return;
    }
  };

  addGroup(products.filter((product) => product.tag), 12);
  addGroup(
    Array.from(
      products.reduce((groups, product) => {
        const kind = homeDeviceTypeOf(product);
        if (!kind || !product.brand) return groups;

        const key = `${kind}:${product.brand}`;
        if (!groups.has(key)) groups.set(key, product);
        return groups;
      }, new Map<string, CatalogProduct>()).values(),
    ),
    limit,
  );
  addGroup(products.filter((product) => isHomeDeviceType(product, "scanner")), 24);
  addGroup(products.filter((product) => isHomeDeviceType(product, "printer")), 24);
  addGroup(products.filter((product) => isHomeDeviceType(product, "photocopier")), 24);
  addGroup(products.filter((product) => product.brand === "HP"), 8);
  addGroup(products.filter((product) => product.brand === "Brother"), 8);
  addGroup(
    Array.from(
      products.reduce((brands, product) => {
        if (product.brand && !brands.has(product.brand)) brands.set(product.brand, product);
        return brands;
      }, new Map<string, CatalogProduct>()).values(),
    ),
    limit,
  );
  addGroup(products, limit - selected.length);

  return selected.slice(0, limit);
}

async function loadProductsFromPayload(): Promise<CatalogProduct[]> {
  const localProducts = loadLocalCatalogFixtures();
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: 1000,
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .flatMap((doc) => [
        doc.id,
        ...(Array.isArray(doc.relatedProducts)
          ? doc.relatedProducts.map((related) =>
              related && typeof related === "object" && "id" in related
                ? related.id
                : undefined,
            )
          : []),
      ])
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);
    const products = docs.map((doc) =>
      toProductListData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );
    const payloadSlugs = new Set(products.map((product) => product.slug));
    return [...products, ...localProducts.filter((product) => !payloadSlugs.has(product.slug))];
  } catch (error) {
    handlePayloadReadError("products", error);
    return localProducts;
  }
}

const getCachedProductsFromPayload = unstable_cache(
  loadProductsFromPayload,
  ["all-products"],
  { revalidate: 300, tags: ["products:list"] },
);

export async function getProductsFromPayload(): Promise<CatalogProduct[]> {
  return getCachedProductsFromPayload();
}

export async function getBestSellingProductsFromPayload(limit = 5): Promise<CatalogProduct[]> {
  const safeLimit = Math.max(1, Math.min(Math.floor(limit) || 5, 24));

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: safeLimit,
      select: PRODUCT_LIST_SELECT,
      sort: "-reviewCount",
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);

    return docs
      .map((doc) =>
        toProductListData(
          doc,
          doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
        ),
      )
      .sort(
        (a, b) =>
          (b.reviewCount || 0) - (a.reviewCount || 0) ||
          (b.viewCount || 0) - (a.viewCount || 0),
      )
      .slice(0, safeLimit);
  } catch (error) {
    handlePayloadReadError("products:best-selling", error);
    return loadLocalCatalogFixtures()
      .sort(
        (a, b) =>
          (b.reviewCount || 0) - (a.reviewCount || 0) ||
          (b.viewCount || 0) - (a.viewCount || 0),
      )
      .slice(0, safeLimit);
  }
}

export async function getProductsBySlugsFromPayload(slugs: string[], limit = 8): Promise<CatalogProduct[]> {
  const requested = Array.from(new Set(slugs.map((slug) => slug.trim()).filter(Boolean))).slice(0, limit);
  if (!requested.length) return [];

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: requested.length,
      select: PRODUCT_LIST_SELECT,
      where: {
        and: [
          { slug: { in: requested } },
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });
    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);
    const order = new Map(requested.map((slug, index) => [slug, index]));

    return docs
      .map((doc) =>
        toProductListData(
          doc,
          doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
        ),
      )
      .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  } catch (error) {
    handlePayloadReadError("products:compare-slugs", error);
    const requestedSet = new Set(requested);
    return loadLocalCatalogFixtures().filter((product) => requestedSet.has(product.slug)).slice(0, limit);
  }
}

async function loadProductCategoryNavFromPayload(): Promise<ProductCategoryNavItem[]> {
  const localFallback: ProductCategoryNavItem[] = HPT_DATA.categories.map((category, index) => ({
    name: category.name,
    slug: "",
    icon: category.icon,
    sortOrder: index,
    children: [],
  }));

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "categories",
      depth: 0,
      limit: 200,
      sort: "sortOrder",
    });

    const docs = res.docs as unknown as PayloadCategoryDoc[];
    const categories = docs.map((doc, index) => ({
      id:
        typeof doc.id === "string" || typeof doc.id === "number"
          ? String(doc.id)
          : `category-${index}`,
      name: categoryTextField(doc, "name") || "",
      slug: categoryTextField(doc, "slug") || "",
      icon: categoryTextField(doc, "icon"),
      sortOrder: categoryNumberField(doc, "sortOrder") ?? index,
      parentId: categoryRelationId(doc.parent),
    }));

    const roots = categories
      .filter((category) => !category.parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"));

    const dbNavItems = roots.map((parent) => ({
      name: parent.name,
      slug: parent.slug,
      icon: parent.icon,
      sortOrder: parent.sortOrder,
      children: categories
        .filter((category) => category.parentId === parent.id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi"))
        .map((child) => ({
          name: child.name,
          slug: child.slug,
          sortOrder: child.sortOrder,
        })),
    }));

    const dbByKey = new Map<string, ProductCategoryNavItem>();
    for (const item of dbNavItems) {
      const keys = [normalizeCategoryNavKey(item.slug), normalizeCategoryNavKey(item.name)].filter(Boolean);
      for (const key of keys) {
        dbByKey.set(key, item);
      }
    }

    return HPT_DATA.categories.map((category, index) => {
      const match = dbByKey.get(normalizeCategoryNavKey(category.name));

      if (!match) {
        return {
          name: category.name,
          slug: "",
          icon: category.icon,
          sortOrder: index,
          children: [],
        };
      }

      return {
        name: match.name || category.name,
        slug: match.slug,
        icon: match.icon || category.icon,
        sortOrder: index,
        children: match.children,
      };
    });
  } catch (error) {
    handlePayloadReadError("product-categories-nav", error);
    return localFallback;
  }
}

const getCachedProductCategoryNavFromPayload = unstable_cache(
  loadProductCategoryNavFromPayload,
  ["product-categories-nav"],
  { revalidate: 300, tags: ["categories:list"] },
);

export async function getProductCategoryNavFromPayload(): Promise<ProductCategoryNavItem[]> {
  return getCachedProductCategoryNavFromPayload();
}

async function loadProductListPageFromPayload({
  page = 1,
  limit = DEFAULT_PRODUCT_LIST_LIMIT,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<ProductListPageResult> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.max(1, Math.min(Math.floor(limit) || DEFAULT_PRODUCT_LIST_LIMIT, 60));
  const localProducts = loadLocalCatalogFixtures();

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: safeLimit,
      page: safePage,
      select: PRODUCT_LIST_SELECT,
      sort: "-updatedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);
    const products = docs.map((doc) =>
      toProductCardData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );

    return {
      products,
      page: typeof res.page === "number" ? res.page : safePage,
      limit: safeLimit,
      totalProducts: typeof res.totalDocs === "number" ? res.totalDocs : products.length,
      totalPages: typeof res.totalPages === "number" ? res.totalPages : Math.max(1, Math.ceil(products.length / safeLimit)),
    };
  } catch (error) {
    handlePayloadReadError("product-list-page", error);
    const start = (safePage - 1) * safeLimit;
    const products = localProducts.slice(start, start + safeLimit);

    return {
      products,
      page: safePage,
      limit: safeLimit,
      totalProducts: localProducts.length,
      totalPages: Math.max(1, Math.ceil(localProducts.length / safeLimit)),
    };
  }
}

function cleanCatalogParam(value?: string) {
  return (value || "").trim().slice(0, 160);
}

function safePositiveInt(value: unknown, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), max);
}

function productSearchOrder(sort?: ProductSearchParams["sort"]) {
  if (sort === "price-asc") return "effective_price asc nulls last, p.updated_at desc";
  if (sort === "price-desc") return "effective_price desc nulls last, p.updated_at desc";
  if (sort === "newest") return "p.updated_at desc, p.created_at desc";
  if (sort === "popular") return "p.review_count desc nulls last, p.view_count desc nulls last, p.updated_at desc";
  return "p.review_count desc nulls last, p.updated_at desc, p.created_at desc";
}

function productSearchWhere(params: ProductSearchParams, values: unknown[]) {
  const where = ["p.status = 'published'", "p._status = 'published'"];
  const search = cleanCatalogParam(params.search);
  const category = cleanCatalogParam(params.category);
  const brand = cleanCatalogParam(params.brand);
  const priceMin = Number(cleanCatalogParam(params.priceMin));
  const priceMax = Number(cleanCatalogParam(params.priceMax));

  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    const idx = values.length;
    where.push(`(
      lower(coalesce(p.name, '') || ' ' || coalesce(p.sku, '') || ' ' || coalesce(p.model, '')) like $${idx}
      or lower(coalesce(c.name, '') || ' ' || coalesce(pc.name, '') || ' ' || coalesce(b.name, '')) like $${idx}
    )`);
  }

  if (category) {
    values.push(category);
    where.push(`(c.slug = $${values.length} or pc.slug = $${values.length})`);
  }

  if (brand) {
    values.push(brand);
    const idx = values.length;
    where.push(`(b.name = $${idx} or b.slug = $${idx})`);
  }

  if (Number.isFinite(priceMin) && priceMin > 0) {
    values.push(priceMin);
    where.push(`effective_price >= $${values.length}`);
  }

  if (Number.isFinite(priceMax) && priceMax > 0) {
    values.push(priceMax);
    where.push(`effective_price <= $${values.length}`);
  }

  // --- Bộ lọc chuyên biệt máy scan (dựa trên nhóm scannerSpecs) ---
  const size = cleanCatalogParam(params.size).toUpperCase();
  if (SCANNER_SIZE_VALUES.has(size)) {
    values.push(size);
    where.push(`p.scanner_specs_max_paper_size = $${values.length}`);
  }

  const speedSql = SCANNER_SPEED_SQL[cleanCatalogParam(params.speed).toLowerCase()];
  if (speedSql) {
    where.push(speedSql);
  }

  const featureColumn = SCANNER_FEATURE_COLUMN[cleanCatalogParam(params.feature).toLowerCase()];
  if (featureColumn) {
    where.push(`${featureColumn} = true`);
  }

  // --- Bộ lọc chuyên biệt máy in (dựa trên nhóm printerSpecs) ---
  const funcSql = PRINTER_FUNC_SQL[cleanCatalogParam(params.func).toLowerCase()];
  if (funcSql) {
    where.push(funcSql);
  }

  const pspeedSql = PRINTER_SPEED_SQL[cleanCatalogParam(params.pspeed).toLowerCase()];
  if (pspeedSql) {
    where.push(pspeedSql);
  }

  const pfeatSql = PRINTER_FEATURE_SQL[cleanCatalogParam(params.pfeat).toLowerCase()];
  if (pfeatSql) {
    where.push(pfeatSql);
  }

  // --- Bộ lọc chuyên biệt phần mềm bản quyền (regex trên tên SP) ---
  const licSql = SOFTWARE_LICENSE_SQL[cleanCatalogParam(params.lic).toLowerCase()];
  if (licSql) {
    where.push(licSql);
  }

  const audSql = SOFTWARE_AUDIENCE_SQL[cleanCatalogParam(params.aud).toLowerCase()];
  if (audSql) {
    where.push(audSql);
  }

  // --- Bộ lọc chuyên biệt mực in & phụ kiện (regex trên tên SP + brand) ---
  const fbSql = INK_FB_SQL[cleanCatalogParam(params.fb).toLowerCase()];
  if (fbSql) {
    where.push(fbSql);
  }

  const mauSql = INK_COLOR_SQL[cleanCatalogParam(params.mau).toLowerCase()];
  if (mauSql) {
    where.push(mauSql);
  }

  const origSql = INK_ORIGIN_SQL[cleanCatalogParam(params.orig).toLowerCase()];
  if (origSql) {
    where.push(origSql);
  }

  // --- Bộ lọc chuyên biệt PC đồng bộ / máy chủ (CPU từ tên+spec, RAM từ cột số) ---
  const cpuSql = PC_CPU_SQL[cleanCatalogParam(params.cpu).toLowerCase()];
  if (cpuSql) {
    where.push(cpuSql);
  }

  const ramSql = PC_RAM_SQL[cleanCatalogParam(params.ram).toLowerCase()];
  if (ramSql) {
    where.push(ramSql);
  }

  return where.join(" and ");
}

async function loadProductListFacets(): Promise<ProductListFacets> {
  const pool = getPgPool();
  if (!pool) return { categories: [], brands: [] };

  const [categoriesResult, brandsResult] = await Promise.all([
    pool.query<{ label: string; value: string; count: string }>(`
      select
        coalesce(pc.name, c.name) as label,
        coalesce(pc.slug, c.slug) as value,
        count(*)::text as count,
        min(coalesce(pc.sort_order, c.sort_order)) as sort_order
      from products p
      join categories c on c.id = p.category_id
      left join categories pc on pc.id = c.parent_id
      where p.status = 'published' and p._status = 'published'
      group by coalesce(pc.name, c.name), coalesce(pc.slug, c.slug)
      order by min(coalesce(pc.sort_order, c.sort_order)) asc nulls last, coalesce(pc.name, c.name) asc
    `),
    pool.query<{ label: string; value: string; count: string }>(`
      select b.name as label, b.name as value, count(*)::text as count
      from products p
      join brands b on b.id = p.brand_id
      where p.status = 'published' and p._status = 'published'
      group by b.id, b.name
      order by b.name asc
    `),
  ]);

  return {
    categories: categoriesResult.rows.map((row) => ({
      label: canonicalizeCategoryName(row.label),
      value: row.value,
      count: Number(row.count) || 0,
    })),
    brands: brandsResult.rows.map((row) => ({
      label: row.label,
      value: row.value,
      count: Number(row.count) || 0,
    })),
  };
}

async function loadProductSearchPageFromPayload(params: ProductSearchParams = {}): Promise<ProductListPageResult> {
  const safePage = safePositiveInt(params.page, 1, 10000);
  const safeLimit = safePositiveInt(params.limit, DEFAULT_PRODUCT_LIST_LIMIT, 60);
  const pool = getPgPool();
  const localProducts = loadLocalCatalogFixtures();

  if (!pool) {
    const start = (safePage - 1) * safeLimit;
    const products = localProducts.slice(start, start + safeLimit);
    return {
      products,
      page: safePage,
      limit: safeLimit,
      totalProducts: localProducts.length,
      totalPages: Math.max(1, Math.ceil(localProducts.length / safeLimit)),
      facets: { categories: [], brands: [] },
    };
  }

  const values: unknown[] = [];
  const whereSQL = productSearchWhere(params, values);
  const orderSQL = productSearchOrder(params.sort);
  const offset = (safePage - 1) * safeLimit;
  values.push(safeLimit, offset);
  const limitIndex = values.length - 1;
  const offsetIndex = values.length;

  try {
    const [idsResult, facets] = await Promise.all([
      pool.query<{ id: string | number; total: string }>(
        `
          select p.id, count(*) over()::text as total
          from products p
          left join categories c on c.id = p.category_id
          left join categories pc on pc.id = c.parent_id
          left join brands b on b.id = p.brand_id
          left join lateral (
            select coalesce(o.promotion_price, o.price) as effective_price
            from product_variants v
            left join product_offers o on o.variant_id = v.id
            where v.product_id = p.id
              and (v.is_primary = true or v.status = 'active')
              and (o.sale_status is null or o.sale_status in ('active', 'contact'))
            order by v.is_primary desc nulls last, o.updated_at desc nulls last
            limit 1
          ) pricing on true
          where ${whereSQL}
          order by ${orderSQL}
          limit $${limitIndex} offset $${offsetIndex}
        `,
        values,
      ),
      loadProductListFacets(),
    ]);

    const ids = idsResult.rows.map((row) => row.id);
    const totalProducts = Number(idsResult.rows[0]?.total) || 0;
    if (!ids.length) {
      return {
        products: [],
        page: safePage,
        limit: safeLimit,
        totalProducts,
        totalPages: Math.max(1, Math.ceil(totalProducts / safeLimit)),
        facets,
      };
    }

    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: safeLimit,
      select: PRODUCT_LIST_SELECT,
      where: { id: { in: ids } },
    });

    const order = new Map(ids.map((id, index) => [String(id), index]));
    const docs = (res.docs as unknown as PayloadProductDoc[]).sort(
      (a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0),
    );
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);
    const products = docs.map((doc) =>
      toProductListData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );

    return {
      products,
      page: safePage,
      limit: safeLimit,
      totalProducts,
      totalPages: Math.max(1, Math.ceil(totalProducts / safeLimit)),
      facets,
    };
  } catch (error) {
    handlePayloadReadError("product-search-page", error);
    const start = (safePage - 1) * safeLimit;
    const products = localProducts.slice(start, start + safeLimit);
    return {
      products,
      page: safePage,
      limit: safeLimit,
      totalProducts: localProducts.length,
      totalPages: Math.max(1, Math.ceil(localProducts.length / safeLimit)),
      facets: { categories: [], brands: [] },
    };
  }
}

const getCachedProductListPageFromPayload = unstable_cache(
  (page?: number, limit?: number) => loadProductListPageFromPayload({ page, limit }),
  ["product-list-page"],
  { revalidate: 300, tags: ["products:list"] },
);

const getCachedProductSearchPageFromPayload = unstable_cache(
  (
    page?: number,
    limit?: number,
    search?: string,
    category?: string,
    brand?: string,
    sort?: ProductSearchParams["sort"],
    priceMin?: string,
    priceMax?: string,
    size?: string,
    speed?: string,
    feature?: string,
    func?: string,
    pspeed?: string,
    pfeat?: string,
    lic?: string,
    aud?: string,
    fb?: string,
    mau?: string,
    orig?: string,
    cpu?: string,
    ram?: string,
  ) =>
    loadProductSearchPageFromPayload({
      page,
      limit,
      search,
      category,
      brand,
      sort,
      priceMin,
      priceMax,
      size,
      speed,
      feature,
      func,
      pspeed,
      pfeat,
      lic,
      aud,
      fb,
      mau,
      orig,
      cpu,
      ram,
    }),
  ["product-search-page"],
  { revalidate: 300, tags: ["products:list"] },
);

export async function getProductListPageFromPayload({
  page = 1,
  limit = DEFAULT_PRODUCT_LIST_LIMIT,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<ProductListPageResult> {
  return getCachedProductListPageFromPayload(page, limit);
}

export async function getProductSearchPageFromPayload({
  page = 1,
  limit = DEFAULT_PRODUCT_LIST_LIMIT,
  search = "",
  category = "",
  brand = "",
  sort = "best",
  priceMin = "",
  priceMax = "",
  size = "",
  speed = "",
  feature = "",
  func = "",
  pspeed = "",
  pfeat = "",
  lic = "",
  aud = "",
  fb = "",
  mau = "",
  orig = "",
  cpu = "",
  ram = "",
}: ProductSearchParams = {}): Promise<ProductListPageResult> {
  return getCachedProductSearchPageFromPayload(
    page,
    limit,
    search,
    category,
    brand,
    sort,
    priceMin,
    priceMax,
    size,
    speed,
    feature,
    func,
    pspeed,
    pfeat,
    lic,
    aud,
    fb,
    mau,
    orig,
    cpu,
    ram,
  );
}

async function loadRelatedProductsFromPayload({
  field,
  value,
  excludeSlug,
  limit,
  readLabel,
}: {
  field: "category" | "brand";
  value: string;
  excludeSlug: string;
  limit: number;
  readLabel: string;
}): Promise<CatalogProduct[]> {
  if (!value) return [];

  try {
    const payload = await getPayloadClient();

    // Payload PostgreSQL adapter does not support filtering by relation field name
    // directly (e.g. "category.name"). We need to resolve the relation ID first.
    const collection = field === "category" ? "categories" : "brands";
    const relRes = await payload.find({
      collection: collection as never,
      depth: 0,
      limit: 1,
      where: { name: { equals: value } },
    });
    let relId = (relRes.docs[0] as { id?: string | number } | undefined)?.id;
    if (!relId && field === "category") {
      const targetName = canonicalizeCategoryName(value);
      const categoryRes = await payload.find({
        collection: "categories" as never,
        depth: 0,
        limit: 1000,
      });
      const categoryMatch = (categoryRes.docs as PayloadCategoryDoc[]).find((category) => {
        const name = categoryTextField(category, "name");
        return name && canonicalizeCategoryName(name) === targetName;
      });
      relId = (categoryMatch as { id?: string | number } | undefined)?.id;
    }
    if (!relId) return [];

    const res = await payload.find({
      collection: "products",
      depth: 1,
      limit: Math.max(1, Math.min(limit, 24)),
      select: PRODUCT_LIST_SELECT,
      sort: "-updatedAt",
      where: {
        and: [
          { slug: { not_in: [excludeSlug] } },
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
          { [field]: { equals: relId } },
        ],
      },
    });

    const docs = res.docs as unknown as PayloadProductDoc[];
    const productIDs = docs
      .map((doc) => doc.id)
      .filter((id): id is string | number => typeof id === "string" || typeof id === "number");
    const projections = await loadCanonicalCommercialProjections(payload, productIDs);

    return docs.map((doc) =>
      toProductCardData(
        doc,
        doc.id !== undefined ? projections.get(String(doc.id)) : undefined,
      ),
    );
  } catch (error) {
    handlePayloadReadError(readLabel, error);
    return loadLocalCatalogFixtures()
      .filter((product) => product.slug !== excludeSlug && product[field] === value)
      .slice(0, limit);
  }
}

const getCachedRelatedProductsFromPayload = unstable_cache(
  loadRelatedProductsFromPayload,
  ["related-products"],
  { revalidate: 300, tags: ["products:list"] },
);

export function getProductsByCategoryFromPayload(
  categoryName: string,
  excludeSlug: string,
  limit = 8,
): Promise<CatalogProduct[]> {
  return getCachedRelatedProductsFromPayload({
    field: "category",
    value: categoryName,
    excludeSlug,
    limit,
    readLabel: `products:category:${categoryName}`,
  });
}

export function getProductsByBrandFromPayload(
  brandName: string,
  excludeSlug: string,
  limit = 8,
): Promise<CatalogProduct[]> {
  return getCachedRelatedProductsFromPayload({
    field: "brand",
    value: brandName,
    excludeSlug,
    limit,
    readLabel: `products:brand:${brandName}`,
  });
}

function productStaticParamsLimit() {
  const configured = Number(process.env.PRODUCT_STATIC_PARAMS_LIMIT);
  if (Number.isFinite(configured) && configured > 0) return Math.floor(configured);
  return 50;
}

export async function getPublishedProductSlugs(limit = productStaticParamsLimit()): Promise<string[]> {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 0,
      limit: Math.max(1, Math.min(limit, 1000)),
      sort: "-updatedAt",
      select: { slug: true },
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    return (res.docs as Array<{ slug?: string }>)
      .map((doc) => doc.slug)
      .filter((slug): slug is string => Boolean(slug));
  } catch (error) {
    handlePayloadReadError("product-slugs", error);
    return loadLocalCatalogFixtures().map((product) => product.slug).filter(Boolean).slice(0, limit);
  }
}

export async function getPublishedProductSitemapCount(): Promise<number> {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 0,
      limit: 1,
      select: { slug: true },
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    return res.totalDocs;
  } catch (error) {
    handlePayloadReadError("product-sitemap-count", error);
    return loadLocalCatalogFixtures().filter((product) => product.slug).length;
  }
}

export async function getPublishedProductSitemapEntries({
  page = 1,
  limit = 5000,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<Array<{ slug: string; updatedAt?: string }>> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.max(1, Math.min(Math.floor(limit) || 5000, 5000));

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 0,
      limit: safeLimit,
      page: safePage,
      select: { slug: true, updatedAt: true },
      sort: "-updatedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });

    return (res.docs as Array<{ slug?: string; updatedAt?: string }>)
      .map((doc) => ({ slug: doc.slug || "", updatedAt: doc.updatedAt }))
      .filter((entry) => entry.slug);
  } catch (error) {
    handlePayloadReadError("product-sitemap", error);
    return loadLocalCatalogFixtures()
      .filter((product) => product.slug)
      .slice((safePage - 1) * safeLimit, safePage * safeLimit)
      .map((product) => ({ slug: product.slug }));
  }
}

async function loadProductBySlugFromPayload(slug: string): Promise<CatalogProduct | null> {
  const localProduct = loadLocalCatalogFixtures().find((product) => product.slug === slug) || null;
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "products",
      depth: 2,
      limit: 1,
      where: {
        and: [
          { slug: { equals: slug } },
          { status: { equals: "published" } },
          { _status: { equals: "published" } },
        ],
      },
    });
    const doc = res.docs[0] as unknown as PayloadProductDoc | undefined;
    if (!doc) return localProduct;
    const id = doc.id;
    const relatedIDs = Array.isArray(doc.relatedProducts)
      ? doc.relatedProducts
          .map((related) =>
            related && typeof related === "object" && "id" in related
              ? related.id
              : undefined,
          )
          .filter(
            (relatedID): relatedID is string | number =>
              typeof relatedID === "string" || typeof relatedID === "number",
          )
      : [];
    const projectionIDs =
      typeof id === "string" || typeof id === "number" ? [id, ...relatedIDs] : relatedIDs;
    const projections = await loadCanonicalCommercialProjections(
      payload,
      projectionIDs,
    );
    const product = normalizeProduct(
      doc,
      true,
      id !== undefined ? projections.get(String(id)) : undefined,
      projections,
    );
    if (typeof id === "string" || typeof id === "number") {
      const raw = await loadRawProductHTML(id);
      product.description = raw.descriptionHTML || product.description;
      product.detail =
        raw.shortDescription ||
        stripHTML(raw.summaryHTML) ||
        product.detail;
    }
    return product;
  } catch (error) {
    handlePayloadReadError(`products:${slug}`, error);
    return localProduct;
  }
}

export async function getProductBySlugFromPayload(slug: string): Promise<CatalogProduct | null> {
  const getCachedProductBySlug = unstable_cache(
    () => loadProductBySlugFromPayload(slug),
    ["product-by-slug", slug],
    { revalidate: 300, tags: [`product:${slug}`] },
  );
  return getCachedProductBySlug();
}
