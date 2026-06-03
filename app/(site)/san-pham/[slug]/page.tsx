import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Download,
  FileText,
  Mail,
  PhoneCall,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { getProductBySlugFromPayload } from "@/lib/catalog-payload";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings, phoneHref, quoteMailHref } from "@/lib/site-settings";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { ProductSpecTable } from "@/components/product/ProductSpecTable";
import { ProductStickyBar } from "@/components/product/ProductStickyBar";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

function stockLabel(stockStatus?: string) {
  if (stockStatus === "out_of_stock") return { label: "Hết hàng", variant: "danger" as const };
  if (stockStatus === "preorder") return { label: "Đặt trước", variant: "warning" as const };
  return { label: "Còn hàng", variant: "success" as const };
}

function tagVariant(tag?: string) {
  if (tag === "Mới") return "new" as const;
  if (tag === "Bán chạy") return "bestseller" as const;
  if (tag === "Cao cấp") return "premium" as const;
  return "neutral" as const;
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

  const settings = normalizeSiteSettings(rawSettings);
  const phone = settings.hotline || settings.phone;
  const productImages = (product.images ?? [])
    .filter((img): img is { id?: string | number; url: string; alt?: string } => Boolean(img?.url));
  const specs = (product.specs as Array<{ label: string; value: string }>) ?? [];
  const schemaPrice = parseVNDPrice(product.price);
  const stock = stockLabel(product.stockStatus);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: productImages.map((img) => absoluteURL(img.url)).filter(Boolean),
    description: product.detail,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.category,
    sku: product.slug,
    offers: product.price
      ? {
          "@type": "Offer",
          url: absoluteURL(`/san-pham/${product.slug}`),
          priceCurrency: "VND",
          price: schemaPrice,
          availability: schemaAvailability(product.stockStatus),
        }
      : undefined,
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

  return (
    <main className="subpage-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Sticky CTA bar */}
      <ProductStickyBar
        productName={product.title}
        price={product.price}
        email={settings.email}
        phone={phone}
        quoteHref={quoteMailHref(settings.email, `Yêu cầu báo giá ${product.title}`)}
        phoneHref={phoneHref(phone)}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="transition-colors hover:text-slate-800">Trang chủ</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <Link href="/san-pham" className="transition-colors hover:text-slate-800">Sản phẩm</Link>
        <ChevronRight size={14} className="text-slate-300" />
        <span className="truncate font-medium text-slate-900">{product.title}</span>
      </nav>

      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <section className="grid gap-8 lg:grid-cols-[480px_1fr] lg:items-start">
        {/* Left: Image gallery */}
        <div className="lg:sticky lg:top-20">
          <ProductImageGallery
            images={productImages}
            productName={product.title}
          />
        </div>

        {/* Right: Product info */}
        <div className="flex flex-col gap-6">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && (
              <span className="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-primary-700">
                {product.brand}
              </span>
            )}
            {product.tag && (
              <Badge variant={tagVariant(product.tag)}>{product.tag}</Badge>
            )}
            <Badge variant={stock.variant}>{stock.label}</Badge>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
              {product.title}
            </h1>
            {product.sku && (
              <p className="mt-1.5 text-sm text-slate-400">
                SKU: <span className="font-mono font-medium text-slate-600">{product.sku}</span>
              </p>
            )}
          </div>

          {/* Summary */}
          {product.detail && (
            <p className="leading-7 text-slate-600">{product.detail}</p>
          )}

          {/* Price block */}
          {(product.price || product.compareAtPrice) && (
            <div className="flex items-baseline gap-3">
              {product.price && (
                <span className="text-3xl font-extrabold text-accent-600">
                  {product.price}
                </span>
              )}
              {product.compareAtPrice && (
                <span className="text-base text-slate-400 line-through">
                  {product.compareAtPrice}
                </span>
              )}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="primary">
              <a href={quoteMailHref(settings.email, `Yêu cầu báo giá ${product.title}`)}>
                <Mail size={18} />
                Nhận báo giá ngay
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={phoneHref(phone)}>
                <PhoneCall size={18} />
                {phone}
              </a>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, label: "Hàng chính hãng" },
              { icon: BadgeCheck, label: "Phản hồi trong 15p" },
              { icon: Truck, label: "Tư vấn triển khai" },
              { icon: Wrench, label: "Bảo trì sau bán" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-center"
              >
                <Icon size={20} className="text-primary-600" />
                <span className="text-xs font-medium leading-tight text-slate-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Quick specs highlight — top 4 */}
          {specs.length > 0 && (
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Thông số nổi bật
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {specs.slice(0, 4).map((spec) => (
                  <div key={spec.label} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-500" />
                    <span>
                      <span className="text-slate-500">{spec.label}:</span>{" "}
                      <span className="font-semibold text-slate-900">{spec.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Sentinel for sticky bar */}
      <div id="product-hero-sentinel" />

      {/* ── TABS CONTENT ─────────────────────────────────────── */}
      <div className="mt-10 flex flex-col gap-8">

        {/* Full specs table */}
        {(specs.length > 0 || product.brand || product.category) && (
          <section>
            <SectionHeading>Thông số kỹ thuật</SectionHeading>
            <ProductSpecTable
              specs={specs}
              brand={product.brand}
              category={product.category}
              warranty={product.warranty}
              origin={product.origin}
              sku={product.sku}
            />
          </section>
        )}

        {/* Description */}
        {product.description && (
          <section>
            <SectionHeading>Mô tả chi tiết</SectionHeading>
            <div className="prose prose-slate max-w-none rounded-xl border border-slate-100 bg-white p-6">
              {/* Payload richText rendered as HTML — adjust if using Lexical renderer */}
              <div dangerouslySetInnerHTML={{ __html: product.description as string }} />
            </div>
          </section>
        )}

        {/* Datasheets / Downloads */}
        {product.datasheets && (product.datasheets as Array<{ url?: string; filename?: string; mimeType?: string }>).length > 0 && (
          <section>
            <SectionHeading>Tài liệu kỹ thuật</SectionHeading>
            <div className="grid gap-3 sm:grid-cols-2">
              {(product.datasheets as Array<{ url?: string; filename?: string; mimeType?: string }>).map((file, idx) =>
                file?.url ? (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    download
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-primary-300 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
                      <FileText size={20} className="text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {file.filename || `Tài liệu ${idx + 1}`}
                      </p>
                      <p className="text-xs text-slate-400">
                        {file.mimeType === "application/pdf" ? "PDF" : "Tệp đính kèm"}
                      </p>
                    </div>
                    <Download size={16} className="flex-shrink-0 text-slate-400" />
                  </a>
                ) : null
              )}
            </div>
          </section>
        )}

        {/* CTA Banner */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 p-8 text-white">
          <div className="relative z-10">
            <h2 className="text-xl font-bold">Cần tư vấn hoặc báo giá?</h2>
            <p className="mt-2 text-primary-200">
              Đội ngũ kỹ thuật HPT Tech sẵn sàng hỗ trợ bạn trong vòng 15 phút.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="md" className="bg-white text-primary-700 hover:bg-primary-50">
                <a href={quoteMailHref(settings.email, `Yêu cầu báo giá ${product.title}`)}>
                  <Mail size={16} />
                  Gửi yêu cầu báo giá
                </a>
              </Button>
              <Button asChild size="md" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50">
                <a href={phoneHref(phone)}>
                  <PhoneCall size={16} />
                  {phone}
                </a>
              </Button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -right-4 h-64 w-64 rounded-full bg-white/5" />
        </section>

      </div>

      {/* Back link */}
      <div className="mt-8">
        <Link
          href="/san-pham"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-primary-600"
        >
          <ArrowLeft size={15} />
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    </main>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-lg font-bold text-slate-900">
      {children}
    </h2>
  );
}
