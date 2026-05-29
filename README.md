# HPT Tech Interface Clone

Prototype giao diện mới cho `hpttech.vn`, dựng dạng static site để dễ kiểm thử và chuyển tiếp sang React/Vue/Next sau này.

## Bản đồ file

- `index.html`: khung trang, header, hero, danh mục, sản phẩm, giải pháp, bài viết, footer.
- `styles.css`: toàn bộ responsive layout theo mockup desktop/mobile.
- `data.js`: dữ liệu seed trích từ `https://hpttech.vn/`.
- `app.js`: render dữ liệu và xử lý tương tác trang chủ.
- `compare.js`: khối so sánh sản phẩm nổi.
- `compare.html` + `compare-page.js`: trang so sánh riêng.
- `support-widget.js`: widget hỗ trợ nổi gồm chatbot, Zalo, Facebook.
- `api/chat.js`: serverless function gọi OpenAI cho chatbot.
- `tmp/static-server.cjs`: static server local có hỗ trợ `/api/chat`.

## Nguồn dữ liệu

- Logo và ảnh sản phẩm/bài viết dùng URL gốc từ `hpttech.vn`.
- Footer và thông tin công ty lấy từ site gốc.
- Sản phẩm hiện là dữ liệu seed để dựng UI và thử nghiệm chatbot/compare.

## Chạy local

Mở trực tiếp `index.html` trong trình duyệt, hoặc chạy static server:

```powershell
node tmp/static-server.cjs e:\Claude\HPTTech 8080
```

## Chatbot OpenAI

Chatbot không dùng API key ở frontend. Key được đọc ở server-side qua:

- `api/chat.js` khi deploy lên Vercel
- `tmp/static-server.cjs` khi chạy local

Tạo biến môi trường theo file `.env.example`:

```env
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

## Chạy local với chatbot

Trong PowerShell:

```powershell
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_MODEL="gpt-4.1-mini"
node tmp/static-server.cjs e:\Claude\HPTTech 8080
```

## Deploy Vercel

1. Import project lên Vercel.
2. Vào `Project Settings` -> `Environment Variables`.
3. Thêm:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` = `gpt-4.1-mini` (tùy chọn, code đã có mặc định)

Sau khi deploy, chatbot frontend sẽ gọi cùng domain qua endpoint `/api/chat`, nên không cần sửa URL nào thêm.
