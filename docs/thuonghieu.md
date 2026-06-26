# Hướng dẫn Codex (v2) — /thuong-hieu trên Payload CMS: CRUD + trang chi tiết · hpttech.vn

## 0. Brief & điểm khác v1

Bạn là Codex trong repo `github.com/vhpgroup/hpttech` (Next.js 15 App Router + Payload CMS 3.85 + Postgres, Tailwind v4, TS). **Tuân thủ AGENTS.md tuyệt đối.**

**Mục tiêu (v2):** Quản lý chứng nhận ủy quyền bằng **Payload CMS** (thêm/sửa/xóa trong admin), trang danh sách `/thuong-hieu`, và mỗi chứng nhận click vào mở **trang chi tiết** `/thuong-hieu/[slug]` dạng bài viết (rich text).

**Khác với v1 (static):** thay mảng tĩnh `lib/brand-certificates.ts` bằng collection Payload `certifications` + helper trong `lib/content-payload.ts`. Bỏ file `lib/brand-certificates.ts` nếu đã tạo ở v1.

**Pattern bám theo (đã có sẵn trong repo — đọc để mô phỏng):**
- Collection: `collections/Posts.ts` (slug auto, `seoField`, hook `revalidateCollection`/`revalidateCollectionDelete`, `versions.drafts`, access đọc published).
- Helper đọc dữ liệu: `lib/content-payload.ts` (hàm `findDocs`, `textField`, `mediaURL`, `mediaImage`, `formatDate`, `unstable_cache`, `getPayloadClient`, `handlePayloadReadError`).
- Trang chi tiết + rich text: `app/(site)/tin-tuc/[...segments]/page.tsx` + `components/rich-text/PayloadRichText.tsx`.
- Breadcrumb/SEO: `components/layout/SubpageHeader.tsx` (`SubpageBreadcrumb`), `lib/seo.ts` (`pageMetadata`, `absoluteURL`).
- Revalidate: `lib/payload/hooks/revalidate.ts` POST tới `/api/revalidate`.

**Bắt buộc:** dùng token Tailwind (`primary-*`, `accent-*`, `surface`, `ink`, `border`, `shadow-soft`) — không hardcode màu; `next/image` + alt tiếng Việt; Server Component mặc định; gate `npm run typecheck` + `npm run lint` (0 warning) + `npm run build`.

## 1. Kiến trúc & danh sách file

**Tạo mới:**
1. `collections/Certifications.ts` — collection (CRUD admin).
2. `components/thuong-hieu/BrandCertificationsPage.tsx` — UI trang danh sách (card link tới chi tiết).
3. `components/thuong-hieu/CertificationDetail.tsx` — UI trang chi tiết (rich text).
4. `app/(site)/thuong-hieu/page.tsx` — route danh sách + metadata.
5. `app/(site)/thuong-hieu/[slug]/page.tsx` — route chi tiết + metadata + generateStaticParams.

**Sửa:**
6. `payload.config.ts` — đăng ký collection `Certifications`.
7. `lib/content-payload.ts` — thêm type + helper đọc certifications (+ thêm `"certifications"` vào union `PublicCollectionSlug`).
8. `app/api/revalidate/route.ts` — thêm nhánh xử lý collection `certifications` (để CRUD phản ánh ngay).
9. `components/layout/Navbar.tsx` + `components/layout/Header.tsx` — thêm link menu "Thương hiệu".
10. `app/sitemap/static/route.ts` — thêm `/thuong-hieu` + các URL `/thuong-hieu/{slug}`.
11. `payload-types.ts` — **được sinh tự động** sau khi chạy generate:types (KHÔNG sửa tay).

**Quy trình DB (quan trọng):** collection mới = đổi schema ⇒ phải generate types + tạo migration, chạy trên DB local/staging trước (xem Bước 2). KHÔNG bật `PAYLOAD_DB_PUSH=true` trên prod.

## 2. Bước 1 — Collection Certifications.ts

Tạo `collections/Certifications.ts` (mô phỏng `Posts.ts`):

