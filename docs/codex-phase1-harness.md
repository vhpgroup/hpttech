# HARNESS CHO CODEX — Phase 1 "Quick Wins" SEO/UX (hpttech.vn)

> Repo: `vhpgroup/hpttech` · Stack: Next.js 15 App Router + Payload CMS 3.85 + Postgres + R2 · TypeScript · Tailwind v4
> Tài liệu này là **đặc tả thực thi**. Mỗi task viết để Codex làm ĐỘC LẬP, đúng file thật, có tiêu chí nghiệm thu rõ ràng.
> Mọi đường dẫn, tên hàm, tên biến dưới đây đã đối chiếu với code thật trên nhánh chính.
> **T5 và T6 đã có diff drop-in hoàn chỉnh — Codex không cần "tự mở file đoán".**

---

## 0. Đọc trước khi làm (bắt buộc)

1. **AGENTS.md là luật.** Khi mâu thuẫn, AGENTS.md thắng.
2. **Build KHÔNG bắt lỗi** (`eslint.ignoreDuringBuilds` + `typescript.ignoreBuildErrors` = true). Gate thật là 2 lệnh ở "Definition of Done".
3. **Không hardcode màu/font.** Dùng token Tailwind (`primary-*`, `accent-*`, `surface`, `ink`, `border`). Code cũ có chỗ dùng hex thô (`bg-[#0A4BFF]`, `#4F64E8`) — ĐỪNG bắt chước; code mới dùng token `primary-600/700`.
4. **Không sửa tay `payload-types.ts`** — chỉ regenerate qua `npm run payload -- generate:types` (chỉ T6 đụng tới).
5. **Không chạy script ghi dữ liệu / không `PAYLOAD_DB_PUSH=true` trên prod** (liên quan T6 & T8).
6. **Nội dung hiển thị = tiếng Việt**, giọng B2B, dấu chuẩn. Ảnh luôn `next/image` + `alt` tiếng Việt.
7. Làm **từng task một**, commit nhỏ, mỗi task 1 nhánh/PR. Thứ tự: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8.

### Definition of Done (mọi task)
```bash
npm run typecheck          # phải sạch (0 lỗi)
npm run lint               # phải sạch (--max-warnings=0)
npm run build              # bắt buộc với task đụng route/UI (T1–T5, T7)
```
- Đụng schema Payload (T6): thêm `npm run payload -- generate:types` rồi commit `payload-types.ts`.

---

## T1 — Thêm thẻ `<h1>` cho Trang chủ và Trang danh mục
**Ưu tiên:** Tác động CAO · Công sức THẤP

### Vấn đề
`app/(site)/page.tsx` và `app/(site)/san-pham/page.tsx` **không render `<h1>`** (trang chủ 0×h1, chỉ h2/h3). Trang chi tiết SP đã có `<h1>` trong `ProductPricingSection.tsx` — KHÔNG đụng.

### Việc cần làm
1. `app/(site)/page.tsx` — thêm đúng 1 `<h1>` (sr-only, không phá layout):
```tsx
return (
  <>
    <h1 className="sr-only">
      Máy scan, máy in &amp; thiết bị văn phòng chính hãng cho doanh nghiệp — HPT Tech
    </h1>
    <HomePageClient
      initialProducts={products}
      categories={categories}
      initialBanners={banners}
      initialSolutions={solutions}
      quoteEmail={settings.email}
    />
  </>
);
```
2. `app/(site)/san-pham/page.tsx` — `<h1>` động theo bộ lọc:
```tsx
const parsed = parseProductsSearchParams(resolvedSearchParams);
const result = await getProductSearchPageFromPayload(parsed);

const heading = parsed.search
  ? `Kết quả tìm kiếm: “${parsed.search}”`
  : parsed.category
    ? parsed.category
    : "Tất cả sản phẩm";

return (
  <Suspense fallback={null}>
    <h1 className="sr-only">{heading} — Máy scan, máy in &amp; thiết bị văn phòng | HPT Tech</h1>
    <ProductListClient … />
  </Suspense>
);
```
3. Mở `components/ProductListClient.tsx`: nếu đã có tiêu đề là `<h1>`, đổi thành `<h2>` — đảm bảo **chỉ 1 `<h1>`/trang**.

### Acceptance / verify
- `view-source` `/` và `/san-pham` có **đúng 1** `<h1>`. PDP vẫn 1 `<h1>` (không hồi quy).
- `npm run build`; `curl -s http://localhost:3000/ | grep -o '<h1' | wc -l` → `1`.

