import fs from "node:fs";
import path from "node:path";
import { unstable_cache } from "next/cache";
import type { Where } from "payload";
import { Pool } from "pg";
import { HPT_DATA } from "@/lib/data";
import { defaultAboutPage } from "@/globals/AboutPage";
import { getPayloadClient } from "@/lib/payload";
import { handlePayloadReadError } from "@/lib/payload-read-policy";

export type PublicBanner = {
  image: string;
  title?: string;
  subtitle?: string;
  link?: string;
};

export type PublicSolution = {
  title: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
};

export type PublicEnterpriseService = {
  title: string;
  slug: string;
  summary: string;
  icon: string;
  image?: PublicAboutImage;
  content?: unknown;
};

export type PublicEnterpriseSupportPage = {
  heroImages: PublicAboutImage[];
};

export type PublicPost = {
  title: string;
  slug: string;
  fullPath?: string;
  image?: string;
  date?: string;
  publishedAt?: string;
  href?: string;
  summary?: string;
  viewCount?: number;
  category?: PublicPostCategory;
  tags?: PublicPostTag[];
  postType?: string;
  featured?: boolean;
  content?: unknown;
};

export type PublicPostsPage = {
  posts: PublicPost[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PublicPostCategory = {
  id?: string;
  name: string;
  slug: string;
  fullTitle?: string;
  fullSlug?: string;
  description?: string;
  image?: string;
  parent?: string;
};

export type PublicPostTag = {
  name: string;
  slug: string;
  description?: string;
};

export type PublicProject = {
  title: string;
  slug: string;
  category?: PublicProjectCategory;
  client?: string;
  industry?: string;
  completedAt?: string;
  summary?: string;
  image?: string;
  content?: unknown;
  gallery?: PublicAboutImage[];
  products?: Array<{
    title: string;
    slug: string;
    image?: string;
  }>;
};

export type PublicProjectCategory = {
  id?: string;
  name: string;
  slug: string;
  description?: string;
};

export type PublicFAQ = {
  question: string;
  category?: string;
};

export type PublicStaticPage = {
  title: string;
  slug: string;
  eyebrow?: string;
  summary?: string;
};

export type PublicSiteSettings = {
  companyName?: string;
  phone?: string;
  hotline?: string;
  email?: string;
  address?: string;
  facebook?: string;
  zalo?: string;
  youtube?: string;
  googleMapsTitle?: string;
  googleMapsEmbedUrl?: string;
  googleMapsDirectionsUrl?: string;
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  footerNote?: string;
};

export type PublicAboutImage = {
  url?: string;
  alt?: string;
};

export type PublicAboutLink = {
  label?: string;
  href?: string;
};

type LocalContentFixtures = {
  posts: PublicPost[];
  projects: PublicProject[];
};

function loadLocalContentFixtures(): LocalContentFixtures {
  const fixturePath = process.env.LOCAL_CONTENT_FIXTURE_PATH;
  if (process.env.NODE_ENV === "production" || !fixturePath) {
    return { posts: [], projects: [] };
  }

  try {
    const absolutePath = path.resolve(process.cwd(), fixturePath);
    const parsed = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as Partial<LocalContentFixtures>;
    const posts = Array.isArray(parsed.posts)
      ? parsed.posts.filter(
          (post): post is PublicPost =>
            Boolean(post && typeof post.title === "string" && typeof post.slug === "string"),
        )
      : [];
    const projects = Array.isArray(parsed.projects)
      ? parsed.projects.filter(
          (project): project is PublicProject =>
            Boolean(project && typeof project.title === "string" && typeof project.slug === "string"),
        )
      : [];

    return { posts, projects };
  } catch (error) {
    console.warn(`[content] Cannot load local fixture from ${fixturePath}.`, error);
    return { posts: [], projects: [] };
  }
}

function mergeLocalBySlug<T extends { slug: string }>(remote: T[], local: T[]) {
  const remoteSlugs = new Set(remote.map((item) => item.slug));
  return [...local.filter((item) => !remoteSlugs.has(item.slug)), ...remote];
}

export type PublicAboutHero = {
  title: string;
  description: string;
  backgroundImage?: PublicAboutImage;
  primaryCta?: PublicAboutLink;
  secondaryCta?: PublicAboutLink;
};

export type PublicAboutStat = {
  value: string;
  label: string;
  description?: string;
};

export type PublicAboutSections = {
  capabilitiesEyebrow: string;
  capabilitiesTitle: string;
  capabilitiesDescription: string;
  processEyebrow: string;
  processTitle: string;
  processDescription: string;
  partnersEyebrow: string;
  partnersTitle: string;
  partnersDescription: string;
  advantagesEyebrow: string;
  advantagesTitle: string;
  advantagesDescription: string;
  caseStudiesEyebrow: string;
  caseStudiesTitle: string;
  caseStudiesDescription: string;
};

export type PublicAboutCapability = {
  title: string;
  description?: string;
  image?: PublicAboutImage;
  items: string[];
};

export type PublicAboutProcessStep = {
  title: string;
  description?: string;
};

export type PublicAboutPartner = {
  name: string;
  logo?: PublicAboutImage;
  url?: string;
};

export type PublicAboutAdvantage = {
  title: string;
  description?: string;
};

export type PublicAboutCaseStudy = {
  segment: string;
  title: string;
  summary?: string;
  image?: PublicAboutImage;
};

export type PublicAboutCTA = {
  title: string;
  description?: string;
  primaryCta?: PublicAboutLink;
  secondaryCta?: PublicAboutLink;
};

export type PublicAboutPage = {
  hero: PublicAboutHero;
  stats: PublicAboutStat[];
  sections: PublicAboutSections;
  capabilities: PublicAboutCapability[];
  process: PublicAboutProcessStep[];
  partners: PublicAboutPartner[];
  advantages: PublicAboutAdvantage[];
  caseStudies: PublicAboutCaseStudy[];
  cta: PublicAboutCTA;
};

type PayloadDoc = Record<string, unknown>;
type PayloadFindResult = {
  docs: PayloadDoc[];
};

export type PublicSitemapEntry = {
  slug?: string;
  fullPath?: string;
  updatedAt?: string;
};

const PUBLIC_NEWS_POST_TYPES = ["news", "guide", "case-study", "announcement"] as const;

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

const HERO_BANNER_DIR = path.join(process.cwd(), "public", "assets", "herobanner");
const HERO_BANNER_PUBLIC_PATH = "/assets/herobanner";
const HERO_BANNER_EXTENSIONS = new Set([".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"]);

function getLocalHeroBanners(): PublicBanner[] {
  try {
    return fs
      .readdirSync(HERO_BANNER_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && HERO_BANNER_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true }))
      .map((entry) => ({
        image: `${HERO_BANNER_PUBLIC_PATH}/${encodeURIComponent(entry.name)}`,
        link: "/",
        title: path.basename(entry.name, path.extname(entry.name)),
      }));
  } catch {
    return [];
  }
}
type PublicCollectionSlug =
  | "banners"
  | "solutions"
  | "enterprise-services"
  | "posts"
  | "project-categories"
  | "post-categories"
  | "post-tags"
  | "news-redirects"
  | "projects"
  | "faq"
  | "static-pages";

