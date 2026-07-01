# Kiến trúc pSEO toàn diện (100+ trang) — hpttech.vn

> Repo `vhpgroup/hpttech`. **Tuân thủ `AGENTS.md`.** Tài liệu này là kiến trúc khung cho toàn bộ hệ programmatic SEO (~100 trang, mở rộng tương lai), tổng quát hoá spec `docs/pseo-may-scan-b2b.md` (máy scan) lên mọi trụ nội dung. Đọc kèm: mockup landing ngành + mockup hub `/giai-phap`.
> Nguyên tắc thiết kế: **1 hệ template + dữ liệu CMS → N trang**. Thêm trang = thêm bản ghi trong Payload, KHÔNG code thêm. Ràng buộc AGENTS.md: không hardcode màu/font, không sửa tay `payload-types.ts`, migration thay vì DB push, tự chạy gate typecheck/lint/build.

---

## 0. Mục tiêu

Xây dựng hệ pSEO phủ toàn bộ nhu cầu tìm kiếm B2B của HPT Tech, khởi điểm ~100 trang chia 5 trụ, có khả năng mở rộng không giới hạn. Mỗi trang: nhắm 1 cụm từ khóa, nội dung riêng đủ giá trị, dẫn tới sản phẩm/dịch vụ thật + CTA báo giá (RFQ). Quản trị tập trung tại `/giai-phap` (hub) + Payload admin.

---

## 1. Năm trụ nội dung (tổng ~100 trang)

| # | Trụ | Số trang | Template chính | Vùng URL |
|---|---|---|---|---|
| 1 | **Máy scan** (ngành / nhu cầu / thương hiệu) | 30 | A — Product-Facet | `/giai-phap/may-scan/...` |
| 2 | **Số hóa tài liệu** (dịch vụ, OCR, ECM/DMS, lưu trữ điện tử) | 25 | B — Digitization Service | `/giai-phap/so-hoa/...` |
| 3 | **Giải pháp CNTT** (Smart Classroom, Paperless, Camera AI, hạ tầng…) | 20 | C — IT Solution | `/giai-phap/cntt/...` |
| 4 | **Theo đối tượng khách hàng** (Bộ Công an, Thuế, Bệnh viện…) | 15 | D — Segment Hub | `/giai-phap/nganh/[doi-tuong]` |
| 5 | **Dự án / năng lực** | 10 | E — Project/Case | `/du-an/...` (đã có) |

Các trụ **liên kết chéo**: trang đối tượng (trụ 4) là hub gom giải pháp của trụ 1–3 cho đúng đối tượng đó; trụ 5 làm bằng chứng năng lực cho tất cả.

---

## 2. Hệ template (A–E) — dùng lại tối đa

Tất cả template chia sẻ 1 **thư viện block** + **khung SEO** chung (metadata qua `pageMetadata()`, JSON-LD, breadcrumb, CTA→RFQ, màu nhấn theo taxonomy). Khác nhau ở tổ hợp block + nguồn dữ liệu.

### Template A — Product-Facet Landing (trụ 1; sau này máy in/photocopy)
- **Dùng cho:** máy scan theo ngành / nhu cầu / thương hiệu.
- **Dữ liệu:** 1 facet (industry | need | brand) + `productQuery` lọc catalog.
- **Block:** Hero → PainPoints/Benefits → **ProductGrid (động)** → CriteriaTable → Workflow → FAQ → RelatedLinks → CTA. (Chính là mockup landing đã duyệt.)

### Template B — Digitization Service Landing (trụ 2)
- **Dùng cho:** dịch vụ số hóa, số hóa theo loại hồ sơ, OCR, ECM, DMS, lưu trữ điện tử.
- **Dữ liệu:** dịch vụ + quy trình + công nghệ + case; product grid (máy scan liên quan) là tùy chọn.
- **Block:** Hero → Problem/ValueProps → ServiceScope → **Process (quy trình số hóa)** → Tech (OCR/DMS/ECM) → CaseStudy/LogoWall → (ProductGrid tùy chọn) → FAQ → RelatedLinks → CTA.

### Template C — IT Solution Landing (trụ 3)
- **Dùng cho:** Smart Classroom, Paperless Meeting, Video Conference, Camera AI, NAS, server, mạng, bảo mật…
- **Dữ liệu:** giải pháp + thành phần thiết bị (bundle) + lợi ích + sơ đồ.
- **Block:** Hero → Benefits → **SolutionComponents (thiết bị trong giải pháp)** → Diagram/HowItWorks → CaseStudy → FAQ → RelatedLinks → CTA.

