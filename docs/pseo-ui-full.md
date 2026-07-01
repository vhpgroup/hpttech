# Spec UI TRỌN BỘ — Cụm pSEO Máy scan (hpttech.vn)

> Gộp toàn bộ UI để đưa Codex làm 1 lần. Stack: Next.js 15 App Router + Tailwind v4 (token trong `app/globals.css`). KHÔNG hardcode màu/font — dùng token `primary-*/accent-*/surface/ink/border` + biến `--ind-*`.
> Đối chiếu mockup: `landing-giai-phap.html` (hub) và `landing-benh-vien.html` (trang chi tiết). Đọc kèm `pseo-codex-wave0.md` (khung dữ liệu) + `landing-pages-seed.json` (30 trang) + `seed-landing-pages.ts`.

## Mục lục
1. **PHẦN 1 — Master hub `/giai-phap`**: token `--ind-*`, `getHubData()`, route + component `GiaiPhapHub` (Hero + thống kê + filter + khối Máy scan 3 nhóm), và khác biệt so với bản Codex đang dựng.
2. **PHẦN 2 — Group hub `/giai-phap/may-scan` + Trang chi tiết (Template A)**: component dùng chung (JsonLd, Breadcrumb, TrustBand, FaqAccordion, CtaQuote, ScanProductCard), group hub, route chi tiết + `LandingTemplateA`, ghi chú triển khai.

**Thứ tự thực thi:** Wave 0 (khung) → seed 30 trang → dựng UI theo file này → gán sản phẩm + publish.

---

# PHẦN 1 — MASTER HUB `/giai-phap`


> Cho Codex. Hiện trạng đang dựng: breadcrumb + 1 banner "PSEO MÁY SCAN" + 4 card giải pháp cũ → CHƯA đủ.
> Mục tiêu: dựng `/giai-phap` giống mockup `landing-giai-phap.html`: **Hero + thống kê + bộ lọc theo nhóm + khối Máy scan gồm 3 nhóm con (10 ngành có màu nhấn · 10 nhu cầu · 10 thương hiệu)** + các trụ khác (số hóa/CNTT…) ở trạng thái lộ trình + giữ 4 card giải pháp doanh nghiệp cũ ở section riêng.
> Stack: Next.js 15 App Router (RSC) + Tailwind v4 (token trong `app/globals.css`). KHÔNG hardcode màu/font — dùng token `primary-*/accent-*/surface/ink/border` và biến `--ind-*` (W1).

---

## 1. Bố cục khối (khớp mockup, từ trên xuống)
1. **Breadcrumb**: Trang chủ › Giải pháp.
2. **Hero** (nền `bg-gradient` xanh nhạt→trắng): eyebrow pill "TRUNG TÂM GIẢI PHÁP"; H1 "Giải pháp số hóa theo ngành"; lead 1–2 dòng; **hàng 3 thống kê** (số lớn màu primary-700 + nhãn); 2 nút CTA (accent "Tư vấn & báo giá", ghost "Xem giải pháp máy scan").
3. **Filter chips** (client): Tất cả · Máy scan · Số hóa · CNTT · Đối tượng · Dự án → ẩn/hiện nhóm.
4. **Nhóm "Máy scan"** (count "30 trang" + link "Hub máy scan"): 3 nhóm con
   - **Theo ngành (10)** — lưới card có **màu nhấn từng ngành** (viền trên + icon tint theo `--ind-*`).
   - **Theo nhu cầu (10)** — lưới thẻ gọn (icon + tên + url nhỏ).
   - **Theo thương hiệu (10)** — hàng chip.
5. **Nhóm lộ trình**: Số hóa tài liệu / CNTT / Theo đối tượng / Dự án — badge "Sắp ra mắt" + vài chip đại diện.
6. **Giải pháp doanh nghiệp (cũ)**: giữ 4 card Hạ tầng CNTT / An ninh & Camera / Hội nghị / Giáo dục ở 1 section riêng (đừng bỏ).
7. **Trust band** + **CTA cuối**.

---

## 2. Dữ liệu (RSC) — `lib/landing-pages.ts`
```ts
// Trả các trang landing đã publish, gom theo productGroup -> facetType
export async function getHubData() {
  const payload = await getPayload({ config: await configPromise })
  const { docs } = await payload.find({
    collection: 'landing-pages', where: { _status: { equals: 'published' } },
    depth: 1, limit: 200, sort: 'sortOrder',
  })
  const scan = { industry: [] as any[], need: [] as any[], brand: [] as any[] }
  for (const d of docs) if (d.productGroup === 'may-scan' && scan[d.facetType]) scan[d.facetType].push(d)
  return { scan }
}
// Mỗi item cần: title, pathname, seo?.description (mô tả ngắn), facetSlug,
// accentKey (industryRef.accentKey), icon (industryRef.icon | needRef.icon).
```

---