function textField(doc: PayloadDoc, key: string) {
  const value = doc[key];
  return typeof value === "string" ? value : undefined;
}

function numberField(doc: PayloadDoc, key: string) {
  const value = doc[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function mediaURL(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  if ("url" in value && typeof value.url === "string") return value.url;
  return undefined;
}

function mediaImage(value: unknown): PublicAboutImage | undefined {
  const url = mediaURL(value);
  if (!url || !value || typeof value !== "object") return undefined;
  const alt =
    "alt" in value && typeof value.alt === "string"
      ? value.alt
      : "filename" in value && typeof value.filename === "string"
        ? value.filename
        : undefined;
  return { url, alt };
}

function objectField(doc: PayloadDoc, key: string): PayloadDoc {
  const value = doc[key];
  return value && typeof value === "object" && !Array.isArray(value) ? (value as PayloadDoc) : {};
}

function relationDoc(value: unknown): PayloadDoc | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as PayloadDoc) : undefined;
}

function docID(doc: PayloadDoc) {
  const id = doc.id;
  return typeof id === "string" || typeof id === "number" ? String(id) : undefined;
}

function postCategory(doc: unknown): PublicPostCategory | undefined {
  const category = relationDoc(doc);
  if (!category) return undefined;
  return {
    id: docID(category),
    name: textField(category, "name") || "",
    slug: textField(category, "slug") || "",
    fullTitle: textField(category, "fullTitle"),
    fullSlug: textField(category, "fullSlug"),
    description: textField(category, "description"),
    image: mediaURL(category.coverImage),
    parent:
      typeof category.parent === "string" || typeof category.parent === "number"
        ? String(category.parent)
        : docID(objectField(category, "parent")),
  };
}

function postTags(value: unknown): PublicPostTag[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const tag = relationDoc(item);
    if (!tag) return [];
    return [
      {
        name: textField(tag, "name") || "",
        slug: textField(tag, "slug") || "",
        description: textField(tag, "description"),
      },
    ];
  });
}

function normalizeNewsPath(value: string) {
  return value.replace(/^\/+|\/+$/g, "").replace(/^tin-tuc\/?/, "");
}

function mapPost(doc: PayloadDoc): PublicPost {
  const slugValue = textField(doc, "slug") || "";
  const fullPath = textField(doc, "fullPath") || slugValue;

  return {
    title: textField(doc, "title") || "",
    slug: slugValue,
    fullPath,
    image: mediaURL(doc.thumbnail),
    date: formatDate(doc.publishedAt),
    publishedAt: textField(doc, "publishedAt"),
    href: `/tin-tuc/${fullPath}`,
    summary: textField(doc, "summary"),
    viewCount: numberField(doc, "viewCount"),
    category: postCategory(doc.category),
    tags: postTags(doc.tags),
    postType: textField(doc, "postType"),
    featured: doc.featured === true,
  };
}

function mapPostDetail(doc: PayloadDoc): PublicPost {
  return {
    ...mapPost(doc),
    content: doc.content,
  };
}

function arrayField(doc: PayloadDoc, key: string): PayloadDoc[] {
  const value = doc[key];
  return Array.isArray(value) ? value.filter((item): item is PayloadDoc => Boolean(item) && typeof item === "object") : [];
}

function aboutLink(doc: PayloadDoc, labelKey: string, hrefKey: string): PublicAboutLink | undefined {
  const label = textField(doc, labelKey);
  const href = textField(doc, hrefKey);
  if (!label || !href) return undefined;
  return { label, href };
}

