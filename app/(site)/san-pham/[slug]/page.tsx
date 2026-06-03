import Link from "next/link";
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
  Printer,
  Receipt,
  RefreshCw,
  ScanLine,
  Send,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import { getProductBySlugFromPayload } from "@/lib/catalog-payload";
import { getSiteSettingsFromPayload } from "@/lib/content-payload";
import type { CatalogProduct } from "@/lib/catalog";
import { absoluteURL, pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings, phoneHref, quoteMailHref } from "@/lib/site-settings";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductDetailTabs, type ProductDetailTab } from "@/components/product/ProductDetailTabs";
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

function tagVariant(tag?: string) {
  if (tag === "Mới") return "new" as const;
  if (tag === "Bán chạy") return "bestseller" as const;
  if (tag === "Cao cấp") return "premium" as const;
  return "neutral" as const;
}

function normalizeText(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
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

function inferDocumentType(filename?: string) {
  const normalized = normalizeText(filename);
  if (!normalized) return "Tài liệu";
  if (normalized.includes("windows")) return "Driver Windows";
  if (normalized.includes("mac")) return "Driver macOS";
  if (normalized.includes("manual") || normalized.includes("huong dan")) return "User Manual";
  if (normalized.includes("datasheet") || normalized.includes("catalog")) return "Datasheet";
  return "Tài liệu";
}

function deriveCapabilities(product: CatalogProduct) {
  const signals = [
    product.title,
    product.category,
    product.detail,
    ...(product.specs ?? []).flatMap((spec) => [spec.label, spec.value]),
  ]
    .filter(Boolean)
    .join(" ");
  const haystack = normalizeText(signals);
  const capabilities = [
    {
      key: "print",
      label: "In",
      icon: Printer,
      visible: /(^|\s)(print|printer|laserjet|may in|in mau|in den trang)/.test(haystack),
    },
    {
      key: "copy",
      label: "Copy",
      icon: Copy,
      visible: /(^|\s)(copy|sao chep|da nang|mfp)/.test(haystack),
    },
    {
      key: "scan",
      label: "Scan",
      icon: ScanLine,
      visible: /(^|\s)(scan|scanner|so hoa)/.test(haystack),
    },
    {
      key: "wifi",
      label: "WiFi",
      icon: Wifi,
      visible: /(^|\s)(wifi|wi-fi|wireless)/.test(haystack),
    },
  ];

  return capabilities.filter((item) => item.visible).slice(0, 4);
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
  const quoteHref = quoteMailHref(settings.email, `Yêu cầu báo giá ${product.title}`);
  const productImages = (product.images ?? []).filter(
    (img): img is { id?: string | number; url: string; alt?: string } => Boolean(img?.url),
  );
  const specs = ((product.specs as ProductSpec[] | undefined) ?? []).filter(
    (spec) => spec.label?.trim() && spec.value?.trim(),
  );
  const quickSpecs = pickQuickSpecs(specs, product.category);
  const capabilities = deriveCapabilities(product);
  const schemaPrice = parseVNDPrice(product.price);
  const stock = stockLabel(product.stockStatus);
  const productDescription = product.description || product.detail;
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
      ) : null,
    },
    {
      id: "description",
      label: "Mô tả sản phẩm",
      content: productDescription ? (
        <div className="rounded-[18px] bg-slate-50 p-6 text-[15px] leading-7 text-slate-700">
          {product.description ? (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : (
            <p>{product.detail}</p>
          )}
        </div>
      ) : null,
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
      ) : null,
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

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1.45fr)_minmax(280px,0.75fr)] xl:items-start">
        <div className="rounded-[20px] bg-white p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:p-5">
          <ProductImageGallery images={productImages} productName={product.title} />
        </div>

        <div className="space-y-5">
          <div className="rounded-[20px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {product.category ? (
                <span className="rounded-full bg-[#0057FF]/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0057FF]">
                  {product.category}
                </span>
              ) : null}
              {product.tag ? <Badge variant={tagVariant(product.tag)}>{product.tag}</Badge> : null}
              <Badge variant={stock.variant}>{stock.label}</Badge>
            </div>

            <div className="mt-4">
              <h1 className="text-3xl font-semibold leading-tight text-slate-950">
                {product.title}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                {product.sku ? (
                  <p>
                    Mã sản phẩm: <span className="font-medium text-slate-900">{product.sku}</span>
                  </p>
                ) : null}
                {product.brand ? (
                  <p>
                    Thương hiệu: <span className="font-medium text-slate-900">{product.brand}</span>
                  </p>
                ) : null}
              </div>
            </div>

            {capabilities.length ? (
              <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                {capabilities.map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                  >
                    <Icon size={16} className="text-[#0057FF]" />
                    {label}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-[20px] bg-white p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:p-6">
            <p className="text-sm text-slate-400">Giá bán</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <p className="text-3xl font-semibold text-slate-950">{product.price || "Liên hệ"}</p>
              {product.compareAtPrice ? (
                <p className="text-base text-slate-400 line-through">{product.compareAtPrice}</p>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="flex-1 rounded-xl bg-[#0057FF] hover:bg-[#0049d8]"
                leftIcon={<FileText size={20} className="text-white" />}
              >
                <a href={quoteHref}>
                  Nhận báo giá
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 bg-white text-slate-800 hover:border-[#2563EB]/45 hover:bg-[#2563EB]/5 hover:text-[#2563EB]"
                leftIcon={<Headset size={20} className="text-[#2563EB]" />}
              >
                <a href={phoneHref(phone)}>
                  Tư vấn ngay
                </a>
              </Button>
            </div>
          </div>
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
                leftIcon={<img src="/assets/icons/zalo.svg" alt="" className="h-5 w-5 object-contain" aria-hidden="true" />}
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

      {quickSpecs.length ? (
        <section className="mt-5 rounded-[20px] bg-white px-5 py-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/60 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickSpecs.map((spec) => {
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
      ) : null}

      <div id="product-hero-sentinel" />

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
