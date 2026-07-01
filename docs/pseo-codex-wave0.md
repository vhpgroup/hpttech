# Kế hoạch Codex — Wave 0: Khung pSEO Máy scan (landing-pages)

> Repo `vhpgroup/hpttech`. **Tuân thủ `AGENTS.md`.** Wave 0 = dựng KHUNG. Sau Wave 0, thêm trang chỉ là thêm bản ghi trong Payload (seed nội dung đã có: `pseo-scanner-*-content.md` + `pseo-intro-*.md`).
> **Chốt quyết định:** dùng collection tổng quát **`landing-pages`** (không dùng `ScannerIndustrySolutions` scanner-only), để trụ 2–5 tái dùng. Wave 0 chỉ bật `pageType = product-facet`, `productGroup = may-scan`, dùng **Template A** cố định (đọc field cấu trúc). Thư viện block cho Template B/C/D để Phase sau.
> **Ràng buộc bắt buộc:** không hardcode màu/font (dùng token trong `app/globals.css`); KHÔNG sửa tay `payload-types.ts` (chạy `npm run payload -- generate:types`); KHÔNG `PAYLOAD_DB_PUSH=true` trên prod, dùng migration; gate DoD = `npm run typecheck && npm run lint && npm run build`.

---

## 0. Sơ đồ phụ thuộc & PR
`W1 tokens` ∥ `W2 taxonomy` → `W3 landing-pages` → `W4 lib` → `W5 Template A` → `W6 routes` → (`W7 sitemap`, `W8 RFQ`) → `W9 seed` → `W10 QA`.
- **PR1 (data nền):** W1, W2, W3, W4.
- **PR2 (giao diện):** W5, W6, W7.
- **PR3 (nối luồng + seed + QA):** W8, W9, W10.
Nhánh: `feat/pseo-wave0`.

---

## W1 — Token màu nhấn theo ngành (`app/globals.css`)
Thêm vào `@theme` (hoặc `:root`) bộ biến `--ind-*` và các block override theo `data-industry`. Trang chi tiết đặt `data-industry` ở wrapper; component đọc `var(--ind-600)`… KHÔNG hardcode hex trong JSX.

```css
/* trong app/globals.css */
[data-industry]{--ind-50:var(--color-primary-50);--ind-100:var(--color-primary-100);--ind-500:var(--color-primary-600);--ind-600:var(--color-primary-700);--ind-700:var(--color-primary-800)}
[data-industry="cong-an"]{--ind-500:#3b82f6;--ind-600:#1d4ed8;--ind-700:#1e3a8a;--ind-50:#eff6ff}
[data-industry="thue"]{--ind-500:#22c55e;--ind-600:#16a34a;--ind-700:#15803d;--ind-50:#f0fdf4}
[data-industry="hai-quan"]{--ind-500:#06b6d4;--ind-600:#0891b2;--ind-700:#155e75;--ind-50:#ecfeff}
[data-industry="kho-bac"]{--ind-500:#f59e0b;--ind-600:#b45309;--ind-700:#92400e;--ind-50:#fffbeb}
[data-industry="toa-an"]{--ind-500:#8b5cf6;--ind-600:#7c3aed;--ind-700:#5b21b6;--ind-50:#f5f3ff}
[data-industry="vien-kiem-sat"]{--ind-500:#f43f5e;--ind-600:#be123c;--ind-700:#9f1239;--ind-50:#fff1f2}
[data-industry="ubnd"]{--ind-500:#ef4444;--ind-600:#dc2626;--ind-700:#991b1b;--ind-50:#fef2f2}
[data-industry="van-thu-luu-tru"]{--ind-500:#78716c;--ind-600:#57534e;--ind-700:#44403c;--ind-50:#fafaf9}
[data-industry="benh-vien"]{--ind-500:#14b8a6;--ind-600:#0d9488;--ind-700:#0f766e;--ind-50:#f0fdfa}
[data-industry="truong-hoc"]{--ind-500:#fb923c;--ind-600:#ea580c;--ind-700:#c2410c;--ind-50:#fff7ed}
```
**Acceptance:** đổi `data-industry` → accent đổi; nhóm nhu cầu/thương hiệu không set thì fallback về primary (xanh).

---

## W2 — Taxonomy collections (`industries`, `scan-needs`) + tái dùng `brands`
Tạo 2 collection nhẹ; `brands` đã có nên KHÔNG tạo mới.

