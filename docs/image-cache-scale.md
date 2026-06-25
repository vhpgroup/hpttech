# Cache ảnh ở quy mô lớn

Mục tiêu: giảm CPU resize ảnh trên VPS khi catalog có 20k sản phẩm và nhiều ảnh.

## Kích thước ảnh của Next.js

`next.config.ts` phải có width nhỏ cho thumbnail/card:

```ts
deviceSizes: [384, 480, 640, 750, 828, 1080, 1200]
```

Component ảnh card/thumbnail phải khai báo `sizes` rõ ràng. Nếu thiếu `sizes`, Next.js có thể chọn biến thể ảnh lớn hơn như 1200px cho một ô hiển thị nhỏ.

## Volume trên Coolify

Mount persistent volume cho:

```text
/app/.next/cache
```

Trong đó `.next/cache/images` giữ cache image optimizer. Nếu không mount, mỗi lần redeploy sẽ resize lại ảnh từ đầu.

## CDN/R2

Khuyến nghị cho production:

1. Đặt Cloudflare CDN trước R2 bằng custom domain.
2. Cache ảnh optimized dài ngày ở edge.
3. Khi traffic ảnh lớn, cân nhắc Cloudflare Image Resizing hoặc image loader riêng để đẩy CPU resize ra khỏi VPS.

Không dùng filesystem container ephemeral để lưu media upload. Nếu không bật R2, phải mount persistent volume cho thư mục upload của Payload.
