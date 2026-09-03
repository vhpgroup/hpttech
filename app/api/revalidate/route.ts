import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { buildRevalidateTargets, parseRevalidateRequest } from "@/lib/revalidate-targets";

// Endpoint làm mới cache cho các tiến trình NGOÀI app: script cron tạo tin
// (cron:create-news), sync bảng giá Google Sheet (prices:*), webhook nội bộ.
//
// Hook afterChange của Payload KHÔNG dùng endpoint này nữa — nó gọi
// revalidateTag/revalidatePath trực tiếp trong tiến trình. Lý do (sự cố 2026-09-04)
// ghi ở lib/payload/hooks/revalidate.ts: tự gọi HTTP vào chính mình từ trong
// transaction ghi làm transaction rollback mà vẫn trả về 200.
//
// Bản đồ collection → tag/path nằm ở lib/revalidate-targets.ts (dùng chung với hook,
// có verifier: npm run test:revalidate-targets).

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { tags, paths } = buildRevalidateTargets(parseRevalidateRequest(body));

  for (const tag of tags) revalidateTag(tag);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, paths, tags });
}