```ts
import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

export const Certifications: CollectionConfig = {
  slug: "certifications",
  labels: { singular: "Chứng nhận ủy quyền", plural: "Chứng nhận ủy quyền" },
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return { status: { equals: "published" } };
    },
  },
  admin: {
    group: "Nội dung",
    useAsTitle: "brand",
    defaultColumns: ["brand", "kindLabel", "validTo", "sortOrder", "status"],
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;
        return {
          ...data,
          slug: data.slug || (data.brand ? formatSlug(String(data.brand)) : undefined),
        };
      },
    ],
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
  },
  versions: { drafts: true },
  fields: [
    { name: "brand", label: "Thương hiệu", type: "text", required: true },
    {
      name: "slug",
      label: "Đường dẫn (slug)",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "Để trống sẽ tự sinh từ tên thương hiệu. Ví dụ: microtek" },
      hooks: {
        beforeValidate: [({ data, value }) => value || (data?.brand ? formatSlug(String(data.brand)) : value)],
      },
    },
    {
      name: "kind",
      label: "Loại ủy quyền",
      type: "select",
      required: true,
      defaultValue: "uy-quyen",
      options: [
        { label: "Nhà phân phối độc quyền", value: "doc-quyen" },
        { label: "Đối tác chính thức", value: "doi-tac" },
        { label: "Nhà phân phối ủy quyền", value: "uy-quyen" },
      ],
    },
    { name: "kindLabel", label: "Nhãn loại (hiển thị)", type: "text", required: true, admin: { description: 'VD: "Nhà phân phối độc quyền"' } },
    { name: "image", label: "Ảnh giấy chứng nhận", type: "upload", relationTo: "media", required: true },
    { name: "logo", label: "Logo thương hiệu", type: "upload", relationTo: "media" },
    { name: "scope", label: "Phạm vi sản phẩm", type: "text" },
    { name: "territory", label: "Khu vực", type: "text", defaultValue: "Việt Nam" },
    { name: "validFrom", label: "Hiệu lực từ", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
    { name: "validTo", label: "Hiệu lực đến", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
    { name: "issuer", label: "Đơn vị cấp", type: "text" },
    { name: "certNo", label: "Số chứng nhận", type: "text" },
    { name: "summary", label: "Tóm tắt (card & meta description)", type: "textarea" },
    { name: "content", label: "Nội dung chi tiết (bài viết)", type: "richText" },
    {
      name: "gallery",
      label: "Hình ảnh bổ sung",
      type: "array",
      labels: { singular: "Ảnh", plural: "Ảnh" },
      fields: [{ name: "image", label: "Ảnh", type: "upload", relationTo: "media", required: true }],
    },
    { name: "featured", label: "Nổi bật", type: "checkbox", defaultValue: false },
    { name: "sortOrder", label: "Thứ tự hiển thị", type: "number", defaultValue: 0, admin: { position: "sidebar" } },
    seoField,
    {
      name: "status",
      label: "Trạng thái",
      type: "select",
      required: true,
      defaultValue: "draft",
      index: true,
      admin: { position: "sidebar" },
      options: [
        { label: "Bản nháp", value: "draft" },
        { label: "Đã xuất bản", value: "published" },
        { label: "Lưu trữ", value: "archived" },
      ],
    },
  ],
};
```

> Kiểm tra đường dẫn import `seoField`/`revalidate*`/`formatSlug` đúng như trong `collections/Posts.ts` (repo dùng đuôi `.ts` trong import nội bộ collection).

## 3. Bước 2 — Đăng ký + migration & types

**a) Đăng ký trong `payload.config.ts`:** import và thêm `Certifications` vào mảng `collections` (đặt cạnh `Posts`/nhóm nội dung):
```ts
import { Certifications } from "./collections/Certifications";
// ...
collections: [ /* ... */ Posts, Certifications, /* ... */ ],
```

**b) Generate types + migration — chạy trên DB LOCAL/STAGING, không phải prod (AGENTS.md mục 8 & 10):**
```bash
# 1) Regenerate payload-types.ts (KHÔNG sửa tay file này)
npm run generate:types        # hoặc: npx payload generate:types

# 2) Tạo migration cho bảng certifications
npx payload migrate:create add_certifications

# 3) Áp migration trên DB local để kiểm tra
npx payload migrate
```
Dùng đúng tên script có trong `package.json`/`docs/` của repo nếu khác. Commit cả file migration mới. Khi deploy, pipeline chạy `payload migrate` để áp lên prod — KHÔNG dùng db push trực tiếp lên prod.

**c) Sau generate:types**, kiểu `Certification` sẽ có trong `payload-types.ts`. Helper ở Bước 3 đọc qua lớp chuẩn hóa riêng nên không bắt buộc import kiểu generated, nhưng vẫn nên `typecheck` để chắc chắn.

## 4. Bước 3 — Helper trong content-payload.ts

Thêm vào **cuối** `lib/content-payload.ts` (tái dùng `findDocs`, `textField`, `mediaURL`, `mediaImage`, `relationDoc`, `formatDate`, `unstable_cache` đã có sẵn trong file). Và thêm `"certifications"` vào union `PublicCollectionSlug` ở đầu file.