function normalizeAboutPage(doc: PayloadDoc | null | undefined): PublicAboutPage {
  const source = doc || {};
  const hero = { ...defaultAboutPage.hero, ...objectField(source, "hero") } as PayloadDoc;
  const cta = { ...defaultAboutPage.cta, ...objectField(source, "cta") } as PayloadDoc;
  const sections = { ...defaultAboutPage.sections, ...objectField(source, "sections") } as PayloadDoc;
  const statsSource = arrayField(source, "stats");
  const capabilitiesSource = arrayField(source, "capabilities");
  const processSource = arrayField(source, "process");
  const partnersSource = arrayField(source, "partners");
  const advantagesSource = arrayField(source, "advantages");
  const caseStudiesSource = arrayField(source, "caseStudies");

  return {
    hero: {
      title: textField(hero, "title") || defaultAboutPage.hero.title,
      description: textField(hero, "description") || defaultAboutPage.hero.description,
      backgroundImage: mediaImage(hero["backgroundImage"]),
      primaryCta: aboutLink(hero, "primaryCtaLabel", "primaryCtaHref"),
      secondaryCta: aboutLink(hero, "secondaryCtaLabel", "secondaryCtaHref"),
    },
    stats: (statsSource.length ? statsSource : defaultAboutPage.stats).map((item, index) => {
      const fallback = defaultAboutPage.stats[index] || defaultAboutPage.stats[0];
      return {
        value: textField(item, "value") || fallback.value,
        label: textField(item, "label") || fallback.label,
        description: textField(item, "description") || fallback.description,
      };
    }),
    sections: {
      capabilitiesEyebrow: textField(sections, "capabilitiesEyebrow") || defaultAboutPage.sections.capabilitiesEyebrow,
      capabilitiesTitle: textField(sections, "capabilitiesTitle") || defaultAboutPage.sections.capabilitiesTitle,
      capabilitiesDescription:
        textField(sections, "capabilitiesDescription") || defaultAboutPage.sections.capabilitiesDescription,
      processEyebrow: textField(sections, "processEyebrow") || defaultAboutPage.sections.processEyebrow,
      processTitle: textField(sections, "processTitle") || defaultAboutPage.sections.processTitle,
      processDescription: textField(sections, "processDescription") || defaultAboutPage.sections.processDescription,
      partnersEyebrow: textField(sections, "partnersEyebrow") || defaultAboutPage.sections.partnersEyebrow,
      partnersTitle: textField(sections, "partnersTitle") || defaultAboutPage.sections.partnersTitle,
      partnersDescription: textField(sections, "partnersDescription") || defaultAboutPage.sections.partnersDescription,
      advantagesEyebrow: textField(sections, "advantagesEyebrow") || defaultAboutPage.sections.advantagesEyebrow,
      advantagesTitle: textField(sections, "advantagesTitle") || defaultAboutPage.sections.advantagesTitle,
      advantagesDescription:
        textField(sections, "advantagesDescription") || defaultAboutPage.sections.advantagesDescription,
      caseStudiesEyebrow: textField(sections, "caseStudiesEyebrow") || defaultAboutPage.sections.caseStudiesEyebrow,
      caseStudiesTitle: textField(sections, "caseStudiesTitle") || defaultAboutPage.sections.caseStudiesTitle,
      caseStudiesDescription:
        textField(sections, "caseStudiesDescription") || defaultAboutPage.sections.caseStudiesDescription,
    },
    capabilities: (capabilitiesSource.length ? capabilitiesSource : defaultAboutPage.capabilities).map((item, index) => {
      const itemDoc = item as PayloadDoc;
      const fallback = defaultAboutPage.capabilities[index] || defaultAboutPage.capabilities[0];
      const items = arrayField(itemDoc, "items").map((entry) => textField(entry, "label")).filter(Boolean) as string[];
      return {
        title: textField(itemDoc, "title") || fallback.title,
        description: textField(itemDoc, "description") || fallback.description,
        image: mediaImage(itemDoc["image"]),
        items: items.length ? items : fallback.items.map((entry) => entry.label),
      };
    }),
    process: (processSource.length ? processSource : defaultAboutPage.process).map((item, index) => {
      const fallback = defaultAboutPage.process[index] || defaultAboutPage.process[0];
      return {
        title: textField(item, "title") || fallback.title,
        description: textField(item, "description") || fallback.description,
      };
    }),
    partners: (partnersSource.length ? partnersSource : defaultAboutPage.partners).map((item, index) => {
      const itemDoc = item as PayloadDoc;
      const fallback = defaultAboutPage.partners[index] || defaultAboutPage.partners[0];
      return {
        name: textField(itemDoc, "name") || fallback.name,
        logo: mediaImage(itemDoc["logo"]),
        url: textField(itemDoc, "url"),
      };
    }),
    advantages: (advantagesSource.length ? advantagesSource : defaultAboutPage.advantages).map((item, index) => {
      const fallback = defaultAboutPage.advantages[index] || defaultAboutPage.advantages[0];
      return {
        title: textField(item, "title") || fallback.title,
        description: textField(item, "description") || fallback.description,
      };
    }),
    caseStudies: (caseStudiesSource.length ? caseStudiesSource : defaultAboutPage.caseStudies).map((item, index) => {
      const itemDoc = item as PayloadDoc;
      const fallback = defaultAboutPage.caseStudies[index] || defaultAboutPage.caseStudies[0];
      return {
        segment: textField(itemDoc, "segment") || fallback.segment,
        title: textField(itemDoc, "title") || fallback.title,
        summary: textField(itemDoc, "summary") || fallback.summary,
        image: mediaImage(itemDoc["image"]),
      };
    }),
    cta: {
      title: textField(cta, "title") || defaultAboutPage.cta.title,
      description: textField(cta, "description") || defaultAboutPage.cta.description,
      primaryCta: aboutLink(cta, "primaryCtaLabel", "primaryCtaHref"),
      secondaryCta: aboutLink(cta, "secondaryCtaLabel", "secondaryCtaHref"),
    },
  };
}

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) return undefined;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

