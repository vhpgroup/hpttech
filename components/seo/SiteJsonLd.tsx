import { absoluteURL, siteURL } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

type Settings = ReturnType<typeof normalizeSiteSettings>;

const HPT_LEGAL_NAME = "Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT";
const HPT_TAX_ID = "0202253444";
const HPT_HEADQUARTERS_ADDRESS = "SB04 Vinhomes Marina, phường An Biên";
const HPT_HEADQUARTERS_CITY = "Hải Phòng";

export default function SiteJsonLd({ settings }: { settings: Settings }) {
  const telephone = settings.hotline || settings.phone;
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.companyName || "HPT Tech",
    legalName: HPT_LEGAL_NAME,
    url: siteURL(),
    logo: absoluteURL("/assets/logo/hptlogo.png"),
    image: absoluteURL("/assets/og/hpttech-og.jpg"),
    taxID: HPT_TAX_ID,
    telephone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: HPT_HEADQUARTERS_ADDRESS,
      addressLocality: HPT_HEADQUARTERS_CITY,
      addressCountry: "VN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone,
      email: settings.email,
      contactType: "customer service",
      areaServed: "VN",
      availableLanguage: "vi",
    },
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
