# Volume cache trên Coolify

Mục tiêu: giữ ISR cache, fetch cache và image optimizer cache sống qua mỗi lần redeploy.

## Một instance

Mount persistent volume vào đúng đường dẫn trong container:

```text
/app/.next/cache
```

Trên Coolify:

1. Mở service Next.js của hpttech.vn.
2. Vào Storage / Persistent Storage.
3. Thêm volume mới.
4. Đặt mount path là `/app/.next/cache`.
5. Redeploy service.

Sau khi mount, các cache sau sẽ không bị xóa mỗi lần deploy:

- Full route cache / ISR.
- Fetch cache của Next.js.
- Image optimizer cache trong `.next/cache/images`.

## Nhiều hơn một replica

Filesystem cache không chia sẻ giữa các replica. Nếu chạy từ 2 replica trở lên, dùng shared cache handler như Redis thay vì chỉ mount volume cục bộ.

## Kiểm tra sau deploy

Chạy:

```bash
curl -I https://hpttech.vn/san-pham
curl -I https://hpttech.vn/tin-tuc
```

Kỳ vọng có cache header phù hợp và lần hit thứ hai không regenerate hàng loạt trang.
