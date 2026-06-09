# Báo Cáo Hiện Trạng & Kế Hoạch Phát Triển AI-First — HPT Tech Website

> Cập nhật: 08/06/2026 | Định hướng ưu tiên: AI Tool → AI Search → AI So sánh → Báo giá → MISA/tồn kho

---

## TỔNG QUAN HIỆN TRẠNG

| Module | Hoàn thiện | Điểm yếu chính |
|---|---:|---|
| CMS / Payload | 95% | Thiếu `Quotes`, `stockQuantity`, lịch sử giá |
| Catalog sản phẩm | 85% | Dữ liệu specs đã có nhưng chưa đủ chuẩn cho AI matching đa ngành |
| Danh sách sản phẩm & bộ lọc | 85% | Filter còn thiên về máy scan, brand/options chưa hoàn toàn động |
| AI Tool tư vấn sản phẩm | 20% | Chưa có tool riêng, hiện mới có chat floating chung |
| AI Search `/ai-search` | 60% | UI tốt nhưng logic còn dùng mock data, chưa nối catalog thật |
| AI So sánh sản phẩm | 35% | Có bảng compare cơ bản, chưa có AI nhận xét và search trực tiếp |
| Báo giá sản phẩm | 85% | Đã render PDF bằng API, nhưng mới mạnh cho 1 sản phẩm/lần |
| Kết nối MISA / tồn kho | 0% | Chưa có field tồn kho số lượng và chưa xác định loại MISA |
| AI Price Intel | 0% | Chưa có công cụ phân tích giá thị trường |

---

## MỤC TIÊU SẢN PHẨM

Xây dựng website HPT Tech theo hướng B2B/e-commerce hiện đại, trong đó AI không chỉ là chatbot mà là bộ công cụ bán hàng:

- AI hiểu nhu cầu khách hàng theo ngữ cảnh doanh nghiệp, trường học, bệnh viện, cơ quan nhà nước.
- AI tìm sản phẩm thật trong catalog HPT.
- AI so sánh và giải thích lý do nên chọn sản phẩm.
- Sale có thể tạo báo giá nhanh từ AI Search / Product Listing / Compare.
- Tồn kho và số lượng còn lại được đồng bộ về sau từ MISA.

---

## THỨ TỰ ƯU TIÊN MỚI

| Ưu tiên | Hạng mục | Lý do ưu tiên | Thời gian dự tính |
|---:|---|---|---:|
| 1 | Chuẩn hóa dữ liệu nền cho AI | AI chỉ tốt khi catalog đủ sạch và cùng format | 2-3 ngày |
| 2 | AI Tool tư vấn sản phẩm | Tạo nền đọc hiểu nhu cầu trước khi search sâu | 3-4 ngày |
| 3 | AI Search catalog thật | Biến `/ai-search` từ demo thành công cụ dùng được | 4-6 ngày |
| 4 | AI So sánh sản phẩm | Giúp khách/sale ra quyết định nhanh hơn | 3-5 ngày |
| 5 | Báo giá nhiều sản phẩm | Sale team dùng hằng ngày, ROI cao | 5-7 ngày |
| 6 | Kết nối MISA / tồn kho | Cần cho số lượng thật, nhưng phụ thuộc hệ MISA | 4-10 ngày |
| 7 | AI Price Intel | Tạo lợi thế cạnh tranh về định giá | 5-7 ngày |
| 8 | Dashboard & vận hành AI | Theo dõi lead, câu hỏi, quote, hiệu quả AI | 1-2 tuần |

---

## SPRINT 1 — CHUẨN HÓA DỮ LIỆU NỀN CHO AI

**Thời gian:** 2-3 ngày

**Mục tiêu:** mọi sản phẩm HPT khi đưa vào AI Search / AI Tool đều có format đủ ổn để máy đọc, lọc, so khớp và giải thích.

### Việc cần làm

| Task | Nội dung | File / module chính | Thời gian |
|---|---|---|---:|
| 1.1 | Chuẩn hóa field chung: brand, model, category, priceValue, stockStatus, warranty, useCases | `collections/Products.ts`, `lib/catalog-payload.ts` | 0.5 ngày |
| 1.2 | Chuẩn hóa specs riêng cho máy scan, máy in, photocopy | `collections/Products.ts` | 0.5 ngày |
| 1.3 | Thiết kế schema mở rộng cho camera, máy tính, âm thanh, thiết bị văn phòng khác | `collections/Products.ts`, docs | 0.5-1 ngày |
| 1.4 | Tạo mapper `ProductAIProfile` cho AI dùng | `lib/ai/products.ts` | 0.5 ngày |
| 1.5 | Kiểm tra dữ liệu thiếu / sai format trong admin | Payload admin | 0.5 ngày |

