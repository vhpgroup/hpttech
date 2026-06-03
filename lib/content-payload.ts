import { HPT_DATA } from "@/lib/data";
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
  image?: string;
  date?: string;
  publishedAt?: string;
  href?: string;
  summary?: string;
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
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  footerNote?: string;
};

type PayloadDoc = Record<string, unknown>;
type PayloadFindResult = {
  docs: PayloadDoc[];
};
type PublicCollectionSlug = "banners" | "solutions" | "posts" | "projects" | "faq" | "static-pages";

function textField(doc: PayloadDoc, key: string) {
  const value = doc[key];
  return typeof value === "string" ? value : undefined;
}

function mediaURL(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  if ("url" in value && typeof value.url === "string") return value.url;
  return undefined;
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

  return banners.length
    ? banners
    : HPT_DATA.banners.map((image) => ({ image, link: "https://hpttech.vn/" }));
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

  return res.docs.map((doc) => ({
    title: textField(doc, "title") || "",
    slug: textField(doc, "slug") || "",
    image: mediaURL(doc.thumbnail),
    date: formatDate(doc.publishedAt),
    publishedAt: textField(doc, "publishedAt"),
    href: `/tin-tuc/${textField(doc, "slug") || ""}`,
    summary: textField(doc, "summary"),
  }));
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
  const slugValue = textField(doc, "slug") || "";

  return {
    title: textField(doc, "title") || "",
    slug: slugValue,
    image: mediaURL(doc.thumbnail),
    date: formatDate(doc.publishedAt),
    publishedAt: textField(doc, "publishedAt"),
    href: `/tin-tuc/${slugValue}`,
    summary: textField(doc, "summary"),
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