`collections/Industries.ts` (slug `industries`): fields `name` (text, required), `slug` (unique, `beforeValidate` dùng `formatSlug`), `icon` (text — Lucide), `accentKey` (text — khớp `data-industry`, vd `cong-an`), `sortOrder` (number). Hook revalidate.
`collections/ScanNeeds.ts` (slug `scan-needs`): `name`, `slug`, `icon`, `sortOrder`. Hook revalidate.

Đăng ký cả 2 trong `payload.config.ts`. **Acceptance:** admin thấy 2 collection; seed được 10 ngành + 10 nhu cầu (slug theo `pseo-architecture-toan-dien.md` §3).

---

## W3 — Collection `landing-pages` (`collections/LandingPages.ts`)

```ts
import type { CollectionConfig } from "payload";
import { seoField } from "../lib/payload/fields/seo.ts";
import { revalidateCollection, revalidateCollectionDelete } from "../lib/payload/hooks/revalidate.ts";
import { formatSlug } from "../lib/payload/utils/slugify.ts";

const FACET_SEGMENT = { industry: "nganh", need: "nhu-cau", brand: "hang" } as const;

export const LandingPages: CollectionConfig = {
  slug: "landing-pages",
  labels: { singular: "Landing pSEO", plural: "Landing pSEO" },
  access: { read: () => true },
  admin: { useAsTitle: "title", defaultColumns: ["title","productGroup","facetType","status","sortOrder"], group: "Nội dung website" },
  versions: { drafts: true },
  hooks: {
    afterChange: [revalidateCollection],
    afterDelete: [revalidateCollectionDelete],
    beforeChange: [({ data }) => {
      // Sinh pathname để query O(1) theo path + phục vụ sitemap
      if (data?.pageType === "product-facet" && data?.productGroup && data?.facetType && data?.facetSlug) {
        const seg = FACET_SEGMENT[data.facetType as keyof typeof FACET_SEGMENT];
        data.pathname = `/giai-phap/${data.productGroup}/${seg}/${data.facetSlug}`;
      }
      return data;
    }],
  },
  fields: [
    { name: "pageType", type: "select", defaultValue: "product-facet", required: true, options: [
      { label: "Product facet", value: "product-facet" },
      { label: "Digitization", value: "digitization" },
      { label: "IT solution", value: "it-solution" },
      { label: "Segment hub", value: "segment-hub" },
    ] },
    { name: "productGroup", type: "select", defaultValue: "may-scan", options: [
      { label: "Máy scan", value: "may-scan" }, { label: "Máy in", value: "may-in" }, { label: "Máy photocopy", value: "may-photocopy" } ] },
    { name: "facetType", type: "select", options: [
      { label: "Ngành", value: "industry" }, { label: "Nhu cầu", value: "need" }, { label: "Thương hiệu", value: "brand" } ] },
    { name: "facetSlug", type: "text", admin: { description: "vd cong-an, cccd, fujitsu — khớp slug taxonomy" } },
    { name: "industryRef", type: "relationship", relationTo: "industries", admin: { condition: (d) => d.facetType === "industry" } },
    { name: "needRef", type: "relationship", relationTo: "scan-needs", admin: { condition: (d) => d.facetType === "need" } },
    { name: "brandRef", type: "relationship", relationTo: "brands", admin: { condition: (d) => d.facetType === "brand" } },
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true,
      hooks: { beforeValidate: [({ data, value }) => value || (data?.facetSlug ?? (data?.title ? formatSlug(data.title) : value))] } },
    { name: "h1", type: "text" },
    { name: "intro", type: "richText" },
    { name: "painPoints", type: "array", labels: { singular: "Vấn đề/điểm mạnh", plural: "Vấn đề/điểm mạnh" }, fields: [{ name: "text", type: "text" }] },
    { name: "criteria", type: "array", fields: [{ name: "need", type: "text" }, { name: "spec", type: "text" }] },
    { name: "workflow", type: "array", fields: [{ name: "step", type: "text" }, { name: "detail", type: "textarea" }] },
    { name: "faqs", type: "array", fields: [{ name: "question", type: "text" }, { name: "answer", type: "textarea" }] },
    { name: "recommendedProducts", type: "relationship", relationTo: "products", hasMany: true },
    { name: "productQuery", type: "group", fields: [
      { name: "needsDuplex", type: "checkbox" }, { name: "needsA3", type: "checkbox" }, { name: "needsNetwork", type: "checkbox" },
      { name: "needsOcr", type: "checkbox" }, { name: "needsCardScan", type: "checkbox" }, { name: "needsPassport", type: "checkbox" },
      { name: "prefersFlatbed", type: "checkbox" }, { name: "largeFormat", type: "checkbox" }, { name: "wideFormat", type: "checkbox" },
      { name: "bookScanner", type: "checkbox" }, { name: "minDailyDuty", type: "number" }, { name: "minScanSpeedPpm", type: "number" },
      { name: "maxPaperSize", type: "select", options: ["A4","A3","A2","A1","A0"] },
      { name: "brands", type: "relationship", relationTo: "brands", hasMany: true } ] },
    { name: "relatedPages", type: "relationship", relationTo: "landing-pages", hasMany: true },
    { name: "pathname", type: "text", unique: true, admin: { readOnly: true, position: "sidebar" } },
    seoField,
    { name: "status", type: "select", defaultValue: "draft", options: [ { label: "Nháp", value: "draft" }, { label: "Xuất bản", value: "published" } ], admin: { position: "sidebar" } },
    { name: "sortOrder", type: "number", defaultValue: 0, admin: { position: "sidebar" } },
  ],
};
```
Đăng ký trong `payload.config.ts`. Sau đó **`npm run payload -- generate:types`** + tạo migration (`npm run payload -- migrate:create pseo_landing_pages`) và áp trên DB local. **Acceptance:** tạo được bản ghi, `pathname` tự sinh đúng, types cập nhật.

