import fs from "node:fs";
import path from "node:path";
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

export type PublicPost = {
  title: string;
  slug: string;
  fullPath?: string;
  image?: string;
  date?: string;
  publishedAt?: string;
  href?: string;
  summary?: string;
  category?: PublicPostCategory;
  tags?: PublicPostTag[];
  postType?: string;
  featured?: boolean;
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
  client?: string;
  industry?: string;
  summary?: string;
  image?: string;
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
  | "posts"
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
    category: postCategory(doc.category),
    tags: postTags(doc.tags),
    postType: textField(doc, "postType"),
    featured: doc.featured === true,
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

export async function getBannersFromPayload(): Promise<PublicBanner[]> {
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

export async function getSolutionsFromPayload(): Promise<PublicSolution[]> {
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

export async function getPostsFromPayload(): Promise<PublicPost[]> {
  const res = await findDocs("posts", {
    sort: "-publishedAt",
    where: { status: { equals: "published" } },
  });

  return res.docs.map(mapPost);
}

export async function getPostBySlugFromPayload(slug: string): Promise<PublicPost | null> {
  const res = await findDocs("posts", {
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
  });
  const doc = res.docs[0];
  if (!doc) return null;
  return mapPost(doc);
}

export async function getPostByPathFromPayload(pathValue: string): Promise<PublicPost | null> {
  const normalizedPath = normalizeNewsPath(pathValue);
  const res = await findDocs("posts", {
    limit: 1,
    where: {
      and: [{ fullPath: { equals: normalizedPath } }, { status: { equals: "published" } }],
    },
  });
  const doc = res.docs[0];
  if (doc) return mapPost(doc);

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

export async function getPostsByCategoryPathFromPayload(pathValue: string): Promise<PublicPost[]> {
  const normalizedPath = normalizeNewsPath(pathValue);
  const [categories, posts] = await Promise.all([getPostCategoriesFromPayload(), getPostsFromPayload()]);
  const categoryIDs = new Set(
    categories
      .filter((category) => category.fullSlug === normalizedPath || category.fullSlug?.startsWith(`${normalizedPath}/`))
      .map((category) => category.id)
      .filter(Boolean),
  );

  return posts.filter((post) => post.category?.id && categoryIDs.has(post.category.id));
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

export async function getProjectsFromPayload(): Promise<PublicProject[]> {
  const res = await findDocs("projects", { sort: "-completedAt" });
  return res.docs.map((doc) => ({
    title: textField(doc, "name") || "",
    slug: textField(doc, "slug") || "",
    client: textField(doc, "client"),
    industry: textField(doc, "industry"),
    summary: textField(doc, "summary"),
    image: Array.isArray(doc.gallery) ? mediaURL(doc.gallery[0]) : undefined,
  }));
}

export async function getFAQsFromPayload(): Promise<PublicFAQ[]> {
  const res = await findDocs("faq", { sort: "sortOrder" });
  return res.docs.map((doc) => ({
    question: textField(doc, "question") || "",
    category: textField(doc, "category"),
  }));
}

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

export async function getSiteSettingsFromPayload(): Promise<PublicSiteSettings | null> {
  try {
    const payload = await getPayloadClient();
    return (await payload.findGlobal({ slug: "site-settings" })) as PublicSiteSettings;
  } catch (error) {
    handlePayloadReadError("site-settings", error);
    return null;
  }
}

export async function getAboutPageFromPayload(): Promise<PublicAboutPage> {
  try {
    const payload = await getPayloadClient();
    const page = (await payload.findGlobal({ slug: "about-page", depth: 2 })) as PayloadDoc;
    return normalizeAboutPage(page);
  } catch (error) {
    handlePayloadReadError("about-page", error);
    return normalizeAboutPage(null);
  }
}
