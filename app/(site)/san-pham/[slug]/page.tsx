import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FileText,
} from "lucide-react";
import {
  getProductBySlugFromPayload,
  getProductsByBrandFromPayload,
  getProductsByCategoryFromPayload,
} from "@/lib/catalog-payload";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { helpLinks } from "@/lib/help-links";
import { normalizeSiteSettings, phoneHref, quoteMailHref } from "@/lib/site-settings";
import { ProductDetailTabs, type ProductDetailTab } from "@/components/product/ProductDetailTabs";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import ProductPricingSection from "@/components/product/ProductPricingSection";
import { ProductSpecTable } from "@/components/product/ProductSpecTable";
import { ProductStickyBar } from "@/components/product/ProductStickyBar";
import { ProductRelationTabs, type ProductRelationSection } from "@/components/product/ProductRelationTabs";
import { PayloadRichText } from "@/components/rich-text/PayloadRichText";
import type { CatalogProduct } from "@/lib/catalog";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ProductSpec = {
  label: string;
  value: string;
};

const quickBuyItems = [
  "Mua online - Giá tốt",
  "Ship hàng toàn quốc",
  "Nhận hàng và thanh toán tại nhà",
];

const consultantItems = [
  {
    name: "Đào Duy Vỹ",
    phone: "0876645432",
    email: "kinhdoanh@hpttech.vn",
    initials: "DVY",
    color: "#16A34A",
    imageSrc: "/assets/consultants/dao-duy-vy.jpg",
  },
  {
    name: "Nguyễn Viết Tân",
    phone: "0559 309 904",
    email: "kinhdoanh@hpttech.vn",
    initials: "NT",
    color: "#7C3AED",
    imageSrc: "/assets/consultants/nguyen-viet-tan.jpg",
  },
  {
    name: "Nguyễn Đức Thắng",
    phone: "0372 767 995",
    email: "kinhdoanh@hpttech.vn",
    initials: "NT",
    color: "#2563EB",
    imageSrc: "/assets/consultants/nguyen-duc-thang.jpg",
  },
];

function parseVNDPrice(value?: string) {
  if (!value) return undefined;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : undefined;
}

function schemaAvailability(stockStatus?: string) {
  if (stockStatus === "out_of_stock") return "https://schema.org/OutOfStock";
  if (stockStatus === "preorder") return "https://schema.org/PreOrder";
  return "https://schema.org/InStock";
}

function normalizeText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function addLazyImageAttributes(html: string) {
  return html.replace(/<img\b([^>]*)>/gi, (_tag, attributes: string) => {
    const selfClosing = /\/\s*$/.test(attributes);
    let nextAttributes = attributes.replace(/\/\s*$/, "").trimEnd();

    if (!/\sloading\s*=/i.test(nextAttributes)) {
      nextAttributes += ' loading="lazy"';
    }
    if (!/\sdecoding\s*=/i.test(nextAttributes)) {
      nextAttributes += ' decoding="async"';
    }

    return `<img${nextAttributes}${selfClosing ? " />" : ">"}`;
  });
}

