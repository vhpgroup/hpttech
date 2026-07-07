AGENTS.md — hpttech.vn (HPT Tech)
Hướng dẫn cho AI coding agent (Codex / VS Code) làm việc trong repo này. File này là
nguồn chân lý về quy ước code.

Khi mâu thuẫn, AGENTS.md thắng — ưu tiên hơn README.md, các tài liệu deploy
legacy (vd docs/vercel-neon-r2-deploy.md) và mọi comment cũ trong code. README.md
hiện đã lỗi thời (mô tả bản static-HTML prototype cũ).

1. Đây là dự án gì
Website B2B (thương mại điện tử + nội dung) cho HPT Tech (hpttech.vn) — máy scan /
máy in / máy photocopy / thiết bị văn phòng & giải pháp số hóa cho doanh nghiệp.

Stack thật (đọc file config, đừng tin README):

Next.js 15 App Router, React 19, output: "standalone" (next.config.ts)
Payload CMS 3.85 headless CMS, chạy chung trong cùng app Next (payload.config.ts)
PostgreSQL qua @payloadcms/db-postgres
Cloudflare R2 (S3-compatible) cho lưu trữ media (xem mục 9 về storage trên VPS)
TypeScript 5.8, Tailwind CSS v4 (@tailwindcss/postcss, theme ở app/globals.css)
Package manager: npm (package-lock.json). Không đưa pnpm/yarn vào.
Deploy: Coolify trên VPS — build bằng Nixpacks (nixpacks.toml) hoặc Docker
(Dockerfile, docker-compose.yml), tận dụng output: "standalone". vercel.json,
.vercelignore, docs/vercel-neon-r2-deploy.md là legacy, không phải đích deploy
hiện tại (xem mục 9).
2. Quy tắc vàng (bắt buộc tuân thủ)
Build KHÔNG bắt lỗi lint/type. next.config.ts đặt eslint.ignoreDuringBuilds: true
và typescript.ignoreBuildErrors: true. Bạn PHẢI tự chạy các gate ở mục 4 — build
xanh không có nghĩa là code đúng.
Không bao giờ hardcode màu/font. Dùng token Tailwind (primary-*, accent-*,
surface, ink, border, …) định nghĩa trong app/globals.css @theme. Xem mục 7.
Không sửa tay payload-types.ts. Đây là file được generate. Chỉ thay đổi bằng
cách regenerate qua Payload CLI sau khi đổi schema — không bao giờ chỉnh trực tiếp.
Lệnh ở mục 8.
Không đặt PAYLOAD_DB_PUSH=true với DB production. Nó đẩy thẳng thay đổi schema
vào Postgres. Để false, trừ khi cố ý sync schema ở DB local. Xem mục 10.
Không chạy script ghi dữ liệu (import / sync giá / migration / seed) khi chưa xác
nhận đúng DB/env. Repo có nhiều script ghi đè được dữ liệu. Xem mục 10.
Không commit secret. Mọi key nằm trong env (.env.example là template; trên prod
khai báo trong dashboard Coolify). Không hardcode, không log API key (OpenAI, Gemini,
Tavily, MISA, Telegram, Google).
Mọi nội dung hiển thị cho người dùng là tiếng Việt. Giọng văn: chuyên nghiệp, B2B,
đáng tin (chính hãng 100%, xuất VAT, giao toàn quốc). Giữ dấu tiếng Việt chuẩn.
Không viết code vào legacy/, scratch/, tmp/ — bị ESLint bỏ qua, không thuộc app.
3. Lệnh thường dùng
npm run dev          # next dev (local — cần Postgres :5433, xem docker-compose.yml)
npm run build        # node scripts/build-with-heartbeat.cjs (bọc quanh next build)
npm run start        # next start (sau khi build)

npm run lint         # eslint . --max-warnings=0   ← gate
npm run typecheck    # tsc --noEmit                ← gate

