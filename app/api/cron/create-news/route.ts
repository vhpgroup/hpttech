import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createNewsCronPost } from "@/lib/news-cron/create-news";

export const runtime = "nodejs";
export const maxDuration = 120;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const headerSecret = request.headers.get("x-cron-secret");
  const querySecret = request.nextUrl.searchParams.get("secret");

  return [bearer, headerSecret, querySecret].some((value) => value === secret);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createNewsCronPost();
    revalidatePath("/tin-tuc");
    if (result.fullPath) revalidatePath(`/tin-tuc/${result.fullPath}`);
    if (result.slug) revalidatePath(`/tin-tuc/${result.slug}`);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Create news cron failed.";
    console.error("[cron:create-news]", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