### Template D — Customer Segment Hub (trụ 4)
- **Dùng cho:** "Giải pháp cho Bộ Công an / Thuế / Bệnh viện…" — trang **tổng hợp theo đối tượng**.
- **Dữ liệu:** segment + liên kết tới các trang trụ 1–3 phù hợp segment + sản phẩm + dự án tiêu biểu.
- **Block:** Hero → SegmentNeeds → **SolutionLinks (gom scanner + số hóa + CNTT cho segment)** → Products → Projects/CaseStudy → FAQ → CTA. (Là mini-hub, không phải trang mỏng.)

### Template E — Project / Capability (trụ 5)
- **Dùng cho:** trang dự án & năng lực triển khai.
- **Tái dùng collection `Projects` + route `/du-an/[slug]` đã có.** Chỉ bổ sung block/ý cho SEO + liên kết tới segment hub.

### Hub template (điều hướng)
- Master hub `/giai-phap` (mockup đã dựng) + group hub theo trụ/nhóm. Chỉ gồm block Hero + Directory/CardGrid + Filter.

---

## 3. Taxonomy & thực thể dùng chung

Tách taxonomy ra collection riêng để tái dùng across trụ (1 ngành xuất hiện ở trụ 1 và trụ 4). Slug không dấu qua `formatSlug`.

| Taxonomy | Collection | Giá trị (lô đầu) |
|---|---|---|
| Ngành / đối tượng | `industries` | cong-an, thue, hai-quan, kho-bac, toa-an, vien-kiem-sat, ubnd, van-thu-luu-tru, benh-vien, truong-hoc, ngan-hang, doanh-nghiep-san-xuat, logistics, cang-bien, kcn, van-phong-luat, cong-chung, luu-tru-lich-su |
| Nhu cầu (scan) | `scan-needs` | ho-so, cccd, ho-chieu, a4, a3, toc-do-cao, kho-lon, sach, ban-ve, hai-mat |
| Thương hiệu | `brands` (ĐÃ CÓ) | Fujitsu, Ricoh, Kodak Alaris, Brother, Epson, Canon, Plustek, Visioneer, HP, Avision (Zebra → nhóm mã vạch riêng) |
| Nhóm sản phẩm | `product-groups` (hoặc enum) | may-scan, may-in, may-photocopy |
| Chủ đề số hóa | field `cluster` trên LandingPages | dich-vu, theo-ho-so, ocr, ecm-dms, luu-tru-dien-tu |

`industries` là taxonomy quan trọng nhất (dùng cho trụ 1 facet ngành + trụ 4 segment hub). Mỗi bản ghi: name, slug, icon, accentKey (màu nhấn), painPoints mặc định, thứ tự.

---

## 4. Mô hình dữ liệu Payload — block-based (cốt lõi mở rộng)

**Quyết định kiến trúc:** dùng **một collection `LandingPages` theo dạng block** (Payload `blocks` field) làm lõi cho trụ 1–4. Lý do: 100+ trang khác loại → 1 collection + thư viện block giúp biên tập viên soạn trang linh hoạt, 1 renderer map block→component, không phình số collection/route. (Trụ 5 tái dùng `Projects` sẵn có.)

### 4.1 Collection `LandingPages` (`landing-pages`)
Field chính:
- `pageType` (select): `product-facet` | `digitization` | `it-solution` | `segment-hub`.
- `productGroup` (select, optional): `may-scan` | `may-in` | `may-photocopy` — cho pageType product-facet.
- `facetType` (select, optional): `industry` | `need` | `brand` — cho product-facet.
- `facetRef` (relationship, optional) → `industries` | `scan-needs` | `brands` theo `facetType`.
- `segmentRef` (relationship → `industries`) — cho segment-hub (trụ 4).
- `cluster` (select, optional) — nhóm phụ cho digitization/it-solution để gom ở hub.
- `title`, `slug`, `h1`, `seo` (seoField), `status` (drafts), `sortOrder`.
- `productQuery` (group) — bộ lọc catalog (map `lib/scanner-specs.ts` cho scan; mở rộng field cho nhóm khác sau).
- `blocks` (blocks field) — thư viện block bên dưới.
- `relatedPages` (relationship self, hasMany) + auto-related theo facet/segment.
- Hook `revalidateCollection`/`revalidateCollectionDelete`.

