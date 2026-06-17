# Tối ưu hoá tốc độ website HPTTech

Tối ưu tốc độ Next.js 15 + Payload CMS website, đảm bảo đúng logic hiện tại, product CRUD mượt mà, deploy Coolify thành công.

## User Review Required

> [!IMPORTANT]
> **Nguyên tắc**: Mọi thay đổi đều giữ nguyên logic hiện tại. Không đổi giao diện, không đổi tính năng. Chỉ tăng tốc.

> [!WARNING]
> **`output: 'standalone'`** sẽ thay đổi cách Docker image được build. Image nhỏ hơn 5-10x, nhưng cần cập nhật Dockerfile tương ứng. Coolify sẽ build nhanh hơn nhiều.

## Phân tích bottleneck

| # | Vấn đề | File | Impact |
|---|--------|------|--------|
| 1 | Homepage `force-dynamic` override `revalidate=300` → không bao giờ cache | [page.tsx](file:///E:/Claude/HPTTech/app/(site)/page.tsx#L7-L8) | 🔴 Critical |
| 2 | `getProductsFromPayload()` fetch 1000 SP `depth:2`, **không cache** | [catalog-payload.ts](file:///E:/Claude/HPTTech/lib/catalog-payload.ts#L681-L725) | 🔴 Critical |
| 3 | `loadRawProductHTML()` tạo PG connection mới mỗi lần, không pool | [catalog-payload.ts](file:///E:/Claude/HPTTech/lib/catalog-payload.ts#L185-L227) | 🔴 Critical |
| 4 | Dockerfile copy toàn bộ app + node_modules → image 1-2GB | [Dockerfile](file:///E:/Claude/HPTTech/Dockerfile#L15) | 🔴 Critical |
| 5 | Missing DB indexes: `status`, `brand`, `category`, `updatedAt` → full table scan | [Products.ts](file:///E:/Claude/HPTTech/collections/Products.ts) | 🔴 High |
| 6 | `getProductBySlugFromPayload()`, `getProductListPageFromPayload()` không cache | [catalog-payload.ts](file:///E:/Claude/HPTTech/lib/catalog-payload.ts#L727-L969) | 🔴 High |
| 7 | Content functions (`getPostsFromPayload`, `getProjectsFromPayload`, `getFAQsFromPayload`) không cache | [content-payload.ts](file:///E:/Claude/HPTTech/lib/content-payload.ts) | 🟠 Medium |
| 8 | All product queries dùng `depth: 2` + không `select` → kéo toàn bộ relations | [catalog-payload.ts](file:///E:/Claude/HPTTech/lib/catalog-payload.ts) | 🟠 Medium |
| 9 | Missing `optimizePackageImports` cho lucide-react, Payload | [next.config.ts](file:///E:/Claude/HPTTech/next.config.ts) | 🟡 Medium |
| 10 | API routes GET thiếu `Cache-Control` headers | [app/api/](file:///E:/Claude/HPTTech/app/api) | 🟡 Low |

## Proposed Changes

### Phase 1: Critical Fixes (ưu tiên cao nhất)

---

#### 1.1 [MODIFY] [page.tsx](file:///E:/Claude/HPTTech/app/(site)/page.tsx) — Remove force-dynamic

`force-dynamic` override `revalidate`, homepage LUÔN SSR mỗi request. Xoá để ISR cache hoạt động.

```diff
 export const revalidate = 300;
-export const dynamic = "force-dynamic";
```

---

#### 1.2 [MODIFY] [catalog-payload.ts](file:///E:/Claude/HPTTech/lib/catalog-payload.ts) — Thêm cache + connection pool

**A. Wrap các hàm chưa cache bằng `unstable_cache`:**

| Hàm | Cache key | Tags |
|-----|-----------|------|
| `getProductsFromPayload()` | `["all-products"]` | `["products"]` |
| `getProductListPageFromPayload()` | `["product-list-page", page, limit]` | `["products"]` |
| `getProductBySlugFromPayload()` | `["product-by-slug", slug]` | `["products"]` |
| `getProductsByCategoryFromPayload()` | `["products-by-category", cat, slug]` | `["products"]` |
| `getProductsByBrandFromPayload()` | `["products-by-brand", brand, slug]` | `["products"]` |

**B. Thay `new Client()` bằng `Pool` singleton:**

```diff
-import { Client } from "pg";
+import { Pool } from "pg";
+
+let _pgPool: Pool | undefined;
+function getPgPool() {
+  if (!_pgPool) {
+    const cs = databaseURL();
+    if (!cs) return undefined;
+    _pgPool = new Pool({ connectionString: cs, max: 5 });
+  }
+  return _pgPool;
+}

 async function loadRawProductHTML(id: string | number) {
-  const client = new Client({ connectionString });
-  try {
-    await client.connect();
-    const result = await client.query(...);
-  } finally {
-    await client.end();
-  }
+  const pool = getPgPool();
+  if (!pool) return {};
+  try {
+    const result = await pool.query(...);
+    ...
+  } catch { return {}; }
 }
```

---

#### 1.3 [MODIFY] [next.config.ts](file:///E:/Claude/HPTTech/next.config.ts) — Standalone + optimizations

```diff
 const nextConfig: NextConfig = {
+  output: "standalone",
+  compress: true,
+  poweredByHeader: false,
+  serverExternalPackages: ["sharp", "pg", "playwright", "puppeteer-core", "exceljs", "pdf-parse"],
+  experimental: {
+    optimizePackageImports: ["lucide-react", "@payloadcms/richtext-lexical"],
+  },
   distDir: process.env.NEXT_DIST_DIR || ".next",
   images: {
     formats: ["image/avif", "image/webp"],
-    minimumCacheTTL: 86400,
+    minimumCacheTTL: 2592000,
+    deviceSizes: [640, 750, 828, 1080, 1200],
+    imageSizes: [16, 32, 48, 64, 96, 128, 256],
```

---

#### 1.4 [MODIFY] [Dockerfile](file:///E:/Claude/HPTTech/Dockerfile) — Standalone image

Image giảm từ ~1-2GB xuống ~150-200MB.

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
CMD ["node", "server.js"]
```

---

#### 1.5 [MODIFY] [Products.ts](file:///E:/Claude/HPTTech/collections/Products.ts) — Thêm database indexes

Các field được query nhiều nhưng thiếu index → full table scan.

```diff
 // Field: status
 {
   name: "status",
   type: "select",
+  index: true,
   ...
 }

 // Field: brand (relationship)
 {
   name: "brand",
   type: "relationship",
   relationTo: "brands",
+  index: true,
   ...
 }

 // Field: category (relationship)
 {
   name: "category",
   type: "relationship",
   relationTo: "categories",
+  index: true,
   ...
 }
```

> [!NOTE]
> Payload CMS tự tạo index khi thấy `index: true`. Không cần chạy migration SQL thủ công.

---

### Phase 2: Data Fetching Optimization

---

#### 2.1 [MODIFY] [catalog-payload.ts](file:///E:/Claude/HPTTech/lib/catalog-payload.ts) — Reduce depth + add select

Giảm `depth: 2` → `depth: 1` cho product list. Thêm `select` để chỉ lấy fields cần thiết.

Áp dụng cho: `loadHomeProductsFromPayload()`, `getProductsFromPayload()`, `getProductListPageFromPayload()`, `getRelatedProductsFromPayload()`.

Product detail page (`getProductBySlugFromPayload`) giữ `depth: 2` vì cần data đầy đủ.

---

#### 2.2 [MODIFY] [catalog-projection.ts](file:///E:/Claude/HPTTech/lib/catalog-projection.ts) — Add select projections

Thêm `select` cho variants/offers/inventory queries trong `loadCanonicalCommercialProjections()`.

---

### Phase 3: Content Caching

---

#### 3.1 [MODIFY] [content-payload.ts](file:///E:/Claude/HPTTech/lib/content-payload.ts) — Cache uncached functions

Wrap các hàm chưa cache:

| Hàm | Tags |
|-----|------|
| `getPostsFromPayload()` | `["posts"]` |
| `getPostBySlugFromPayload()` | `["posts"]` |
| `getProjectsFromPayload()` | `["projects"]` |
| `getFAQsFromPayload()` | `["faqs"]` |
| `getAboutPageFromPayload()` | `["about"]` |

---

### Phase 4: API & Polish

---

#### 4.1 [MODIFY] API routes — Cache-Control headers

Thêm `Cache-Control` cho các GET API routes:
- `/api/home-content` → `s-maxage=300, stale-while-revalidate=60`
- `/api/products/compare-picker` → `s-maxage=300, stale-while-revalidate=60`

---

## Verification Plan

### Automated Tests
```bash
# Build standalone thành công
npm run build

# TypeScript check
npm run typecheck

# Lint pass
npm run lint

# Verify existing tests
npm run test:bulk-import
npm run test:quote
```

### Docker Verification
```bash
# Build Docker image
docker build -t hpttech-test .

# Verify image size (target < 300MB)
docker images hpttech-test

# Run container
docker run -p 3000:3000 --env-file .env hpttech-test
```

### Manual Verification (post-deploy)
- ✅ Trang chủ load nhanh, ISR cache hoạt động (check response header `x-nextjs-cache`)
- ✅ `/san-pham` — danh sách sản phẩm hiển thị đúng, filter/sort đúng
- ✅ `/san-pham/[slug]` — chi tiết sản phẩm đầy đủ data, specs, ảnh, related
- ✅ `/admin` — Payload admin panel hoạt động bình thường
- ✅ Thêm/Sửa/Xoá sản phẩm → revalidate tự động → frontend cập nhật trong 5 phút
- ✅ `/tin-tuc` — tin tức hiển thị đúng
- ✅ Coolify build + deploy thành công