function uniqueProducts(products: CatalogProduct[]) {
  const seen = new Set<string>();

  return products.filter((item) => {
    const key = item.slug || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function EmptyProductSection({ message }: { message: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
      {message}
    </div>
  );
}

function ProductHTMLContent({ html }: { html?: string }) {
  if (!html) return null;
  const htmlWithLazyImages = addLazyImageAttributes(html);

  return (
    <div
      className="product-description-content rounded-[18px] bg-white p-6 text-[15px] leading-7 text-slate-700 shadow-sm ring-1 ring-slate-200/80 [&_a]:font-semibold [&_a]:text-blue-700 [&_figure]:my-6 [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:border-l-4 [&_h2]:border-blue-600 [&_h2]:pl-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-950 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_img]:mx-auto [&_img]:my-5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200 [&_img]:bg-white [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-4 [&_picture]:mx-auto [&_picture]:block [&_table]:my-5 [&_table]:w-full [&_table]:overflow-hidden [&_table]:rounded-xl [&_table]:border [&_table]:border-slate-200 [&_td]:border [&_td]:border-slate-200 [&_td]:p-3 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:p-3 [&_ul]:mb-4 [&_ol]:mb-4"
      dangerouslySetInnerHTML={{ __html: htmlWithLazyImages }}
    />
  );
}

function inferDocumentType(filename?: string) {
  const normalized = normalizeText(filename);
  if (!normalized) return "Tài liệu";
  if (normalized.includes("windows")) return "Driver Windows";
  if (normalized.includes("mac")) return "Driver macOS";
  if (normalized.includes("manual") || normalized.includes("huong dan")) return "User Manual";
  if (normalized.includes("datasheet") || normalized.includes("catalog")) return "Datasheet";
  return "Tài liệu";
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlugFromPayload(slug);

  if (!product) {
    return pageMetadata({
      title: "Sản phẩm",
      description: "Thông tin sản phẩm HPT Tech.",
      path: `/san-pham/${slug}`,
    });
  }

  return pageMetadata({
    title: product.title,
    description: product.detail || "Thông tin sản phẩm, thông số và báo giá từ HPT Tech.",
    path: `/san-pham/${product.slug}`,
    image: product.images?.[0]?.url || product.image,
  });
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, rawSettings] = await Promise.all([
    getProductBySlugFromPayload(slug),
    getSiteSettingsFromPayload(),
  ]);

  if (!product) notFound();

  const [similarProducts, sameBrandProducts] = await Promise.all([
    product.category ? getProductsByCategoryFromPayload(product.category, product.slug, 8) : Promise.resolve([]),
    product.brand ? getProductsByBrandFromPayload(product.brand, product.slug, 8) : Promise.resolve([]),
  ]);

  const settings = normalizeSiteSettings(rawSettings);
  const phone = settings.hotline || settings.phone;
  const quoteHref = quoteMailHref(settings.email, `Yêu cầu báo giá ${product.title}`);
  const productImages = (product.images ?? []).filter(
    (img): img is { id?: string | number; url: string; alt?: string } => Boolean(img?.url),
  );
  const specs = ((product.specs as ProductSpec[] | undefined) ?? []).filter(
    (spec) => spec.label?.trim() && spec.value?.trim(),
  );
  const schemaPrice = parseVNDPrice(product.price);
  // Không tự sinh mô tả từ tóm tắt (detail) — quyết định 2026-07-09: mô tả
  // để trống thì hiển thị trạng thái trống, không tự thêm nội dung.
  const productDescription = product.description || product.descriptionRichText;
  const assignedRelatedProducts = uniqueProducts((product.relatedProducts ?? []).filter((item) => item.slug !== product.slug));
  const relatedProducts = assignedRelatedProducts.slice(0, 15);
  const relationSections: ProductRelationSection[] = [
    {
      id: "similar",
      label: "Sản phẩm tương tự",
      products: uniqueProducts(similarProducts).slice(0, 15),
      emptyMessage: "Chưa có sản phẩm tương tự trong cùng danh mục.",
    },
    {
      id: "same-brand",
      label: "Sản phẩm cùng hãng",
      products: uniqueProducts(sameBrandProducts).slice(0, 15),
      emptyMessage: "Chưa có sản phẩm cùng hãng trong catalog.",
    },
    {
      id: "related",
      label: "Sản phẩm liên quan",
      products: relatedProducts,
      emptyMessage: "Chưa có sản phẩm liên quan hoặc sản phẩm thay thế trong catalog.",
    },
  ];
  const documents = (product.datasheets as
    | Array<{ id?: string | number; url?: string; filename?: string; mimeType?: string }>
    | undefined
  )?.filter((file) => Boolean(file?.url));

  const hasReviews = (product.reviewCount ?? 0) > 0 && (product.rating ?? 0) > 0;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: productImages.map((img) => absoluteURL(img.url)).filter(Boolean),
    description: product.detail,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.category,
    sku: product.sku || product.model || product.slug,
    mpn: product.model || undefined,
    ...(hasReviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number((product.rating ?? 0).toFixed(1)),
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: absoluteURL(`/san-pham/${product.slug}`),
      priceCurrency: "VND",
      availability: schemaAvailability(product.stockStatus),
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: settings.companyName || "HPT Tech" },
      ...(schemaPrice ? { price: schemaPrice } : {}),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: absoluteURL("/") },
      { "@type": "ListItem", position: 2, name: "Sản phẩm", item: absoluteURL("/san-pham") },
      { "@type": "ListItem", position: 3, name: product.title, item: absoluteURL(`/san-pham/${product.slug}`) },
    ],
  };

  const tabSections: ProductDetailTab[] = [
    {
      id: "specs",
      label: "Thông số kỹ thuật",
      content: specs.length ? (
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-[18px] bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Tổng quan
            </p>
            <div className="mt-4 space-y-4 text-sm">
              {[
                { label: "Thương hiệu", value: product.brand },
                { label: "Danh mục", value: product.category },
                { label: "Mã sản phẩm", value: product.sku },
                { label: "Bảo hành", value: product.warranty },
                { label: "Xuất xứ", value: product.origin },
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.label}>
                    <p className="text-slate-400">{item.label}</p>
                    <p className="mt-1 font-medium text-slate-900">{item.value}</p>
                  </div>
                ))}
            </div>
          </aside>
          <ProductSpecTable specs={specs} />
        </div>
      ) : (
        <EmptyProductSection message="Sản phẩm này chưa có bảng thông số kỹ thuật chi tiết trong CMS." />
      ),
    },
    {
      id: "description",
      label: "Mô tả sản phẩm",
      content: productDescription ? (
        product.description ? (
          <ProductHTMLContent html={product.description} />
        ) : (
          <PayloadRichText data={product.descriptionRichText} className="rounded-[18px] bg-white p-6 text-[15px] shadow-sm ring-1 ring-slate-200/80" />
        )
      ) : (
        <EmptyProductSection message="Sản phẩm này chưa có mô tả chi tiết. Vui lòng bổ sung nội dung trong Payload CMS." />
      ),
    },
    {
      id: "usage-guide",
      label: "Hướng dẫn sử dụng",
      content: product.usageGuideRichText || product.usageGuide ? (
        product.usageGuideRichText ? (
          <PayloadRichText data={product.usageGuideRichText} className="rounded-[18px] bg-slate-50 p-6 text-[15px]" />
        ) : (
          <ProductHTMLContent html={product.usageGuide} />
        )
      ) : (
        <EmptyProductSection message="Sản phẩm này chưa có hướng dẫn sử dụng trong Payload CMS." />
      ),
    },
    {
      id: "documents",
      label: "Driver & Tài liệu",
      content: documents?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((file, index) =>
            file.url ? (
              <a
                key={file.id ?? `${file.filename}-${index}`}
                href={file.url}
                target="_blank"
                rel="noreferrer noopener"
                download
                className="rounded-[18px] bg-slate-50 p-5 transition-shadow hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.18)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#0057FF] shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {inferDocumentType(file.filename)}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {file.filename || `Tài liệu ${index + 1}`}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {file.mimeType === "application/pdf" ? "PDF" : "Tệp đính kèm"}
                    </p>
                  </div>
                  <Download size={18} className="mt-1 text-slate-400" />
                </div>
              </a>
            ) : null,
          )}
        </div>
      ) : (
        <EmptyProductSection message="Chưa có driver, catalogue hoặc tài liệu kỹ thuật được đính kèm." />
      ),
    },
  ];

  return (
    <main className="subpage-main !w-[var(--shell-width)] !max-w-none !py-8 md:!py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <ProductStickyBar
        productName={product.title}
        price={product.price}
        phone={phone}
        quoteHref={quoteHref}
        phoneHref={phoneHref(phone)}
      />

      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="transition-colors hover:text-slate-800">
          Trang chủ
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <Link href="/san-pham" className="transition-colors hover:text-slate-800">
          Sản phẩm
        </Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="truncate font-medium text-slate-900">{product.title}</span>
      </nav>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.45fr)_minmax(280px,0.8fr)] xl:items-start">
        <div className="rounded-[20px] bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:p-5">
          <ProductImageGallery images={productImages} productName={product.title} />
        </div>

        <div className="space-y-5">
          <ProductPricingSection
            product={product}
            quoteHref={quoteHref}
            phoneHref={phoneHref(phone)}
            schemaPrice={schemaPrice}
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="overflow-hidden rounded-xl bg-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/70">
            <div className="bg-primary-600 px-4 py-3">
              <h2 className="text-sm font-bold uppercase text-white">Cam kết HPT Tech</h2>
            </div>
            <ul className="space-y-2 px-4 py-4">
              {[
                "Xuất hóa đơn VAT đầy đủ cho doanh nghiệp",
                "Hàng mới 100% - nguyên seal",
                "Bảo hành 12 tháng",
                "Giao hàng toàn quốc, hỗ trợ kỹ thuật",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-700">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent-600" strokeWidth={3} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/70">
            <div className="bg-[#4F64E8] px-4 py-3">
              <h2 className="text-sm font-bold uppercase text-white">Trợ giúp</h2>
            </div>
            <div className="space-y-2 px-4 py-4">
              {helpLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-start gap-2 text-sm leading-5 text-slate-700 transition-colors hover:text-[#0057FF]"
                >
                  <Check size={16} className="mt-0.5 shrink-0 text-orange-600" strokeWidth={3} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/70">
            <div className="bg-[#4F64E8] px-4 py-3">
              <h2 className="text-sm font-bold uppercase text-white">Mua hàng nhanh chóng, tiện lợi</h2>
            </div>
            <div className="space-y-2 px-4 py-4">
              {quickBuyItems.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/70">
            <div className="bg-[#4F64E8] px-4 py-3">
              <h2 className="text-sm font-bold uppercase text-white">Tư vấn khách hàng</h2>
            </div>
            <div className="space-y-4 px-4 py-4">
              {consultantItems.map((consultant) => (
                <div key={`${consultant.name}-${consultant.phone}`} className="flex items-center gap-3">
                  <div
                    className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white ring-1 ring-slate-200"
                    style={{ backgroundColor: consultant.color }}
                  >
                    {consultant.initials}
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${consultant.imageSrc})` }}
                    />
                  </div>
                  <div className="min-w-0 text-sm leading-5 text-slate-700">
                    <p className="font-semibold text-slate-900">{consultant.name}</p>
                    <p>
                      <strong>Hotline/Zalo:</strong>{" "}
                      <a href={phoneHref(consultant.phone)} className="hover:text-[#0057FF]">
                        {consultant.phone}
                      </a>
                    </p>
                    <p>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${consultant.email}`} className="break-all hover:text-[#0057FF]">
                        {consultant.email}
                      </a>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <div id="product-hero-sentinel" />

      <div className="mt-6">
        <ProductDetailTabs sections={tabSections} />
      </div>

      <ProductRelationTabs sections={relationSections} />

      <div className="mt-8">
        <Link
          href="/san-pham"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-[#0057FF]"
        >
          <ArrowLeft size={15} />
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    </main>
  );
}