## 3. Token màu nhấn theo ngành — `app/globals.css` (W1, nhắc lại)
```css
[data-industry="cong-an"]{--ind-600:#1d4ed8;--ind-700:#1e3a8a;--ind-50:#eff6ff}
[data-industry="thue"]{--ind-600:#16a34a;--ind-700:#15803d;--ind-50:#f0fdf4}
[data-industry="hai-quan"]{--ind-600:#0891b2;--ind-700:#155e75;--ind-50:#ecfeff}
[data-industry="kho-bac"]{--ind-600:#b45309;--ind-700:#92400e;--ind-50:#fffbeb}
[data-industry="toa-an"]{--ind-600:#7c3aed;--ind-700:#5b21b6;--ind-50:#f5f3ff}
[data-industry="vien-kiem-sat"]{--ind-600:#be123c;--ind-700:#9f1239;--ind-50:#fff1f2}
[data-industry="ubnd"]{--ind-600:#dc2626;--ind-700:#991b1b;--ind-50:#fef2f2}
[data-industry="van-thu-luu-tru"]{--ind-600:#57534e;--ind-700:#44403c;--ind-50:#fafaf9}
[data-industry="benh-vien"]{--ind-600:#0d9488;--ind-700:#0f766e;--ind-50:#f0fdfa}
[data-industry="truong-hoc"]{--ind-600:#ea580c;--ind-700:#c2410c;--ind-50:#fff7ed}
[data-industry]{--ind-600:var(--color-primary-700);--ind-700:var(--color-primary-800);--ind-50:var(--color-primary-50)} /* fallback */
```

---

## 4. Route — `app/(site)/giai-phap/page.tsx` (RSC)
```tsx
import { getHubData } from '@/lib/landing-pages'
import { pageMetadata } from '@/lib/seo'
import { GiaiPhapHub } from '@/components/solutions/GiaiPhapHub'

export const revalidate = 3600
export function generateMetadata() {
  return pageMetadata({
    title: 'Giải pháp số hóa theo ngành | Máy scan & thiết bị văn phòng',
    description: 'Trung tâm giải pháp HPT Tech: máy scan theo ngành/nhu cầu/thương hiệu, số hóa tài liệu, giải pháp CNTT cho cơ quan nhà nước, bệnh viện, ngân hàng, trường học.',
    path: '/giai-phap',
  })
}
export default async function Page() {
  const data = await getHubData()
  return <GiaiPhapHub scan={data.scan} />
}
```

---