---

## W4 — Lib truy vấn & tiện ích (`lib/landing-pages.ts`)
Export:
- `FACET_SEGMENT` và `SEGMENT_FACET` (đảo chiều `nganh|nhu-cau|hang` → facetType).
- `getPublishedLandingPages(opts?: { productGroup?; facetType? })` — query Payload local API, `status=published`.
- `getLandingPageByPath(pathname)` → 1 doc hoặc null.
- `getScannersForQuery(productQuery, { limit=12 })` — dùng adapter `lib/catalog-payload.ts`; lọc sản phẩm `category` = máy scan, `status=published`, ánh xạ cờ → `lib/scanner-specs.ts` (bảng W4.1). Gộp `recommendedProducts` (ưu tiên) + tự khớp, khử trùng.
- `evaluateLandingCompleteness(doc)` & `meetsQualityGate(doc)` (theo phong cách `evaluateScannerSpecs`): đạt khi intro ≥ ~400 từ, `faqs.length ≥ 3`, `painPoints.length ≥ 3`, và (số sản phẩm hiển thị ≥ 3 **hoặc** facet=brand có ≥ 3 model của hãng).
- `landingAccentKey(doc)` → `industryRef.accentKey` nếu facet=industry, else null.
- `buildLandingMetadata(doc)` → gọi `pageMetadata()` (lib/seo.ts).

### W4.1 Ánh xạ productQuery → scanner-specs
| Cờ | Điều kiện trên `scannerSpecs` (Products) |
|---|---|
| needsDuplex | `duplexScan===true` hoặc có `scanSpeedDuplexIpm` |
| needsA3 / maxPaperSize | `maxPaperSize` chứa khổ yêu cầu |
| needsNetwork | `connectivity` chứa LAN/Ethernet/Network |
| needsOcr | `ocr===true` |
| needsCardScan | `plasticCardScan===true` |
| needsPassport | `passportScan===true` |
| prefersFlatbed | `scannerType` chứa Flatbed (ưu tiên xếp trước, không loại) |
| minDailyDuty | `dailyDuty >= value` |
| minScanSpeedPpm | `scanSpeedSimplexPpm >= value` *(cờ MỚI)* |
| largeFormat | khổ > A3 (A2/A1/A0) *(cờ MỚI — cần bổ sung field/logic)* |
| wideFormat | máy quét khổ rộng/bản vẽ *(cờ MỚI)* |
| bookScanner | `scannerType`/loại = book/overhead *(cờ MỚI)* |
| brands | `brand` ∈ danh sách |