### 4.2 Thư viện Block (dùng chung mọi template)
`HeroBlock`, `ValuePropsBlock` (pain points/benefits), `ProductGridBlock` (có `query` override + chọn tay), `CriteriaTableBlock`, `ProcessBlock` (quy trình số hóa), `TechStackBlock` (OCR/DMS/ECM), `SolutionComponentsBlock` (bundle thiết bị), `DiagramBlock`, `CaseStudyBlock`, `LogoWallBlock`, `StatBandBlock`, `FaqBlock`, `RelatedLinksBlock`, `RichTextBlock`, `CtaQuoteBlock` (nối RFQ). Mỗi block = 1 React component; renderer `renderBlocks(blocks)` map type→component.

### 4.3 URL resolver
LandingPages có `pathname` tính từ pageType + group + facet/segment slug (lưu sẵn field `pathname` unique, sinh trong hook `beforeChange` để query O(1) theo path). Ví dụ:
- product-facet + may-scan + industry cong-an → `/giai-phap/may-scan/nganh/cong-an`
- product-facet + may-scan + need cccd → `/giai-phap/may-scan/nhu-cau/cccd`
- product-facet + may-scan + brand fujitsu → `/giai-phap/may-scan/hang/fujitsu`
- digitization + cluster theo-ho-so → `/giai-phap/so-hoa/so-hoa-ho-so-dat-dai`
- it-solution → `/giai-phap/cntt/smart-classroom`
- segment-hub + cong-an → `/giai-phap/nganh/cong-an`

### 4.4 Tái dùng sẵn có
- `brands` (facet thương hiệu) — KHÔNG tạo mới; có thể tái dùng `/thuong-hieu/[slug]` cho trang brand thuần, và LandingPages brand-facet cho trang "máy scan [hãng]" hướng giải pháp.
- `Projects` + `/du-an/[slug]` — trụ 5.
- `Products` + catalog adapter — ProductGridBlock.
- `QuoteRequests` + Google Sheet — CtaQuoteBlock.
- `seoField`, `pageMetadata()`, revalidate hooks, `formatSlug`.

### 4.5 Lưu ý migration
Sau khi thêm collections (`landing-pages`, `industries`, `scan-needs`, `product-groups`): `npm run payload -- generate:types` + tạo & áp migration ở local. KHÔNG push prod, KHÔNG sửa tay `payload-types.ts`.

---

## 5. URL & hub cho cụm Máy scan (trụ 1 — LÀM TRƯỚC)

```
/giai-phap                                  → master hub (mọi trụ)
/giai-phap/may-scan                         → hub nhóm máy scan: 3 khu (Ngành / Nhu cầu / Thương hiệu)
/giai-phap/may-scan/nganh/[slug]            → 10 trang theo ngành
/giai-phap/may-scan/nhu-cau/[slug]          → 10 trang theo nhu cầu
/giai-phap/may-scan/hang/[slug]             → 10 trang theo thương hiệu
```

Route Next: `app/(site)/giai-phap/may-scan/page.tsx` (hub nhóm) + `app/(site)/giai-phap/may-scan/[facet]/[value]/page.tsx` với `[facet] ∈ {nganh, nhu-cau, hang}`. `generateStaticParams` lấy từ `landing-pages` (pageType=product-facet, productGroup=may-scan, published). `generateMetadata` qua `pageMetadata()` + quality gate → noindex nếu chưa đủ.
Breadcrumb: `Trang chủ › Giải pháp › Máy scan › [Ngành|Nhu cầu|Hãng] › [tên]`.

---

## 6. Liên kết nội bộ cụm Máy scan (chống mồ côi + tăng topical authority)

- **Hub nhóm** `/giai-phap/may-scan` liên kết tới cả 30 trang (3 khu).
- **Mỗi trang chi tiết** liên kết: (a) các trang cùng facet (ngành khác / nhu cầu khác / hãng khác); (b) **chéo facet** — trang ngành trỏ tới nhu cầu & hãng liên quan (vd Công an → CCCD, hồ sơ, 2 mặt, Fujitsu/Kodak); (c) sản phẩm `/san-pham/[slug]`; (d) `/thuong-hieu/[slug]`; (e) hub nhóm + master hub.
- Mọi trang cách hub ≤ 2 click. Auto-related theo facet để không phải gắn tay.

