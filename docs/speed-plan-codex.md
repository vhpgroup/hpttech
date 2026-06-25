# Kế hoạch tối ưu tốc độ hpttech.vn ở QUY MÔ LỚN — giao cho Codex

**Mục tiêu:** site chạy mượt ở **15.000–20.000 sản phẩm** + **5.000–10.000 bài viết** (~30k trang).
Ở quy mô này, vấn đề số 1 KHÔNG phải "tinh chỉnh tốc độ" mà là **khử các đường fetch-all**
(đang nạp toàn bộ bảng vào RAM) — nếu không, build sẽ OOM/timeout và trang sẽ sập khi data lớn.

Dựa trên đọc mã thực tế ngày 2026-06-25 (commit hiện tại).

---

## Điều gì thay đổi ở quy mô lớn (đọc trước)

1. **Không bao giờ fetch-all.** Mọi truy vấn danh sách phải có `limit` + phân trang + `select`.
2. **Không pre-render toàn bộ khi build.** `generateStaticParams` không được trả 20k slug.
3. **Cache tag phải hẹp** (theo id/slug), không dùng 1 tag chung làm nổ toàn bộ cache khi sửa 1 SP.
4. **Cache phải sống qua redeploy** → mount volume cho `.next/cache` trên Coolify.
5. **Search 20k bản ghi không thể `ilike`** → cần Postgres FTS hoặc search engine.
6. **Index DB là bắt buộc**, không phải tùy chọn.

---

## Quy tắc cho Codex

- Tuân `AGENTS.md` (mục 4 gate, mục 8 regenerate types, mục 10 prod safety).
- CHỈ tăng tốc / chịu tải — KHÔNG đổi giao diện, tính năng, logic hiển thị.
- Làm tuần tự từng task; mỗi task: verify → sửa nhỏ nhất → gate → commit atomic.
- KHÔNG chạy script ghi dữ liệu / KHÔNG đụng DB prod. Đổi schema (index) chỉ ở DB local +
  `npx payload generate:types` + commit; prod áp khi deploy.
- Sau mỗi task: `npm run typecheck` && `npm run lint`; route/UI thì `npm run build`.

---

## S0 — KHỬ FETCH-ALL (BẮT BUỘC, làm TRƯỚC khi nạp data lớn)

> Đây là các điểm sẽ làm sập site ở 20k SP / 10k bài. Ưu tiên tuyệt đối.

