import { NextResponse } from "next/server";
import { testMisaConnection } from "@/lib/integrations/misa/client";

function isAuthorized(request: Request) {
  const secret = process.env.MISA_SYNC_SECRET;
  if (!secret) return true;

  const url = new URL(request.url);
  return request.headers.get("x-misa-sync-secret") === secret || url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await testMisaConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