### Kết quả mong muốn

- Có một format AI-ready cho sản phẩm.
- AI không đọc trực tiếp specs rời rạc, mà đọc profile đã chuẩn hóa.
- Các filter sau này dùng cùng một nguồn dữ liệu.

---

## SPRINT 2 — AI TOOL TƯ VẤN SẢN PHẨM

**Thời gian:** 3-4 ngày

**Mục tiêu:** tạo tool AI đọc hiểu nhu cầu trước, chưa cần phụ thuộc hoàn toàn vào search ranking phức tạp.

### Luồng hoạt động

Người dùng nhập:

> Tôi cần máy scan cho trường học, scan hồ sơ học sinh, tốc độ khoảng 40 tờ/phút, có LAN, ngân sách dưới 15 triệu.

AI phân tích:

- Loại thiết bị: máy scan tài liệu
- Mục đích: scan hồ sơ học sinh
- Môi trường dùng: trường học
- Tốc độ mong muốn: khoảng 40 tờ/phút
- Kết nối: LAN
- Ngân sách: dưới 15 triệu
- Câu hỏi còn thiếu: khổ giấy A4/A3, cần WiFi không, số lượng scan/ngày

### Việc cần làm

| Task | Nội dung | File / module chính | Thời gian |
|---|---|---|---:|
| 2.1 | Tạo API đọc hiểu nhu cầu | `app/api/ai/product-advisor/route.ts` | 1 ngày |
| 2.2 | Thiết kế prompt + JSON contract | `lib/ai/advisor.ts` | 0.5 ngày |
| 2.3 | UI tool tư vấn sản phẩm | `components/ai-tools/ProductAdvisor.tsx` | 1 ngày |
| 2.4 | Gợi ý câu hỏi tiếp theo theo ngữ cảnh | `lib/ai/advisor.ts` | 0.5 ngày |
| 2.5 | Fallback khi thiếu OpenAI API key | API + UI | 0.5 ngày |

### Kết quả mong muốn

- Có tool AI tư vấn riêng.
- AI trả dữ liệu có cấu trúc, không trả text tự do khó dùng.
- Làm nền cho AI Search và AI Compare.

---

## SPRINT 3 — AI SEARCH SẢN PHẨM THEO CATALOG THẬT

**Thời gian:** 4-6 ngày

**Mục tiêu:** thay toàn bộ mock data trong `/ai-search` bằng catalog thật từ Payload.

### Luồng hoạt động chuẩn

1. Người dùng nhập câu hỏi tự nhiên.
2. LLM đọc hiểu câu hỏi và trả intent/spec constraints.
3. Hệ thống tìm trong catalog HPT.
4. Chỉ hiển thị sản phẩm có trong HPT.
5. Sản phẩm hết hàng vẫn hiển thị, nhưng báo rõ hết hàng.
6. Sản phẩm không có trong HPT thì ẩn.
7. Giữ thứ tự ưu tiên theo điểm phù hợp.

### Việc cần làm

| Task | Nội dung | File / module chính | Thời gian |
|---|---|---|---:|
| 3.1 | Bỏ phụ thuộc mock data khỏi logic search | `lib/ai-search/search.ts` | 0.5 ngày |
| 3.2 | API AI Search dùng catalog thật | `app/api/ai/search-products/route.ts` | 1 ngày |
| 3.3 | Matching score theo category, specs, budget, useCases, stock | `lib/ai-search/ranking.ts` | 1-1.5 ngày |
| 3.4 | Cập nhật UI `/ai-search` nhận kết quả động | `components/ai-search/*` | 1-1.5 ngày |
| 3.5 | Quick filters theo kết quả thật | `QuickFilters.tsx` | 0.5 ngày |
| 3.6 | Test nhiều ngữ cảnh: trường học, văn phòng, bệnh viện, cơ quan nhà nước | test thủ công + cases | 0.5-1 ngày |

### Kết quả mong muốn

- `/ai-search` dùng được với sản phẩm thật.
- Người dùng hỏi máy in/photocopy/camera/máy tính vẫn có logic phân tích đúng nhóm.
- AI giải thích vì sao sản phẩm phù hợp.

---

## SPRINT 4 — AI SO SÁNH SẢN PHẨM