```ts
// ===== Certifications (Thương hiệu & Chứng nhận) =====
export type PublicCertification = {
  brand: string;
  slug: string;
  href: string;
  kind: string;
  kindLabel: string;
  scope?: string;
  territory?: string;
  validFrom?: string;
  validTo?: string;
  validity?: string;
  issuer?: string;
  certNo?: string;
  summary?: string;
  image?: string;
  imageAlt?: string;
  logo?: string;
  orientation: "portrait" | "landscape";
  featured?: boolean;
  content?: unknown;
  gallery?: PublicAboutImage[];
};

function certValidity(doc: PayloadDoc): string | undefined {
  const from = formatDate(doc.validFrom);
  const to = formatDate(doc.validTo);
  if (from && to) return `${from} – ${to}`;
  return to || from;
}

function mediaOrientation(value: unknown): "portrait" | "landscape" {
  if (value && typeof value === "object") {
    const w = "width" in value && typeof (value as PayloadDoc).width === "number" ? (value as PayloadDoc).width as number : 0;
    const h = "height" in value && typeof (value as PayloadDoc).height === "number" ? (value as PayloadDoc).height as number : 0;
    if (w && h && w > h) return "landscape";
  }
  return "portrait";
}

function mapCertification(doc: PayloadDoc): PublicCertification {
  const slug = textField(doc, "slug") || "";
  const brand = textField(doc, "brand") || "";
  const kindLabel = textField(doc, "kindLabel") || "";
  return {
    brand,
    slug,
    href: `/thuong-hieu/${slug}`,
    kind: textField(doc, "kind") || "uy-quyen",
    kindLabel,
    scope: textField(doc, "scope"),
    territory: textField(doc, "territory"),
    validFrom: textField(doc, "validFrom"),
    validTo: textField(doc, "validTo"),
    validity: certValidity(doc),
    issuer: textField(doc, "issuer"),
    certNo: textField(doc, "certNo"),
    summary: textField(doc, "summary"),
    image: mediaURL(doc.image),
    imageAlt: mediaImage(doc.image)?.alt || `Giấy chứng nhận ${kindLabel} ${brand}`.trim(),
    logo: mediaURL(doc.logo),
    orientation: mediaOrientation(doc.image),
    featured: doc.featured === true,
  };
}

function mapCertificationDetail(doc: PayloadDoc): PublicCertification {
  return {
    ...mapCertification(doc),
    content: doc.content,
    gallery: Array.isArray(doc.gallery)
      ? doc.gallery.flatMap((item) => {
          const row = relationDoc(item);
          const image = row ? mediaImage(row.image) : undefined;
          return image ? [image] : [];
        })
      : [],
  };
}

async function loadCertificationsFromPayload(): Promise<PublicCertification[]> {
  const res = await findDocs("certifications", {
    sort: "sortOrder",
    where: { status: { equals: "published" } },
  });
  return res.docs.map(mapCertification);
}

export const getCertificationsFromPayload = unstable_cache(
  loadCertificationsFromPayload,
  ["certifications"],
  { revalidate: 300, tags: ["certifications"] },
);

async function loadCertificationBySlug(slug: string): Promise<PublicCertification | null> {
  const res = await findDocs("certifications", {
    limit: 1,
    where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }] },
  });
  const doc = res.docs[0];
  return doc ? mapCertificationDetail(doc) : null;
}

export async function getCertificationBySlugFromPayload(slug: string): Promise<PublicCertification | null> {
  const getCached = unstable_cache(
    () => loadCertificationBySlug(slug),
    ["certification-by-slug", slug],
    { revalidate: 300, tags: [`certification:${slug}`, "certifications"] },
  );
  return getCached();
}

export async function getCertificationSitemapEntries(): Promise<PublicSitemapEntry[]> {
  const res = await findDocs("certifications", {
    sort: "sortOrder",
    where: { status: { equals: "published" } },
  });
  return res.docs.map((doc) => ({ slug: textField(doc, "slug"), updatedAt: textField(doc, "updatedAt") }));
}
```

> `findDocs` mặc định `depth: 2` nên `image`, `logo`, `gallery.image` đều được populate (có `url`, `alt`, `width`, `height`).

## 5. Bước 4 — Revalidate (CRUD ăn ngay)

Hook `afterChange/afterDelete` của collection (gắn ở Bước 1) POST tới `/api/revalidate` với `{ collection: \"certifications\", slug }`. File **`app/api/revalidate/route.ts`** gom `tags`/`paths` vào Set rồi flush cuối hàm. Sửa 2 chỗ cho khớp đúng pattern hiện có:\n\n**a) Thêm vào object `collectionPaths` (đầu file):**\n```ts\nconst collectionPaths: Record<string, string[]> = {\n  // ...giữ nguyên các dòng cũ...\n  certifications: [\"/thuong-hieu\", \"/sitemap.xml\", \"/sitemap/static\"],\n};\n```\n\n**b) Thêm nhánh trong hàm POST, đặt cạnh các khối `if (collection === ...)` khác (TRƯỚC vòng flush `for (const tag of tags)...`):**\n```ts\nif (collection === \"certifications\") {\n  tags.add(\"certifications\");\n  if (slug) {\n    tags.add(`certification:${slug}`);\n    paths.add(`/thuong-hieu/${slug}`);\n  }\n}\n```\n\nKhông cần sửa phần cuối — route đã tự `revalidateTag` mọi tag trong `tags` và `revalidatePath` mọi path trong `paths`. Tag phải khớp tag dùng trong `unstable_cache` ở Bước 3 (`certifications`, `certification:${slug}`).\n\n> Kết quả: thêm/sửa/xóa hoặc đổi trạng thái published trong admin → `/thuong-hieu` và `/thuong-hieu/[slug]` cập nhật gần như tức thì (không phải chờ hết 300s). Yêu cầu env `REVALIDATE_SECRET` + `NEXT_PUBLIC_URL` đã có sẵn (route 401 nếu thiếu secret)."


