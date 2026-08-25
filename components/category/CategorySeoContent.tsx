import { PayloadRichText } from "@/components/rich-text/PayloadRichText";
import {
  buildCategorySeoToc,
  extractLexicalHeadings,
  splitLexicalByHeadings,
  type CategorySeoContent as CategorySeoContentData,
  type CategorySeoTocItem,
} from "@/lib/category-seo-content";

// Khối bài SEO dưới grid sản phẩm ở landing danh mục /<slug>.
// Server Component thuần: mục lục + anchor đều render sẵn ở HTML nên Google
// thu thập được ngay, không phụ thuộc JS (khác kiểu TOC dựng bằng client script).

type CategorySeoContentProps = {
  content: CategorySeoContentData;
  categoryName: string;
};

// Tiêu đề khối là H2, nên đề mục người viết đánh H2/H3/H4 được HẠ MỘT CẤP khi
// render (h3/h4/h5) để cây heading của trang vẫn hợp lệ — style giữ nguyên thứ bậc
// thị giác mà người viết mong đợi.
const HEADING_STYLE: Record<number, string> = {
  2: "mt-10 scroll-mt-28 text-xl font-bold leading-8 text-primary-700 sm:text-2xl",
  3: "mt-8 scroll-mt-28 text-lg font-bold leading-7 text-slate-950",
  4: "mt-6 scroll-mt-28 text-base font-bold leading-6 text-slate-950",
};

const HEADING_TAG: Record<number, "h3" | "h4" | "h5"> = {
  2: "h3",
  3: "h4",
  4: "h5",
};

function TocList({ items, depth = 0 }: { items: CategorySeoTocItem[]; depth?: number }) {
  if (!items.length) return null;

  return (
    <ul className={depth === 0 ? "space-y-1.5" : "mt-1.5 space-y-1.5 pl-5"}>
      {items.map((item) => (
        <li key={item.id}>
          <a
            className="text-sm leading-6 text-primary-700 underline-offset-4 hover:text-primary-900 hover:underline"
            href={`#${item.id}`}
          >
            {item.text}
          </a>
          <TocList items={item.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
}

export function CategorySeoContent({ content, categoryName }: CategorySeoContentProps) {
  const headings = extractLexicalHeadings(content.body);
  const sections = splitLexicalByHeadings(content.body, headings);
  const toc = buildCategorySeoToc(headings);

  // Mục đầu không có heading = đoạn dẫn nhập (đặt TRÊN box "Xem nhanh", giống samnec).
  const intro = sections[0] && !sections[0].heading ? sections[0] : null;
  const bodySections = intro ? sections.slice(1) : sections;

  const faqSchema = content.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: content.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <section
      aria-labelledby="noi-dung-seo-danh-muc"
      className="mx-auto mt-10 w-full max-w-5xl rounded-lg border border-border bg-white p-5 shadow-sm sm:p-8"
    >
      {faqSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      ) : null}

      <h2
        className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl"
        id="noi-dung-seo-danh-muc"
      >
        {content.heading}
      </h2>

      {intro ? <PayloadRichText data={intro.content} /> : null}

      {content.showToc && toc.length > 1 ? (
        <nav
          aria-label={`${content.tocTitle} — ${categoryName}`}
          className="my-7 rounded-lg border border-primary-100 bg-primary-50/60 p-5"
        >
          <p className="mb-3 text-base font-bold text-slate-950">{content.tocTitle}</p>
          <TocList items={toc} />
        </nav>
      ) : null}

      {bodySections.map((section, index) => {
        const heading = section.heading;
        const HeadingTag = heading ? HEADING_TAG[heading.level] || "h4" : null;

        return (
          <div key={heading?.id || `section-${index}`}>
            {heading && HeadingTag ? (
              <HeadingTag
                className={HEADING_STYLE[heading.level] || HEADING_STYLE[3]}
                id={heading.id}
              >
                {heading.text}
              </HeadingTag>
            ) : null}
            {section.content.root.children.length ? (
              <PayloadRichText data={section.content} />
            ) : null}
          </div>
        );
      })}

      {content.faqs.length ? (
        <div className="mt-10 border-t border-border pt-7">
          <h3 className="scroll-mt-28 text-xl font-bold text-slate-950" id="cau-hoi-thuong-gap">
            Câu hỏi thường gặp về {categoryName.toLowerCase()}
          </h3>
          <div className="mt-4 space-y-3">
            {content.faqs.map((faq) => (
              <details
                className="rounded-lg border border-border bg-surface px-4 py-3 open:bg-white"
                key={faq.question}
              >
                <summary className="cursor-pointer list-none text-sm font-bold text-slate-950 marker:hidden">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm leading-7 text-slate-700">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