npm run payload      # Payload CLI (vd generate:types — xem mục 8)
Cảnh báo: KHÔNG tự ý chạy các script ảnh hưởng dữ liệu thật (import / sync giá /
migration / seed / crawl). Phải xác nhận DATABASE_URI/env trước — chi tiết ở mục 10.

DB local: docker compose up -d dựng Postgres ở :5433 khớp DATABASE_URI mặc định
trong .env.example. Copy .env.example → .env trước khi chạy lần đầu.

4. Verification gates — chạy trước khi coi là xong
Vì build bỏ qua lint/type (mục 2.1), đây mới là gate chất lượng thật. Sau BẤT KỲ thay
đổi nào, chạy và phải pass:

npm run typecheck    # phải sạch (0 lỗi)
npm run lint         # phải sạch (--max-warnings=0 → warning cũng fail)
Hiện chưa có hook cưỡng chế ở máy, nên bắt buộc tự chạy 2 lệnh trên trước mỗi commit.
Thay đổi UI/route: chạy thêm npm run build một lần — đây là cách duy nhất lộ lỗi
runtime/RSC (vì typecheck là gate tĩnh duy nhất, build thì dung thứ lỗi).
Thay đổi đụng pipeline dữ liệu: chạy verifier tương ứng — xem mục 5.
5. Triết lý harness & test — verifier nào bảo vệ domain nào
Repo không có Jest/Vitest. "Test" ở đây là các script scripts/verify-*.ts chạy qua
tsx — chúng là lưới an toàn cho các pipeline dữ liệu (báo giá, scraper, import, AI).
Nguyên tắc:

Đụng domain nào → chạy verifier của domain đó (bảng dưới) và để nó pass trước khi xong.
Sửa được một bug mới trong pipeline → thêm/mở rộng verifier để bug đó không tái diễn
(vòng lặp Hashimoto). Verifier là nơi "đóng băng" mỗi bài học.
Domain	Lệnh verifier	Khu vực được bảo vệ
Báo giá & VAT	npm run test:quote	lib/quote-totals.ts, checkout, Orders
Scraper – an toàn pipeline	npm run test:scraper-pipeline-safety	lib/scraper/**, ScraperJobs
Scraper – đa nguồn	npm run test:scraper-multi-source	gộp/đối chiếu dữ liệu nhiều nguồn
Scraper – canonical row	npm run test:scraper-canonical-row	chuẩn hóa 1 dòng sản phẩm
Scraper – nhận diện nguồn	npm run test:anphat-source-identity	nhận diện nguồn (anphatpc)
Scraper – phân loại PC/Server	npm run test:desktop-server-classify	lib/scraper/pc-server-taxonomy.ts, phân loại + spec + canonical row nhánh "Máy tính đồng bộ - Máy chủ"
Import sản phẩm	npm run test:bulk-import	lib/*import-export*, products:bulk-import
AI profile sản phẩm	npm run test:ai-profile	lib/ai/**, ProductAIMetadata
Catalog (audit độ sẵn sàng)	npm run payload:audit-catalog	toàn catalog trước khi publish
Desktop stage	npm run test:desktop-stage	Khóa hợp đồng layout fluid: container co giãn căn giữa, không transform scale, --shell-width co giãn, không ghim 1440px cứng (đọc script để rõ phạm vi)
PR đụng nhiều domain → chạy tất cả verifier liên quan, không chỉ một.

6. Kiến trúc — cái gì nằm ở đâu
app/
  (site)/            ← site công khai, route slug tiếng Việt
    page.tsx                 /              (trang chủ)
    [slug]/                  trang tĩnh động (catch-all)
    san-pham/                sản phẩm (catalog, trang chi tiết)
    tin-tuc/                 tin tức/blog (Posts)
    giai-phap/               giải pháp
    du-an/                   dự án
    compare/                 so sánh sản phẩm
    checkout/                giỏ hàng → đơn hàng
    ai-recommendation/       AI tư vấn chọn máy (đã có)
    ai-search/               AI search (đã có)
    lien-he/ ve-hpt/ tuyen-dung/ chinh-sach-*/ huong-dan-*/   trang thông tin & chính sách
    layout.tsx  not-found.tsx
  (payload)/         ← route group admin của Payload (/admin)
  api/               ← route handler Next (chat, scraper, webhook, sync giá…)
  sitemap.xml/  robots.txt/  google-merchant.xml/   ← route handler SEO/feed