## 6. Bước 5 — Trang danh sách + component

**`app/(site)/thuong-hieu/page.tsx`:**
```tsx
import { BrandCertificationsPage } from "@/components/thuong-hieu/BrandCertificationsPage";
import { getCertificationsFromPayload, getSiteSettingsFromPayload } from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export default async function ThuongHieuPage() {
  const [certifications, rawSettings] = await Promise.all([
    getCertificationsFromPayload(),
    getSiteSettingsFromPayload(),
  ]);
  return <BrandCertificationsPage certifications={certifications} settings={normalizeSiteSettings(rawSettings)} />;
}

export function generateMetadata() {
  return pageMetadata({
    title: "Thương hiệu & Chứng nhận ủy quyền chính hãng",
    description:
      "HPT Tech là nhà phân phối & đối tác ủy quyền chính hãng của Microtek, TP-Link, Joyusing, TTR... Cam kết hàng chính hãng 100%, bảo hành chuẩn hãng, xuất hóa đơn VAT.",
    path: "/thuong-hieu",
  });
}
```

**`components/thuong-hieu/BrandCertificationsPage.tsx`** (Server Component, card là `Link` tới chi tiết):
```tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleDollarSign, Network, PhoneCall, ShieldCheck, Truck } from "lucide-react";
import type { PublicCertification } from "@/lib/content-payload";
import type { normalizeSiteSettings } from "@/lib/site-settings";
import { phoneHref } from "@/lib/site-settings";

type Props = {
  certifications: PublicCertification[];
  settings: ReturnType<typeof normalizeSiteSettings>;
};

const kindBadgeClass: Record<string, string> = {
  "doc-quyen": "bg-amber-500",
  "doi-tac": "bg-primary-600",
  "uy-quyen": "bg-teal-600",
};
const trustChips = ["Chính hãng 100%", "Bảo hành chính hãng", "Xuất hóa đơn VAT", "Giao toàn quốc"];
const commitments = [
  { icon: BadgeCheck, title: "Hàng chính hãng 100%", desc: "Đầy đủ CO/CQ, nhập chính ngạch, truy xuất xuất xứ từ hãng." },
  { icon: ShieldCheck, title: "Bảo hành chuẩn hãng", desc: "Bảo hành theo chính sách hãng, đổi mới trong thời gian quy định." },
  { icon: Network, title: "Linh kiện & hỗ trợ kỹ thuật", desc: "Sẵn vật tư, phụ kiện và đội kỹ thuật triển khai – bảo trì tận nơi." },
  { icon: CircleDollarSign, title: "Giá dự án & VAT", desc: "Báo giá ưu đãi theo số lượng/dự án, xuất hóa đơn VAT đầy đủ." },
  { icon: Truck, title: "Giao hàng toàn quốc", desc: "Giao & lắp đặt trên 63 tỉnh thành, đồng hành lâu dài." },
];
const distributedBrands = ["Fujitsu", "Kodak", "ROWE", "CZUR", "Microtek", "Panasonic", "TP-Link", "Joyusing", "TTR", "Canon", "Epson", "Brother"];

export function BrandCertificationsPage({ certifications, settings }: Props) {
  const phone = settings.hotline || settings.phone;
  const stats = [
    { value: `${certifications.length}+`, label: "Thương hiệu ủy quyền", note: "Cập nhật liên tục" },
    { value: "100%", label: "Hàng chính hãng", note: "Đầy đủ CO/CQ" },
    { value: "VAT", label: "Xuất hóa đơn đầy đủ", note: "Giá tốt doanh nghiệp" },
    { value: "63", label: "Tỉnh thành phủ sóng", note: "Giao & lắp đặt tận nơi" },
  ];
  return (
    <main className="bg-surface text-ink">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute -right-32 -top-24 h-[520px] w-[520px] rounded-full bg-primary-600/30 blur-3xl" />
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 md:px-10 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-medium text-white/60">
            <Link href="/" className="transition hover:text-white">Trang chủ</Link>
            <span aria-hidden>›</span>
            <span className="text-white/80">Thương hiệu & Chứng nhận</span>
          </nav>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-primary-300">Thương hiệu & Đối tác ủy quyền</p>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-[1.12] tracking-tight md:text-5xl">
            Đối tác ủy quyền chính hãng của <span className="text-primary-300">các thương hiệu hàng đầu</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 md:text-lg">
            HPT Tech là nhà phân phối & đối tác ủy quyền chính thức của nhiều thương hiệu thiết bị văn phòng,
            máy scan và giải pháp số hóa. Mỗi giấy chứng nhận là cam kết hàng chính hãng 100%, bảo hành chuẩn hãng và hóa đơn VAT đầy đủ.
          </p>
          <ul className="mt-7 flex flex-wrap gap-3">
            {trustChips.map((chip) => (
              <li key={chip} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold">
                <BadgeCheck size={16} className="text-emerald-300" />{chip}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/lien-he" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent-500 px-6 text-sm font-bold text-white shadow-soft transition hover:bg-accent-600">Nhận tư vấn & báo giá<ArrowRight size={18} /></Link>
            {phone ? (
              <a href={phoneHref(phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/50 px-6 text-sm font-bold text-white transition hover:bg-white/10"><PhoneCall size={17} />Gọi ngay: {phone}</a>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-10 max-w-[1280px] px-6 md:px-10">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-soft md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="border-b border-r border-slate-100 px-6 py-6 last:border-r-0 md:border-b-0">
              <strong className="block text-3xl font-extrabold leading-none text-primary-600">{s.value}</strong>
              <span className="mt-2 block text-sm font-bold text-ink">{s.label}</span>
              <small className="mt-1 block text-xs text-slate-500">{s.note}</small>
            </div>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-[1280px] px-6 pt-14 md:px-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary-600">Hồ sơ năng lực</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-primary-800 md:text-3xl">Giấy chứng nhận ủy quyền chính hãng</h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">Các chứng nhận do chính hãng cấp trực tiếp cho Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT. Bấm vào từng mục để xem chi tiết.</p>
        </div>
        {certifications.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {certifications.map((cert) => (
              <Link key={cert.slug} href={cert.href} className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition hover:-translate-y-1 ${cert.orientation === "landscape" ? "md:col-span-2" : ""}`}>
                <div className="relative flex justify-center bg-gradient-to-b from-slate-100 to-slate-200/60 p-6">
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white ${kindBadgeClass[cert.kind] || "bg-primary-600"}`}>{cert.kindLabel}</span>
                  {cert.image ? (
                    <Image src={cert.image} alt={cert.imageAlt || `Giấy chứng nhận ${cert.brand}`} width={cert.orientation === "landscape" ? 900 : 460} height={cert.orientation === "landscape" ? 640 : 650} className="h-auto max-h-[340px] w-auto rounded-lg bg-white shadow-lg" />
                  ) : null}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-extrabold text-primary-800">{cert.brand}</h3>
                  <dl className="mt-4 space-y-2.5 text-sm">
                    {cert.scope ? <CertRow k="Phạm vi" v={cert.scope} /> : null}
                    {cert.territory ? <CertRow k="Khu vực" v={cert.territory} /> : null}
                    {cert.validity ? <CertRow k="Hiệu lực" v={cert.validity} strong /> : null}
                    {cert.issuer ? <CertRow k="Đơn vị cấp" v={cert.issuer} /> : null}
                  </dl>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary-600 group-hover:text-primary-800">Xem chi tiết chứng nhận<ArrowRight size={15} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-slate-500">Chưa có chứng nhận nào được đăng. Vui lòng thêm trong trang quản trị.</p>
        )}
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pt-14 md:px-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary-600">Cam kết HPT Tech</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-primary-800 md:text-3xl">Quyền lợi khi mua hàng chính hãng tại HPT</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {commitments.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="rounded-2xl border border-border bg-white p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><Icon size={22} /></span>
              <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pt-14 md:px-10">
        <div className="mb-6 max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wider text-primary-600">Hệ sinh thái thương hiệu</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-primary-800 md:text-3xl">Các thương hiệu HPT phân phối</h2>
        </div>
        <ul className="flex flex-wrap gap-3 rounded-2xl border border-border bg-white p-6">
          {distributedBrands.map((b) => (<li key={b} className="rounded-lg bg-slate-100 px-4 py-2 text-[15px] font-bold text-slate-700">{b}</li>))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-14 md:px-10">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-primary-700 to-primary-600 px-8 py-10 text-white shadow-soft md:flex-row md:items-center md:px-14">
          <div>
            <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight md:text-3xl">Cần tư vấn thiết bị chính hãng cho doanh nghiệp?</h2>
            <p className="mt-2 text-white/85">Đội ngũ HPT Tech hỗ trợ chọn cấu hình, báo giá dự án và xuất hóa đơn VAT nhanh chóng.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/lien-he" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-primary-700">Liên hệ tư vấn<ArrowRight size={16} /></Link>
            {phone ? <a href={phoneHref(phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-900 px-6 text-sm font-bold text-white"><PhoneCall size={16} />{phone}</a> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function CertRow({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="font-semibold text-slate-400">{k}</dt>
      <dd className={strong ? "font-bold text-primary-700" : "font-medium text-slate-700"}>{v}</dd>
    </div>
  );
}
```

