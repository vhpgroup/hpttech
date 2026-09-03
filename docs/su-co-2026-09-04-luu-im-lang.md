# Sự cố 2026-09-04 — Lưu báo "thành công" nhưng dữ liệu không vào DB

## Triệu chứng

Nhân viên content mở `/admin/collections/categories/<id>`, gõ bài SEO danh mục vào ô
"Nội dung bài viết", bấm Lưu. Admin báo **"Cập nhật thành công."**, nội dung hiện đúng
trên form. Nhưng website không bao giờ hiện khối bài SEO, và mở lại record thì ô nội
dung trống trơn.

## Đo được gì

Kiểm tra qua Payload REST API trên prod (04/09/2026):

| Hiện tượng | Số đo |
|---|---|
| Danh mục có nội dung SEO thật trong DB | **0 / 169** |
| Danh mục có `seoContent.body = null` | 168 |
| Danh mục có `body` = đoạn văn rỗng | 1 (`may-scan`, dấu vết một lần lưu 26/08) |
| Lần `PATCH` trả 200 + "Cập nhật thành công." nhưng DB không đổi | **3 lần** trong một phiên |
| Lần ghi thành công cùng payload đó | 13 lần |

Đặc điểm của một lần thất bại:

- HTTP 200, `message: "Cập nhật thành công."`
- Document trả kèm response **có** nội dung mới → admin UI tin là đã lưu
- Trong DB: không đổi một byte, `updatedAt` **đứng nguyên** (theo dõi liên tục 90 giây)

Đã loại trừ: draft/version (Categories không bật `versions.drafts`), thiếu cột DB
(migration `20260826_031500` đã chạy, `where[seoContent.body][exists]` lọc SQL được),
access control chặn field, `scripts/apply-startup-migrations.cjs` ghi đè (chỉ có DDL,
không có câu `UPDATE` dữ liệu nào), HTTP cache, và nhiều replica lệch dữ liệu.

Một chi tiết đáng chú ý: ở lần thất bại đầu, trang `/may-scan` **có** hiện nội dung
khoảng một phút rồi mất — dấu hiệu cache đã được nạp bằng dữ liệu của transaction
trước khi transaction bị huỷ.

## Nguyên nhân (nghi can chính)

`lib/payload/hooks/revalidate.ts` gọi `await fetch(<chính app>/api/revalidate)` ngay
trong hook `afterChange`.

Chuỗi sự việc:

1. Payload mở transaction, `UPDATE` bản ghi.
2. Hook `afterChange` chạy **bên trong** transaction đó, và `await` một request HTTP
   **vào chính tiến trình đang xử lý request lưu**.
3. Payload chạy chung app Next → request lưu đang giữ một handler + một transaction mở,
   rồi đứng chờ một request khác vào cùng tiến trình. Khi có nhiều lượt lưu sát nhau,
   self-request bị xếp hàng sau chính nó.
4. Endpoint `/api/revalidate` lại `revalidatePath("/")` + `revalidatePath("/san-pham")`
   — hai trang nặng nhất site — nên vòng này càng lâu.
5. Transaction hết thời gian → rollback. Nhưng response đã dựng xong từ bước 2 nên
   client vẫn nhận 200 kèm document mới.

Đây là lý do lỗi **chập chờn**: chỉ nổ khi trùng nhịp, nên test tay một lần thường thấy
"bình thường".

## Đã sửa

- `lib/revalidate-targets.ts` (mới): bản đồ thuần collection → tag/path, dùng chung,
  không import `next/cache` nên verifier nạp được trực tiếp.
- `lib/payload/hooks/revalidate.ts`: đường chính là gọi `revalidateTag`/`revalidatePath`
  **trực tiếp trong tiến trình** (đúng pattern chính thức của Payload, và đúng quy ước
  mục 7 AGENTS.md "đừng fetch ngược về chính app"). Không truy vấn DB, không HTTP → không
  thể tranh chấp với transaction. Endpoint HTTP tụt xuống làm fallback, chỉ dùng khi hook
  chạy ngoài request scope (script `cron:create-news`, `prices:*`). Toàn bộ nhánh làm mới
  cache nằm trong `try/catch` — lỗi cache tuyệt đối không được làm rollback một lần ghi.
- Thêm công tắc `context: { disableRevalidate: true }` cho script ghi hàng loạt.
- `app/api/revalidate/route.ts`: dùng chung bản đồ, hành vi và response giữ nguyên.

## Hàng rào chống tái diễn

```
npm run test:revalidate-targets
```

19 kiểm tra, gồm 4 kiểm tra đọc thẳng source của hook: FAIL nếu nhánh HTTP quay lại làm
đường chính, nếu mất `next/cache`, nếu mất `try/catch`, hoặc nếu hook gọi `fetch` trực
tiếp. Đã kiểm chứng: dựng lại đúng code cũ thì verifier fail với exit code 1.

## Việc nên làm tiếp (chưa nằm trong PR này)

1. **Bật `PAYLOAD_STRICT_READS=true` trên prod** — AGENTS.md mục 8.1 đã khuyến nghị.
   Lỗi im lặng là thứ đắt nhất ở sự cố này.
2. **Rà các hook `afterChange` khác** xem còn chỗ nào `await` I/O ra ngoài trong
   transaction ghi (webhook, Telegram, MISA). Nguyên tắc: hook trong transaction chỉ
   làm việc trong bộ nhớ; mọi I/O ra ngoài phải đẩy sang sau khi commit.
3. **Nghiệm thu bằng người thật**: một nhân viên content đăng thử một bài trên
   `/admin/collections/categories/2`, bấm Lưu, F5 lại form, rồi mở `hpttech.vn/may-scan`.

## Lưu ý cho người kiểm thử: hai cửa ẩn khối SEO một cách hợp lệ

Không phải bug, nhưng rất dễ tưởng là bug:

1. Khối bài SEO **chỉ hiện ở URL gốc sạch** `hpttech.vn/<slug>`: trang 1, không lọc,
   không `?search=`. Mọi query param (trừ `page`) đều ẩn khối — cố ý, để chống duplicate
   content. Trang `/san-pham?category=...` **không bao giờ** hiện khối này.
2. Bỏ tick "Bật khối nội dung SEO", hoặc bài chỉ có tiêu đề mà không có chữ thật →
   `normalizeCategorySeoContent` trả `null`, không render gì.