> **Cờ MỚI** (`largeFormat`, `wideFormat`, `bookScanner`, `minScanSpeedPpm`) chưa có trong `lib/scanner-specs.ts`: bổ sung field tương ứng vào schema `scannerSpecs` (Products) hoặc dùng `scannerType`/`maxPaperSize` để suy ra. Ghi rõ cách suy luận trong `lib/landing-pages.ts`.

**Acceptance:** `getScannersForQuery` trả danh sách đúng theo cờ; `meetsQualityGate` trả boolean hợp lý.

---

## W5 — Template A (components `components/landing/`)
Component nhận `doc` + render cố định theo thứ tự (khớp mockup đã duyệt). Chỉ dùng token Tailwind + `var(--ind-*)`, tái dùng product card có sẵn.
- `LandingTemplateA.tsx` — bọc `<div data-industry={accentKey}>` và render: `Breadcrumb` → `Hero` (h1, intro lead, CTA báo giá) → `PainPoints` (từ `painPoints`) → `ProductGrid` (từ `getScannersForQuery`) → `CriteriaTable` (`criteria`) → `Workflow` (`workflow`) → `TrustBand` (tái dùng) → `Faq` (`faqs`) → `RelatedLinks` (`relatedPages` + auto theo facet) → `CtaQuote` (W8).
- Component con: `IndustryHero`, `PainPointGrid`, `LandingProductGrid`, `CriteriaTable`, `WorkflowSteps`, `FaqAccordion` (tái dùng nếu có), `RelatedLinks`, `CtaQuote`.
- JSON-LD: `lib/seo-jsonld.ts` (nếu chưa có) export `breadcrumbLd`, `faqLd`, `itemListLd`; nhúng trong Template A qua `<script type="application/ld+json">`. FAQ chỉ render schema khi `faqs.length ≥ 3`.

**Acceptance:** render đúng bố cục, responsive, đổi màu theo ngành, không hardcode màu.

---

## W6 — Routes (App Router, `app/(site)`)
1. `app/(site)/giai-phap/page.tsx` — **nâng cấp master hub**: liệt kê `getPublishedLandingPages()` gom theo `productGroup` (+ giữ nội dung Solutions cũ nếu cần). Card nhóm → link group hub.
2. `app/(site)/giai-phap/may-scan/page.tsx` — **group hub**: 3 khu Ngành / Nhu cầu / Thương hiệu từ `getPublishedLandingPages({ productGroup:"may-scan" })` gom theo `facetType`.
3. `app/(site)/giai-phap/may-scan/[facet]/[value]/page.tsx` — **detail**:
```ts
export async function generateStaticParams() {
  const pages = await getPublishedLandingPages({ productGroup: "may-scan" });
  return pages.map(p => ({ facet: FACET_SEGMENT[p.facetType], value: p.facetSlug }));
}
export async function generateMetadata({ params }): Promise<Metadata> {
  const page = await getLandingPageByPath(`/giai-phap/may-scan/${params.facet}/${params.value}`);
  if (!page) return {};
  const md = buildLandingMetadata(page);
  if (page.seo?.noIndex || !meetsQualityGate(page)) md.robots = { index: false, follow: true };
  return md;
}
export const revalidate = 3600; // + on-demand qua hook revalidate
export default async function Page({ params }) {
  const page = await getLandingPageByPath(`/giai-phap/may-scan/${params.facet}/${params.value}`);
  if (!page || page.status !== "published") notFound();
  return <LandingTemplateA doc={page} />;
}
```
Chỉ nhận `facet ∈ {nganh, nhu-cau, hang}`; giá trị khác → `notFound()`. **Acceptance:** 30 URL render đúng; metadata/canonical/OG chuẩn; gate → noindex khi thiếu.

---

## W7 — Sitemap
Tạo `app/sitemap/landing/route.ts` phát mọi `pathname` của landing `published` **đạt gate** (kèm `lastmod=updatedAt`), theo khuôn `app/sitemap/products/[id]`. **Đăng ký** nguồn này vào sitemap index `app/sitemap.xml/route.ts`. Thêm URL hub `/giai-phap/may-scan`. **Acceptance:** URL xuất hiện trong `sitemap.xml`; trang noindex KHÔNG vào sitemap.

---