**Thời gian:** 3-5 ngày

**Mục tiêu:** biến trang so sánh từ bảng thông số thành công cụ hỗ trợ quyết định.

### Việc cần làm

| Task | Nội dung | File / module chính | Thời gian |
|---|---|---|---:|
| 4.1 | Thêm search sản phẩm trực tiếp trong trang compare | `app/(site)/compare/page.tsx` | 0.5-1 ngày |
| 4.2 | API AI nhận xét so sánh | `app/api/ai/compare-products/route.ts` | 1 ngày |
| 4.3 | Prompt so sánh theo ngữ cảnh sử dụng | `lib/ai/compare.ts` | 0.5 ngày |
| 4.4 | UI kết luận đề xuất: nên chọn mẫu nào, vì sao | compare components | 1 ngày |
| 4.5 | CTA từ compare: thêm vào báo giá, tư vấn Zalo | compare + quote | 0.5 ngày |

### Kết quả mong muốn

- Khách không chỉ thấy thông số, mà hiểu mẫu nào phù hợp nhất.
- Sale có thể dùng compare như công cụ tư vấn trong cuộc gọi.

---

## SPRINT 5 — BÁO GIÁ NHIỀU SẢN PHẨM

**Thời gian:** 5-7 ngày

**Mục tiêu:** báo giá trở thành workflow bán hàng thật, không chỉ modal xem nhanh.

### Việc cần làm

| Task | Nội dung | File / module chính | Thời gian |
|---|---|---|---:|
| 5.1 | Refactor QuoteProvider sang multi-item quote | `components/quote/QuoteProvider.tsx` | 1.5-2 ngày |
| 5.2 | Tạo quote cart riêng với số lượng, đơn giá, VAT, ghi chú | `components/quote/*` | 1 ngày |
| 5.3 | Collection `Quotes` trong Payload | `collections/Quotes.ts` | 0.5-1 ngày |
| 5.4 | API lưu báo giá | `app/api/quotes/route.ts` | 0.5 ngày |
| 5.5 | Cập nhật API PDF render nhiều dòng sản phẩm | `app/api/quotes/pdf/route.ts` | 1 ngày |
| 5.6 | Gửi email báo giá cho khách / sale | email adapter + API | 1 ngày |

### Kết quả mong muốn

- Thêm nhiều sản phẩm vào báo giá.
- Lưu lịch sử báo giá trong CMS.
- Xuất PDF/Word/in đúng form.
- Có thể gọi báo giá từ Product Listing, Product Detail, AI Search, Compare.

---

## SPRINT 6 — KẾT NỐI MISA / TỒN KHO

**Thời gian:** 4-10 ngày

**Phụ thuộc:** cần xác nhận HPT dùng MISA AMIS Cloud hay MISA SME Desktop.

### Phương án

| Loại MISA | Cách làm | Thời gian |
|---|---|---:|
| MISA AMIS Cloud | Dùng REST API / token / scheduled sync | 4-5 ngày |
| MISA SME Desktop | Export Excel định kỳ hoặc middleware trung gian | 7-10 ngày |

### Việc cần làm

| Task | Nội dung | File / module chính | Thời gian |
|---|---|---|---:|
| 6.1 | Thêm field `stockQuantity`, `misaItemCode` | `collections/Products.ts` | 0.5 ngày |
| 6.2 | Mapping sản phẩm HPT với mã hàng MISA | admin + data | 1 ngày |
| 6.3 | API nhận/sync tồn kho | `app/api/integrations/misa/*` | 1-3 ngày |
| 6.4 | Hiển thị số lượng tồn trên listing/detail/AI Search | product components | 1 ngày |
| 6.5 | Log lỗi sync và cảnh báo sản phẩm chưa map mã MISA | admin / logs | 1 ngày |

### Kết quả mong muốn

- Web biết số lượng tồn kho thật.
- AI Search có thể ưu tiên sản phẩm còn hàng.
- Sản phẩm hết hàng vẫn hiện, nhưng báo rõ trạng thái.

---

## SPRINT 7 — AI PRICE INTEL

**Thời gian:** 5-7 ngày

**Mục tiêu:** hỗ trợ sale/marketing kiểm tra giá thị trường và đối thủ.

### Việc cần làm