## 7. Bước 6 — Trang chi tiết [slug] + component

**`app/(site)/thuong-hieu/[slug]/page.tsx`:**
```tsx
import { notFound } from "next/navigation";
import { CertificationDetail } from "@/components/thuong-hieu/CertificationDetail";
import {
  getCertificationBySlugFromPayload,
  getCertificationsFromPayload,
  getSiteSettingsFromPayload,
} from "@/lib/content-payload";
import { pageMetadata } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;
export const dynamicParams = true;

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const cert = await getCertificationBySlugFromPayload(slug);
  if (!cert) {
    return pageMetadata({ title: "Không tìm thấy chứng nhận", description: "Nội dung không tồn tại.", path: `/thuong-hieu/${slug}` });
  }
  return pageMetadata({
    title: `Chứng nhận ${cert.kindLabel} ${cert.brand}`,
    description: cert.summary || `HPT Tech là ${cert.kindLabel} ${cert.brand} tại ${cert.territory || "Việt Nam"}.`,
    path: cert.href,
    image: cert.image,
    type: "article",
  });
}

export default async function CertificationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [cert, all, rawSettings] = await Promise.all([
    getCertificationBySlugFromPayload(slug),
    getCertificationsFromPayload(),
    getSiteSettingsFromPayload(),
  ]);
  if (!cert) notFound();
  const related = all.filter((item) => item.slug !== cert.slug).slice(0, 3);
  return <CertificationDetail cert={cert} related={related} settings={normalizeSiteSettings(rawSettings)} />;
}
```