### S0.1 — `app/(site)/tin-tuc/page.tsx`: đang `getPostsFromPayload()` (TẤT CẢ bài) rồi để client phân trang
- Hiện tại: nạp **toàn bộ** bài viết, đẩy hết xuống `NewsPageClient` lọc/`phân trang ở client.
  Ở 10k bài → payload khổng lồ + ngốn RAM.
- Sửa: tạo `getPostsPageFromPayload({ page, limit: 12, type, q, sort })` trả về **1 trang**;
  chuyển lọc/sắp xếp/phân trang sang **server** (đọc searchParams). Client chỉ nhận 1 trang.
- ✅ Acceptance: HTML/JSON của `/tin-tuc` **không tăng theo tổng số bài** (luôn ~12 mục/trang).

### S0.2 — `app/(site)/tin-tuc/[...segments]/page.tsx`: mỗi bài chi tiết fetch TẤT CẢ posts + TẤT CẢ products cho sidebar
- Hiện tại (trang chi tiết bài):
  ```ts
  const [latestPosts, popularPosts, topProducts] = await Promise.all([
    getPostsFromPayload(),     // ← TẤT CẢ bài
    getMostViewedPostsFromPayload(6),
    getProductsFromPayload(),  // ← TẤT CẢ sản phẩm
  ]);
  ```
  → mỗi lần render 1 bài (và mỗi lần ISR revalidate 10k trang) đều nạp ~30k bản ghi chỉ để
  hiện sidebar "5 tin mới / 5 SP bán chạy". Cực kỳ nặng.
- Sửa: thay bằng truy vấn **giới hạn**: `getLatestPostsFromPayload(5)` và
  `getBestSellingProductsFromPayload(5)` (query mới, có `limit` + sort theo review/view + index).
  Nhánh category cũng phải phân trang `getPostsByCategoryPathFromPayload(path, { page, limit })`.
- ✅ Acceptance: trang bài viết chỉ chạy vài query **bounded**, không nạp toàn bộ catalog/posts.

### S0.3 — `app/sitemap.xml/route.ts`: `getProductsFromPayload()` + `getPostsFromPayload()` (TẤT CẢ, depth cao)
- Sửa: dùng truy vấn **nhẹ chỉ lấy `slug` + `updatedAt`** (không relations, không depth).
  Triển khai `generateSitemaps()` chia nhỏ ≤ **5.000 URL/file** (sitemap index): tách
  `sitemap/products/[n]`, `sitemap/posts/[n]`, `sitemap/static`.
- ✅ Acceptance: mỗi file sitemap ≤ ~5k URL; truy vấn chỉ `select` slug+updatedAt.

### S0.4 — `app/google-merchant.xml/route.ts`: SQL nạp TẤT CẢ sản phẩm + `new Client` mỗi request
- Hiện tại: 1 query lấy toàn bộ SP published, nối chuỗi 20k `<item>` trong RAM mỗi 5 phút.
- Sửa (chọn 1):
  - **(Khuyến nghị)** sinh feed theo **lịch (cron)** ra file tĩnh rồi upload R2 / serve tĩnh;
    hoặc tăng cache `s-maxage=86400` (giá không đổi mỗi 5 phút).
  - Dùng `Pool` thay `new Client`. Cân nhắc **stream** response thay vì build chuỗi 20k item.
- ✅ Acceptance: không dựng 20k item đồng bộ mỗi 5 phút; RAM ổn định; feed vẫn hợp lệ.

### S0.5 — `app/(site)/san-pham/[slug]/page.tsx`: `generateStaticParams` trả TẤT CẢ slug → build OOM
- Hiện tại: `generateStaticParams()` = `getPublishedProductSlugs()` (toàn bộ) + `dynamicParams=true`.
  → build sẽ cố pre-render **cả 20k trang** → Coolify build timeout/OOM.
- Sửa: `generateStaticParams()` trả `[]` (hoặc top ~100–300 SP bán chạy), giữ `dynamicParams=true`.
  Trang vẫn được ISR cache khi truy cập lần đầu (giống `/tin-tuc/[...segments]` đã làm đúng: `return []`).
- ✅ Acceptance: build KHÔNG pre-render 20k trang; thời gian build ổn định; trang vẫn cache sau hit đầu.

---

## S1 — Caching & cache sống qua redeploy

### S1.1 — Bọc `unstable_cache` với TAG HẸP (không nổ toàn bộ)
- File: `lib/catalog-payload.ts`, `lib/content-payload.ts`.
- Tag theo mức: `product:{slug}`, `products:list`, `post:{slug}`, `posts:list`, `category:{slug}`.
- Khi sửa 1 SP: chỉ `revalidateTag("product:"+slug)` + `revalidateTag("products:list")` —
  KHÔNG dùng 1 tag `products` chung (ở 20k + sync giá thường xuyên sẽ xóa sạch cache liên tục).
- `keyParts` phải gồm mọi tham số (page, limit, category, brand, sort, q…).

### S1.2 — `revalidateTag` trong hook CRUD
- Hook `afterChange`/`afterDelete` của `Products`, `Posts`, … gọi đúng tag hẹp tương ứng.
- ✅ Acceptance: sửa 1 SP/bài → chỉ trang đó + list liên quan mới, phần còn lại giữ cache.

### S1.3 — Persistent volume cho `.next/cache` trên Coolify (CỰC KỲ quan trọng)
- ISR full-route cache + fetch cache + ảnh tối ưu nằm ở `.next/cache`. Không mount volume →
  **mỗi redeploy xóa sạch cache** → 30k trang nguội → regenerate ồ ạt + đập DB khi bot crawl.
- Việc: mount volume Coolify vào `/app/.next/cache` (đây là cấu hình hạ tầng, không phải code).
- Nếu sau này chạy **>1 replica**: cache filesystem không chia sẻ → cần shared cache handler
  (Redis qua `@neshca/cache-handler` hoặc `cacheHandler` của Next). Single instance thì volume là đủ.

---

## S2 — Database & Search (trục chịu tải chính ở 20k)

### S2.1 — Index DB (composite) cho Products + Posts
- `collections/Products.ts`: `index: true` cho `status`, `brand`, `category`, `updatedAt`, `slug`.
  Cân nhắc composite index (qua migration): `(status, _status)`, `(category_id, status)`,
  `(brand_id, status)` — phục vụ filter listing.
- `collections/Posts.ts`: index `slug`, `publishedAt`, `category`, `status`.
- ⚠️ Schema change → chỉ DB local + `npx payload generate:types` + commit; prod áp khi deploy.

### S2.2 — Listing query: `depth` thấp + `select` + `limit`
- `getProductSearchPageFromPayload` và các list: `depth: 0/1`, chỉ `select` field card cần,
  luôn `limit` + offset theo trang. (Trang chi tiết `[slug]` giữ depth đầy đủ — bounded.)
- **Facets** (đếm brand/category/giá): dùng SQL `GROUP BY` có index + cache; KHÔNG quét toàn bộ
  SP mỗi request.

### S2.3 — Search: thay `ilike` bằng giải pháp chịu được 20k + tiếng Việt
- Hiện `/san-pham?search=` và `/tin-tuc?q=` gần như chắc dùng `ilike` → full scan ở 20k.
- Chọn 1:
  - **(Khuyến nghị) Meilisearch / Typesense** chạy container trên cùng VPS (Coolify): typo-tolerant,
    facet sẵn, tiếng Việt tốt, đồng bộ index từ hook Payload. Lý tưởng cho 20k SP + 10k bài.
  - **Postgres FTS** (ít hạ tầng hơn): cột `tsvector` generated + GIN index + `unaccent` cho dấu
    tiếng Việt. Dùng cho cả product + post search.
- ✅ Acceptance: search ở 20k trả < ~100ms; có facet; gõ sai dấu vẫn ra (nếu dùng engine).

### S2.4 — Connection pool
- Dùng `Pool` singleton (bỏ `new Client` ở merchant feed & nơi khác). Nếu chạy nhiều replica →
  thêm PgBouncer / pooling của Coolify. Size pool hợp lý (vd max 10/instance).

---

## S3 — Ảnh (20k SP × nhiều ảnh)

### S3.1 — `sizes` + `deviceSizes` (dừng tải thumbnail ở w=1200)
- `next.config.ts`: thêm `384, 480` vào `deviceSizes` (hiện min 640 → w=384 trả 400).
- Component ảnh card: thêm `sizes`, vd `(max-width:640px) 45vw, (max-width:1024px) 30vw, 240px`.

### S3.2 — Giảm tải CPU tối ưu ảnh ở scale
- Next image optimizer chạy trên VPS → tối ưu hàng nghìn ảnh on-demand có thể nghẽn CPU.
- Khuyến nghị: đặt **Cloudflare CDN trước R2** (custom domain) để cache ảnh đã tối ưu ở edge;
  hoặc dùng Cloudflare Image Resizing + `images.loader` để đẩy việc resize khỏi VPS.
- Tối thiểu: đảm bảo `.next/cache/images` nằm trên volume (S1.3) để không resize lại sau mỗi deploy.

---

## S4 — Polish
- Brotli ở reverse proxy Coolify (Traefik) — hiện chỉ gzip.
- `Cache-Control` cho API GET (`/api/home-content`, `/api/products/compare-picker`).
- Trang chủ: chỉ render tập SP curated nhỏ, không query lớn (kiểm `loadHomeProductsFromPayload`).

---

## Definition of Done (kiểm ở scale)

```bash
npm run typecheck && npm run lint && npm run build
npm run test:quote && npm run test:bulk-import
```

Kiểm thực tế sau khi nạp data lớn (hoặc seed staging ~20k SP):
- **Build time** không tăng theo số SP (S0.5) — Coolify build ổn định.
- `/tin-tuc`, trang bài viết, `/san-pham`: payload + RAM **không tăng theo tổng số bản ghi** (S0).
- Sitemap chia file ≤ 5k URL; merchant feed không nổ RAM.
- Search 20k < ~100ms, có facet.
- `curl -sI /san-pham`, `/tin-tuc` → có `s-maxage` (hết `no-store`); ảnh card ≤ w=640.
- Redeploy KHÔNG làm mất ISR/image cache (volume).
- Giao diện & CRUD `/admin` không đổi.

---

## Thứ tự đề xuất
**S0 (khử fetch-all) → S2.1/S2.2 (index + query) → S1 (cache + volume) → S2.3 (search engine) →
S3 (ảnh) → S4 (polish).** S0 là chặn sập; làm trước khi nạp 20k.