| Task | Nội dung | File / module chính | Thời gian |
|---|---|---|---:|
| 7.1 | Tool nhập model / URL / tên sản phẩm | `app/(site)/tools/gia-thi-truong/page.tsx` | 1 ngày |
| 7.2 | API AI price intel | `app/api/ai/price-intel/route.ts` | 1-2 ngày |
| 7.3 | Web search / nguồn dữ liệu giá | API + provider | 1-2 ngày |
| 7.4 | Báo cáo: giá thấp/cao/trung bình, khuyến nghị biên độ giá | UI + AI summary | 1 ngày |
| 7.5 | Lưu lịch sử phân tích giá | collection hoặc log | 1 ngày |

### Kết quả mong muốn

- Sale có dữ liệu tham khảo trước khi báo giá.
- Marketing biết sản phẩm nào đang cạnh tranh mạnh/yếu.

---

## SPRINT 8 — DASHBOARD & VẬN HÀNH AI

**Thời gian:** 1-2 tuần

### Việc cần làm

| Task | Nội dung | Thời gian |
|---|---|---:|
| 8.1 | Lưu lịch sử AI Search và AI Advisor | 1-2 ngày |
| 8.2 | Dashboard câu hỏi phổ biến / nhu cầu phổ biến | 2-3 ngày |
| 8.3 | Tracking quote conversion | 1-2 ngày |
| 8.4 | Phân quyền admin / sale / content | 1-2 ngày |
| 8.5 | Tối ưu tốc độ API AI, cache catalog, rate limit | 2-3 ngày |
| 8.6 | Bộ test regression cho AI Search / Quote / Compare | 2-3 ngày |

---

## TIMELINE TỔNG QUAN

| Tuần | Công việc chính | Kết quả cuối tuần |
|---|---|---|
| Tuần 1 | Sprint 1 + Sprint 2 | Catalog AI-ready, có AI Tool tư vấn sản phẩm |
| Tuần 2 | Sprint 3 | AI Search dùng catalog thật, bỏ mock data chính |
| Tuần 3 | Sprint 4 + bắt đầu Sprint 5 | AI Compare có nhận xét, bắt đầu quote nhiều sản phẩm |
| Tuần 4 | Hoàn thiện Sprint 5 + Sprint 6 | Báo giá nhiều sản phẩm, bắt đầu tồn kho/MISA |
| Tuần 5 | Hoàn thiện MISA + Sprint 7 | Tồn kho thật hơn, có AI Price Intel bản đầu |
| Tuần 6 | Sprint 8 | Dashboard, log, tối ưu vận hành |

---

## ĐỀ XUẤT LÀM NGAY

### Task 1 — Chuẩn hóa dữ liệu AI

**Thời gian:** 2-3 ngày  
**Lý do:** nếu dữ liệu chưa chuẩn, AI Search và AI Compare sẽ trả kết quả không ổn định.

### Task 2 — AI Tool tư vấn sản phẩm

**Thời gian:** 3-4 ngày  
**Lý do:** tạo lõi đọc hiểu nhu cầu trước, dùng lại cho AI Search và AI Compare.

### Task 3 — AI Search catalog thật

**Thời gian:** 4-6 ngày  
**Lý do:** đây là tính năng khách nhìn thấy rõ nhất, hiện vẫn còn demo/mock.

---

## RỦI RO CẦN CHỐT SỚM

| Rủi ro | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Dữ liệu sản phẩm nhập không đủ specs | AI matching sai hoặc thiếu kết quả | Bắt buộc schema theo danh mục, cảnh báo thiếu field |
| OpenAI API lỗi / hết quota | AI Tool ngừng hoạt động | Có fallback rule-based cơ bản |
| MISA không có API phù hợp | Sync tồn kho kéo dài | Chốt loại MISA trước khi estimate cuối |
| Sản phẩm trùng model / tên không chuẩn | Search và mapping sai | Thêm `modelNormalized`, `misaItemCode`, SKU bắt buộc |
| PDF báo giá nhiều sản phẩm quá dài | Vỡ layout A4 | Thiết kế template nhiều trang ngay từ Sprint 5 |

---

## KẾT LUẬN

Thứ tự làm mới nên ưu tiên AI trước:

1. Chuẩn hóa dữ liệu.
2. AI Tool tư vấn.
3. AI Search catalog thật.
4. AI So sánh.
5. Báo giá nhiều sản phẩm.
6. MISA/tồn kho.
7. AI Price Intel.
8. Dashboard vận hành.

Cách này tốt hơn việc làm MISA ngay từ đầu, vì AI Tool / AI Search / AI Compare tạo khác biệt trực tiếp cho khách hàng và sale team. MISA nên đi sau khi luồng tìm kiếm, tư vấn và báo giá đã rõ.
