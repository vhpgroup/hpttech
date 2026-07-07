# Crawl "Máy tính đồng bộ - Máy chủ" (anphatpc) — Runbook cho Codex

Trạng thái: **code hỗ trợ đã viết sẵn trong nhánh này** — Codex chỉ cần chạy
migration/seed trên đúng DB, dry-run, rồi crawl theo trình tự bên dưới.
Tuân thủ AGENTS.md §10: mọi lệnh ghi dữ liệu phải xác nhận `DATABASE_URI` trước.

## 1. Bối cảnh

- Nguồn: nhánh "Máy Tính Đồng Bộ - Máy Chủ" của anphatpc.com.vn (menu 4 cấp:
  10 nhóm L2 / 35 L3 / 105 L4). Phần lớn L3–L4 là **facet lọc** (`?filter=<id>`
  trên chính URL cha), link chết (`javascript:;`) hoặc trang search (`/tim?q=`)
  — KHÔNG phải danh mục. Chỉ ~15 trang danh mục thật (đa số dạng `_dmNNNN.html`).
- Đích: catalog hpttech hiện có 0 sản phẩm PC/AIO/server/workstation/NUC/máy
  tính công nghiệp → mảng hoàn toàn mới, không phải dọn dữ liệu cũ.
- Nguyên tắc chốt: CPU/RAM/Ổ cứng/Màn hình = **spec/attribute**, Hãng = quan hệ
  **Brands**, chỉ 7 danh mục lá + 1 node cha được tạo (xem mục 3).

## 2. Code đã viết sẵn (không cần viết lại)

| File | Nội dung |
|---|---|
| `lib/scraper/pc-server-taxonomy.ts` | **Module mới** — nguồn chân lý: 7 type code, map code → tên Category, `detectPcServerTypeCode()` (có guard chống bẫy "Windows Server"→server, "Laptop … Workstation"→workstation, AIO máy in→AIO PC) |
| `lib/product-category.ts` | Hằng số tên/slug 8 category + checker + `canonicalizeCategoryName/Slug` |
| `lib/catalog-schema.ts` | `PRODUCT_TYPE_OPTIONS` += 7 code mới (bắt buộc vì `ProductTypes.code` là select) |
| `lib/scraper/db-lookup.ts` | `commonProductTypeCode()` nhận diện PC/Server — đặt TRƯỚC rule software (tên PC hay chứa "Windows 11") |
| `lib/scraper/canonical-row.ts` | Map productType → Category lá; tinh chỉnh nội bộ họ PC/Server (danh mục trộn "Máy chủ, Linh kiện") |
| `lib/scraper/product-type-guard.ts` | Nhận diện theo title+URL TRƯỚC rule full-text laptop (trang PC luôn chứa "intel core/ssd/ddr"); expected/actual cùng họ không throw |
| `lib/scraper/spec-normalizer.ts` | `deriveDesktopSpecs` / `deriveServerSpecs`; **attributes: []** (mapAttributes throw nếu gặp code chưa có AttributeDefinition) |
| `lib/scraper/batch-importer.ts` | Ghi `desktopSpecs` / `serverSpecs` vào products |
| `collections/Products.ts` | 2 group field mới `desktopSpecs`, `serverSpecs` + 7 option `specProfile` (importer ghi `specProfile = productTypeCode` nên option bắt buộc phải có) |
| `scripts/crawl-category.ts` | `classifyCategoryProduct` nhận diện 7 loại mới; danh mục trộn "Máy chủ, Linh kiện" ưu tiên tên sản phẩm |
| `scripts/add-desktop-server-product-types.ts` | Seed 7 Product Type (idempotent) |
| `scripts/seed-desktop-server-categories.ts` | Seed cây Categories 1 cha + 7 lá (idempotent, dùng `parent`) |
| `scripts/verify-desktop-server-classify.ts` | Verifier mới `npm run test:desktop-server-classify` (pure — không cần DB/mạng) |

## 3. Cây danh mục & mapping

