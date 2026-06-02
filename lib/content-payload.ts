import { HPT_DATA } from "@/lib/data";
import { getPayloadClient } from "@/lib/payload";

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

async function findDocs(collection: string, options: Record<string, unknown> = {}) {
  const payload = await getPayloadClient();
  return payload.find({
    collection: collection as any,
    depth: 2,
    limit: 1000,
    ...options,
  } as any);
}

export async function getBannersFromPayload(): Promise<PublicBanner[]> {
  const res = await findDocs("banners", {
    sort: "sortOrder",
    where: { active: { equals: true } },
  });
  const banners = res.docs
    .flatMap((doc: any) => {
      const image = mediaURL(doc.image);
      if (!image) return [];
      return [{ image, title: doc.title, subtitle: doc.subtitle, link: doc.link }];
    });

  return banners.length
    ? banners
    : HPT_DATA.banners.map((image) => ({ image, link: "https://hpttech.vn/" }));
}

export async function getSolutionsFromPayload(): Promise<PublicSolution[]> {
  const res = await findDocs("solutions", { sort: "sortOrder" });
  const solutions = res.docs.map((doc: any) => ({
    title: doc.name,
    slug: doc.slug,
    description: doc.summary,
    icon: doc.icon,
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

  return res.docs.map((doc: any) => ({
    title: doc.title,
    slug: doc.slug,
    image: mediaURL(doc.thumbnail),
    date: formatDate(doc.publishedAt),
    href: `/tin-tuc/${doc.slug}`,
    summary: doc.summary,
  }));
}

export async function getPostBySlugFromPayload(slug: string): Promise<PublicPost | null> {
  const res = await findDocs("posts", {
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
  });
  const doc: any = res.docs[0];
  if (!doc) return null;

  return {
    title: doc.title,
    slug: doc.slug,
    image: mediaURL(doc.thumbnail),
    date: formatDate(doc.publishedAt),
    href: `/tin-tuc/${doc.slug}`,
    summary: doc.summary,
  };
}

export async function getProjectsFromPayload(): Promise<PublicProject[]> {
  const res = await findDocs("projects", { sort: "-completedAt" });
  return res.docs.map((doc: any) => ({
    title: doc.name,
    slug: doc.slug,
    client: doc.client,
    industry: doc.industry,
    summary: doc.summary,
    image: Array.isArray(doc.gallery) ? mediaURL(doc.gallery[0]) : undefined,
  }));
}

export async function getFAQsFromPayload(): Promise<PublicFAQ[]> {
  const res = await findDocs("faq", { sort: "sortOrder" });
  return res.docs.map((doc: any) => ({
    question: doc.question,
    category: doc.category,
  }));
}

export async function getStaticPageFromPayload(slug: string): Promise<PublicStaticPage | null> {
  const res = await findDocs("static-pages", {
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: "published" } }],
    },
  });
  const doc: any = res.docs[0];
  if (!doc) return null;

  return {
    title: doc.title,
    slug: doc.slug,
    eyebrow: doc.eyebrow,
    summary: doc.summary,
  };
}

export async function getSiteSettingsFromPayload(): Promise<PublicSiteSettings | null> {
  const payload = await getPayloadClient();
  try {
    return (await payload.findGlobal({ slug: "site-settings" as any })) as PublicSiteSettings;
  } catch {
    return null;
  }
}
