/**
 * scripts/seed-landing-pages.ts
 * ------------------------------------------------------------------
 * Nạp 30 trang pSEO máy scan vào collection `landing-pages` từ file
 * landing-pages-seed.json (sinh bởi build_seed.py).
 *
 * CÁCH CHẠY (chạy trên DB LOCAL trước — KHÔNG chạy trên prod khi chưa chắc):
 *   PAYLOAD_SEED_CONFIRM=yes npx tsx scripts/seed-landing-pages.ts docs/landing-pages-seed.json
 *
 * Yêu cầu: đã có env của app (DATABASE_URI/PAYLOAD_SECRET…) như khi chạy Payload.
 * Idempotent: upsert theo `pathname` (chạy lại không tạo trùng).
 * TUÂN THỦ AGENTS.md: không tự đổi schema; chỉ ghi dữ liệu sau khi xác nhận DB.
 *
 * Ghi chú cho Codex:
 * - Nếu alias '@payload-config' khác, sửa import cho khớp repo.
 * - `intro` được convert markdown-đơn-giản -> Lexical. Nếu editor richText của
 *   dự án có node tuỳ biến, chỉnh hàm mdToLexical cho phù hợp.
 * - Trang brand: brandRef tra trong collection `brands` theo tên; nếu HPT không
 *   bán hãng đó -> log cảnh báo, vẫn tạo trang ở trạng thái draft.
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import configPromise from '../payload.config.ts'

type SeedPayload = Awaited<ReturnType<typeof getPayload>>
type PayloadDoc = Record<string, unknown> & { id?: string | number; slug?: string }
type LexicalNode = Record<string, unknown> & {
  children?: LexicalNode[]
  text?: string
}
type SeedFacetType = 'industry' | 'need' | 'brand'
type SeedRecord = {
  criteria?: Array<{ need?: string; spec?: string }>
  facetSlug: string
  facetType: SeedFacetType
  faqs?: Array<{ answer?: string; question?: string }>
  h1?: string
  intro?: string
  lineup?: string
  pageType?: string
  painPoints?: string[]
  pathname?: string
  productGroup?: string
  productQuery?: Record<string, unknown>
  seo?: { description?: string; title?: string }
  slug?: string
  title: string
  workflow?: Array<{ detail?: string; step?: string }>
}

// ---- taxonomy tối thiểu (tạo nếu thiếu) ----
const INDUSTRIES: Record<string, { name: string; icon: string }> = {
  'cong-an': { name: 'Công an', icon: 'shield' },
  'thue': { name: 'Thuế', icon: 'receipt' },
  'hai-quan': { name: 'Hải quan', icon: 'container' },
  'kho-bac': { name: 'Kho bạc', icon: 'landmark' },
  'toa-an': { name: 'Tòa án', icon: 'scale' },
  'vien-kiem-sat': { name: 'Viện kiểm sát', icon: 'gavel' },
  'ubnd': { name: 'UBND', icon: 'building-2' },
  'van-thu-luu-tru': { name: 'Văn thư lưu trữ', icon: 'archive' },
  'benh-vien': { name: 'Bệnh viện', icon: 'hospital' },
  'truong-hoc': { name: 'Trường học', icon: 'graduation-cap' },
}
const SCAN_NEEDS: Record<string, string> = {
  'ho-so': 'Scan hồ sơ', 'cccd': 'Scan CCCD', 'ho-chieu': 'Scan hộ chiếu',
  'a4': 'Scan A4', 'a3': 'Scan A3', 'toc-do-cao': 'Scan tốc độ cao',
  'kho-lon': 'Scan khổ lớn', 'sach': 'Scan sách', 'ban-ve': 'Scan bản vẽ',
  'hai-mat': 'Scan 2 mặt tự động',
}
// tên hãng để tra trong collection brands (facetSlug -> tên hiển thị)
const BRAND_NAMES: Record<string, string> = {
  'fujitsu': 'Fujitsu', 'ricoh': 'Ricoh', 'kodak-alaris': 'Kodak Alaris',
  'brother': 'Brother', 'epson': 'Epson', 'canon': 'Canon',
  'plustek': 'Plustek', 'visioneer': 'Visioneer', 'hp': 'HP', 'avision': 'Avision',
}

// chỉ các field thuộc group productQuery trong schema landing-pages
const PQ_KEYS = new Set([
  'needsDuplex', 'needsA3', 'needsNetwork', 'needsOcr', 'needsCardScan',
  'needsPassport', 'prefersFlatbed', 'largeFormat', 'wideFormat', 'bookScanner',
  'minDailyDuty', 'minScanSpeedPpm', 'maxPaperSize', 'brands',
])

// ---- markdown rất đơn giản -> Lexical richText ----
function textNode(text: string, bold = false) {
  return { type: 'text', text, format: bold ? 1 : 0, detail: 0, mode: 'normal', style: '', version: 1 }
}
function paragraph(children: LexicalNode[]) {
  return { type: 'paragraph', children, direction: 'ltr', format: '', indent: 0, version: 1 }
}
function parseInline(s: string) {
  // tách **bold** thành các text node
  const out: LexicalNode[] = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(textNode(s.slice(last, m.index)))
    out.push(textNode(m[1], true))
    last = m.index + m[0].length
  }
  if (last < s.length) out.push(textNode(s.slice(last)))
  return out.length ? out : [textNode(s)]
}
function mdToLexical(md: string) {
  const paras = (md || '').split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  const children = paras.length ? paras.map((p) => paragraph(parseInline(p))) : [paragraph([textNode('')])]
  return { root: { type: 'root', children, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

function docID(doc: PayloadDoc) {
  if (typeof doc.id === 'string' || typeof doc.id === 'number') return doc.id
  throw new Error('Payload document thiếu id.')
}

async function findOne(payload: SeedPayload, collection: string, where: Where): Promise<PayloadDoc | null> {
  const r = await payload.find({ collection: collection as never, where, limit: 1, depth: 0 })
  return (r.docs?.[0] as PayloadDoc | undefined) || null
}

async function findBrand(payload: SeedPayload, facetSlug: string, name: string) {
  const candidates = Array.from(new Set([
    facetSlug,
    name,
    name.toLowerCase(),
    facetSlug === 'kodak-alaris' ? 'kodak' : '',
    facetSlug === 'kodak-alaris' ? 'alaris' : '',
  ].filter(Boolean)))

  for (const candidate of candidates) {
    const bySlug = await findOne(payload, 'brands', { slug: { equals: candidate } })
    if (bySlug) return bySlug
  }

  for (const candidate of candidates) {
    const byName = await findOne(payload, 'brands', { name: { like: candidate } })
    if (byName) return byName
  }

  return null
}

async function upsertBrand(payload: SeedPayload, facetSlug: string, name: string) {
  const existing = await findBrand(payload, facetSlug, name)
  if (existing) return existing
  return payload.create({
    collection: 'brands' as never,
    data: {
      name,
      slug: facetSlug,
      description: `Thương hiệu ${name} trong danh mục máy scan HPT Tech.`,
    },
  }) as Promise<PayloadDoc>
}

async function upsertTaxonomy(payload: SeedPayload, collection: string, slug: string, data: Record<string, unknown>) {
  const existing = await findOne(payload, collection, { slug: { equals: slug } })
  if (existing) return existing
  return payload.create({ collection: collection as never, data: { ...data, slug } }) as Promise<PayloadDoc>
}

async function main() {
  const file = process.argv[2] || 'docs/landing-pages-seed.json'
  const raw = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')) as { records?: SeedRecord[] } | SeedRecord[]
  const records: SeedRecord[] = Array.isArray(raw) ? raw : raw.records || []

  const payload = await getPayload({ config: await configPromise })
  const dbUri = process.env.DATABASE_URI || process.env.POSTGRES_URL || 'postgres://payload:payload@127.0.0.1:5433/hpttech_payload'
  console.log(`[seed] DB: ${String(dbUri).replace(/\/\/.*@/, '//***@')}`)
  console.log(`[seed] Số record: ${records.length}`)
  if (process.env.PAYLOAD_SEED_CONFIRM !== 'yes') {
    console.error('❌ Dừng: đặt PAYLOAD_SEED_CONFIRM=yes để xác nhận đúng DB rồi chạy lại.')
    process.exit(1)
  }

  let created = 0, updated = 0
  const warned = 0
  for (const rec of records) {
    // 1) taxonomy ref theo facetType
    const refData: Record<string, string | number> = {}
    if (rec.facetType === 'industry') {
      const ind = await upsertTaxonomy(payload, 'industries', rec.facetSlug, {
        name: INDUSTRIES[rec.facetSlug]?.name || rec.facetSlug,
        icon: INDUSTRIES[rec.facetSlug]?.icon,
        accentKey: rec.facetSlug,
      })
      refData.industryRef = docID(ind)
    } else if (rec.facetType === 'need') {
      const nd = await upsertTaxonomy(payload, 'scan-needs', rec.facetSlug, {
        name: SCAN_NEEDS[rec.facetSlug] || rec.facetSlug,
      })
      refData.needRef = docID(nd)
    } else if (rec.facetType === 'brand') {
      const name = BRAND_NAMES[rec.facetSlug] || rec.facetSlug
      const brand = await upsertBrand(payload, rec.facetSlug, name)
      if (brand) refData.brandRef = docID(brand)
    }

    // 2) productQuery: chỉ giữ key thuộc schema
    const pq: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(rec.productQuery || {})) if (PQ_KEYS.has(k)) pq[k] = v
    if (refData.brandRef) pq.brands = [refData.brandRef]

    // 3) data ghi vào collection
    const intro = rec.lineup ? `${rec.intro || ''}\n\nDòng sản phẩm tiêu biểu: ${rec.lineup}` : rec.intro || ''
    const data: Record<string, unknown> = {
      pageType: rec.pageType || 'product-facet',
      productGroup: rec.productGroup || 'may-scan',
      facetType: rec.facetType,
      slug: rec.slug || `${rec.facetType}-${rec.facetSlug}`,
      title: rec.title,
      h1: rec.h1 || rec.title,
      intro: mdToLexical(intro),
      painPoints: (rec.painPoints || []).map((t: string) => ({ text: t })),
      criteria: (rec.criteria || []).map((c) => ({ need: c.need, spec: c.spec })),
      faqs: (rec.faqs || []).map((f) => ({ question: f.question, answer: f.answer })),
      productQuery: pq,
      seo: { title: rec.seo?.title, description: rec.seo?.description },
      ...refData,
    }
    if (Array.isArray(rec.workflow)) data.workflow = rec.workflow.map((w) => ({ step: w.step, detail: w.detail }))

    const isPublished = false
    const productGroup = rec.productGroup || 'may-scan'
    const pathname = rec.pathname || `/giai-phap/${productGroup}/${{ industry: 'nganh', need: 'nhu-cau', brand: 'hang' }[rec.facetType]}/${rec.facetSlug}`

    // 4) upsert theo pathname
    const existing = await findOne(payload, 'landing-pages', { pathname: { equals: pathname } })
    if (existing) {
      await payload.update({ collection: 'landing-pages' as never, id: docID(existing), data, draft: !isPublished })
      updated++
    } else {
      await payload.create({ collection: 'landing-pages' as never, data, draft: !isPublished })
      created++
    }
    console.log(`  ${existing ? '↻' : '＋'} ${pathname}`)
  }

  console.log(`\n[seed] Xong: tạo ${created}, cập nhật ${updated}, cảnh báo brand ${warned}.`)
  console.log('[seed] Tất cả để _status=draft. Gán recommendedProducts + đạt gate rồi publish.')
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
