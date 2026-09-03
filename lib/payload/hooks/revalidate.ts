import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook } from "payload";
import { buildRevalidateTargets, type RevalidateRequest } from "../../revalidate-targets.ts";

// Làm mới cache sau khi nội dung trong Payload thay đổi.
//
// SỰ CỐ 2026-09-04 — vì sao KHÔNG được await fetch trong hook này:
// Bản cũ gọi `await fetch(<chính app>/api/revalidate)` ngay trong hook afterChange.
// Hook afterChange chạy BÊN TRONG transaction ghi của Payload, mà Payload lại chạy
// chung tiến trình Next: request lưu đang giữ một handler và một transaction mở, rồi
// đứng chờ một request khác vào cùng tiến trình đó. Khi có nhiều lượt lưu sát nhau,
// self-request bị xếp hàng sau chính nó → transaction hết thời gian → rollback.
// Người dùng vẫn thấy 200 kèm "Cập nhật thành công." (response đã dựng xong trước đó)
// nhưng DB không đổi một byte, updatedAt đứng nguyên. Kết quả: nhân viên content gõ
// bài SEO danh mục, được báo thành công, nội dung không bao giờ lên website.
//
// Nguyên tắc từ nay:
//   1. Trong request scope → gọi revalidateTag/revalidatePath TRỰC TIẾP. Payload nằm
//      cùng app Next nên không cần vòng HTTP nào (đúng pattern chính thức của Payload).
//      Đây cũng là quy ước mục 7 AGENTS.md: "đừng fetch ngược về chính app".
//   2. Endpoint /api/revalidate CHỈ dành cho tiến trình NGOÀI (script cron, sync giá).
//   3. Mọi lỗi làm mới cache phải bị nuốt tại đây. Làm mới cache là việc phụ —
//      không bao giờ được phép làm hỏng một lần ghi dữ liệu đã thành công.
//
// Hàng rào: npm run test:revalidate-targets (scripts/verify-revalidate-targets.ts)
// sẽ FAIL nếu nhánh HTTP quay lại làm đường chính.

/**
 * Cho phép script hàng loạt tắt làm mới cache từng bản ghi bằng cách truyền
 * `context: { disableRevalidate: true }` vào lệnh ghi Payload — tránh hàng nghìn
 * lượt invalidate khi sync bảng giá. Nhận `unknown` để không phụ thuộc kiểu nội bộ
 * của Payload.
 */
function isRevalidateDisabled(context: unknown): boolean {
  if (!context || typeof context !== "object") return false;
  return (context as Record<string, unknown>).disableRevalidate === true;
}

async function applyRevalidate(input: RevalidateRequest) {
  const targets = buildRevalidateTargets(input);

  try {
    // ĐƯỜNG CHÍNH: làm ngay trong tiến trình. Không truy vấn DB, không HTTP,
    // nên không thể tranh chấp với transaction đang mở.
    //
    // Import ĐỘNG và nằm trong try: file này bị payload.config.ts nạp, mà config
    // lại được các script tsx/cron nạp ngoài môi trường Next. Import tĩnh mà
    // next/cache lỗi ở đó thì vỡ TOÀN BỘ script — động thì lỗi rơi vào catch.
    const { revalidatePath, revalidateTag } = await import("next/cache");
    for (const tag of targets.tags) revalidateTag(tag);
    for (const path of targets.paths) revalidatePath(path);
    return;
  } catch (inProcessError) {
    // next/cache ném lỗi khi gọi ngoài request scope (script tsx, cron chạy riêng
    // tiến trình). Lúc đó mới nhờ endpoint — và vì đang ở tiến trình khác, gọi HTTP
    // sang server prod không thể tự chặn chính mình.
    console.warn("[payload-revalidate] làm mới trong tiến trình thất bại, chuyển sang endpoint", inProcessError);
  }

  await postRevalidate(input);
}

/**
 * FALLBACK — chỉ dùng khi hook chạy ngoài request scope của Next.
 * Đừng biến hàm này thành đường chính (xem sự cố 2026-09-04 ở đầu file).
 */
async function postRevalidate(payload: RevalidateRequest) {
  const baseURL = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!baseURL || !secret) return;

  const url = baseURL.startsWith("http") ? baseURL : `https://${baseURL}`;

  try {
    await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn("[payload-revalidate] request failed", error);
  }
}

export const revalidateCollection: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  if (isRevalidateDisabled(req?.context)) return;

  await applyRevalidate({
    collection: collection.slug,
    path:
      typeof doc?.fullPath === "string"
        ? doc.fullPath
        : typeof doc?.fullSlug === "string"
          ? doc.fullSlug
          : undefined,
    slug: typeof doc?.slug === "string" ? doc.slug : undefined,
  });
};

export const revalidateCollectionDelete: CollectionAfterDeleteHook = async ({ collection, doc, req }) => {
  if (isRevalidateDisabled(req?.context)) return;

  await applyRevalidate({
    collection: collection.slug,
    deleted: true,
    slug: typeof doc?.slug === "string" ? doc.slug : undefined,
  });
};

export const revalidateGlobal: GlobalAfterChangeHook = async ({ global, req }) => {
  if (isRevalidateDisabled(req?.context)) return;

  await applyRevalidate({
    global: global.slug,
  });
};