---

## T2 — Structured data sản phẩm: thêm `aggregateRating` + chuẩn hóa `offers`
**Ưu tiên:** Tác động CAO · Công sức THẤP

### Vấn đề (đã đối chiếu code)
Trong `app/(site)/san-pham/[slug]/page.tsx`, `productSchema`: **thiếu `aggregateRating`** (dù `product.rating`/`product.reviewCount` đã có), và `offers` chỉ thêm khi `product.price` có giá → SP "Liên hệ" mất `availability`.

### Việc cần làm — thay khối `const productSchema = {…}` bằng:
```tsx
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
```

### Ràng buộc / cạm bẫy
- **Chỉ bật `aggregateRating` khi review THẬT.** Nếu `rating`/`reviewCount` là số mồi/seed → KHÔNG đẩy ra schema (Google cấm rating giả). Điều kiện `hasReviews` đã chặn khi =0; phải đảm bảo dữ liệu là thật.
- SP không giá: Offer trên hợp lệ schema.org (có `availability`, không `price`); Google có thể *cảnh báo* thiếu price (warning, không phải error). Nếu muốn 0 cảnh báo → chỉ thêm `offers` khi có `schemaPrice`. Ghi lựa chọn vào PR.

### Verify
- Rich Results Test (https://search.google.com/test/rich-results) cho 1 PDP có review → có `aggregateRating`, không lỗi đỏ. `curl PDP | grep -o aggregateRating`.

---

## T3 — Schema toàn site (Organization + WebSite) & ảnh OG mặc định
**Ưu tiên:** Tác động CAO · Công sức THẤP

### Vấn đề
Trang chủ/layout **0 JSON-LD** (thiếu Organization + WebSite searchbox). `lib/seo.ts` chỉ set ảnh khi truyền `image` → trang chủ + nhiều trang **thiếu `og:image`**.

### Việc cần làm
**(a) og:image mặc định** — sửa `lib/seo.ts` trong `pageMetadata`:
```ts
const DEFAULT_OG_IMAGE = "/assets/og/hpttech-og.jpg"; // 1200x630, đặt trong /public
const resolvedImage = image || DEFAULT_OG_IMAGE;
const images = [{ url: absoluteURL(resolvedImage), width: 1200, height: 630 }];
// dùng `images` cho openGraph.images; twitter.images = [absoluteURL(resolvedImage)];
// twitter.card = "summary_large_image".
```
> Tạo file `public/assets/og/hpttech-og.jpg` (1200×630). Ảnh /public không cần khai báo `remotePatterns`.

**(b) Organization + WebSite** — tạo `components/seo/SiteJsonLd.tsx`:
```tsx
import { absoluteURL, siteURL } from "@/lib/seo";
import { normalizeSiteSettings } from "@/lib/site-settings";

type Settings = ReturnType<typeof normalizeSiteSettings>;

export default function SiteJsonLd({ settings }: { settings: Settings }) {
  const org = {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
```
Mount trong `app/(site)/layout.tsx` ngay sau `<body>` (đã có sẵn `settings`):
```tsx
<body>
  <SiteJsonLd settings={settings} />
  {/* … phần còn lại … */}
```

### Verify
`curl -s http://localhost:3000/ | grep -o 'og:image'` → có; `grep -o '"@type":"WebSite"'` → có; Rich Results Test không lỗi.

---

## T4 — Khối "Cam kết HPT Tech" (xuất VAT) trên trang sản phẩm
**Ưu tiên:** Tác động CAO · Công sức THẤP

### Vấn đề
PDP chỉ hiện trạng thái VAT nhỏ `[Giá đã có VAT]`. Chưa có khối làm nổi USP B2B: **xuất hóa đơn VAT, chính hãng 100%, bảo hành, giao toàn quốc**.

### Việc cần làm
Trong `app/(site)/san-pham/[slug]/page.tsx`, thêm card lên ĐẦU cột `aside` (dùng token, không hex). `Check` đã import sẵn:
```tsx
<div className="overflow-hidden rounded-xl bg-white shadow-[0_16px_34px_-28px_rgba(15,23,42,0.24)] ring-1 ring-slate-200/70">
  <div className="bg-primary-600 px-4 py-3">
    <h2 className="text-sm font-bold uppercase text-white">Cam kết HPT Tech</h2>
  </div>
  <ul className="space-y-2 px-4 py-4">
    {[
      "Xuất hóa đơn VAT đầy đủ cho doanh nghiệp",
      "Hàng chính hãng 100% — nguyên seal",
      "Bảo hành chính hãng theo nhà sản xuất",
      "Giao hàng toàn quốc, hỗ trợ kỹ thuật",
    ].map((item) => (
      <li key={item} className="flex items-start gap-2 text-sm leading-5 text-slate-700">
        <Check size={16} className="mt-0.5 shrink-0 text-accent-600" strokeWidth={3} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
</div>
```
> Nếu `accent-600` chưa khớp token cam trong `globals.css`, dùng token cam đang có. Verify: `npm run build` + xem PDP desktop & mobile.

---

## T5 — Sửa mega-menu hiện bộ lọc "placeholder" giả  ✅ DROP-IN HOÀN CHỈNH
**Ưu tiên:** Tác động CAO · Công sức THẤP (phần code)

### Gốc rễ (đã đọc cả luồng dữ liệu)
- `lib/catalog-payload.ts → loadProductCategoryNavFromPayload()` **đã dựng `children` ĐÚNG** từ quan hệ cha/con của collection `categories` (lọc `parentId`, gán vào `children`). Tức code loader KHÔNG sai.
- Vấn đề ở `components/home/CategoryPanel.tsx`: khi `category.children.length === 0`, `buildMegaColumns()` trả về `defaultMegaColumns` = **menu GIẢ cứng** ("Theo nhu cầu / HP-Brother-Epson-Ricoh / Thiết bị"). Vì đa số danh mục **chưa có danh mục con trong Payload** → ~18 danh mục cùng hiện 1 menu giả giống hệt (vd "Camera & An ninh" cũng hiện brand máy in).

→ **2 phần:** (A) sửa CODE để hết menu giả — *drop-in dưới đây*; (B) làm giàu menu là việc **DỮ LIỆU** (tạo danh mục con trong Payload), KHÔNG cần code (loader tự đổ children).

### (A) CODE — sửa `components/home/CategoryPanel.tsx` (3 thay đổi)

**A1. XÓA toàn bộ block `const defaultMegaColumns: MegaColumn[] = [ … ];`** (khoảng 30 dòng, ngay trên `const scannerMegaColumns`). Không dùng nữa.

**A2. Thay hàm `buildMegaColumns`** — bỏ nhánh trả `defaultMegaColumns`, trả `[]` khi không có children:
```tsx
function buildMegaColumns(category: ProductCategoryNavItem): MegaColumn[] {
  if (category.name.trim().toLowerCase() === "máy scan") {
    return scannerMegaColumns;
  }

  // Danh mục chưa có danh mục con trong Payload → KHÔNG hiện menu giả nữa.
  if (!category.children.length) {
    return [];
  }

  const columnCount = Math.min(3, category.children.length);
  const chunkSize = Math.ceil(category.children.length / columnCount);
  const columns: MegaColumn[] = [];

  for (let index = 0; index < category.children.length; index += chunkSize) {
    const chunk = category.children.slice(index, index + chunkSize);
    columns.push({
      title: index === 0 ? category.name : `Nhóm ${columns.length + 1}`,
      links: chunk.map((child) => ({
        label: child.name,
        href: categoryLandingHref(child),
      })),
    });
  }

  return columns;
}
```

**A3. Chỉ render mega-panel khi có cột thật** — sửa phần `categories.map(...)` trong `CategoryPanel`:
```tsx
{categories.map((category, index) => {
  const megaColumns = buildMegaColumns(category);
  return (
    <article
      className="category-item"
      key={category.slug || category.name}
      style={{ ["--menu-index" as string]: index } as CSSProperties}
    >
      <Link href={categoryLandingHref(category)}>
        {getCategoryIcon(category.icon || "")}
        <span>{category.name}</span>
      </Link>
      {megaColumns.length > 0 ? <CategoryMegaPanel columns={megaColumns} /> : null}
    </article>
  );
})}
```
> Sau khi xóa `defaultMegaColumns`, chạy `npm run lint` để chắc không còn biến/định danh thừa.

### (B) DỮ LIỆU (tùy chọn, để menu phong phú — KHÔNG cần code)
Trong Payload admin → collection **Categories**: tạo các **danh mục con** và set trường **`parent`** trỏ về danh mục cha (vd cha "Máy in" → con "Máy in laser", "Máy in phun", "Máy in màu"). Loader sẽ tự đưa vào `children` và mega-menu hiện cột thật. Đây là việc nội dung; không nằm trong code Phase 1.

### Acceptance / verify
- Hover danh mục chưa có con → **không** còn menu giả; "Máy scan" giữ menu chi tiết; danh mục có con (nếu đã tạo) hiện đúng.
- `npm run lint` sạch (không còn `defaultMegaColumns`); `npm run build` ok.

---

## T6 — Hotline "Kế toán – Hóa đơn VAT" + giờ làm việc  ✅ DROP-IN · ⚠️ ĐỤNG SCHEMA PAYLOAD
**Ưu tiên:** Tác động TRUNG BÌNH · Công sức THẤP–TRUNG BÌNH

### Vấn đề
`SiteSettings` chỉ có `phone`/`hotline` chung. Đối thủ Hoàng Phát có **đường dây "Kế toán – Hóa đơn" riêng + giờ làm rõ ràng** — đúng nhu cầu kế toán DN. Thêm 3 trường: `accountingHotline`, `salesProjectHotline`, `workingHours`.

> Luồng dữ liệu (đã đọc): `loadSiteSettingsFromPayload()` **ép kiểu cả global** `as PublicSiteSettings` (không map từng field) → chỉ cần thêm field vào (1) type `PublicSiteSettings`, (2) `defaultSiteSettings`, (3) global Payload — field tự chảy ra `settings`. `normalizeSiteSettings` spread default+settings nên field mới tự có.

### Sửa 5 file (drop-in)

**6.1 `lib/content-payload.ts`** — thêm 3 field vào cuối type `PublicSiteSettings` (trước dấu `}` đóng, sau `footerNote?: string;`):
```ts
  footerNote?: string;
  accountingHotline?: string;
  salesProjectHotline?: string;
  workingHours?: string;
};
```

**6.2 `lib/site-settings.ts`** — thêm 3 key vào cuối `defaultSiteSettings` (BẮT BUỘC vì type là `Required<PublicSiteSettings>`):
```ts
  footerNote: "Thiết bị văn phòng, máy scan, máy in và giải pháp số hóa tài liệu cho doanh nghiệp.",
  accountingHotline: "",
  salesProjectHotline: "",
  workingHours: "T2–T7: 8:00–17:30",
};
```
> KHÔNG cần sửa `normalizeSiteSettings` (đã spread default). Đoạn ép `phone`/`hotline` cuối hàm giữ nguyên.

**6.3 `globals/SiteSettings.ts`** — (a) thêm 3 key vào object return của `applyDefaultSettings` (sau `footerNote: …`):
```ts
    footerNote: doc.footerNote || defaultSiteSettings.footerNote,
    accountingHotline: doc.accountingHotline || defaultSiteSettings.accountingHotline,
    salesProjectHotline: doc.salesProjectHotline || defaultSiteSettings.salesProjectHotline,
    workingHours: doc.workingHours || defaultSiteSettings.workingHours,
  };
```
(b) thêm 3 field vào cuối mảng `fields` (sau field `footerNote`):
```ts
    { name: "accountingHotline", label: "Hotline Kế toán - Hóa đơn VAT", type: "text" },
    { name: "salesProjectHotline", label: "Hotline Bán hàng Dự án / Doanh nghiệp", type: "text" },
    { name: "workingHours", label: "Giờ làm việc", type: "text", defaultValue: "T2–T7: 8:00–17:30" },
  ],
};
```

**6.4 `components/layout/Header.tsx`** — trong `div.utility-topbar`, thay khối `<span>` giờ làm (đang hardcode "8:00 - 17:30") và thêm dòng kế toán. `Clock`, `FileText` đã import sẵn:
```tsx
    <span>
      <Clock size={14} />
      {settings.workingHours || "8:00 - 17:30"}
    </span>
    {settings.accountingHotline ? (
      <a href={phoneHref(settings.accountingHotline)}>
        <FileText size={14} />
        Kế toán - Hóa đơn: {settings.accountingHotline}
      </a>
    ) : null}
    <a href={phoneHref(phone)}>
      <PhoneCall size={14} />
      {phone}
    </a>
```

**6.5 `components/layout/Footer.tsx`** — (a) thêm `Clock` vào import lucide (hiện CHƯA có):
```ts
import {
  BadgeCheck,
  Building2,
  ChevronUp,
  Clock,
  FileText,
  Globe2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
```
(b) chèn 3 item vào mảng `contactItems` (giữ thứ tự hợp lý):
```tsx
  const contactItems: ContactItem[] = [
    { label: "Công ty", value: HPT_LEGAL_NAME, icon: Building2 },
    { label: "Mã số thuế", value: HPT_TAX_CODE, icon: FileText },
    { label: "Địa chỉ", value: "SB04 Vinhomes Marina, phường An Biên, thành phố Hải Phòng.", icon: MapPin },
    { label: "Hotline", value: phone, href: phoneHref(phone), icon: Phone },
    ...(settings.accountingHotline
      ? [{ label: "Kế toán - Hóa đơn VAT", value: settings.accountingHotline, href: phoneHref(settings.accountingHotline), icon: FileText } as ContactItem]
      : []),
    ...(settings.salesProjectHotline
      ? [{ label: "Bán hàng Dự án / DN", value: settings.salesProjectHotline, href: phoneHref(settings.salesProjectHotline), icon: Phone } as ContactItem]
      : []),
    { label: "Email", value: settings.email, href: `mailto:${settings.email}`, icon: Mail },
    ...(settings.workingHours
      ? [{ label: "Giờ làm việc", value: settings.workingHours, icon: Clock } as ContactItem]
      : []),
    { label: "Website", value: "hpttech.vn", href: "https://hpttech.vn", icon: Globe2 },
  ];
```

### ⚠️ Quy trình schema (AGENTS.md §8 & §10)
1. Sync schema ở **DB local**: migration Payload (ưu tiên) hoặc 1 lần `PAYLOAD_DB_PUSH=true` **CHỈ local**. **TUYỆT ĐỐI không** trên prod.
2. `npm run payload -- generate:types` → commit `payload-types.ts` đã regenerate.
3. Prod: field mới áp qua migration lúc deploy; không tự chạy script đụng DB prod.

### Acceptance / verify
- Admin hiện 3 field; điền giá trị → Header topbar + Footer hiển thị đúng (ẩn khi rỗng).
- `payload-types.ts` đã regenerate (có 3 field) và được commit.
- `npm run typecheck && npm run lint && npm run build` đều sạch.

---

## T7 — Xác minh & vá tối ưu ảnh (KHÔNG phải đổi component)
**Ưu tiên:** Tác động CAO · Công sức TRUNG BÌNH · *Cần xác minh runtime trước*

### Sự thật đã kiểm chứng
- `next.config.ts` cấu hình ảnh **ĐÚNG**: `formats: ["image/avif","image/webp"]`, `deviceSizes`, `imageSizes`, `remotePatterns`, **không** `unoptimized`.
- `ProductCard.tsx`, `HomeHeroClient.tsx` đều dùng `next/image` chuẩn (sizes/width/height/lazy/priority).
→ Nếu ảnh thiếu `srcset` ngoài prod thì do **runtime/deploy** (`/_next/image` không chạy trên Coolify/VPS, hoặc `sharp` thiếu trong bản `standalone`), HOẶC ảnh trong **rich-text mô tả** (raw `<img>` từ CMS).

### Việc cần làm
1. **Xác minh trên bản deploy thật:** `view-source` `/` + 1 PDP, kiểm tra ảnh next/image có `srcset` và URL `/_next/image?url=…&w=…` không. Mở thử `/_next/image?url=...&w=640&q=72` — lỗi 400/500 = optimizer hỏng.
2. **Nếu optimizer hỏng trên VPS:** đảm bảo `sharp` có trong image `standalone` (kiểm Dockerfile/nixpacks copy `node_modules/sharp`); nếu không, dùng **custom loader Cloudflare/R2** (`images.loader="custom"` + `loaderFile`). Xác nhận với team hạ tầng.
3. **Ảnh rich-text (chắc chắn vá):** `ProductHTMLContent` (PDP) render `dangerouslySetInnerHTML` chứa `<img>` thô → thêm `loading="lazy"` + `decoding="async"` cho mọi `<img>` (hậu xử lý chuỗi HTML trước khi render).

### Acceptance / verify
- Kết luận rõ optimizer prod chạy hay không (kèm bằng chứng). Nếu hỏng → đã sửa, ảnh có `srcset`.
- Ảnh mô tả có `loading="lazy"`. Đo Lighthouse mobile `/` + 1 PDP, ghi LCP trước/sau vào PR. (`npm run build && npm run start`)

---

## T8 — (Phụ lục, KHÔNG phải code) Sửa lỗi dữ liệu thương hiệu
**Ưu tiên:** Trung bình · *Vấn đề DỮ LIỆU* · cần xác nhận DB

PDP "Máy Scan Fujitsu Fi-6110" gắn `brand="Ricoh"` (từ dữ liệu Payload, không phải code). Việc cần làm (KHÔNG tự chạy trên prod — AGENTS.md §10):
1. Script **dry-run** rà SP có `brand` lệch tên/`model`/slug (vd slug "fujitsu" nhưng brand "Ricoh"); xuất danh sách, KHÔNG ghi.
2. Người xác nhận quy tắc đúng → mới sửa (ưu tiên local/staging).
3. Cân nhắc mở rộng `npm run payload:audit-catalog` để bắt lỗi brand/category trong tương lai.

---

## Phụ lục A — Prompt sẵn-để-dán cho Codex
> Kèm câu: *"Tuân thủ AGENTS.md. Chạy `npm run typecheck` + `npm run lint` (và `npm run build` nếu đụng UI) trước khi xong. Không hardcode hex, dùng token Tailwind. Nội dung tiếng Việt."*

- **T1:** "Thêm 1 `<h1>` sr-only cho `app/(site)/page.tsx` và `<h1>` động theo bộ lọc cho `app/(site)/san-pham/page.tsx`; kiểm tra `components/ProductListClient.tsx` để không trùng h1."
- **T2:** "Trong `app/(site)/san-pham/[slug]/page.tsx` cập nhật `productSchema`: thêm `aggregateRating` khi reviewCount>0 & rating>0; `offers` luôn có `availability`+`itemCondition`+`seller`, `price` chỉ khi có. Test Rich Results."
- **T3:** "Thêm og:image mặc định trong `lib/seo.ts` (asset `public/assets/og/hpttech-og.jpg` 1200×630); tạo `components/seo/SiteJsonLd.tsx` (Organization+WebSite SearchAction) và mount trong `app/(site)/layout.tsx` ngay sau `<body>`."
- **T4:** "Thêm card 'Cam kết HPT Tech' (xuất VAT/chính hãng/bảo hành/giao toàn quốc) lên đầu cột aside trong PDP, dùng token `primary`/`accent`."
- **T5:** "Trong `components/home/CategoryPanel.tsx`: xóa hẳn `defaultMegaColumns`; `buildMegaColumns` trả `[]` khi category không có children; chỉ render `<CategoryMegaPanel>` khi `megaColumns.length>0`. Theo đúng diff T5 trong harness."
- **T6:** "Thêm field `accountingHotline`, `salesProjectHotline`, `workingHours` vào 5 file: `lib/content-payload.ts` (type), `lib/site-settings.ts` (defaults), `globals/SiteSettings.ts` (fields + applyDefaultSettings), `components/layout/Header.tsx` (utility-topbar), `components/layout/Footer.tsx` (contactItems, thêm import Clock). Migrate DB local, `npm run payload -- generate:types`, commit payload-types.ts. KHÔNG đụng DB prod. Theo đúng diff T6."
- **T7:** "Xác minh `/_next/image` chạy trên bản deploy (view-source tìm srcset); nếu hỏng sửa pipeline ảnh; thêm `loading=lazy` cho `<img>` trong rich-text mô tả sản phẩm. Báo cáo LCP trước/sau."
- **T8:** "Viết script dry-run rà SP sai `brand` (vd slug 'fujitsu' nhưng brand 'Ricoh'); KHÔNG ghi DB; xuất danh sách để người duyệt."

## Phụ lục B — Thứ tự & nhánh
| Task | Nhánh | Ghi chú |
|---|---|---|
| T1 | `seo/h1-home-listing` | drop-in |
| T2 | `seo/product-schema-rating` | drop-in |
| T3 | `seo/org-website-jsonld-og` | drop-in (+ cần tạo ảnh OG) |
| T4 | `ux/pdp-vat-commitment` | drop-in |
| T5 | `ux/megamenu-fix` | drop-in (code); data subcategory là việc nội dung |
| T6 | `feat/accounting-hotline` | drop-in 5 file; đổi schema → migrate + generate:types |
| T7 | `perf/image-verify` | xác minh runtime trước |
| T8 | `data/brand-audit` | việc dữ liệu, cần xác nhận DB |

T1–T6 đều đã là diff drop-in. T1–T4 độc lập (song song được). T5 code độc lập. T6 cần quy trình schema. T7 cần bản deploy. T8 tách hẳn (data).