async function findDocs(collection: PublicCollectionSlug, options: Record<string, unknown> = {}): Promise<PayloadFindResult> {
  try {
    const payload = await getPayloadClient();
    return (await payload.find({
      collection,
      depth: 2,
      limit: 1000,
      ...options,
    })) as unknown as PayloadFindResult;
  } catch (error) {
    handlePayloadReadError(collection, error);
    return { docs: [] };
  }
}

async function loadBannersFromPayload(): Promise<PublicBanner[]> {
  const res = await findDocs("banners", {
    sort: "sortOrder",
    where: { active: { equals: true } },
  });
  const banners = res.docs
    .flatMap((doc) => {
      const image = mediaURL(doc.image);
      if (!image) return [];
      return [{ image, title: textField(doc, "title"), subtitle: textField(doc, "subtitle"), link: textField(doc, "link") }];
    });

  if (banners.length) return banners;

  const localBanners = getLocalHeroBanners();
  return localBanners.length
    ? localBanners
    : HPT_DATA.banners.map((image) => ({ image, link: "/" }));
}

export const getBannersFromPayload = unstable_cache(
  loadBannersFromPayload,
  ["banners"],
  { revalidate: 300, tags: ["banners"] },
);

async function loadSolutionsFromPayload(): Promise<PublicSolution[]> {
  const res = await findDocs("solutions", { sort: "sortOrder" });
  const solutions = res.docs.map((doc) => ({
    title: textField(doc, "name") || "",
    slug: textField(doc, "slug"),
    description: textField(doc, "summary"),
    icon: textField(doc, "icon"),
    image: mediaURL(doc.image),
  }));

  return solutions.length
    ? solutions
    : HPT_DATA.solutions.map((solution) => ({
        title: solution.title,
        description: solution.description,
        icon: solution.icon,
      }));
}

export const getSolutionsFromPayload = unstable_cache(
  loadSolutionsFromPayload,
  ["solutions"],
  { revalidate: 300, tags: ["solutions"] },
);

const defaultEnterpriseServices: PublicEnterpriseService[] = [
  {
    title: "Giải pháp số hóa tài liệu",
    slug: "giai-phap-so-hoa-tai-lieu",
    summary: "Tư vấn thiết bị, lưu trữ và quản lý tài liệu theo nhu cầu thực tế.",
    icon: "scan",
  },
  {
    title: "Giải pháp OCR và tự động hóa",
    slug: "giai-phap-ocr-va-tu-dong-hoa",
    summary: "Ứng dụng công nghệ nhận dạng để hỗ trợ trích xuất và xử lý dữ liệu.",
    icon: "file",
  },
  {
    title: "Hạ tầng mạng doanh nghiệp",
    slug: "ha-tang-mang-doanh-nghiep",
    summary: "Thiết kế, cung cấp và triển khai mạng LAN, WAN, Wi-Fi và thiết bị liên quan.",
    icon: "network",
  },
  {
    title: "Camera giám sát và hội nghị",
    slug: "camera-giam-sat-va-hoi-nghi",
    summary: "Cung cấp hệ thống giám sát, họp trực tuyến và kết nối nhiều địa điểm.",
    icon: "camera",
  },
  {
    title: "Bảo trì hệ thống CNTT",
    slug: "bao-tri-he-thong-cntt",
    summary: "Khảo sát và thực hiện bảo trì theo phạm vi công việc đã thống nhất.",
    icon: "wrench",
  },
  {
    title: "Triển khai hệ thống CNTT",
    slug: "trien-khai-he-thong-cntt",
    summary: "Tư vấn, lắp đặt và cấu hình hệ thống theo mục tiêu của doanh nghiệp.",
    icon: "building",
  },
  {
    title: "Thiết bị cho trường học",
    slug: "thiet-bi-cho-truong-hoc",
    summary: "Cung cấp thiết bị CNTT theo số lượng, ngân sách và môi trường sử dụng.",
    icon: "school",
  },
  {
    title: "Máy chủ và lưu trữ",
    slug: "may-chu-va-luu-tru",
    summary: "Xây dựng cấu hình máy chủ, lưu trữ và phương án mở rộng phù hợp.",
    icon: "server",
  },
];

function mapEnterpriseService(doc: PayloadDoc): PublicEnterpriseService {
  return {
    title: textField(doc, "title") || "",
    slug: textField(doc, "slug") || "",
    summary: textField(doc, "summary") || "",
    icon: textField(doc, "icon") || "building",
    image: mediaImage(doc.image),
    content: doc.content,
  };
}

async function loadEnterpriseServicesFromPayload(): Promise<PublicEnterpriseService[]> {
  const res = await findDocs("enterprise-services", {
    sort: "sortOrder",
    where: { status: { equals: "published" } },
  });
  const services = res.docs.map(mapEnterpriseService).filter((service) => service.slug);
  return services.length ? services : defaultEnterpriseServices;
}

