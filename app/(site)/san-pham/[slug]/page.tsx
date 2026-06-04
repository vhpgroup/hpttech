import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Gauge,
  Headset,
  Network,
  Receipt,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { getProductBySlugFromPayload, getProductsFromPayload } from "@/lib/catalog-payload";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings, phoneHref, quoteMailHref } from "@/lib/site-settings";
import { Button } from "@/components/ui/Button";
import { ProductDetailTabs, type ProductDetailTab } from "@/components/product/ProductDetailTabs";
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import ProductPricingSection from "@/components/product/ProductPricingSection";
import { ProductSpecTable } from "@/components/product/ProductSpecTable";
import { ProductStickyBar } from "@/components/product/ProductStickyBar";
import AddToCartButton from "@/components/cart/AddToCartButton";

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

const trustItems = [
  { label: "Hàng chính hãng 100%", icon: BadgeCheck, color: "#16A34A" },
  { label: "Xuất VAT đầy đủ", icon: Receipt, color: "#2563EB" },
  { label: "Bảo hành chính hãng", icon: ShieldCheck, color: "#F59E0B" },
  { label: "Hỗ trợ kỹ thuật tận nơi", icon: Headset, color: "#7C3AED" },
  { label: "Đổi trả theo chính sách", icon: RefreshCw, color: "#0891B2" },
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

function stockLabel(stockStatus?: string) {
  if (stockStatus === "out_of_stock") return { label: "Hết hàng", variant: "danger" as const };
  if (stockStatus === "preorder") return { label: "Đặt trước", variant: "warning" as const };
  return { label: "Còn hàng", variant: "success" as const };
}

function normalizeText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

function escapeHTML(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHTML(value?: string) {
  if (!value) return "";
  return escapeHTML(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function inferProductType(category?: string) {
  const normalized = normalizeText(category);
  if (normalized.includes("scan")) return "scanner";
  if (normalized.includes("photo")) return "copier";
  if (normalized.includes("in")) return "printer";
  return "general";
}

function matchesAnyLabel(label: string, patterns: string[]) {
  const normalized = normalizeText(label);
  return patterns.some((pattern) => normalized.includes(pattern));
}

function pickQuickSpecs(specs: ProductSpec[], category?: string) {
  const presets: Record<string, string[]> = {
    printer: ["toc do", "duplex", "2 mat", "adf", "ket noi", "wifi", "lan", "usb"],
    scanner: ["toc do", "adf", "phan giai", "ket noi", "wifi", "lan", "usb"],
    copier: ["toc do", "kho giay", "duplex", "2 mat", "adf", "ket noi"],
    general: ["toc do", "hieu suat", "ket noi", "bao hanh"],
  };

  const type = inferProductType(category);
  const priority = presets[type];
  const selected: ProductSpec[] = [];
  const used = new Set<string>();

  for (const pattern of priority) {
    const match = specs.find((spec) => {
      const key = `${normalizeText(spec.label)}:${normalizeText(spec.value)}`;
      return !used.has(key) && matchesAnyLabel(spec.label, [pattern]);
    });

    if (!match) continue;

    const key = `${normalizeText(match.label)}:${normalizeText(match.value)}`;
    used.add(key);
    selected.push(match);
    if (selected.length === 4) break;
  }

  if (selected.length < 4) {
    for (const spec of specs) {
      const key = `${normalizeText(spec.label)}:${normalizeText(spec.value)}`;
      if (used.has(key)) continue;
      used.add(key);
      selected.push(spec);
      if (selected.length === 4) break;
    }
  }

  return selected;
}

function EmptyProductSection({ message }: { message: string }) {
  return (
    <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-500">
      {message}
    </div>
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
  const [product, rawSettings, allProducts] = await Promise.all([
    getProductBySlugFromPayload(slug),
    getSiteSettingsFromPayload(),
    getProductsFromPayload(),
  ]);

  if (!product) notFound();

  const settings = normalizeSiteSettings(rawSettings);
  const phone = settings.hotline || settings.phone;
  const quoteHref = quoteMailHref(settings.email, `Yêu cầu báo giá ${product.title}`);
  const productImages = (product.images ?? []).filter(
    (img): img is { id?: string | number; url: string; alt?: string } => Boolean(img?.url),
  );
  const specs = ((product.specs as ProductSpec[] | undefined) ?? []).filter(
    (spec) => spec.label?.trim() && spec.value?.trim(),
  );
  const quickSpecs = pickQuickSpecs(specs, product.category);
  const fallbackQuickSpecs = [
    { label: "Thương hiệu", value: product.brand },
    { label: "Danh mục", value: product.category },
    { label: "Bảo hành", value: product.warranty || "Liên hệ xác nhận" },
    { label: "Tình trạng", value: stockLabel(product.stockStatus).label },
  ].filter((item): item is ProductSpec => Boolean(item.value));
  const displayedQuickSpecs = quickSpecs.length ? quickSpecs : fallbackQuickSpecs;
  const schemaPrice = parseVNDPrice(product.price);
  const productDescription = product.description || product.detail;
  const assignedRelatedProducts = (product.relatedProducts ?? []).filter((item) => item.slug !== product.slug);
  const fallbackRelatedProducts = allProducts
    .filter((item) => item.slug !== product.slug)
    .filter((item) => item.category === product.category || item.brand === product.brand)
    .slice(0, 4);
  const broadRelatedProducts = allProducts.filter((item) => item.slug !== product.slug).slice(0, 4);
  const relatedProducts = (
    assignedRelatedProducts.length
      ? assignedRelatedProducts
      : fallbackRelatedProducts.length
        ? fallbackRelatedProducts
        : broadRelatedProducts
  ).slice(0, 4);
  const documents = (product.datasheets as
    | Array<{ id?: string | number; url?: string; filename?: string; mimeType?: string }>
    | undefined
  )?.filter((file) => Boolean(file?.url));

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
        <div
          className="rounded-[18px] bg-slate-50 p-6 text-[15px] leading-7 text-slate-700 [&_a]:font-semibold [&_a]:text-blue-700 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:mx-auto [&_img]:h-auto [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-3 [&_picture]:mx-auto [&_picture]:block [&_ul]:mb-4 [&_ol]:mb-4"
          dangerouslySetInnerHTML={{ __html: product.description || textToHTML(product.detail) }}
        />
      ) : (
        <EmptyProductSection message="Sản phẩm này chưa có mô tả chi tiết. Vui lòng bổ sung nội dung trong Payload CMS." />
      ),
    },
    {
      id: "usage-guide",
      label: "Hướng dẫn sử dụng",
      content: product.usageGuide ? (
        <div
          className="rounded-[18px] bg-slate-50 p-6 text-[15px] leading-7 text-slate-700 [&_a]:font-semibold [&_a]:text-blue-700 [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:mx-auto [&_img]:h-auto [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:mb-3 [&_picture]:mx-auto [&_picture]:block [&_ul]:mb-4 [&_ol]:mb-4"
          dangerouslySetInnerHTML={{ __html: product.usageGuide }}
        />
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

        <aside className="xl:sticky xl:top-24">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0057FF]">
              HPT TECH CAM KẾT
            </p>

            <div className="mt-5 space-y-4">
              {trustItems.map(({ label, icon: Icon, color }) => (
                <div key={label} className="group flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${color}1A`, color }}
                  >
                    <Icon size={20} strokeWidth={2.1} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[18px] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Hotline</p>
              <a href={phoneHref(phone)} className="mt-1 inline-flex text-2xl font-semibold text-slate-950">
                {phone}
              </a>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Button
                asChild
                size="md"
                variant="outline"
                className="justify-center rounded-xl border-slate-200"
                leftIcon={<Image src="/assets/icons/zalo.svg" alt="" width={20} height={20} className="h-5 w-5 object-contain" aria-hidden="true" />}
              >
                <a href={settings.zalo || phoneHref(phone)} target="_blank" rel="noreferrer">
                  Chat Zalo
                </a>
              </Button>
              <Button
                asChild
                size="md"
                className="justify-center rounded-xl bg-[#0057FF] hover:bg-[#0049d8]"
                leftIcon={<Send size={18} className="text-white" />}
              >
                <a href={quoteHref}>
                  Gửi yêu cầu
                </a>
              </Button>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-5 rounded-[20px] bg-white px-5 py-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {displayedQuickSpecs.map((spec) => {
              const Icon = pickQuickSpecIcon(spec.label);

              return (
                <div key={`${spec.label}-${spec.value}`} className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0057FF]/8 text-[#0057FF]">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{spec.label}</p>
                    <p className="mt-1 font-semibold text-slate-900">{spec.value}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <div id="product-hero-sentinel" />

      <section className="mt-6 rounded-[20px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0057FF]">Gợi ý phù hợp</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Sản phẩm liên quan</h2>
            </div>
            <Link href="/san-pham" className="text-sm font-semibold text-slate-500 transition-colors hover:text-[#0057FF]">
              Xem toàn bộ sản phẩm
            </Link>
          </div>
          {relatedProducts.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.map((item) => {
              const image = item.images?.[0]?.url || item.image;

              return (
                <article key={item.slug} className="flex min-h-[300px] flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <Link href={`/san-pham/${item.slug}`} className="grid h-36 place-items-center rounded-md bg-slate-50">
                    {image ? <Image src={image} alt={item.title} width={180} height={132} className="max-h-32 object-contain" /> : null}
                  </Link>
                  <div className="mt-4 flex flex-1 flex-col">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{item.brand}</p>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                      <Link href={`/san-pham/${item.slug}`}>{item.title}</Link>
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-orange-600">{item.price || "Liên hệ"}</p>
                    <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                      <AddToCartButton
                        product={item}
                        label="Thêm"
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                      />
                      <Link className="rounded-md bg-blue-700 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800" href={`/san-pham/${item.slug}`}>
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyProductSection message="Chưa có sản phẩm liên quan hoặc sản phẩm thay thế trong catalog." />
            </div>
          )}
        </section>

      <div className="mt-6">
        <ProductDetailTabs sections={tabSections} />
      </div>

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

function pickQuickSpecIcon(label: string) {
  const normalized = normalizeText(label);
  if (normalized.includes("toc do")) return Gauge;
  if (normalized.includes("2 mat") || normalized.includes("duplex")) return Copy;
  if (normalized.includes("adf")) return FileText;
  if (normalized.includes("ket noi") || normalized.includes("wifi") || normalized.includes("lan") || normalized.includes("usb")) {
    return Network;
  }
  return FileText;
}
