# Brotli trên Coolify / reverse proxy

Mục tiêu: dùng Brotli cho HTML/JS/CSS tĩnh để giảm bandwidth và TTFB cảm nhận.

Ứng dụng Next.js vẫn để `compress: true` trong `next.config.ts`, nhưng compression tốt nhất nên đặt ở reverse proxy/CDN.

## Cloudflare

Nếu domain đi qua Cloudflare:

1. Bật Brotli trong Speed > Optimization.
2. Bật cache static assets cho `/_next/static/*`.
3. Giữ cache TTL dài cho file hashed.

## Traefik / Coolify

Nếu dùng Traefik middleware, thêm compression middleware có Brotli nếu stack Traefik/Coolify đang hỗ trợ plugin/middleware tương ứng. Tối thiểu phải giữ gzip bật sẵn.

Cần test sau khi deploy:

```bash
curl -H "Accept-Encoding: br" -I https://hpttech.vn/_next/static/
curl -H "Accept-Encoding: br" -I https://hpttech.vn/san-pham
```

Kỳ vọng response có `content-encoding: br` cho asset/page đủ điều kiện. Nếu chưa có Brotli ở Traefik, ưu tiên bật Cloudflare Brotli vì ít rủi ro hơn đổi proxy config.