## W8 — CTA → RFQ (tái dùng luồng báo giá)
`CtaQuote` gửi vào `app/api/quotes/submit` (đã có, lưu `QuoteRequests` + append Google Sheet — xem `docs/rfq-lead.md`). Bổ sung 2 field vào form/collection: `industry` (hoặc `facetSlug`) và `source="pseo-may-scan"` để sales biết nguồn lead. Nếu thêm field vào `QuoteRequests` → `generate:types` + migration. **Acceptance:** gửi form tạo được bản ghi `QuoteRequests` kèm industry/source; Google Sheet vẫn append đúng.

---

## W9 — Seed 30 trang
Nhập nội dung từ `pseo-scanner-nganh-content.md`, `pseo-scanner-nhucau-content.md`, `pseo-scanner-thuonghieu-content.md` + intro dài từ `pseo-intro-*.md`. Ưu tiên qua admin hoặc script `scripts/seed-landing-pages.ts` (guard xác nhận DB/env trước khi ghi). Gán `recommendedProducts` thật theo catalog. **Acceptance:** 30 bản ghi, ≥ số đạt gate được publish; còn lại để draft/noindex.

---

## W10 — QA & Definition of Done
```bash
npm run typecheck && npm run lint && npm run build
npm run payload -- generate:types   # sau khi thêm collections
# migration đã tạo & áp local (KHÔNG push prod)
```
Kiểm: 30 URL render + breadcrumb + canonical + OG; JSON-LD qua Rich Results Test (Breadcrumb/FAQ); URL đạt gate có trong sitemap; CTA tạo `QuoteRequests`; Lighthouse SEO ≥ 95; đổi màu theo ngành hoạt động; Fujitsu vs Ricoh canonical riêng, nội dung khác.

---

## Danh sách file
**Mới:** `collections/Industries.ts`, `collections/ScanNeeds.ts`, `collections/LandingPages.ts`, `lib/landing-pages.ts`, `lib/seo-jsonld.ts` (nếu chưa có), `components/landing/*`, `app/(site)/giai-phap/may-scan/page.tsx`, `app/(site)/giai-phap/may-scan/[facet]/[value]/page.tsx`, `app/sitemap/landing/route.ts`, `scripts/seed-landing-pages.ts`, `migrations/xxxx_pseo_landing_pages.ts`.
**Sửa:** `payload.config.ts` (đăng ký 3 collection), `app/(site)/giai-phap/page.tsx` (master hub), `app/sitemap.xml/route.ts` (thêm nguồn landing), `app/globals.css` (token `--ind-*`), `app/api/quotes/submit` + `collections/QuoteRequests.ts` (industry/source), `lib/scanner-specs.ts` (cờ mới), `payload-types.ts` (chỉ qua generate).

## Ngoài phạm vi Wave 0 (Phase sau)
Thư viện block cho Template B/C/D (số hóa, CNTT, segment hub); route trụ 2–5 (`/giai-phap/so-hoa`, `/cntt`, `/nganh/[doi-tuong]`); trang PT2 combo & PT3 facet; nhóm "Máy quét mã vạch" (Zebra).

---

## PHỤ LỤC — Rà soát bổ sung trước khi code (đọc kỹ)

Các điểm dưới đây bịt lỗ hổng của W1–W10; ưu tiên [BLOCKER] > [NÊN SỬA] > [TÙY].

### A. Dữ liệu & Payload (toàn vẹn)
- **[BLOCKER] `facetSlug` phải DERIVE từ `facetRef`, không nhập tay.** Trong `beforeChange`, đọc slug của `industryRef|needRef|brandRef` theo `facetType` để set `facetSlug` + `pathname`. Thêm `validate` bảo đảm đúng ref được chọn theo `facetType` (tránh facetSlug "cong-an" nhưng ref trỏ "thue").
- **[BLOCKER] Uniqueness đặt trên `pathname`, KHÔNG unique toàn cục trên `slug`.** `slug` có thể trùng giữa các facet/nhóm (vd need `a3` và tương lai). Giữ `pathname` unique là đủ.
- **[BLOCKER] Chỉ dùng MỘT cơ chế publish.** Đang vừa bật `versions.drafts` (sinh `_status`) vừa có field `status` thủ công → trùng. Chọn: dùng draft built-in của Payload (`_status`) và query `where._status = 'published'`; BỎ field `status`. Đảm bảo `access.read` lọc bản nháp khỏi API công khai.
- **[BLOCKER] Xác định đúng "danh mục máy scan" trong `Categories`** (slug/id thực tế) để `getScannersForQuery` lọc đúng — chưa chốt trong W4. Codex phải đọc `collections/Categories.ts` + dữ liệu để lấy đúng khóa.
- **[NÊN SỬA] Cờ productQuery mới = thay đổi schema Products.** Nếu không suy luận được từ `scannerType`/`maxPaperSize`, phải THÊM field (`largeFormat`, `wideFormat`, `bookScanner`, `scanSpeedSimplexPpm` nếu chưa có) vào `scannerSpecs` → kèm migration + `generate:types`. Coi đây là task schema, không chỉ sửa lib.