export const getEnterpriseServicesFromPayload = unstable_cache(
  loadEnterpriseServicesFromPayload,
  ["enterprise-services"],
  { revalidate: 300, tags: ["enterprise-services"] },
);

export async function getEnterpriseServiceBySlugFromPayload(
  slug: string,
): Promise<PublicEnterpriseService | null> {
  const res = await findDocs("enterprise-services", {
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
  });
  const doc = res.docs[0];
  if (doc) return mapEnterpriseService(doc);
  return defaultEnterpriseServices.find((service) => service.slug === slug) || null;
}

export async function getEnterpriseSupportPageFromPayload(): Promise<PublicEnterpriseSupportPage> {
  try {
    const payload = await getPayloadClient();
    const page = (await payload.findGlobal({
      slug: "enterprise-support-page",
      depth: 2,
    })) as PayloadDoc;
    return {
      heroImages: arrayField(page, "heroImages").flatMap((item) => {
        const image = mediaImage(item.image);
        if (!image) return [];
        return [{ ...image, alt: textField(item, "alt") || image.alt }];
      }),
    };
  } catch (error) {
    handlePayloadReadError("enterprise-support-page", error);
    return { heroImages: [] };
  }
}

async function loadPostsFromPayload(): Promise<PublicPost[]> {
  const res = await findDocs("posts", {
    sort: "-publishedAt",
    where: { status: { equals: "published" } },
  });

  return mergeLocalBySlug(res.docs.map(mapPost), loadLocalContentFixtures().posts);
}

export type GetPostsPageOptions = {
  page?: number;
  limit?: number;
  type?: string;
  q?: string;
  sort?: "newest" | "oldest";
};

const PUBLIC_POST_CARD_SELECT = {
  title: true,
  slug: true,
  fullPath: true,
  thumbnail: true,
  publishedAt: true,
  summary: true,
  viewCount: true,
  category: true,
  tags: true,
  postType: true,
  featured: true,
} as const;

function clampPositiveInteger(value: unknown, fallback: number, max = 100) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(Math.floor(number), max);
}

function sortPostsForPage(posts: PublicPost[], sort: "newest" | "oldest") {
  return [...posts].sort((a, b) => {
    const left = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const right = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return sort === "oldest" ? left - right : right - left;
  });
}

