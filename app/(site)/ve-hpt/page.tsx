import { AboutEnterprisePage } from "@/components/about/AboutEnterprisePage";
import {
  getAboutPageFromPayload,
  getSiteSettingsFromPayload,
} from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export default async function AboutPage() {
  const [aboutPage, rawSettings] = await Promise.all([
    getAboutPageFromPayload(),
    getSiteSettingsFromPayload(),
  ]);
  const settings = normalizeSiteSettings(rawSettings);

  return <AboutEnterprisePage content={aboutPage} settings={settings} />;
}

export async function generateMetadata() {
  const aboutPage = await getAboutPageFromPayload();

  return pageMetadata({
    title: aboutPage.hero.title,
    description: aboutPage.hero.description,
    path: "/ve-hpt",
  });
}