### B. Route & render
- **[BLOCKER] `export const dynamicParams = true`** ở `[facet]/[value]` để thêm bản ghi trong CMS hiển thị mà không cần rebuild (kết hợp ISR + on-demand revalidate).
- **[NÊN SỬA] Fallback màu nhấn:** trang nhu cầu/thương hiệu không set `data-industry` → component phải dùng `var(--ind-600, var(--color-primary-700))` để không mất màu.
- **[NÊN SỬA] Validate segment:** `facet ∈ {nganh,nhu-cau,hang}` → `notFound()` nếu khác. `/giai-phap/may-scan/nganh` (thiếu value) → redirect về group hub hoặc `notFound()`.
- **[TÙY] Xác nhận** `/giai-phap` (segment tĩnh) không bị `app/(site)/[slug]` (StaticPages catch-all) nuốt — Next ưu tiên segment tĩnh, chỉ cần kiểm tra.

### C. SEO
- **[NÊN SỬA] robots.txt** (`app/robots.txt/route.ts`): cho phép `/giai-phap/*`, trỏ tới `sitemap.xml`. Trang chưa đạt gate chỉ dùng **meta robots noindex** — KHÔNG chặn trong robots.txt (phải cho crawl để đọc được thẻ noindex).
- **[NÊN SỬA] Fujitsu vs Ricoh:** mỗi trang **self-canonical**, KHÔNG canonical chéo sang nhau; chỉ khác nội dung. (Tránh hiểu nhầm "canonical về 1 trang".)
- **[NÊN SỬA] Hub phải indexable** (master + group) — không dính noindex.
- **[TÙY] OG image:** Wave 0 dùng OG mặc định của site (`pageMetadata`); bổ sung ảnh riêng theo ngành/hãng ở phase sau. FAQPage schema vẫn hợp lệ nhưng Google hạn chế hiển thị rich result FAQ — giữ schema, không kỳ vọng luôn hiện.

### D. Edge case UI & dữ liệu thực tế
- **[BLOCKER] Chỉ tạo/publish trang thương hiệu cho hãng HPT THẬT SỰ phân phối.** Rà catalog: nếu không bán (vd Visioneer) thì để draft/noindex, tránh trang rỗng sản phẩm. Trang hãng có < 3 model thật → không đạt gate.
- **[NÊN SỬA] Empty-state ProductGrid:** khi `getScannersForQuery` trả 0 sản phẩm (vd A0 wide-format chưa có hàng) → hiển thị link danh mục máy scan + CTA báo giá thay vì lưới trống; trang tự noindex qua gate.
- **[NÊN SỬA] Revalidate cụ thể:** hook khi 1 landing đổi phải revalidate path trang đó + `/giai-phap` + `/giai-phap/may-scan` + route sitemap (không chỉ revalidate chung).

### E. Checklist migration (bổ sung, chạy local — KHÔNG push prod)
1. `industries` + `scan-needs` + `landing-pages`.
2. `QuoteRequests` thêm `industry` + `source`.
3. (Nếu thêm cờ) `Products.scannerSpecs` field mới.
Sau MỖI thay đổi schema: `npm run payload -- generate:types`. DoD cuối: `npm run typecheck && npm run lint && npm run build`.

### F. Ánh xạ nội dung seed → field (để W9 không nhầm)
- File `pseo-scanner-*-content.md`: `title`, `seo.title`→`seo.title`, `seo.description`→`seo.description`, `productQuery`.
- File `pseo-intro-*.md`: nội dung → field `intro` (richText, chia đoạn).
- `painPoints`/`benefits` → `painPoints[]`; `criteria`→`criteria[]`; `workflow`→`workflow[]`; `faqs`→`faqs[]`; brand `lineup` → 1 đoạn trong `intro` hoặc mục riêng trong Template A (brand).