```
Máy tính đồng bộ - Máy chủ            (may-tinh-dong-bo-may-chu — node cha)
├─ PC đồng bộ                         (pc-dong-bo)            ← desktop-pc
├─ PC All-in-One                      (pc-all-in-one)         ← all-in-one
├─ Mini PC - NUC                      (mini-pc-nuc)           ← mini-pc
├─ Máy trạm Workstation               (may-tram-workstation)  ← workstation
├─ Máy chủ - Server                   (may-chu-server)        ← server
├─ Linh kiện máy chủ                  (linh-kien-may-chu)     ← server-component
└─ Máy tính công nghiệp               (may-tinh-cong-nghiep)  ← industrial-pc
```

## 4. Danh sách URL crawl (chỉ trang danh mục thật)

| productType | URL |
|---|---|
| desktop-pc | `https://www.anphatpc.com.vn/may-tinh-dong-bo-hp_dm1044.html` |
| desktop-pc | `https://www.anphatpc.com.vn/may-tinh-dong-bo-dell_dm1055.html` |
| desktop-pc | `https://www.anphatpc.com.vn/may-tinh-dong-bo-ibm-lenovo_dm1056.html` |
| desktop-pc | `https://www.anphatpc.com.vn/may-tinh-dong-bo-asus_dm1209.html` |
| all-in-one | `https://www.anphatpc.com.vn/may-tinh-all-in-one_dm1011.html` |
| mini-pc | `https://www.anphatpc.com.vn/asus-nuc-gen-12.html` → `-13` / `-14` / `-15.html` |
| server | `https://www.anphatpc.com.vn/may-chu-server_dm1468.html` |
| server-component | `https://www.anphatpc.com.vn/cpu-for-sever_dm1223.html` |
| server-component | `https://www.anphatpc.com.vn/ram-sever_dm1224.html` |
| server-component | `https://www.anphatpc.com.vn/hdd-for-sever_dm1225.html` |
| server-component | `https://www.anphatpc.com.vn/vga-for-sever_dm1226.html` |
| server-component | `https://www.anphatpc.com.vn/raid-for-sever_dm1227.html` |
| server-component | `https://www.anphatpc.com.vn/mainboard-server_dm1298.html` |
| server-component | `https://www.anphatpc.com.vn/nguon-cho-server_dm1481.html` |
| workstation | `https://www.anphatpc.com.vn/may-tinh-workstation-may-tram_dm1469.html` |
| industrial-pc | `https://www.anphatpc.com.vn/may-tinh-cong-nghiep.html` ⚠️ không có `_dm` — dry-run trước, nếu không bóc được categoryId thì bỏ |

KHÔNG crawl: mọi URL `?filter=` (facet), `javascript:;`, `/tim?q=` (search),
`/pcap-graphics-ai.html` (link "Theo RAM" bị đặt nhầm của An Phát), và các trang
hãng con của server/AIO khi trang cha đã đủ (duplicate-check sẽ chặn trùng nếu
lỡ crawl lại: `/may-chu-ibm_dm1415.html`, `/may-chu-hp_dm1416.html`,
`/may-chu-dell_dm1417.html`, `/all-in-one-hp_dm1399.html`, …).

## 5. Trình tự thực hiện (theo thứ tự, không bỏ bước)

### Bước 0 — Xác nhận môi trường (AGENTS.md §10, BẮT BUỘC)
```bash
# .env phải trỏ DB local/staging. Nếu không chắc → coi là prod và DỪNG.
docker compose up -d          # Postgres local :5433 (nếu chạy local)
grep DATABASE_URI .env
```

### Bước 1 — Đồng bộ schema + regenerate types
Products.ts thêm 2 group field; `specProfile` và `product_types.code` thêm option
(enum Postgres) → PHẢI có migration:
```bash
npm run payload -- migrate:create add-desktop-server-catalog
npm run payload -- migrate           # hoặc PAYLOAD_DB_PUSH=true CHỈ với DB local
npx payload generate:types           # commit payload-types.ts, KHÔNG sửa tay
```

### Bước 2 — Seed product types + categories
```bash
npm run payload:add-desktop-server-types
npm run payload:seed-desktop-server-categories
```