collections/         ← Payload collections (schema DB + UI admin). Danh sách ở mục 8.
globals/             ← Payload globals: SiteSettings, AboutPage, EnterpriseSupportPage
components/          ← React components (gồm components/payload/* tùy biến admin)
lib/                 ← business logic (xem bên dưới)
scripts/             ← script tsx/cjs (migration, seed, scraper, sync giá, verifier)
docs/                ← tài liệu kế hoạch + file dữ liệu nguồn (scan/printer/photocopy)
Bản đồ lib/ (helper quan trọng — tái sử dụng, đừng viết lại):

lib/payload.ts — singleton getPayload. Luôn query Payload qua đây.
lib/payload-read-policy.ts — hành vi strict-read (PAYLOAD_STRICT_READS); tôn trọng nó.
lib/catalog-payload.ts, lib/catalog*.ts, lib/catalog/** — đọc/chiếu dữ liệu catalog.
lib/content-payload.ts, lib/content.ts — nội dung bài viết/trang.
lib/seo.ts — helper metadata/SEO. Dùng cho generateMetadata, đừng tự chế thẻ.
lib/scanner-specs.ts — chuẩn hóa thông số máy scan.
lib/quote-totals.ts — tính báo giá & VAT (nguồn chân lý duy nhất — không tự tính VAT lẻ).
lib/cart.ts — logic giỏ hàng. lib/product-* — giá, khuyến mãi, danh mục, import/export.
lib/cn.ts — helper cn() (clsx + tailwind-merge). Dùng cho class điều kiện.
lib/google-sheets.ts, lib/integrations/** — sync sheet giá, MISA, hệ thống ngoài.
lib/scraper/**, lib/search/**, lib/ai/**, lib/ai-search/**, lib/news-cron/**.
7. Quy ước code
TypeScript toàn bộ. Không dùng any nếu không có lý do rõ ràng. Ưu tiên type từ
payload-types.ts cho dữ liệu Payload.
Import: dùng alias @/ → root repo (vd @/lib/payload, @/components/...).
Styling: chỉ dùng utility Tailwind v4. Token brand (từ app/globals.css @theme):
Xanh thương hiệu = thang primary; chính = primary-600 (#2563eb). Dùng
bg-primary-600, text-primary-700… Không dán hex thô vào component. Cần đổi màu
brand thì sửa token --color-primary-* trong app/globals.css.
Accent = thang accent (cam). Semantic: success / warning / danger / info.
Trung tính: surface, ink, border.
Font: lấy từ biến CSS --font-body (gắn qua next/font ở layout) và expose thành
Tailwind font-sans. Dùng font-sans; đừng import font lẻ tẻ. (Lưu ý:
tailwind.config.ts vẫn ghi "Manrope" từ prototype cũ — block @theme trong
app/globals.css mới là cái thực sự điều khiển token v4.)
Ảnh: luôn dùng next/image. Host ảnh từ xa đã whitelist trong next.config.ts
(hpttech.vn, *.r2.dev, *.cloudflarestorage.com, *.anphatpc.com.vn). Thêm nguồn
ảnh mới BẮT BUỘC cập nhật remotePatterns. Mọi ảnh cần alt tiếng Việt có nghĩa
(Payload media.alt có sẵn cho việc này).
Package chỉ chạy server: sharp, pg, playwright, puppeteer-core, exceljs,
pdf-parse nằm trong serverExternalPackages. Không import vào client component.
Server vs client: mặc định Server Component. Chỉ thêm "use client" khi cần tương
tác. Fetch dữ liệu qua lib/* + lib/payload.ts, không fetch ngược về chính app.
SEO là tính năng, không phải việc phụ: mỗi route index được phải export
generateMetadata (title + meta description tiếng Việt), trang sản phẩm phát structured
data schema.org/Product + Offer, và thay đổi phải giữ sitemap.xml / robots.txt /
google-merchant.xml hợp lệ.
8. Quy tắc Payload CMS
Collections (collections/, đăng ký trong payload.config.ts): Users, Media,
Categories, Brands, ProductTypes, AttributeDefinitions, Products,
ProductVariants, ProductOffers, ProductInventory, ProductAIMetadata, ScraperJobs,
Orders, Banners, Solutions, PostCategories, PostTags, NewsRedirects, Posts,
ProjectCategories, DownloadCategories, Downloads, Projects, FAQ, Testimonials,
StaticPages, EnterpriseServices.
Globals: SiteSettings, AboutPage, EnterpriseSupportPage.

Đổi fields của collection là đổi schema DB. Ở local, sync bằng migration Payload
(ưu tiên) hoặc một lần PAYLOAD_DB_PUSH=true có chủ đích chỉ với DB local — không
bao giờ với prod (mục 10). drizzle-kit chỉ là công cụ nền do Payload quản lý.

Sau khi đổi schema, regenerate type bằng Payload CLI (ghi ra payload-types.ts theo
payload.config.ts):

npx payload generate:types
# hoặc qua script alias — cần "--" để truyền subcommand:
npm run payload -- generate:types
Rồi commit payload-types.ts đã regenerate. Tuyệt đối không sửa tay file này.

Products.ts rất lớn và là trung tâm (variants, offers, inventory, AI metadata là các
collection riêng liên kết tới nó). Đọc kỹ trước khi đổi cấu trúc sản phẩm.

Tùy biến UI admin nằm ở components/payload/* (đăng ký trong payload.config.ts).

i18n là tiếng Việt (fallbackLanguage: "vi"). Label/description field viết tiếng Việt.

9. Dữ liệu, tích hợp & deploy (Coolify + VPS)
Cấu hình qua env (.env.example): Postgres, R2, OpenAI (chatbot/AI, gpt-4.1-mini),
Gemini (làm giàu dữ liệu scraper), Tavily + Google Search (search cho scraper),
MISA AMIS (đồng bộ kế toán/ERP), Telegram (cảnh báo scraper), sync Google Sheets
giá (prices:*), CONTACT_WEBHOOK_URL.

Deploy = Coolify + VPS. Đây là đích deploy duy nhất hiện tại.

Env vars khai báo trong dashboard Coolify cho từng service. Không commit .env.
Database: DATABASE_URI trỏ tới Postgres của dự án — thường là Postgres service do
Coolify quản lý trên cùng VPS (hoặc Postgres ngoài).
Lưu trữ media (cực kỳ lưu ý): trên VPS biến VERCEL không được set, nên guard "bắt
buộc R2" trong payload.config.ts không kích hoạt → Payload có thể rơi về lưu local
disk. Mà filesystem container là ephemeral: redeploy trên Coolify sẽ mất ảnh
upload nếu không có persistent volume. → Hoặc bật R2 (set đủ R2_*), hoặc mount
persistent volume cho thư mục uploads.
scripts/build-with-heartbeat.cjs: giữ log "sống" lúc build (tránh Nixpacks/Coolify
timeout). Đó là lý do npm run build gọi nó thay vì next build trực tiếp.
Legacy — không phải hướng dẫn deploy hiện tại (chỉ tham khảo lịch sử):
docs/vercel-neon-r2-deploy.md, vercel.json, .vercelignore, và mọi nhắc tới Vercel/Neon
trong repo (kể cả ví dụ "Neon" trong .env.example). Nếu thông tin mâu thuẫn, mục 9 này thắng.

Nguyên tắc với tích hợp: coi mọi integration đều có thể fail — bọc timeout (env đã có
sẵn *_TIMEOUT_MS) và suy giảm mượt: scraper/MISA chết KHÔNG được làm vỡ render trang.

10. An toàn dữ liệu production
Repo có nhiều script ghi/đổi/ghi đè dữ liệu thật. Trước khi chạy bất kỳ script nào dưới
đây, luôn xác nhận DATABASE_URI/env đang load trỏ vào DB nào — nếu không chắc, mặc
định coi như đang trỏ prod và DỪNG lại để hỏi.

Script cần đặc biệt cẩn trọng (mặc định coi là phá hoại nếu nhắm sai DB):

Ghi đè / đồng bộ giá: prices:import-gsheet, prices:sync-gsheet (import có thể
ghi đè giá trong catalog). prices:export-gsheet an toàn hơn (chỉ xuất).
Import / crawl sản phẩm: products:bulk-import, products:crawl-category,
products:clean-retailer-specs.
Migration / seed / đổi schema dữ liệu: payload:migrate-existing-catalog,
payload:merge-software-category, payload:backfill-ai-metadata,
payload:make-attributes-optional, payload:seed-catalog, payload:seed-news-taxonomy,
payload:add-desktop-server-types, payload:seed-desktop-server-categories,
payload:ensure-product-indexes, và PAYLOAD_DB_PUSH=true.
Tạo nội dung tự động: cron:create-news.
Quy tắc bắt buộc:

Agent/Codex KHÔNG tự ý chạy các script trên — phải hỏi và để con người xác nhận DB/env.
Ưu tiên chạy trên DB local/staging trước; chỉ đụng prod khi đã xác nhận rõ ràng.
Backup (hoặc dùng dry-run nếu script hỗ trợ) trước khi chạy lên dữ liệu thật.
Không bao giờ seed/migrate/import-giá trên prod chỉ vì "tiện đang mở terminal".
11. Quy trình thực hiện thay đổi (Plan → Implement → Verify)
Plan: xác định đúng collection/route/lib helper trước (dùng bản đồ ở mục 6/8). Tái
sử dụng helper sẵn có; đừng nhân bản logic catalog/SEO/quote.
Implement thay đổi nhỏ nhất mà đúng. Giữ ranh giới server/client sạch.
Verify: npm run typecheck + npm run lint (cả hai sạch), thêm verifier domain
liên quan (mục 5), và npm run build cho việc liên quan route/UI.
Tự review theo file này: dùng token không hex, next/image + alt, nội dung tiếng
Việt, có metadata SEO, không lộ secret, đã regenerate payload-types.ts nếu đổi schema,
không chạm dữ liệu prod (mục 10).
Nguyên tắc harness: mỗi khi gặp một lỗi có thể lặp lại, hãy mã hóa cách phòng vào file
này (thêm một quy tắc), thành rule lint, hoặc thành một verifier mới — để nó không tái diễn.

12. KHÔNG được đụng vào / đã lỗi thời
payload-types.ts — generated; chỉ đổi qua payload generate:types (mục 8), không sửa tay.
package-lock.json — để npm quản lý.
legacy/, scratch/, tmp/ — bị ESLint bỏ qua, không thuộc app.
styles.css ở root là CSS prototype cũ, được globals.css import; code mới ưu tiên
token Tailwind thay vì mở rộng nó.
Tài liệu lỗi thời: README.md (mô tả prototype cũ) và docs/vercel-neon-r2-deploy.md
(đường deploy Vercel/Neon cũ). Khi quy ước/đường deploy đổi, cập nhật CHÍNH file này.
13. Bối cảnh kinh doanh (để viết nội dung & ra quyết định)
HPT Tech — Công ty TNHH Đầu tư Xây dựng và Thiết bị Công nghệ HPT. B2B, bán chính hãng
100%, xuất hóa đơn VAT, giá tốt cho doanh nghiệp, giao toàn quốc. Mạnh ở máy
scan/máy in chuyên dụng cao cấp mà bán lẻ phổ thông không có: Fujitsu, Kodak, ROWE, CZUR,
Microtek, Panasonic. Liên hệ: hotline 0967286889, email kinhoanh@hpttech.vn. Khi
viết nội dung/CTA, hướng tới khách doanh nghiệp (số lượng, dự án, số hóa tài liệu), luôn
nhấn mạnh tư vấn + báo giá + hotline.