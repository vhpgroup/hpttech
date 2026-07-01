import { absoluteURL } from "@/lib/seo";

export function breadcrumbLd(items: Array<{ href: string; name: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteURL(item.href),
      name: item.name,
      position: index + 1,
    })),
  };
}

export function faqLd(faqs: Array<{ answer?: string; question?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs
      .filter((faq) => faq.question && faq.answer)
      .map((faq) => ({
        "@type": "Question",
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
        name: faq.question,
      })),
  };
}

export function itemListLd(items: Array<{ href?: string; name: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      item: absoluteURL(item.href || "/san-pham"),
      name: item.name,
      position: index + 1,
    })),
  };
}