## 5. Component chính — `components/solutions/GiaiPhapHub.tsx` (client, có filter)
```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'

type Item = { title: string; pathname: string; desc?: string; facetSlug: string; accentKey?: string; icon?: string }
type Props = { scan: { industry: Item[]; need: Item[]; brand: Item[] } }

const FILTERS = [
  { f: 'all', label: 'Tất cả' }, { f: 'may-scan', label: 'Máy scan' },
  { f: 'so-hoa', label: 'Số hóa tài liệu' }, { f: 'cntt', label: 'Giải pháp CNTT' },
  { f: 'doi-tuong', label: 'Theo đối tượng' }, { f: 'du-an', label: 'Dự án' },
]

export function GiaiPhapHub({ scan }: Props) {
  const [f, setF] = useState('all')
  const show = (g: string) => f === 'all' || f === g
  const stat = scan.industry.length + scan.need.length + scan.brand.length

  return (
    <div className="text-ink">
      {/* breadcrumb */}
      <div className="mx-auto max-w-[1200px] px-5">
        <nav className="py-4 text-[13.5px] text-slate-500">
          <Link href="/" className="hover:text-primary-700">Trang chủ</Link> ›{' '}
          <span className="font-semibold text-primary-700">Giải pháp</span>
        </nav>
      </div>

      {/* HERO */}
      <section className="border-b border-border bg-[linear-gradient(135deg,#eff6ff_0%,#fff_60%)]">
        <div className="mx-auto max-w-[1200px] px-5 py-11">
          <span className="inline-block rounded-full bg-primary-50 px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-primary-700">
            Trung tâm giải pháp
          </span>
          <h1 className="my-3.5 max-w-[780px] text-[40px] font-black leading-[1.15] tracking-[-0.02em]">
            Giải pháp số hóa theo ngành
          </h1>
          <p className="max-w-[740px] text-[18px] text-slate-600">
            Tổng hợp giải pháp thiết bị &amp; số hóa của HPT Tech theo nhóm sản phẩm, nhu cầu và ngành —
            cho cơ quan nhà nước, công an, thuế, hải quan, bệnh viện, trường học, ngân hàng…
          </p>
          <div className="my-6 flex flex-wrap gap-8">
            {[[String(stat), 'Trang máy scan'], ['5', 'Nhóm giải pháp'], ['100+', 'Trang lộ trình']].map(([n, l]) => (
              <div key={l}>
                <div className="text-[28px] font-black text-primary-700">{n}</div>
                <div className="text-[13px] font-semibold text-slate-500">{l}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3.5">
            <a href="#lien-he" className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-3.5 text-[15px] font-bold text-white hover:bg-accent-600">Tư vấn &amp; báo giá dự án →</a>
            <a href="#scan" className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3.5 text-[15px] font-bold text-primary-700 hover:border-primary-600">Xem giải pháp máy scan</a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 py-12">
        {/* FILTER */}
        <div className="flex flex-wrap gap-2.5">
          {FILTERS.map((x) => (
            <button key={x.f} onClick={() => setF(x.f)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${f === x.f ? 'border-primary-700 bg-primary-700 text-white' : 'border-border bg-white text-slate-700 hover:border-primary-600 hover:text-primary-700'}`}>
              {x.label}
            </button>
          ))}
        </div>

        {/* NHÓM MÁY SCAN */}
        {show('may-scan') && (
          <section id="scan" className="mt-9">
            <div className="mb-1.5 flex flex-wrap items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-[22px] text-primary-700">🖨️</span>
              <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">Máy scan</h2>
              <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[12.5px] font-bold text-primary-700">{stat} trang</span>
              <Link href="/giai-phap/may-scan" className="ml-auto text-sm font-bold text-primary-700 hover:underline">Hub máy scan →</Link>
            </div>

            <SubLabel>Theo ngành — {scan.industry.length} trang</SubLabel>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
              {scan.industry.map((p) => (
                <Link key={p.pathname} href={p.pathname} data-industry={p.accentKey}
                  className="group flex min-h-[150px] flex-col gap-2 rounded-[14px] border border-border bg-white p-4 transition [border-top:3px_solid_var(--ind-600)] hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-28px_rgba(30,58,138,0.45)]">
                  <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--ind-50)] text-[20px] text-[color:var(--ind-700)]">{p.icon ? '' : '🏛️'}</span>
                  <h3 className="text-[14.5px] font-bold leading-tight">{p.title}</h3>
                  <p className="flex-1 text-[12px] text-slate-500">{p.desc}</p>
                  <span className="truncate font-mono text-[10.5px] text-slate-400">{p.pathname.replace('/giai-phap/may-scan', '')}</span>
                </Link>
              ))}
            </div>

            <SubLabel>Theo nhu cầu — {scan.need.length} trang</SubLabel>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {scan.need.map((p) => (
                <Link key={p.pathname} href={p.pathname}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-semibold hover:border-primary-600 hover:text-primary-700">
                  <span className="text-[19px]">🗂️</span>
                  <span>{p.title}<small className="block font-mono text-[11px] font-normal text-slate-400">{p.pathname.replace('/giai-phap/may-scan', '')}</small></span>
                </Link>
              ))}
            </div>

            <SubLabel>Theo thương hiệu — {scan.brand.length} trang</SubLabel>
            <div className="flex flex-wrap gap-2.5">
              {scan.brand.map((p) => (
                <Link key={p.pathname} href={p.pathname}
                  className="rounded-[10px] border border-border bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:border-primary-600 hover:text-primary-700">
                  {p.title.replace(/^Máy scan /, '')}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* NHÓM LỘ TRÌNH (số hóa / cntt / đối tượng / dự án) */}
        {([
          { g: 'so-hoa', icon: '🗃️', title: 'Số hóa tài liệu', count: '25 trang', items: ['Dịch vụ số hóa', 'Số hóa hồ sơ đất đai', 'OCR tiếng Việt', 'DMS', 'ECM'] },
          { g: 'cntt', icon: '🖥️', title: 'Giải pháp CNTT', count: '20 trang', items: ['Smart Classroom', 'Paperless Meeting', 'Camera AI', 'Hạ tầng mạng'] },
          { g: 'doi-tuong', icon: '🏢', title: 'Theo đối tượng khách hàng', count: '15 trang', items: ['Bộ Công an', 'Bộ Tài chính', 'Bệnh viện', 'Ngân hàng'] },
          { g: 'du-an', icon: '📁', title: 'Dự án & năng lực', count: '10 trang', items: ['Dự án Bộ Công an', 'Kho bạc', 'Năng lực HPT'] },
        ] as const).filter((b) => show(b.g)).map((b) => (
          <section key={b.g} className="mt-9">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-[22px] text-primary-700">{b.icon}</span>
              <h2 className="text-[26px] font-extrabold tracking-[-0.02em]">{b.title}</h2>
              <span className="ml-auto rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[12px] font-bold text-amber-700">Lộ trình phase sau</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {b.items.map((t) => <span key={t} className="rounded-full border border-border bg-white px-3.5 py-2 text-[13.5px] font-semibold text-slate-700">{t}</span>)}
              <span className="rounded-full border border-border bg-white px-3.5 py-2 text-[13.5px] font-semibold text-slate-400">…</span>
            </div>
          </section>
        ))}
      </div>

      {/* CTA cuối */}
      <section id="lien-he" className="mx-auto max-w-[1200px] px-5 pb-14">
        <div className="rounded-[18px] bg-[linear-gradient(135deg,var(--color-primary-800),var(--color-primary-600))] p-11 text-center text-white">
          <h2 className="text-[25px] font-extrabold">Chưa thấy ngành hoặc nhu cầu của bạn?</h2>
          <p className="mx-auto mt-3 max-w-[620px] text-blue-100">HPT Tech tư vấn giải pháp số hóa &amp; thiết bị theo đặc thù đơn vị, báo giá dự án kèm hồ sơ và xuất VAT.</p>
          <a href="#" className="mt-5 inline-flex rounded-xl bg-accent-500 px-6 py-3.5 font-bold text-white hover:bg-accent-600">Nhận tư vấn &amp; báo giá →</a>
        </div>
      </section>
    </div>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 mt-5 text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-slate-500">{children}</div>
}
```

---

## 6. Khác biệt so với bản Codex đang dựng (theo ảnh) — CẦN SỬA
1. Thay banner "PSEO MÁY SCAN" đơn lẻ bằng **Hero đầy đủ** (eyebrow + H1 + lead + 3 thống kê + 2 CTA).
2. **Thêm bộ lọc chip** theo nhóm.
3. **Thêm khối "Máy scan" 3 nhóm con** (ngành 10 card có màu · nhu cầu 10 thẻ · thương hiệu 10 chip) — đây là phần chính đang thiếu; dữ liệu lấy từ `getHubData()` (landing-pages published), KHÔNG hardcode.
4. 4 card "Hạ tầng CNTT / An ninh & Camera / Hội nghị / Giáo dục" hiện tại: chuyển xuống **section "Giải pháp doanh nghiệp"** riêng (giữ nguyên Solutions cũ), đừng để lẫn ngay dưới banner.
5. Card ngành phải có **màu nhấn theo `--ind-*`** (viền trên + icon), lấy `accentKey` từ `industryRef`.
6. Spacing/ў bo góc: card `rounded-[14px]`/`[18px]`, container `max-w-[1200px]`, đúng như mockup.

> Đối chiếu trực quan: mở `landing-giai-phap.html` (mockup đã duyệt) — dựng cho khớp bố cục, khoảng cách, màu. Component trên là RSC-friendly (chỉ `GiaiPhapHub` là client vì có filter).


---

# PHẦN 2 — GROUP HUB `/giai-phap/may-scan` + TRANG CHI TIẾT (TEMPLATE A)


> Cho Codex. Dùng cùng `pseo-hub-ui-spec.md` (phần 1/2: master hub `/giai-phap`).
> Stack: Next.js 15 App Router + Tailwind v4 (token trong `app/globals.css`). KHÔNG hardcode màu/font — dùng `primary-*/accent-*/surface/ink/border` + biến `--ind-*` (W1). Đối chiếu mockup: `landing-giai-phap.html` (hub) và `landing-benh-vien.html` (chi tiết).
> Ghi chú: `intro` là richText (Lexical) → render bằng renderer sẵn có của dự án (vd `import { RichText } from '@payloadcms/richtext-lexical/react'` → `<RichText data={doc.intro} />`). Product card: nếu repo đã có component card sản phẩm thì tái dùng; dưới đây là bản `ScanProductCard` tự chứa để dùng ngay.

---

## A. Component dùng chung — `components/landing/`

### A1. `JsonLd.tsx` + `lib/seo-jsonld.ts`
```tsx
// components/landing/JsonLd.tsx
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
```
```ts
// lib/seo-jsonld.ts
import { absoluteURL } from './seo'
export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absoluteURL(it.path) })),
})
export const faqLd = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
})
export const itemListLd = (products: { title: string; path: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'ItemList',
  itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.title, url: absoluteURL(p.path) })),
})
```

### A2. `Breadcrumb.tsx` (RSC)
```tsx
import Link from 'next/link'
export function Breadcrumb({ items }: { items: { name: string; path?: string }[] }) {
  return (
    <nav className="mx-auto max-w-[1200px] px-5 py-4 text-[13.5px] text-slate-500">
      {items.map((it, i) => (
        <span key={i}>
          {it.path ? <Link href={it.path} className="hover:text-primary-700">{it.name}</Link>
            : <span className="font-semibold text-primary-700">{it.name}</span>}
          {i < items.length - 1 ? ' › ' : ''}
        </span>
      ))}
    </nav>
  )
}
```

### A3. `TrustBand.tsx` (RSC) — dải tin cậy (tái dùng nếu repo đã có)
```tsx
const ITEMS = [['🛡️','Chính hãng 100%'],['🧾','Xuất hóa đơn VAT'],['🚚','Giao toàn quốc'],['🔧','Hỗ trợ kỹ thuật'],['📄','Bảo hành chính hãng']]
export function TrustBand() {
  return (
    <div className="rounded-[18px] bg-primary-800 text-white">
      <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-5">
        {ITEMS.map(([ic, t]) => <div key={t} className="flex items-center gap-2.5 text-sm font-semibold"><span className="text-xl">{ic}</span>{t}</div>)}
      </div>
    </div>
  )
}
```

### A4. `FaqAccordion.tsx` (RSC, dùng <details> — không cần JS)
```tsx
export function FaqAccordion({ faqs }: { faqs: { question: string; answer: string }[] }) {
  if (!faqs?.length) return null
  return (
    <div className="mx-auto max-w-[860px]">
      {faqs.map((f, i) => (
        <details key={i} open={i === 0} className="mb-3 overflow-hidden rounded-[14px] border border-border bg-white [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 text-[16px] font-bold">
            {f.question}<span className="text-[22px] font-extrabold text-primary-700">+</span>
          </summary>
          <p className="px-5 pb-5 text-slate-600">{f.answer}</p>
        </details>
      ))}
    </div>
  )
}
```

### A5. `CtaQuote.tsx` (client) — form báo giá nối RFQ
```tsx
'use client'
import { useState } from 'react'
export function CtaQuote({ industry, source = 'pseo-may-scan' }: { industry?: string; source?: string }) {
  const [sent, setSent] = useState(false)
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = { org: fd.get('org'), contact: fd.get('contact'), email: fd.get('email'), note: fd.get('note'), industry, source }
    try {
      await fetch('/api/quotes/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setSent(true)
    } catch { alert('Gửi lỗi, vui lòng thử lại hoặc gọi hotline.') }
  }
  return (
    <div id="bao-gia" className="mx-auto max-w-[1200px] px-5 pb-14">
      <div className="grid gap-10 rounded-[18px] bg-[linear-gradient(135deg,var(--color-primary-800),var(--ind-600,var(--color-primary-600)))] p-11 text-white lg:grid-cols-2">
        <div>
          <h2 className="text-[28px] font-extrabold">Nhận tư vấn &amp; báo giá dự án</h2>
          <p className="mt-3 text-blue-100">HPT Tech khảo sát nhu cầu và đề xuất cấu hình tối ưu theo ngân sách. Chính hãng, xuất VAT, hỗ trợ toàn quốc.</p>
        </div>
        {sent ? (
          <div className="rounded-[18px] bg-white p-6 text-ink">✅ Đã gửi yêu cầu. HPT Tech sẽ liên hệ trong giờ làm việc.</div>
        ) : (
          <form onSubmit={submit} className="rounded-[18px] bg-white p-6 text-ink">
            <div className="mb-3.5"><label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Đơn vị</label><input name="org" className="w-full rounded-[10px] border border-border px-3.5 py-3 outline-none focus:border-primary-600" /></div>
            <div className="mb-3.5"><label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Người liên hệ &amp; SĐT</label><input name="contact" required className="w-full rounded-[10px] border border-border px-3.5 py-3 outline-none focus:border-primary-600" /></div>
            <div className="mb-3.5"><label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Email</label><input name="email" type="email" className="w-full rounded-[10px] border border-border px-3.5 py-3 outline-none focus:border-primary-600" /></div>
            <div className="mb-3.5"><label className="mb-1.5 block text-[13px] font-semibold text-slate-700">Nhu cầu</label><textarea name="note" rows={3} className="w-full rounded-[10px] border border-border px-3.5 py-3 outline-none focus:border-primary-600" /></div>
            <button className="w-full rounded-xl bg-accent-500 px-5 py-3.5 font-bold text-white hover:bg-accent-600">Gửi yêu cầu báo giá</button>
          </form>
        )}
      </div>
    </div>
  )
}
```

### A6. `ScanProductCard.tsx` (RSC) — dùng nếu chưa có card sẵn
```tsx
import Link from 'next/link'
export type ScanProduct = { title: string; slug: string; brand?: string; badges?: string[]; priceText?: string; imageUrl?: string }
export function ScanProductCard({ p }: { p: ScanProduct }) {
  return (
    <Link href={`/san-pham/${p.slug}`} className="group flex flex-col overflow-hidden rounded-[18px] border border-border bg-white transition hover:-translate-y-0.5 hover:shadow-[0_24px_44px_-30px_rgba(30,58,138,0.4)]">
      <div className="relative grid h-[170px] place-items-center border-b border-border bg-[linear-gradient(135deg,#f1f5f9,#eff6ff)]">
        {p.brand && <span className="absolute left-3 top-3 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-extrabold text-primary-700">{p.brand}</span>}
        {p.imageUrl ? <img src={p.imageUrl} alt={p.title} className="max-h-[150px] object-contain" /> : <span className="text-5xl opacity-80">🖨️</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="min-h-[44px] text-[16px] font-bold">{p.title}</h3>
        {p.badges && <div className="flex flex-wrap gap-1.5">{p.badges.map((b) => <span key={b} className="rounded-lg border border-blue-100 bg-primary-50 px-2 py-1 text-[12px] font-semibold text-primary-800">{b}</span>)}</div>}
        <div className="mt-auto text-[15px] font-extrabold text-accent-600">{p.priceText || 'Liên hệ báo giá'}</div>
      </div>
    </Link>
  )
}
```

---

## B. Group hub — `app/(site)/giai-phap/may-scan/page.tsx` (RSC)
```tsx
import Link from 'next/link'
import { getHubData } from '@/lib/landing-pages'
import { pageMetadata } from '@/lib/seo'
import { Breadcrumb } from '@/components/landing/Breadcrumb'

export const revalidate = 3600
export function generateMetadata() {
  return pageMetadata({
    title: 'Giải pháp máy scan theo ngành, nhu cầu & thương hiệu',
    description: 'Tổng hợp máy scan HPT Tech theo ngành (công an, thuế, bệnh viện…), theo nhu cầu (CCCD, A3, 2 mặt…) và theo thương hiệu (Fujitsu, Canon, Epson…). Tư vấn & báo giá.',
    path: '/giai-phap/may-scan',
  })
}
export default async function Page() {
  const { scan } = await getHubData()
  const Section = ({ label, children }: any) => (
    <><div className="mb-3 mt-8 text-[12.5px] font-extrabold uppercase tracking-[0.06em] text-slate-500">{label}</div>{children}</>
  )
  return (
    <div className="text-ink">
      <Breadcrumb items={[{ name: 'Trang chủ', path: '/' }, { name: 'Giải pháp', path: '/giai-phap' }, { name: 'Máy scan' }]} />
      <section className="border-b border-border bg-[linear-gradient(135deg,#eff6ff_0%,#fff_60%)]">
        <div className="mx-auto max-w-[1200px] px-5 py-11">
          <span className="inline-block rounded-full bg-primary-50 px-3 py-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-primary-700">Máy scan</span>
          <h1 className="my-3.5 max-w-[820px] text-[38px] font-black leading-[1.15] tracking-[-0.02em]">Giải pháp máy scan theo ngành, nhu cầu &amp; thương hiệu</h1>
          <p className="max-w-[760px] text-[18px] text-slate-600">Chọn nhanh máy scan phù hợp theo bối cảnh sử dụng. Tất cả thiết bị chính hãng, bảo hành, xuất VAT, giao &amp; hỗ trợ toàn quốc.</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 py-12">
        <Section label={`Theo ngành — ${scan.industry.length} trang`}>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            {scan.industry.map((p: any) => (
              <Link key={p.pathname} href={p.pathname} data-industry={p.accentKey}
                className="flex min-h-[150px] flex-col gap-2 rounded-[14px] border border-border bg-white p-4 [border-top:3px_solid_var(--ind-600)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_38px_-28px_rgba(30,58,138,0.45)]">
                <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-[var(--ind-50)] text-[20px] text-[color:var(--ind-700)]">🏛️</span>
                <h3 className="text-[14.5px] font-bold leading-tight">{p.title}</h3>
                <p className="flex-1 text-[12px] text-slate-500">{p.desc}</p>
              </Link>
            ))}
          </div>
        </Section>
        <Section label={`Theo nhu cầu — ${scan.need.length} trang`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {scan.need.map((p: any) => (
              <Link key={p.pathname} href={p.pathname} className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-semibold hover:border-primary-600 hover:text-primary-700">
                <span className="text-[19px]">🗂️</span>{p.title}
              </Link>
            ))}
          </div>
        </Section>
        <Section label={`Theo thương hiệu — ${scan.brand.length} trang`}>
          <div className="flex flex-wrap gap-2.5">
            {scan.brand.map((p: any) => (
              <Link key={p.pathname} href={p.pathname} className="rounded-[10px] border border-border bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:border-primary-600 hover:text-primary-700">
                {p.title.replace(/^Máy scan /, '')}
              </Link>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
```

---

## C. Trang chi tiết — `app/(site)/giai-phap/may-scan/[facet]/[value]/page.tsx`
```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublishedLandingPages, getLandingPageByPath, getScannersForQuery, meetsQualityGate, buildLandingMetadata } from '@/lib/landing-pages'
import { LandingTemplateA } from '@/components/landing/LandingTemplateA'

const SEG = { industry: 'nganh', need: 'nhu-cau', brand: 'hang' } as const
export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const pages = await getPublishedLandingPages({ productGroup: 'may-scan' })
  return pages.map((p: any) => ({ facet: SEG[p.facetType as keyof typeof SEG], value: p.facetSlug }))
}
export async function generateMetadata({ params }: { params: Promise<{ facet: string; value: string }> }): Promise<Metadata> {
  const { facet, value } = await params
  const page = await getLandingPageByPath(`/giai-phap/may-scan/${facet}/${value}`)
  if (!page) return {}
  const md = buildLandingMetadata(page)
  if (page.seo?.noIndex || !meetsQualityGate(page)) md.robots = { index: false, follow: true }
  return md
}
export default async function Page({ params }: { params: Promise<{ facet: string; value: string }> }) {
  const { facet, value } = await params
  if (!['nganh', 'nhu-cau', 'hang'].includes(facet)) notFound()
  const page = await getLandingPageByPath(`/giai-phap/may-scan/${facet}/${value}`)
  if (!page || page._status !== 'published') notFound()
  const products = await getScannersForQuery(page.productQuery, { recommended: page.recommendedProducts, limit: 8 })
  return <LandingTemplateA doc={page} products={products} />
}
```

### `components/landing/LandingTemplateA.tsx` (RSC)
```tsx
import Link from 'next/link'
import { RichText } from '@payloadcms/richtext-lexical/react' // hoặc renderer sẵn có của dự án
import { Breadcrumb } from './Breadcrumb'
import { TrustBand } from './TrustBand'
import { FaqAccordion } from './FaqAccordion'
import { CtaQuote } from './CtaQuote'
import { ScanProductCard } from './ScanProductCard'
import { JsonLd } from './JsonLd'
import { breadcrumbLd, faqLd, itemListLd } from '@/lib/seo-jsonld'

const FACET_LABEL = { industry: 'Ngành', need: 'Nhu cầu', brand: 'Hãng' } as const
const SEG = { industry: 'nganh', need: 'nhu-cau', brand: 'hang' } as const

export function LandingTemplateA({ doc, products }: { doc: any; products: any[] }) {
  const accent = doc.facetType === 'industry' ? (doc.industryRef?.accentKey || doc.facetSlug) : undefined
  const base = `/giai-phap/may-scan/${SEG[doc.facetType as 'industry']}`
  const crumbs = [
    { name: 'Trang chủ', path: '/' }, { name: 'Giải pháp', path: '/giai-phap' },
    { name: 'Máy scan', path: '/giai-phap/may-scan' }, { name: doc.title },
  ]
  return (
    <div data-industry={accent} className="text-ink">
      <JsonLd data={breadcrumbLd(crumbs.map((c) => ({ name: c.name, path: c.path || doc.pathname })))} />
      {doc.faqs?.length >= 3 && <JsonLd data={faqLd(doc.faqs)} />}
      {products?.length > 0 && <JsonLd data={itemListLd(products.map((p) => ({ title: p.title, path: `/san-pham/${p.slug}` })))} />}

      <Breadcrumb items={crumbs} />

      {/* HERO */}
      <section className="bg-[linear-gradient(135deg,var(--ind-50,#eff6ff)_0%,#fff_58%)]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-11 px-5 pb-14 pt-10 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <span className="inline-block rounded-full bg-[var(--ind-50)] px-3 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[color:var(--ind-700)]">Giải pháp số hóa</span>
            <h1 className="my-4 text-[44px] font-black leading-[1.12] tracking-[-0.02em]">{doc.h1 || doc.title}</h1>
            <div className="prose max-w-none text-[18px] text-slate-600"><RichText data={doc.intro} /></div>
            <div className="mt-6 flex flex-wrap gap-3.5">
              <a href="#bao-gia" className="inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3.5 font-bold text-white hover:bg-accent-600">Nhận tư vấn &amp; báo giá →</a>
              <a href="#san-pham" className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-6 py-3.5 font-bold text-primary-700 hover:border-primary-600">Xem sản phẩm phù hợp</a>
            </div>
          </div>
          {doc.heroImageUrl && (
            <div className="rounded-[18px] border border-border bg-white p-6 shadow-[0_30px_60px_-30px_rgba(30,58,138,0.35)]">
              <img src={doc.heroImageUrl} alt={doc.title} className="mx-auto max-h-[340px] object-contain" />
            </div>
          )}
        </div>
      </section>

      {/* TRUST */}
      <div className="mx-auto max-w-[1200px] px-5 py-8"><TrustBand /></div>

      {/* PAIN POINTS */}
      {doc.painPoints?.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-5 py-8">
          <h2 className="mb-8 text-center text-[30px] font-extrabold">Vì sao {doc.title.toLowerCase()} cần thiết bị chuyên dụng</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {doc.painPoints.map((pp: any, i: number) => (
              <div key={i} className="rounded-[18px] border border-border border-t-4 bg-white p-6 [border-top-color:var(--ind-500,var(--color-accent-500))]">
                <p className="text-slate-600">{pp.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRODUCTS */}
      <section id="san-pham" className="bg-surface py-12">
        <div className="mx-auto max-w-[1200px] px-5">
          <h2 className="mb-8 text-center text-[30px] font-extrabold">Sản phẩm đề xuất</h2>
          {products?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => <ScanProductCard key={p.slug} p={{ title: p.title, slug: p.slug, brand: p.brand, badges: p.badges, priceText: p.priceText, imageUrl: p.imageUrl }} />)}
            </div>
          ) : (
            <div className="rounded-[18px] border border-border bg-white p-8 text-center text-slate-500">
              Đang cập nhật sản phẩm phù hợp. <a href="#bao-gia" className="font-bold text-primary-700">Liên hệ để được tư vấn →</a>
            </div>
          )}
          <div className="mt-8 text-center"><Link href="/giai-phap/may-scan" className="inline-flex rounded-xl bg-primary-700 px-6 py-3.5 font-bold text-white hover:bg-primary-800">Xem tất cả máy scan →</Link></div>
        </div>
      </section>

      {/* CRITERIA */}
      {doc.criteria?.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-5 py-12">
          <h2 className="mb-8 text-center text-[30px] font-extrabold">Tiêu chí chọn máy</h2>
          <table className="w-full overflow-hidden rounded-[18px] border border-border bg-white">
            <thead><tr className="bg-primary-800 text-left text-white"><th className="px-5 py-4 text-[14.5px]">Nhu cầu</th><th className="px-5 py-4 text-[14.5px]">Thông số đáp ứng</th></tr></thead>
            <tbody>
              {doc.criteria.map((c: any, i: number) => (
                <tr key={i} className={i % 2 ? 'bg-surface' : ''}><td className="border-t border-border px-5 py-4 font-bold">{c.need}</td><td className="border-t border-border px-5 py-4 font-semibold text-primary-700">{c.spec}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* WORKFLOW (nếu có) */}
      {doc.workflow?.length > 0 && (
        <section className="bg-surface py-12"><div className="mx-auto max-w-[1200px] px-5">
          <h2 className="mb-8 text-center text-[30px] font-extrabold">Quy trình số hóa</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {doc.workflow.map((w: any, i: number) => (
              <div key={i} className="rounded-[14px] border border-border bg-white p-5">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-[10px] bg-[var(--ind-600,var(--color-primary-700))] font-extrabold text-white">{i + 1}</div>
                <h3 className="text-[15.5px] font-bold">{w.step}</h3>{w.detail && <p className="mt-1.5 text-[13.5px] text-slate-500">{w.detail}</p>}
              </div>
            ))}
          </div>
        </div></section>
      )}

      {/* FAQ */}
      {doc.faqs?.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-5 py-12">
          <h2 className="mb-8 text-center text-[30px] font-extrabold">Câu hỏi thường gặp</h2>
          <FaqAccordion faqs={doc.faqs} />
        </section>
      )}

      {/* RELATED */}
      {doc.relatedPages?.length > 0 && (
        <section className="bg-surface py-11"><div className="mx-auto max-w-[1200px] px-5">
          <h3 className="mb-3 text-[16px] font-bold">Giải pháp liên quan</h3>
          <div className="flex flex-wrap gap-3">
            {doc.relatedPages.map((r: any) => <Link key={r.pathname} href={r.pathname} className="rounded-full border border-border bg-white px-4.5 py-2.5 text-[14.5px] font-semibold hover:border-primary-600 hover:text-primary-700">{r.title}</Link>)}
          </div>
        </div></section>
      )}

      {/* CTA */}
      <CtaQuote industry={doc.facetSlug} />
    </div>
  )
}
```

---

## D. Ghi chú triển khai (Codex đọc kỹ)
1. **RichText:** thay `RichText` import cho khớp renderer lexical của dự án; nếu chưa có, tạo serializer tối thiểu (paragraph → <p>).
2. **Product card:** nếu repo đã có card sản phẩm dùng ở `/san-pham`/danh mục thì **tái dùng** thay `ScanProductCard`. `getScannersForQuery` cần trả về `{ title, slug, brand, badges[], priceText, imageUrl }` (badges suy từ scannerSpecs: tốc độ, ADF, A3/A4, 2 mặt, LAN, OCR).
3. **Màu nhấn:** trang chi tiết bọc `data-industry={accentKey}`; nhu cầu/thương hiệu không có accent → biến `--ind-*` fallback về primary (đã khai ở W1). Có thể set màu nhấn riêng cho nhóm nhu cầu/thương hiệu sau.
4. **Gate + noindex:** `generateMetadata` set robots noindex khi chưa đạt gate; nhưng trang vẫn render (không 404).
5. **Responsive:** grid tự về 1–2 cột ở mobile như class đã set; kiểm mockup `landing-benh-vien.html`.
6. **Không hardcode màu/font:** mọi màu qua token (`primary/accent/surface/ink/border`) + `--ind-*`; chỉ dùng vài giá trị nền gradient inline như mockup.
7. **Thứ tự khối** khớp mockup: Breadcrumb → Hero+CTA → TrustBand → PainPoints → Products → Criteria → Workflow → FAQ → Related → CtaQuote (+ JSON-LD ẩn).