### Bước 3 — Gate chất lượng (build không bắt lỗi — phải tự chạy)
```bash
npm run typecheck                      # 0 lỗi
npm run lint                           # 0 warning
npm run test:desktop-server-classify   # verifier mới (pure, không cần DB)
npm run test:scraper-canonical-row
npm run test:scraper-pipeline-safety
npm run test:scraper-multi-source
npm run test:anphat-source-identity
npm run test:bulk-import
```

### Bước 4 — Dry-run từng nhóm (không ghi DB)
```bash
npm run products:crawl-category -- "https://www.anphatpc.com.vn/may-tinh-dong-bo-hp_dm1044.html" --limit=5 --dry-run
npm run products:crawl-category -- "https://www.anphatpc.com.vn/may-chu-server_dm1468.html" --limit=5 --dry-run
```
Soi workbook `tmp/category-anphatpc.com.vn-*.xlsx` (cột Loại sản phẩm phải đúng
mã: desktop-pc / server / …). CLI throw nếu có sản phẩm không phân loại được —
khi đó bổ sung từ khóa vào `detectPcServerTypeCode` và chạy lại verifier.

### Bước 5 — Crawl thật, tạo DRAFT (không --publish)
```bash
# Khuyến nghị cho PC/server: nhiều ảnh hơn mặc định (mặc định 1 ảnh/SP)
SCRAPER_IMPORT_MAX_IMAGES=4 npm run products:crawl-category -- "<url>" --limit=20
# chạy tiếp --skip=20 --limit=20 … cho tới hết; delay giữa request đã có sẵn (SCRAPER_DELAY_MS=3000)
```
Thứ tự gợi ý: NUC (ít SP) → Máy chủ → Linh kiện máy chủ → Workstation → AIO →
4 danh mục PC đồng bộ → Công nghiệp (nếu bước 4 pass).

### Bước 6 — Review + publish có chọn lọc
- Review draft trong `/admin/collections/products` (giá, category, brand, ảnh,
  desktopSpecs/serverSpecs). Link nhanh: các bản ghi `ScraperJobs`.
- `npm run payload:audit-catalog` trước khi publish.
- Publish qua admin hoặc `scripts/publish-drafts.ts` — KHÔNG `--publish` cả loạt
  ngay lần đầu.

## 6. Bẫy đã biết & cách xử lý

- **Word count publication-gate (1000–1900 từ):** linh kiện máy chủ (CPU/RAM lẻ)
  khó đạt bài dài → sản phẩm sẽ nằm ở draft. Chấp nhận (review tay) hoặc nới
  `SCRAPER_MIN_ARTICLE_WORDS` cho đợt chạy nhóm linh kiện.
- **Danh mục trộn "Máy chủ, Linh kiện" (`may-chu_dm1018`):** đã xử lý — phân
  loại ưu tiên tên sản phẩm. Vẫn nên crawl trang con `_dm1468` + 7 trang linh
  kiện thay vì trang cha.
- **Giá:** giá/spec từ API danh mục An Phát ghi đè output AI — spot-check vài SP
  so với trang nguồn.
- **Ảnh:** code đã ưu tiên ảnh full-size (bỏ prefix `75_/120_/250_`); nếu thiếu
  ảnh chạy `scripts/check-missing-images.ts` / `refetch-missing-images.ts`.
- **Nội dung:** để pipeline AI viết lại mô tả (đã có sẵn) — không copy nguyên
  văn mô tả của An Phát.
- **industrial-pc:** trang không có `_dm`, menu con toàn `/tim?` — nếu
  `discoverSourceCategory` không bóc được categoryId thì bỏ nhóm này, nhập tay.

## 7. Definition of Done

- [ ] Migration + `payload generate:types` đã commit (không sửa tay).
- [ ] 7 Product Type + 8 Category (1 cha, 7 lá, đúng slug/parent) tồn tại trong DB.
- [ ] `typecheck` / `lint` / 6 verifier ở Bước 3 đều xanh.
- [ ] Mỗi URL ở mục 4 đã crawl xong, sản phẩm draft có: category lá đúng, brand,
  desktopSpecs hoặc serverSpecs, ≥1 ảnh R2, giá hợp lệ.
- [ ] `payload:audit-catalog` pass; publish có chọn lọc sau review.
- [ ] `sitemap.xml` / `google-merchant.xml` hợp lệ sau khi publish.