**`components/thuong-hieu/CertificationDetail.tsx`** (Server Component, render rich text qua `PayloadRichText`):
```tsx
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ExternalLink, PhoneCall } from "lucide-react";
import { PayloadRichText } from "@/components/rich-text/PayloadRichText";
import { SubpageBreadcrumb } from "@/components/layout/SubpageHeader";
import type { PublicCertification } from "@/lib/content-payload";
import { absoluteURL } from "@/lib/seo";
import type { normalizeSiteSettings } from "@/lib/site-settings";
import { phoneHref } from "@/lib/site-settings";

const kindBadgeClass: Record<string, string> = {
  "doc-quyen": "bg-amber-500",
  "doi-tac": "bg-primary-600",
  "uy-quyen": "bg-teal-600",
};

type Props = {
  cert: PublicCertification;
  related: PublicCertification[];
  settings: ReturnType<typeof normalizeSiteSettings>;
};

export function CertificationDetail({ cert, related, settings }: Props) {
  const phone = settings.hotline || settings.phone;
  const facts: Array<{ k: string; v?: string }> = [
    { k: "Thương hiệu", v: cert.brand },
    { k: "Loại ủy quyền", v: cert.kindLabel },
    { k: "Phạm vi", v: cert.scope },
    { k: "Khu vực", v: cert.territory },
    { k: "Hiệu lực", v: cert.validity },
    { k: "Đơn vị cấp", v: cert.issuer },
    { k: "Số chứng nhận", v: cert.certNo },
  ];
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Chứng nhận ${cert.kindLabel} ${cert.brand}`,
    image: cert.image ? [absoluteURL(cert.image)] : undefined,
    description: cert.summary,
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { name: "Trang chủ", item: absoluteURL("/") },
      { name: "Thương hiệu & Chứng nhận", item: absoluteURL("/thuong-hieu") },
      { name: cert.brand, item: absoluteURL(cert.href) },
    ].map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })),
  };

  return (
    <main className="subpage-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <SubpageBreadcrumb className="mb-4" items={[{ label: "Trang chủ", href: "/" }, { label: "Thương hiệu & Chứng nhận", href: "/thuong-hieu" }, { label: cert.brand }]} />

      <div>
        <span className={`inline-block rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white ${kindBadgeClass[cert.kind] || "bg-primary-600"}`}>{cert.kindLabel}</span>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-primary-800 sm:text-4xl">Chứng nhận {cert.kindLabel} {cert.brand}</h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-slate-500">
          {cert.issuer ? <span>Đơn vị cấp: <strong className="text-slate-700">{cert.issuer}</strong></span> : null}
          {cert.validity ? <span>Hiệu lực: <strong className="text-slate-700">{cert.validity}</strong></span> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,420px)_1fr]">
        {cert.image ? (
          <a href={cert.image} target="_blank" rel="noopener noreferrer" className="relative block rounded-2xl border border-border bg-white p-4 shadow-soft">
            <Image src={cert.image} alt={cert.imageAlt || `Giấy chứng nhận ${cert.brand}`} width={cert.orientation === "landscape" ? 900 : 560} height={cert.orientation === "landscape" ? 640 : 760} className="w-full rounded-lg shadow-md" />
            <span className="absolute bottom-7 right-7 inline-flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-3 py-2 text-xs font-bold text-white"><ExternalLink size={14} /> Xem bản gốc</span>
          </a>
        ) : null}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
          <div className="border-b border-slate-100 px-6 py-4 text-base font-extrabold text-primary-800">Thông tin chứng nhận</div>
          <dl className="px-6 py-2">
            {facts.filter((f) => f.v).map((f) => (
              <div key={f.k} className="grid grid-cols-[130px_1fr] gap-4 border-b border-dashed border-slate-100 py-3 text-sm last:border-b-0">
                <dt className="font-semibold text-slate-400">{f.k}</dt>
                <dd className="font-semibold text-slate-700">{f.v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-col gap-2.5 border-t border-slate-100 bg-surface px-6 py-5">
            <Link href="/lien-he" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-accent-500 px-5 text-sm font-bold text-white transition hover:bg-accent-600">Nhận tư vấn & báo giá {cert.brand}<ArrowRight size={17} /></Link>
            {phone ? <a href={phoneHref(phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-primary-600 px-5 text-sm font-bold text-primary-700 transition hover:bg-primary-50"><PhoneCall size={16} /> Hotline: {phone}</a> : null}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0 rounded-2xl border border-border bg-white p-6 shadow-soft sm:p-9">
          {cert.summary ? <p className="mb-6 border-l-4 border-primary-200 bg-primary-50/50 px-5 py-3 text-base italic leading-7 text-primary-900">{cert.summary}</p> : null}
          <PayloadRichText data={cert.content} />
          {cert.gallery && cert.gallery.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {cert.gallery.map((img, i) => (img.url ? <Image key={i} src={img.url} alt={img.alt || `Hình ảnh chứng nhận ${cert.brand} ${i + 1}`} width={600} height={420} className="w-full rounded-lg border border-border" /> : null))}
            </div>
          ) : null}
        </article>
        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-6 shadow-soft">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-primary-700">Cam kết HPT</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              <li>✓ Hàng chính hãng 100%, đầy đủ CO/CQ & VAT</li>
              <li>✓ Bảo hành theo tiêu chuẩn hãng</li>
              <li>✓ Linh kiện, vật tư & hỗ trợ kỹ thuật</li>
              <li>✓ Giá dự án ưu đãi, giao toàn quốc</li>
            </ul>
          </div>
        </aside>
      </div>

      {related.length ? (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-primary-800">Chứng nhận ủy quyền khác</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={item.href} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition hover:-translate-y-1">
                {item.image ? (
                  <div className="flex justify-center bg-gradient-to-b from-slate-100 to-slate-200/60 p-4">
                    <Image src={item.image} alt={item.imageAlt || `Chứng nhận ${item.brand}`} width={300} height={210} className="max-h-[150px] w-auto rounded-md shadow" />
                  </div>
                ) : null}
                <div className="p-5">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white ${kindBadgeClass[item.kind] || "bg-primary-600"}`}>{item.kindLabel}</span>
                  <h3 className="mt-2.5 text-base font-extrabold text-primary-800">{item.brand}</h3>
                  <span className="mt-1 inline-block text-sm font-bold text-primary-600 group-hover:text-primary-800">Xem chi tiết →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="my-12">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-primary-700 to-primary-600 px-8 py-10 text-white shadow-soft md:flex-row md:items-center md:px-14">
          <div>
            <h2 className="max-w-2xl text-2xl font-extrabold tracking-tight md:text-3xl">Cần tư vấn thiết bị chính hãng cho doanh nghiệp?</h2>
            <p className="mt-2 text-white/85">HPT Tech hỗ trợ chọn cấu hình, báo giá dự án và xuất hóa đơn VAT.</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/lien-he" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-bold text-primary-700">Liên hệ tư vấn<ArrowRight size={16} /></Link>
            {phone ? <a href={phoneHref(phone)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-900 px-6 text-sm font-bold text-white"><PhoneCall size={16} />{phone}</a> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
```

> `subpage-main` là class bố cục subpage có sẵn (xem trang tin-tức) — tự lo container/padding. `PayloadRichText` tự populate ảnh nhúng & xử lý null an toàn.

## 8. Bước 7 — Menu, sitemap, SEO

**Menu — `components/layout/Navbar.tsx`:** thêm vào mảng `navLinks` (sau "Giới thiệu"):
```ts
{ href: "/thuong-hieu", label: "Thương hiệu" },
```
**Menu mobile — `components/layout/Header.tsx`:** thêm cùng link vào danh sách menu mobile (mirror Navbar). (Tuỳ chọn) thêm vào `components/layout/Footer.tsx` cột liên kết nhanh.

**Sitemap — `app/sitemap/static/route.ts`:** thêm `/thuong-hieu` và lặp các URL chi tiết. Import helper và ghép vào danh sách URL tĩnh:
```ts
import { getCertificationSitemapEntries } from "@/lib/content-payload";
// ...trong GET, trước khi build XML:
const certs = await getCertificationSitemapEntries();
const certUrls = [
  { loc: `${base}/thuong-hieu` },
  ...certs.map((c) => ({ loc: `${base}/thuong-hieu/${c.slug}`, lastmod: c.updatedAt })),
];
// merge certUrls vào mảng <url> đang render (theo đúng cấu trúc file hiện có)
```
Mở file để khớp đúng cách nó tạo từng `<url>` (hàm escape + thẻ `<loc>`/`<lastmod>`), rồi chèn `certUrls` vào.

**SEO:** đã có `generateMetadata` ở cả 2 route. `pageMetadata` tự thêm canonical + OG. (Tuỳ chọn nâng cao: đọc field `seo` của record để override title/description nếu admin nhập — không bắt buộc cho v1.)

## 9. Bước 8 — Nhập 4 chứng nhận trong admin

Sau khi deploy schema (migration), vào **/admin → Chứng nhận ủy quyền → Create**. Trước tiên upload 4 ảnh đã chuẩn bị vào **Media** (hoặc upload trực tiếp ở field ảnh).

4 ảnh đã được tối ưu sẵn (đặt tên gợi ý): `microtek-2026.jpg`, `tp-link-omada-vigi-2026.jpg`, `joyusing-2026.jpg`, `ttr-2026.jpg`.

| brand | slug | kind | kindLabel | scope | validFrom→validTo | issuer | certNo |
|---|---|---|---|---|---|---|---|
| Microtek | microtek | doc-quyen | Nhà phân phối độc quyền | Máy scan Microtek (Consumer Scanners) | 01/06/2026 (năm 2026) | Microtek International, Inc. | — |
| TP-Link · Omada & VIGI | tp-link | doi-tac | Đối tác chính thức | Thiết bị mạng Omada & camera VIGI | 01/01/2026 → 31/12/2026 | TP-Link Technologies (VN) Co.,Ltd | — |
| Joyusing | joyusing | uy-quyen | Nhà phân phối ủy quyền | Thiết bị Joyusing (máy scan, máy chiếu vật thể) | 01/12/2025 → 30/11/2026 | Fujian Joyusing Technology Co., Ltd | — |
| TTR Entertainment | ttr | uy-quyen | Nhà phân phối ủy quyền | Toàn bộ dải sản phẩm (full series) | 01/09/2025 → 01/09/2026 | dhaudiotechnik · TTR Audio | 825370015 |

Nhập `summary` ngắn + viết `content` (bài chi tiết) cho từng mục, đặt `status = Đã xuất bản`, rồi Save. Đặt `sortOrder` để sắp thứ tự (vd Microtek=10, TP-Link=20...). Ảnh ngang (TTR) sẽ tự chiếm trọn hàng nhờ `orientation` suy ra từ kích thước ảnh.

## 10. Nghiệm thu & commit

**Gate bắt buộc:**
```bash
npm run typecheck   # 0 lỗi
npm run lint        # 0 warning (--max-warnings=0)
npm run build       # bắt buộc (route + RSC + Payload)
```

**Checklist:**
- [ ] Admin: thêm/sửa/xóa record `certifications` hoạt động; đổi `status` published/draft phản ánh ngoài site (nhờ revalidate).
- [ ] `/thuong-hieu` hiển thị card từ Payload; bấm card → `/thuong-hieu/[slug]`.
- [ ] Trang chi tiết render đúng: badge, bảng thông tin, ảnh (xem bản gốc), rich text, chứng nhận liên quan, CTA.
- [ ] Slug tự sinh từ brand; ảnh ngang chiếm trọn hàng; mọi `next/image` có alt tiếng Việt.
- [ ] `generateMetadata` ở cả 2 route; `/thuong-hieu` + các `/thuong-hieu/{slug}` có trong sitemap.
- [ ] Link "Thương hiệu" có ở menu desktop + mobile.
- [ ] Chỉ dùng token màu (`primary/accent/surface/ink/border/shadow-soft`); không hardcode hex.
- [ ] `payload-types.ts` được sinh tự động (không sửa tay); migration được commit.

**Branch & commit gợi ý:**
```
git checkout -b feat/thuong-hieu-payload-chung-nhan
git commit -m "feat(cms): collection certifications + trang /thuong-hieu và trang chi tiết"
```

> Nếu đã làm v1 (static): xóa `lib/brand-certificates.ts` và bản `BrandCertificationsPage.tsx` cũ (đè bằng bản ở Bước 5).