---

## 7. Governance ở quy mô 30+ trang (chống thin & ăn thịt từ khóa)

- **1 trang = 1 từ khóa chính.** Bản đồ từ khóa ở §9 tách bạch intent giữa ngành / nhu cầu / thương hiệu để không cannibalize nhau.
- **Hàng rào chất lượng (index gate):** intro riêng ≥ 400 từ + ≥ 3 FAQ riêng + ≥ 3 sản phẩm thật (hoặc, với trang hãng, ≥ 3 model thật của hãng). Không đạt → `noindex` (không 404).
- **Trang thương hiệu** dễ mỏng → bắt buộc: giới thiệu hãng + dòng sản phẩm tiêu biểu + lý do chọn; canonical self. Tránh chỉ là danh sách lọc.
- **Trang nhu cầu** (a4, a3, 2 mặt) có thể trùng facet danh mục → set canonical, thêm nội dung tư vấn riêng; nếu quá mỏng thì gộp/nâng cấp facet thay vì tạo trang song song.
- Xuất bản theo lô + theo dõi GSC (impressions/vị trí/‘crawled - not indexed’). Biên tập: draft → review → publish.

---

## 8. Lộ trình — MÁY SCAN 30 TRANG TRƯỚC

Hoàn thành trọn trụ 1 (30 trang) rồi mới sang trụ 2–5.

- **Wave 0 — Khung (bắt buộc, 1 lần):** collections `industries`, `scan-needs`, LandingPages (product-facet) + Template A + block dùng chung + route hub/nhóm/chi tiết + sitemap + CTA→RFQ + màu nhấn theo ngành. Sau đó chỉ thêm bản ghi.
- **Wave 1 — 10 trang THEO NGÀNH:** cong-an, thue, hai-quan, kho-bac, toa-an, vien-kiem-sat, ubnd, van-thu-luu-tru, benh-vien, truong-hoc. (Bao trùm phần lớn danh sách 20 ưu tiên.)
- **Wave 2 — 10 trang THEO NHU CẦU:** ho-so, cccd, ho-chieu, a4, a3, toc-do-cao, kho-lon, sach, ban-ve, hai-mat.
- **Wave 3 — 10 trang THEO THƯƠNG HIỆU:** fujitsu, ricoh, kodak-alaris, brother, epson, canon, plustek, visioneer, hp, zebra.

Đối chiếu "20 trang ưu tiên" của bạn: Công an, Thuế, Bệnh viện, Lưu trữ (=văn thư lưu trữ), Hồ sơ, Tốc độ cao, A3 → nằm trong Wave 1–2 (làm ngay). Các mục Số hóa/OCR/DMS/ECM/Paperless thuộc trụ 2–3 (sau khi xong scanner).

---

## 9. Bảng ánh xạ 30 trang Máy scan

Chung: `pageType=product-facet`, `productGroup=may-scan`, Template A. `pq` = preset `productQuery` (map `lib/scanner-specs.ts`).

### 9.1 Theo ngành — `/giai-phap/may-scan/nganh/[slug]`
| Trang | slug | Từ khóa chính | pq preset | Nội dung khác biệt |
|---|---|---|---|---|
| Công an | cong-an | máy scan cho công an | ocr+duplex+cardScan+dailyDuty cao | hồ sơ nghiệp vụ, CCCD/căn cước, bảo mật |
| Thuế | thue | máy scan cho cơ quan thuế | ocr+duplex+dailyDuty cao | hóa đơn, chứng từ thuế, khối lượng lớn |
| Hải quan | hai-quan | máy scan cho hải quan | a3+duplex+toc-do-cao | tờ khai, chứng từ XNK |
| Kho bạc | kho-bac | máy scan cho kho bạc | ocr+duplex+dailyDuty cao | chứng từ kế toán/kho bạc |
| Tòa án | toa-an | máy scan cho tòa án | duplex+dailyDuty cao+ocr | hồ sơ vụ án, tài liệu pháp lý |
| Viện kiểm sát | vien-kiem-sat | máy scan cho viện kiểm sát | duplex+ocr | hồ sơ vụ án, tống đạt |
| UBND | ubnd | máy scan cho ubnd | duplex+ocr+network | dịch vụ công một cửa, hồ sơ hành chính |
| Văn thư lưu trữ | van-thu-luu-tru | máy scan văn thư lưu trữ | a3+flatbed+dailyDuty rất cao+ocr | tài liệu cũ/đóng quyển, số hóa kho |
| Bệnh viện | benh-vien | máy scan cho bệnh viện | network+duplex+dailyDuty cao | HIS/EMR, bệnh án (đã có mockup) |
| Trường học | truong-hoc | máy scan cho trường học | duplex+ocr | học bạ, khảo thí, thư viện |