function filterLocalPostsForPage(posts: PublicPost[], options: Required<Pick<GetPostsPageOptions, "sort">> & GetPostsPageOptions) {
  const query = options.q?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return sortPostsForPage(
    posts
      .filter((post) => post.postType !== "recruitment")
      .filter((post) => !options.type || post.postType === options.type)
      .filter((post) => {
        if (!query) return true;
        const value = `${post.title} ${post.summary || ""}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        return value.includes(query);
      }),
    options.sort,
  );
}

export async function getPostsPageFromPayload(options: GetPostsPageOptions = {}): Promise<PublicPostsPage> {
  const page = clampPositiveInteger(options.page, 1, 100000);
  const limit = clampPositiveInteger(options.limit, 12, 48);
  const sort = options.sort === "oldest" ? "oldest" : "newest";
  const q = options.q?.trim();
  const where: Where[] = [
    { status: { equals: "published" } },
    { postType: { in: [...PUBLIC_NEWS_POST_TYPES] } },
  ];

  if (options.type) {
    where.push({ postType: { equals: options.type } });
  }

  if (q) {
    where.push({
      or: [
        { title: { like: q } },
        { summary: { like: q } },
      ],
    });
  }

  try {
    const payload = await getPayloadClient();
    const pool = q ? getPgPool() : undefined;

    if (q && pool) {
      const values: unknown[] = [[...PUBLIC_NEWS_POST_TYPES]];
      const sqlWhere = ["status = 'published'", "post_type = any($1)"];

      if (options.type) {
        values.push(options.type);
        sqlWhere.push(`post_type = $${values.length}`);
      }

      values.push(`%${q.toLowerCase()}%`);
      sqlWhere.push(`lower(coalesce(title, '') || ' ' || coalesce(summary, '')) like $${values.length}`);

      const offset = (page - 1) * limit;
      values.push(limit, offset);
      const limitIndex = values.length - 1;
      const offsetIndex = values.length;
      const idsResult = await pool.query<{ id: string | number; total: string }>(
        `
          select id, count(*) over()::text as total
          from posts
          where ${sqlWhere.join(" and ")}
          order by ${sort === "oldest" ? "published_at asc" : "published_at desc"} nulls last, id asc
          limit $${limitIndex} offset $${offsetIndex}
        `,
        values,
      );
      const ids = idsResult.rows.map((row) => row.id);
      const totalDocs = Number(idsResult.rows[0]?.total) || 0;
      const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

      if (!ids.length) {
        return {
          posts: [],
          totalDocs,
          totalPages,
          page: Math.min(page, totalPages),
          limit,
          hasNextPage: false,
          hasPrevPage: page > 1,
        };
      }

      const res = await payload.find({
        collection: "posts",
        depth: 2,
        limit,
        select: PUBLIC_POST_CARD_SELECT,
        where: { id: { in: ids } },
      });
      const order = new Map(ids.map((id, index) => [String(id), index]));
      const posts = (res.docs as PayloadDoc[])
        .sort((a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0))
        .map(mapPost);

      return {
        posts,
        totalDocs,
        totalPages,
        page: Math.min(page, totalPages),
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    }

    const res = await payload.find({
      collection: "posts",
      depth: 2,
      limit,
      page,
      select: PUBLIC_POST_CARD_SELECT,
      sort: sort === "oldest" ? "publishedAt" : "-publishedAt",
      where: { and: where },
    });

    const localPosts = filterLocalPostsForPage(loadLocalContentFixtures().posts, { ...options, sort });
    const localStart = (page - 1) * limit;
    const localPage = localPosts.slice(localStart, localStart + limit);
    const mergedPosts = mergeLocalBySlug(res.docs.map((doc) => mapPost(doc as PayloadDoc)), localPage).slice(0, limit);
    const totalDocs = res.totalDocs + localPosts.length;
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

    return {
      posts: mergedPosts,
      totalDocs,
      totalPages,
      page: Math.min(page, totalPages),
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  } catch (error) {
    handlePayloadReadError("posts", error);
    const localPosts = filterLocalPostsForPage(loadLocalContentFixtures().posts, { ...options, sort });
    const totalDocs = localPosts.length;
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
    const safePage = Math.min(page, totalPages);
    return {
      posts: localPosts.slice((safePage - 1) * limit, safePage * limit),
      totalDocs,
      totalPages,
      page: safePage,
      limit,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  }
}

function projectCategory(doc: unknown): PublicProjectCategory | undefined {
  const category = relationDoc(doc);
  if (!category) return undefined;
  return {
    id: docID(category),
    name: textField(category, "name") || "",
    slug: textField(category, "slug") || "",
    description: textField(category, "description"),
  };
}

export const getPostsFromPayload = unstable_cache(
  loadPostsFromPayload,
  ["posts"],
  { revalidate: 300, tags: ["posts:list"] },
);

export async function getLatestPostsFromPayload(limit = 5, excludeSlug?: string): Promise<PublicPost[]> {
  const safeLimit = clampPositiveInteger(limit, 5, 24);

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      depth: 2,
      limit: excludeSlug ? safeLimit + 1 : safeLimit,
      select: PUBLIC_POST_CARD_SELECT,
      sort: "-publishedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { postType: { in: [...PUBLIC_NEWS_POST_TYPES] } },
          ...(excludeSlug ? [{ slug: { not_in: [excludeSlug] } }] : []),
        ],
      },
    });

    return (res.docs as PayloadDoc[]).map(mapPost).slice(0, safeLimit);
  } catch (error) {
    handlePayloadReadError("posts:latest", error);
    return filterLocalPostsForPage(loadLocalContentFixtures().posts, { sort: "newest" })
      .filter((post) => post.slug !== excludeSlug)
      .slice(0, safeLimit);
  }
}

export async function getMostViewedPostsFromPayload(limit = 5, excludeSlug?: string): Promise<PublicPost[]> {
  const safeLimit = clampPositiveInteger(limit, 5, 24);

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      depth: 2,
      limit: excludeSlug ? safeLimit + 1 : safeLimit,
      select: PUBLIC_POST_CARD_SELECT,
      sort: "-viewCount",
      where: {
        and: [
          { status: { equals: "published" } },
          { postType: { in: [...PUBLIC_NEWS_POST_TYPES] } },
          ...(excludeSlug ? [{ slug: { not_in: [excludeSlug] } }] : []),
        ],
      },
    });

    return (res.docs as PayloadDoc[])
      .map(mapPost)
      .sort(
        (a, b) =>
          (b.viewCount || 0) - (a.viewCount || 0) ||
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) - (a.publishedAt ? new Date(a.publishedAt).getTime() : 0),
      )
      .slice(0, safeLimit);
  } catch (error) {
    handlePayloadReadError("posts:most-viewed", error);
    return filterLocalPostsForPage(loadLocalContentFixtures().posts, { sort: "newest" })
      .filter((post) => post.slug !== excludeSlug)
      .sort(
        (a, b) =>
          (b.viewCount || 0) - (a.viewCount || 0) ||
          Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
          (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) - (a.publishedAt ? new Date(a.publishedAt).getTime() : 0),
      )
      .slice(0, safeLimit);
  }
}

async function loadPostBySlugFromPayload(slug: string): Promise<PublicPost | null> {
  const localPost = loadLocalContentFixtures().posts.find((post) => post.slug === slug);
  if (localPost) return localPost;

  const res = await findDocs("posts", {
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
  });
  const doc = res.docs[0];
  if (!doc) return null;
  return mapPostDetail(doc);
}

export async function getPostBySlugFromPayload(slug: string): Promise<PublicPost | null> {
  const getCachedPostBySlug = unstable_cache(
    () => loadPostBySlugFromPayload(slug),
    ["post-by-slug", slug],
    { revalidate: 300, tags: [`post:${slug}`] },
  );
  return getCachedPostBySlug();
}

export async function getRecruitmentPostBySlugFromPayload(slug: string): Promise<PublicPost | null> {
  const localPost = loadLocalContentFixtures().posts.find(
    (post) => post.slug === slug && post.postType === "recruitment",
  );
  if (localPost) return localPost;

  const res = await findDocs("posts", {
    limit: 1,
    where: {
      and: [
        { slug: { equals: slug } },
        { postType: { equals: "recruitment" } },
        { status: { equals: "published" } },
      ],
    },
  });
  const doc = res.docs[0];
  return doc ? mapPostDetail(doc) : null;
}

export async function getPostByPathFromPayload(pathValue: string): Promise<PublicPost | null> {
  const normalizedPath = normalizeNewsPath(pathValue);
  const localPost = loadLocalContentFixtures().posts.find(
    (post) => normalizeNewsPath(post.fullPath || post.slug) === normalizedPath,
  );
  if (localPost) return localPost;

  const res = await findDocs("posts", {
    limit: 1,
    where: {
      and: [{ fullPath: { equals: normalizedPath } }, { status: { equals: "published" } }],
    },
  });
  const doc = res.docs[0];
  if (doc) return mapPostDetail(doc);

  const slug = normalizedPath.split("/").pop() || normalizedPath;
  return getPostBySlugFromPayload(slug);
}

export async function getPostCategoriesFromPayload(): Promise<PublicPostCategory[]> {
  const res = await findDocs("post-categories", {
    sort: "sortOrder",
  });
  return res.docs.map((doc) => ({
    id: docID(doc),
    name: textField(doc, "name") || "",
    slug: textField(doc, "slug") || "",
    fullTitle: textField(doc, "fullTitle"),
    fullSlug: textField(doc, "fullSlug"),
    description: textField(doc, "description"),
    image: mediaURL(doc.coverImage),
    parent:
      typeof doc.parent === "string" || typeof doc.parent === "number"
        ? String(doc.parent)
        : docID(objectField(doc, "parent")),
  }));
}

export async function getPostCategoryByPathFromPayload(pathValue: string): Promise<PublicPostCategory | null> {
  const normalizedPath = normalizeNewsPath(pathValue);
  const res = await findDocs("post-categories", {
    limit: 1,
    where: {
      fullSlug: {
        equals: normalizedPath,
      },
    },
  });
  const doc = res.docs[0];
  if (!doc) return null;
  return {
    id: docID(doc),
    name: textField(doc, "name") || "",
    slug: textField(doc, "slug") || "",
    fullTitle: textField(doc, "fullTitle"),
    fullSlug: textField(doc, "fullSlug"),
    description: textField(doc, "description"),
    image: mediaURL(doc.coverImage),
    parent:
      typeof doc.parent === "string" || typeof doc.parent === "number"
        ? String(doc.parent)
        : docID(objectField(doc, "parent")),
  };
}

export async function getPostsByCategoryPathFromPayload(
  pathValue: string,
  options: { page?: number; limit?: number } = {},
): Promise<PublicPostsPage> {
  const normalizedPath = normalizeNewsPath(pathValue);
  const page = clampPositiveInteger(options.page, 1, 100000);
  const limit = clampPositiveInteger(options.limit, 12, 48);
  const categories = await getPostCategoriesFromPayload();
  const categoryIDs = categories
    .filter((category) => category.fullSlug === normalizedPath || category.fullSlug?.startsWith(`${normalizedPath}/`))
    .map((category) => category.id)
    .filter((id): id is string => Boolean(id));

  if (!categoryIDs.length) {
    return {
      posts: [],
      totalDocs: 0,
      totalPages: 1,
      page: 1,
      limit,
      hasNextPage: false,
      hasPrevPage: false,
    };
  }

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      depth: 2,
      limit,
      page,
      select: PUBLIC_POST_CARD_SELECT,
      sort: "-publishedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { postType: { in: [...PUBLIC_NEWS_POST_TYPES] } },
          { category: { in: categoryIDs } },
        ],
      },
    });

    return {
      posts: (res.docs as PayloadDoc[]).map(mapPost),
      totalDocs: res.totalDocs,
      totalPages: Math.max(1, res.totalPages),
      page: res.page || page,
      limit,
      hasNextPage: Boolean(res.hasNextPage),
      hasPrevPage: Boolean(res.hasPrevPage),
    };
  } catch (error) {
    handlePayloadReadError(`posts:category:${normalizedPath}`, error);
    const categoryIDSet = new Set(categoryIDs);
    const posts = filterLocalPostsForPage(loadLocalContentFixtures().posts, { sort: "newest" })
      .filter((post) => post.category?.id && categoryIDSet.has(post.category.id));
    const totalDocs = posts.length;
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
    const safePage = Math.min(page, totalPages);

    return {
      posts: posts.slice((safePage - 1) * limit, safePage * limit),
      totalDocs,
      totalPages,
      page: safePage,
      limit,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  }
}

export async function getPublishedPostSitemapCount(): Promise<number> {
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      depth: 0,
      limit: 1,
      select: { slug: true },
      where: {
        and: [
          { status: { equals: "published" } },
          { postType: { in: [...PUBLIC_NEWS_POST_TYPES] } },
        ],
      },
    });
    return res.totalDocs;
  } catch (error) {
    handlePayloadReadError("posts:sitemap-count", error);
    return filterLocalPostsForPage(loadLocalContentFixtures().posts, { sort: "newest" }).length;
  }
}

export async function getPublishedPostSitemapEntries({
  page = 1,
  limit = 5000,
}: {
  page?: number;
  limit?: number;
} = {}): Promise<PublicSitemapEntry[]> {
  const safePage = clampPositiveInteger(page, 1, 100000);
  const safeLimit = clampPositiveInteger(limit, 5000, 5000);

  try {
    const payload = await getPayloadClient();
    const res = await payload.find({
      collection: "posts",
      depth: 0,
      limit: safeLimit,
      page: safePage,
      select: { slug: true, fullPath: true, updatedAt: true },
      sort: "-updatedAt",
      where: {
        and: [
          { status: { equals: "published" } },
          { postType: { in: [...PUBLIC_NEWS_POST_TYPES] } },
        ],
      },
    });

    return (res.docs as PayloadDoc[]).map((doc) => ({
      slug: textField(doc, "slug"),
      fullPath: textField(doc, "fullPath"),
      updatedAt: textField(doc, "updatedAt"),
    }));
  } catch (error) {
    handlePayloadReadError("posts:sitemap", error);
    const posts = filterLocalPostsForPage(loadLocalContentFixtures().posts, { sort: "newest" });
    return posts.slice((safePage - 1) * safeLimit, safePage * safeLimit).map((post) => ({
      slug: post.slug,
      fullPath: post.fullPath,
      updatedAt: post.publishedAt,
    }));
  }
}

export async function getNewsRedirectFromPayload(pathValue: string): Promise<{ destination: string; permanent: boolean } | null> {
  const normalizedPath = normalizeNewsPath(pathValue);
  const res = await findDocs("news-redirects", {
    limit: 1,
    where: {
      fromPath: {
        equals: normalizedPath,
      },
    },
  });
  const doc = res.docs[0];
  if (!doc) return null;
  const toPath = textField(doc, "toPath");
  if (!toPath) return null;
  return {
    destination: `/tin-tuc/${normalizeNewsPath(toPath)}`,
    permanent: textField(doc, "statusCode") !== "302",
  };
}

function mapProject(doc: PayloadDoc): PublicProject {
  return {
    title: textField(doc, "name") || "",
    slug: textField(doc, "slug") || "",
    category: projectCategory(doc.category),
    client: textField(doc, "client"),
    industry: textField(doc, "industry"),
    completedAt: textField(doc, "completedAt"),
    summary: textField(doc, "summary"),
    image: Array.isArray(doc.gallery) ? mediaURL(doc.gallery[0]) : undefined,
  };
}

function mapProjectDetail(doc: PayloadDoc): PublicProject {
  return {
    ...mapProject(doc),
    content: doc.content,
    gallery: Array.isArray(doc.gallery)
      ? doc.gallery.flatMap((item) => {
          const image = mediaImage(item);
          return image ? [image] : [];
        })
      : [],
    products: Array.isArray(doc.products)
      ? doc.products.flatMap((item) => {
          const product = relationDoc(item);
          if (!product) return [];
          const slug = textField(product, "slug");
          const title = textField(product, "title") || textField(product, "name");
          if (!slug || !title) return [];
          const images = Array.isArray(product.images) ? product.images : [];
          return [{
            title,
            slug,
            image: mediaURL(images[0]),
          }];
        })
      : [],
  };
}

async function loadProjectsFromPayload(): Promise<PublicProject[]> {
  const res = await findDocs("projects", { sort: "-completedAt" });
  return mergeLocalBySlug(res.docs.map(mapProject), loadLocalContentFixtures().projects);
}

export const getProjectsFromPayload = unstable_cache(
  loadProjectsFromPayload,
  ["projects"],
  { revalidate: 300, tags: ["projects"] },
);

export async function getProjectBySlugFromPayload(slug: string): Promise<PublicProject | null> {
  const localProject = loadLocalContentFixtures().projects.find((project) => project.slug === slug);
  if (localProject) return localProject;

  const res = await findDocs("projects", {
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  });
  const doc = res.docs[0];
  return doc ? mapProjectDetail(doc) : null;
}

export async function getProjectCategoriesFromPayload(): Promise<PublicProjectCategory[]> {
  const res = await findDocs("project-categories", {
    sort: "sortOrder",
  });

  return res.docs.map((doc) => ({
    id: docID(doc),
    name: textField(doc, "name") || "",
    slug: textField(doc, "slug") || "",
    description: textField(doc, "description"),
  }));
}

async function loadFAQsFromPayload(): Promise<PublicFAQ[]> {
  const res = await findDocs("faq", { sort: "sortOrder" });
  return res.docs.map((doc) => ({
    question: textField(doc, "question") || "",
    category: textField(doc, "category"),
  }));
}

export const getFAQsFromPayload = unstable_cache(
  loadFAQsFromPayload,
  ["faqs"],
  { revalidate: 300, tags: ["faqs"] },
);

export async function getStaticPageFromPayload(slug: string): Promise<PublicStaticPage | null> {
  const res = await findDocs("static-pages", {
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
  });
  const doc = res.docs[0];
  if (!doc) return null;

  return {
    title: textField(doc, "title") || "",
    slug: textField(doc, "slug") || "",
    eyebrow: textField(doc, "eyebrow"),
    summary: textField(doc, "summary"),
  };
}

async function loadSiteSettingsFromPayload(): Promise<PublicSiteSettings | null> {
  try {
    const payload = await getPayloadClient();
    return (await payload.findGlobal({ slug: "site-settings" })) as PublicSiteSettings;
  } catch (error) {
    handlePayloadReadError("site-settings", error);
    return null;
  }
}

export const getSiteSettingsFromPayload = unstable_cache(
  loadSiteSettingsFromPayload,
  ["site-settings"],
  { revalidate: 300, tags: ["site-settings"] },
);

async function loadAboutPageFromPayload(): Promise<PublicAboutPage> {
  try {
    const payload = await getPayloadClient();
    const page = (await payload.findGlobal({ slug: "about-page", depth: 1 })) as PayloadDoc;
    return normalizeAboutPage(page);
  } catch (error) {
    handlePayloadReadError("about-page", error);
    return normalizeAboutPage(null);
  }
}

export const getAboutPageFromPayload = unstable_cache(
  loadAboutPageFromPayload,
  ["about-page"],
  { revalidate: 300, tags: ["about"] },
);
