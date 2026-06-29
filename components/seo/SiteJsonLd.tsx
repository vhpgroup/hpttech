import { absoluteURL, siteURL } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

type Settings = ReturnType<typeof normalizeSiteSettings>;

export default function SiteJsonLd({ settings }: { settings: Settings }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName || "HPT Tech",
    url: siteURL(),
    logo: absoluteURL("/assets/logo/hptlogo.png"),
    image: absoluteURL("/assets/og/hpttech-og.jpg"),
    telephone: settings.hotline || settings.phone,
    email: settings.email,
    sameAs: [settings.facebook, settings.youtube, settings.zalo].filter(Boolean),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: settings.companyName || "HPT Tech",
    url: siteURL(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteURL()}/san-pham?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