### 9.2 Theo nhu cầu — `/giai-phap/may-scan/nhu-cau/[slug]`
| Trang | slug | Từ khóa chính | pq preset |
|---|---|---|---|
| Scan hồ sơ | ho-so | máy scan hồ sơ tài liệu | duplex+ocr |
| Scan CCCD | cccd | máy scan cccd / căn cước | cardScan |
| Scan hộ chiếu | ho-chieu | máy scan hộ chiếu | passportScan |
| Scan A4 | a4 | máy scan a4 | maxPaperSize=A4 |
| Scan A3 | a3 | máy scan a3 | maxPaperSize=A3 |
| Tốc độ cao | toc-do-cao | máy scan tốc độ cao | scanSpeedSimplexPpm cao |
| Khổ lớn | kho-lon | máy scan khổ lớn | A2/A1 + flatbed |
| Scan sách | sach | máy scan sách / book scanner | book/overhead scanner |
| Scan bản vẽ | ban-ve | máy scan bản vẽ a0 | wide-format A0 |
| 2 mặt tự động | hai-mat | máy scan 2 mặt tự động | duplexScan |

### 9.3 Theo thương hiệu — `/giai-phap/may-scan/hang/[slug]` (facet brand, dùng `brands`)
| Trang | slug | Từ khóa chính | pq preset | Ghi chú |
|---|---|---|---|---|
| Fujitsu | fujitsu | máy scan fujitsu | brand=Fujitsu | dòng fi/ScanSnap (nay thuộc Ricoh/PFU) |
| Ricoh | ricoh | máy scan ricoh | brand=Ricoh | |
| Kodak Alaris | kodak-alaris | máy scan kodak alaris | brand=Kodak | dòng S/E |
| Brother | brother | máy scan brother | brand=Brother | ADS series |
| Epson | epson | máy scan epson | brand=Epson | WorkForce DS |
| Canon | canon | máy scan canon | brand=Canon | imageFORMULA |
| Plustek | plustek | máy scan plustek | brand=Plustek | SmartOffice |
| Visioneer | visioneer | máy scan visioneer | brand=Visioneer | |
| HP | hp | máy scan hp | brand=HP | ScanJet |
| Avision | avision | máy scan avision | brand=Avision | Hãng Đài Loan; dải A4 → A3 công nghiệp nối mạng, giá tốt (thay cho Zebra) |

---

## 10. Bước kế tiếp cho Codex (scanner-30)

1. **Wave 0:** dựng khung theo §4 (chỉ phần cần cho product-facet may-scan): collections `industries` + `scan-needs`; `landing-pages` (product-facet) + Template A + block ProductGrid/PainPoints/Criteria/Workflow/FAQ/Related/CTA; route hub nhóm + `[facet]/[value]`; sitemap; CTA→RFQ; token màu ngành `--ind-*`. `generate:types` + migration (local, không push prod).
2. **Wave 1→3:** seed 30 bản ghi theo §9 (nội dung riêng, đạt quality gate §7). Có thể dùng LLM sinh nháp intro/FAQ rồi review.
3. **DoD mỗi PR:** `npm run typecheck && npm run lint && npm run build` + `npm run payload -- generate:types`; Rich Results (Breadcrumb/FAQ); URL vào sitemap; CTA tạo `QuoteRequests`.

**Quan hệ với spec cũ:** `docs/pseo-may-scan-b2b.md` (collection `ScannerIndustrySolutions`) là bản scanner-only đơn giản. Vì mục tiêu 100 trang/5 trụ, **khuyến nghị dùng `landing-pages` tổng quát** (tài liệu này) để trụ 2–5 tái dùng; nếu chỉ làm scanner thì collection scanner-only vẫn chạy được. Chọn 1 hướng trước khi code Wave 0.